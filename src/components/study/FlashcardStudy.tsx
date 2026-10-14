import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  RotateCcw,
  Shuffle,
  Volume2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronLeft,
  Calendar,
  Clock,
  BookOpen,
  Keyboard,
} from 'lucide-react';
import {
  Deck,
  LearningSessionRecord,
  LearningSessionWordResult,
  MascotTone,
  StudyReviewRating,
  VocabularyItem,
} from '../../types';
import { recordStudyReview, saveLearningSession, getReviewRecords, getLearningSessions } from '../../services/storage';
import { processReviewAttempt, getDueWords, getIntervalPreviews, getWordSrsState, SrsReviewOutcome, formatIntervalLabel } from '../../services/srs';
import { recordXpReward } from '../../services/progression';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';

interface FlashcardStudyProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  initialMode?: 'deck' | 'due';
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
  onGoToTyping?: () => void;
  onGoToSoNhuc?: () => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  decks,
  vocabulary,
  defaultDeckId,
  initialMode = 'deck',
  tone,
  onExit,
  onSelectDeck,
  onGoToTyping,
  onGoToSoNhuc,
}) => {
  const [studyMode, setStudyMode] = useState<'deck' | 'due'>(initialMode);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    defaultDeckId || (decks[0]?.id ?? '')
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<VocabularyItem[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => Date.now());

  // Session tallies for four outcomes
  const [rememberedCount, setRememberedCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [scheduledNextTimes, setScheduledNextTimes] = useState<number[]>([]);

  // Double-click and rapid submission guard
  const isSubmittingRef = useRef(false);

  // Active dialogue reaction
  const [currentMascotReaction, setCurrentMascotReaction] = useState(() =>
    getRandomDialogue('FLASHCARD_START', tone)
  );

  // Calculate current due cards count for badge
  const dueCount = useMemo(() => {
    const revs = getReviewRecords();
    const sess = getLearningSessions();
    return getDueWords(undefined, revs, sess, vocabulary).length;
  }, [vocabulary]);

  // Load cards for active mode & deck
  const initCards = useCallback((mode: 'deck' | 'due', deckId: string, shuffle = false) => {
    let list: VocabularyItem[] = [];
    if (mode === 'due') {
      const revs = getReviewRecords();
      const sess = getLearningSessions();
      list = getDueWords(undefined, revs, sess, vocabulary);
    } else {
      list = vocabulary.filter((v) => v.deckId === deckId);
    }

    if (shuffle) {
      list = [...list].sort(() => Math.random() - 0.5);
    }

    setShuffledCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setWordResults([]);
    setScheduledNextTimes([]);
    setSessionStartTime(Date.now());
    setRememberedCount(0);
    setHardCount(0);
    setForgotCount(0);
    setEasyCount(0);
    isSubmittingRef.current = false;
    setCurrentMascotReaction(getRandomDialogue('FLASHCARD_START', tone));
  }, [vocabulary, tone]);

  useEffect(() => {
    initCards(studyMode, selectedDeckId);
  }, [studyMode, selectedDeckId, initCards]);

  const currentDeck = decks.find((d) => d.id === selectedDeckId);
  const currentCard = shuffledCards[currentIndex];
  const totalCards = shuffledCards.length;

  // Calculate real interval previews for the current card via SRS engine
  const intervalPreviews = useMemo(() => {
    if (!currentCard) return null;
    return getIntervalPreviews(currentCard.id, Date.now(), 'flashcard');
  }, [currentCard]);

  const currentCardSrs = useMemo(() => {
    if (!currentCard) return null;
    return getWordSrsState(currentCard.id);
  }, [currentCard]);

  const handlePronounce = useCallback((word?: string) => {
    const targetWord = word || currentCard?.englishWord;
    if (!targetWord) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(targetWord);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentCard]);

  // Handle card ratings with the four outcomes
  const handleRate = useCallback((outcome: SrsReviewOutcome) => {
    // Prevent accidental submit before reveal, or double-click re-submission
    if (!currentCard || !isFlipped || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const activeDeckId = currentCard.deckId || selectedDeckId;
    const now = Date.now();
    const eventId = `srs-fc-${now}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Record review in local storage
    recordStudyReview(activeDeckId, currentCard.id, outcome as StudyReviewRating);

    // 2. Process review attempt via authoritative SRS scheduling engine
    const revs = getReviewRecords();
    const sess = getLearningSessions();
    const isCorrect = outcome === 'remembered' || outcome === 'easy';
    const isPartiallyCorrect = outcome === 'hard';

    const srsState = processReviewAttempt(
      {
        eventId,
        wordId: currentCard.id,
        learningMode: 'flashcard',
        isCorrect,
        isPartiallyCorrect,
        outcome,
        timestamp: now,
      },
      revs,
      sess
    );

    if (srsState.nextReviewAt) {
      setScheduledNextTimes((prev) => [...prev, srsState.nextReviewAt!]);
    }

    // 3. Record XP attempt (flashcards award 0 XP, but count toward streak qualification)
    recordXpReward({
      sourceSessionId: `session-flashcard-${sessionStartTime}`,
      sourceAttemptId: eventId,
      wordId: currentCard.id,
      deckId: activeDeckId,
      learningMode: 'flashcard',
      calculateParams: {
        learningMode: 'flashcard',
        isCorrect,
      },
      timestamp: now,
    });

    const resultVerdict = isCorrect ? 'correct' : isPartiallyCorrect ? 'partially_correct' : 'incorrect';
    const currentResult: LearningSessionWordResult = {
      wordId: currentCard.id,
      result: resultVerdict,
      timestamp: now,
    };

    const updatedWordResults = [...wordResults, currentResult];
    setWordResults(updatedWordResults);

    // Update tallies
    const newRemembered = rememberedCount + (outcome === 'remembered' ? 1 : 0);
    const newHard = hardCount + (outcome === 'hard' ? 1 : 0);
    const newForgot = forgotCount + (outcome === 'forgot' ? 1 : 0);
    const newEasy = easyCount + (outcome === 'easy' ? 1 : 0);

    if (outcome === 'remembered') {
      setRememberedCount(newRemembered);
      setCurrentMascotReaction(getRandomDialogue('FLASHCARD_REMEMBERED', tone));
    } else if (outcome === 'easy') {
      setEasyCount(newEasy);
      setCurrentMascotReaction(getRandomDialogue('FLASHCARD_REMEMBERED', tone));
    } else if (outcome === 'hard') {
      setHardCount(newHard);
      setCurrentMascotReaction(getRandomDialogue('FLASHCARD_HARD', tone));
    } else {
      setForgotCount(newForgot);
      setCurrentMascotReaction(getRandomDialogue('FLASHCARD_FORGOT', tone));
    }

    // Advance or complete
    if (currentIndex + 1 < totalCards) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      // Release lock for next card after brief transition
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 100);
    } else {
      setIsCompleted(true);
      isSubmittingRef.current = false;

      // Persist completed learning session record
      const sessionRecord: LearningSessionRecord = {
        id: `session-flashcard-${now}`,
        deckId: activeDeckId,
        learningMode: 'flashcard',
        startedAt: sessionStartTime,
        completedAt: now,
        durationSeconds: Math.max(1, Math.round((now - sessionStartTime) / 1000)),
        totalQuestions: totalCards,
        correctAnswers: newRemembered + newEasy,
        partiallyCorrectAnswers: newHard,
        incorrectAnswers: newForgot,
        wordResults: updatedWordResults,
      };
      saveLearningSession(sessionRecord);

      // Mascot reaction at end
      const successRate = totalCards > 0 ? (newRemembered + newEasy) / totalCards : 0;
      if (successRate >= 0.75) {
        setCurrentMascotReaction(getRandomDialogue('SESSION_SUCCESS', tone));
      } else if (successRate >= 0.45) {
        setCurrentMascotReaction(getRandomDialogue('SESSION_AVERAGE', tone));
      } else {
        setCurrentMascotReaction(getRandomDialogue('SESSION_FAIL', tone));
      }
    }
  }, [
    currentCard,
    isFlipped,
    selectedDeckId,
    currentIndex,
    totalCards,
    tone,
    rememberedCount,
    hardCount,
    forgotCount,
    easyCount,
    wordResults,
    sessionStartTime,
  ]);

  const handleExit = useCallback(() => {
    if (!isCompleted && wordResults.length > 0) {
      const now = Date.now();
      const activeDeckId = currentCard?.deckId || selectedDeckId;
      const partialSession: LearningSessionRecord = {
        id: `session-flashcard-partial-${now}`,
        deckId: activeDeckId,
        learningMode: 'flashcard',
        startedAt: sessionStartTime,
        completedAt: now,
        durationSeconds: Math.max(1, Math.round((now - sessionStartTime) / 1000)),
        totalQuestions: wordResults.length,
        correctAnswers: rememberedCount + easyCount,
        partiallyCorrectAnswers: hardCount,
        incorrectAnswers: forgotCount,
        wordResults: wordResults,
      };
      saveLearningSession(partialSession);
    }
    onExit();
  }, [
    isCompleted,
    wordResults,
    currentCard,
    selectedDeckId,
    sessionStartTime,
    rememberedCount,
    easyCount,
    hardCount,
    forgotCount,
    onExit,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (isCompleted) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1' && isFlipped) {
        e.preventDefault();
        handleRate('forgot');
      } else if (e.key === '2' && isFlipped) {
        e.preventDefault();
        handleRate('hard');
      } else if (e.key === '3' && isFlipped) {
        e.preventDefault();
        handleRate('remembered');
      } else if (e.key === '4' && isFlipped) {
        e.preventDefault();
        handleRate('easy');
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handlePronounce();
      } else if (e.key === 'ArrowRight' && currentIndex + 1 < totalCards) {
        e.preventDefault();
        setCurrentIndex((i) => i + 1);
        setIsFlipped(false);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex((i) => i - 1);
        setIsFlipped(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, isFlipped, currentIndex, totalCards, handleRate, handlePronounce]);

  // Mode B Empty State: No words due today
  if (studyMode === 'due' && totalCards === 0 && !isCompleted) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-[#E5F3E9] text-[#268A59] flex items-center justify-center mx-auto text-3xl font-bold shadow-xs">
          ✨
        </div>
        <h3 className="mt-4 text-xl font-black text-[#173B2B]">
          Hôm nay đại ca tạm hết nợ từ vựng. Giỏi đấy!
        </h3>
        <p className="mt-2 text-sm text-[#69756D] leading-relaxed max-w-md mx-auto">
          Không có từ nào đến hạn ôn tập tại thời điểm này. Các từ đều đã được lên lịch hẹn tiếp theo theo chu kỳ SRS.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setStudyMode('deck');
              initCards('deck', selectedDeckId);
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Học tiếp theo bộ từ</span>
          </button>
          <button
            onClick={handleExit}
            className="px-4 py-2.5 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] bg-white border border-[#E6EBE6] rounded-xl transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // If no decks exist in Mode A
  if (decks.length === 0 && studyMode === 'deck') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <CapTongMascot expression="confused" size="lg" />
        <h3 className="mt-4 text-xl font-bold text-[#1D2420]">
          Chưa có bộ từ nào để ôn tập cả!
        </h3>
        <p className="mt-2 text-sm text-[#69756D]">
          Mau tạo một bộ từ vựng mới rồi quay lại đây nạp kiến thức nhé đại ca.
        </p>
        <button
          onClick={handleExit}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
        >
          Quay lại danh sách bộ từ
        </button>
      </div>
    );
  }

  // If active deck has 0 cards
  if (totalCards === 0 && !isCompleted && studyMode === 'deck') {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="flex justify-center mb-4">
          <CapTongMascot expression="smug" size="lg" />
        </div>
        <h3 className="text-xl font-bold text-[#1D2420]">
          Bộ từ "{currentDeck?.title}" đang trống trơn!
        </h3>
        <p className="mt-2 text-sm text-[#69756D]">
          Trống rỗng thế này thì học cái gì hả đại ca? Mau nạp từ vào đã nhé.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleExit}
            className="px-4 py-2 text-sm font-medium text-[#1D2420] border border-[#E6EBE6] bg-white rounded-xl hover:bg-[#FAFBF8] transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Session Completion Screen
  if (isCompleted) {
    const totalReviewed = totalCards;
    const earliestNextTime = scheduledNextTimes.length > 0 ? Math.min(...scheduledNextTimes) : null;
    const now = Date.now();
    const nextIntervalMs = earliestNextTime ? Math.max(0, earliestNextTime - now) : 0;
    const nextTimeLabel = nextIntervalMs > 0 ? formatIntervalLabel(nextIntervalMs) : 'Ngay bây giờ';

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs text-center space-y-6">
          <div className="flex justify-center">
            <CapTongMascot
              expression={forgotCount === 0 ? 'happy' : forgotCount <= 2 ? 'smug' : 'confused'}
              size="lg"
            />
          </div>

          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#268A59]">
              Hoàn thành phiên Flashcard
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#173B2B]">
              Đại ca vừa ôn xong {totalReviewed} từ.
            </h2>
            <p className="mt-1.5 text-xs text-[#69756D]">
              {forgotCount > 0 ? `${forgotCount} từ cần gặp lại sớm.` : 'Tất cả từ đã ghi nhớ xuất sắc!'}
              {' '}{totalReviewed - forgotCount} từ đã được lên lịch ôn tiếp theo chu kỳ SRS.
            </p>
          </div>

          {/* Speech box */}
          <div className="p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl max-w-lg mx-auto">
            <p className="text-xs sm:text-sm font-medium text-[#1D2420]">
              "{currentMascotReaction.text}"
            </p>
            <span className="text-[11px] font-semibold text-[#69756D] mt-1 block">
              — Cạp Tổng nhận xét
            </span>
          </div>

          {/* Detailed Outcomes Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg mx-auto">
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
              <span className="text-[11px] font-bold text-red-700 block">🔴 Quên</span>
              <span className="text-xl font-black text-red-800 tabular-nums mt-0.5 block">{forgotCount}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-800 block">🟠 Khó</span>
              <span className="text-xl font-black text-amber-900 tabular-nums mt-0.5 block">{hardCount}</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 block">🟢 Nhớ</span>
              <span className="text-xl font-black text-emerald-900 tabular-nums mt-0.5 block">{rememberedCount}</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <span className="text-[11px] font-bold text-blue-800 block">🔵 Dễ</span>
              <span className="text-xl font-black text-blue-900 tabular-nums mt-0.5 block">{easyCount}</span>
            </div>
          </div>

          {/* Next upcoming review hint */}
          {earliestNextTime && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-xs text-[#69756D]">
              <Clock className="w-3.5 h-3.5 text-[#268A59]" />
              <span>
                Từ cần ôn gần nhất tiếp theo: <strong className="text-[#173B2B]">{nextTimeLabel} nữa</strong>
              </span>
            </div>
          )}

          {/* Optional Link to Typing Practice for Strong Evidence */}
          {onGoToTyping && (
            <div className="pt-2">
              <button
                onClick={onGoToTyping}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#268A59] hover:text-[#173B2B] hover:underline cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
                <span>⌨️ Luyện gõ từ để nhớ chắc hơn & tích lũy XP</span>
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-[#E6EBE6]">
            <button
              onClick={() => initCards(studyMode, selectedDeckId, true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ôn lại phiên này</span>
            </button>
            {onGoToSoNhuc && (
              <button
                onClick={onGoToSoNhuc}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#173B2B] hover:bg-[#E5F3E9] border border-[#BDE5C8] bg-white rounded-xl transition cursor-pointer"
              >
                Xem Sổ Nhục
              </button>
            )}
            <button
              onClick={handleExit}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] border border-[#E6EBE6] bg-white rounded-xl transition cursor-pointer"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      {/* Top Header Controls: Mode Selector & Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6EBE6]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            className="p-2 text-[#69756D] hover:text-[#173B2B] hover:bg-white rounded-xl border border-[#E6EBE6] transition"
            title="Quay lại"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Entry Mode Switcher: Mode A (Học bộ từ) vs Mode B (Ôn từ đến hạn) */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E6EBE6] text-xs font-bold shadow-2xs">
            <button
              onClick={() => {
                setStudyMode('deck');
                initCards('deck', selectedDeckId);
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                studyMode === 'deck'
                  ? 'bg-[#173B2B] text-white shadow-2xs'
                  : 'text-[#69756D] hover:text-[#173B2B]'
              }`}
            >
              📁 Học bộ từ
            </button>
            <button
              onClick={() => {
                setStudyMode('due');
                initCards('due', selectedDeckId);
              }}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                studyMode === 'due'
                  ? 'bg-[#173B2B] text-white shadow-2xs'
                  : 'text-[#69756D] hover:text-[#173B2B]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ôn từ đến hạn</span>
              {dueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-stone-900 font-mono font-bold">
                  {dueCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Deck Picker (Mode A) & Shuffle Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {studyMode === 'deck' && (
            <select
              value={selectedDeckId}
              onChange={(e) => {
                const newId = e.target.value;
                setSelectedDeckId(newId);
                onSelectDeck(newId);
              }}
              className="text-xs font-bold text-[#173B2B] bg-white border border-[#E6EBE6] rounded-xl px-3 py-1.5 focus:ring-0 cursor-pointer"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setReverseDirection((prev) => !prev)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition ${
              reverseDirection
                ? 'bg-[#173B2B] text-white border-[#173B2B]'
                : 'bg-white text-[#69756D] border-[#E6EBE6] hover:text-[#173B2B]'
            }`}
            title="Đảo chiều thẻ (Anh ➔ Việt hoặc Việt ➔ Anh)"
          >
            <span>{reverseDirection ? 'Việt ➔ Anh' : 'Anh ➔ Việt'}</span>
          </button>

          <button
            type="button"
            onClick={() => initCards(studyMode, selectedDeckId, true)}
            className="p-1.5 bg-white text-[#69756D] hover:text-[#173B2B] border border-[#E6EBE6] rounded-xl transition"
            title="Xáo trộn thẻ"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#69756D]">
        <span>
          {studyMode === 'due' ? '🔥 Chế độ: Ôn từ đến hạn' : `Bộ: ${currentDeck?.title || 'Từ vựng'}`}
        </span>
        <span>
          Thẻ {currentIndex + 1} / {totalCards}
        </span>
      </div>
      <div className="w-full bg-[#E6EBE6] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#268A59] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Active Recall Instruction Notice */}
      {!isFlipped && (
        <div className="text-center py-1">
          <p className="text-xs text-[#69756D] font-medium">
            💡 Thử tự nhớ nghĩa trước khi lật thẻ nhé đại ca.
          </p>
        </div>
      )}

      {/* FLASHCARD INTERACTION CONTAINER */}
      <div className="perspective-1000">
        <div
          onClick={() => {
            if (!isFlipped) setIsFlipped(true);
          }}
          className={`w-full min-h-[300px] sm:min-h-[340px] bg-white border-2 rounded-3xl p-6 sm:p-10 flex flex-col justify-between transition-all duration-200 select-none shadow-xs relative ${
            isFlipped ? 'border-[#268A59]/40 bg-[#FAFBF8]' : 'border-[#E6EBE6] cursor-pointer hover:border-[#268A59]/40'
          }`}
        >
          {/* Top Row: Part of Speech & Audio */}
          <div className="flex items-center justify-between text-xs text-[#69756D]">
            <div className="flex items-center gap-2">
              {currentCard.partOfSpeech && (
                <span className="font-bold text-[#268A59] bg-[#E5F3E9] px-2.5 py-0.5 rounded-md text-[11px]">
                  {currentCard.partOfSpeech}
                </span>
              )}
              {currentCardSrs?.difficultyStatus && (
                <span className="text-[10px] text-stone-600 font-medium px-2 py-0.5 rounded-md bg-stone-100">
                  {currentCardSrs.difficultyStatus}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePronounce();
              }}
              className="p-2 text-[#268A59] hover:bg-[#E5F3E9] rounded-xl transition"
              title="Phát âm từ (Phím R)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Card Core Content */}
          <div className="my-auto py-4 text-center space-y-3">
            {/* Question side (English word) */}
            <h3 className="text-3xl sm:text-4xl font-black text-[#173B2B] tracking-tight">
              {reverseDirection ? currentCard.vietnameseDefinition : currentCard.englishWord}
            </h3>

            {/* Answer side: Revealed only after flipping */}
            {isFlipped && (
              <div className="pt-3 border-t border-emerald-100 animate-in fade-in duration-200 space-y-2">
                <p className="text-xl sm:text-2xl font-extrabold text-[#268A59]">
                  {reverseDirection ? currentCard.englishWord : currentCard.vietnameseDefinition}
                </p>

                {currentCard.exampleSentence && (
                  <p className="text-xs text-[#1D2420] italic max-w-md mx-auto pt-1 bg-white p-2.5 rounded-xl border border-[#E6EBE6]">
                    "{currentCard.exampleSentence}"
                  </p>
                )}

                {currentCard.notes && (
                  <p className="text-[11px] text-[#69756D] italic">
                    Ghi chú: {currentCard.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Flip Button or Indicator */}
          <div className="pt-3 border-t border-[#E6EBE6] flex items-center justify-between text-xs text-[#69756D]">
            <span>Lượt xem: {currentCard.reviewCount || 0} lần</span>
            {!isFlipped ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="px-4 py-1.5 bg-[#173B2B] hover:bg-[#268A59] text-white rounded-xl font-bold transition text-xs shadow-2xs"
              >
                👀 Lật thẻ xem đáp án
              </button>
            ) : (
              <span className="text-[#268A59] font-bold">
                ✓ Đã xem đáp án — Chọn độ nhớ bên dưới
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FOUR SELF-EVALUATION BUTTONS WITH SRS PREVIEWS (SHOWN ONLY AFTER FLIP) */}
      {isFlipped ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Button 1: Quên */}
          <button
            type="button"
            onClick={() => handleRate('forgot')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-red-50 border border-red-200 text-red-700 shadow-2xs transition active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <span className="text-sm">🔴</span>
              <span>Quên</span>
            </div>
            <span className="text-[11px] text-red-600 font-mono mt-0.5 font-bold">
              {intervalPreviews?.forgot.label || '10 phút'}
            </span>
            <span className="text-[9px] text-red-400 font-mono hidden sm:inline mt-0.5">Phím 1</span>
          </button>

          {/* Button 2: Khó */}
          <button
            type="button"
            onClick={() => handleRate('hard')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs transition active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <span className="text-sm">🟠</span>
              <span>Khó</span>
            </div>
            <span className="text-[11px] text-amber-700 font-mono mt-0.5 font-bold">
              {intervalPreviews?.hard.label || '1 giờ'}
            </span>
            <span className="text-[9px] text-amber-500 font-mono hidden sm:inline mt-0.5">Phím 2</span>
          </button>

          {/* Button 3: Nhớ */}
          <button
            type="button"
            onClick={() => handleRate('remembered')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs transition active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <span className="text-sm">🟢</span>
              <span>Nhớ</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-mono mt-0.5 font-bold">
              {intervalPreviews?.remembered.label || '1 ngày'}
            </span>
            <span className="text-[9px] text-emerald-500 font-mono hidden sm:inline mt-0.5">Phím 3</span>
          </button>

          {/* Button 4: Dễ */}
          <button
            type="button"
            onClick={() => handleRate('easy')}
            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 shadow-2xs transition active:scale-95 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
              <span className="text-sm">🔵</span>
              <span>Dễ</span>
            </div>
            <span className="text-[11px] text-blue-700 font-mono mt-0.5 font-bold">
              {intervalPreviews?.easy.label || '3 ngày'}
            </span>
            <span className="text-[9px] text-blue-500 font-mono hidden sm:inline mt-0.5">Phím 4</span>
          </button>
        </div>
      ) : (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsFlipped(true)}
            className="w-full py-3.5 bg-[#173B2B] hover:bg-[#268A59] text-white rounded-2xl font-bold transition text-xs shadow-xs cursor-pointer"
          >
            👀 Lật thẻ xem đáp án (Space)
          </button>
        </div>
      )}

      {/* Manual Step Navigation Bar */}
      <div className="flex items-center justify-between text-xs text-[#69756D] pt-2">
        <button
          disabled={currentIndex === 0}
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((i) => i - 1);
              setIsFlipped(false);
            }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E6EBE6] bg-white transition ${
            currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:text-[#173B2B]'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thẻ trước</span>
        </button>

        <span className="text-[11px] text-[#69756D] font-mono hidden sm:inline">
          Phím tắt: Space (Lật) · 1, 2, 3, 4 (Đánh giá) · R (Phát âm)
        </span>

        <button
          disabled={currentIndex + 1 >= totalCards}
          onClick={() => {
            if (currentIndex + 1 < totalCards) {
              setCurrentIndex((i) => i + 1);
              setIsFlipped(false);
            }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#E6EBE6] bg-white transition ${
            currentIndex + 1 >= totalCards ? 'opacity-40 cursor-not-allowed' : 'hover:text-[#173B2B]'
          }`}
        >
          <span>Thẻ sau</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
