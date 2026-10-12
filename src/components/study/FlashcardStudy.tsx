import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Shuffle,
  Volume2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronLeft,
} from 'lucide-react';
import {
  Deck,
  LearningSessionRecord,
  LearningSessionWordResult,
  MascotTone,
  StudyReviewRating,
  VocabularyItem,
} from '../../types';
import { recordStudyReview, saveLearningSession } from '../../services/storage';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';

interface FlashcardStudyProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
}

export const FlashcardStudy: React.FC<FlashcardStudyProps> = ({
  decks,
  vocabulary,
  defaultDeckId,
  tone,
  onExit,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    defaultDeckId || (decks[0]?.id ?? '')
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reverseDirection, setReverseDirection] = useState(false); // false: EN -> VI, true: VI -> EN
  const [shuffledCards, setShuffledCards] = useState<VocabularyItem[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => Date.now());

  // Session tallies
  const [rememberedCount, setRememberedCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);

  // Active dialogue reaction
  const [currentMascotReaction, setCurrentMascotReaction] = useState(() =>
    getRandomDialogue('FLASHCARD_START', tone)
  );

  // Load cards for active deck
  const initCards = useCallback((deckId: string, shuffle = false) => {
    const raw = vocabulary.filter((v) => v.deckId === deckId);
    let list = [...raw];
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    setShuffledCards(list);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsCompleted(false);
    setWordResults([]);
    setSessionStartTime(Date.now());
    setRememberedCount(0);
    setHardCount(0);
    setForgotCount(0);
    setCurrentMascotReaction(getRandomDialogue('FLASHCARD_START', tone));
  }, [vocabulary, tone]);

  useEffect(() => {
    if (selectedDeckId) {
      initCards(selectedDeckId);
    }
  }, [selectedDeckId, initCards]);

  const currentDeck = decks.find((d) => d.id === selectedDeckId);
  const currentCard = shuffledCards[currentIndex];
  const totalCards = shuffledCards.length;

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

  // Handle card ratings
  const handleRate = useCallback((rating: StudyReviewRating) => {
    if (!currentCard || !selectedDeckId) return;

    // Record review in storage
    recordStudyReview(selectedDeckId, currentCard.id, rating);

    const resultVerdict =
      rating === 'remembered'
        ? 'correct'
        : rating === 'hard'
        ? 'partially_correct'
        : 'incorrect';

    const currentResult: LearningSessionWordResult = {
      wordId: currentCard.id,
      result: resultVerdict,
      timestamp: Date.now(),
    };

    const updatedWordResults = [...wordResults, currentResult];
    setWordResults(updatedWordResults);

    // Update tallies
    const newRemembered = rememberedCount + (rating === 'remembered' ? 1 : 0);
    const newHard = hardCount + (rating === 'hard' ? 1 : 0);
    const newForgot = forgotCount + (rating === 'forgot' ? 1 : 0);

    if (rating === 'remembered') {
      setRememberedCount(newRemembered);
      setCurrentMascotReaction(getRandomDialogue('FLASHCARD_REMEMBERED', tone));
    } else if (rating === 'hard') {
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
    } else {
      setIsCompleted(true);

      // Persist completed learning session record (Milestone 4.1 audit)
      const sessionRecord: LearningSessionRecord = {
        id: `session-flashcard-${Date.now()}`,
        deckId: selectedDeckId,
        learningMode: 'flashcard',
        startedAt: sessionStartTime,
        completedAt: Date.now(),
        durationSeconds: Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000)),
        totalQuestions: totalCards,
        correctAnswers: newRemembered,
        partiallyCorrectAnswers: newHard,
        incorrectAnswers: newForgot,
        wordResults: updatedWordResults,
      };
      saveLearningSession(sessionRecord);

      // Pick end of session reaction
      const total = totalCards;
      const successRate = total > 0 ? newRemembered / total : 0;
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
    selectedDeckId,
    currentIndex,
    totalCards,
    tone,
    rememberedCount,
    hardCount,
    forgotCount,
    wordResults,
    sessionStartTime,
  ]);

  const handleShuffleToggle = () => {
    initCards(selectedDeckId, true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (isCompleted) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1') {
        e.preventDefault();
        handleRate('forgot');
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate('remembered');
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
  }, [isCompleted, currentIndex, totalCards, handleRate, handlePronounce]);

  // If no decks exist
  if (decks.length === 0) {
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
          onClick={onExit}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
        >
          Quay lại danh sách bộ từ
        </button>
      </div>
    );
  }

  // If active deck has 0 cards
  if (totalCards === 0) {
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
            onClick={onExit}
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
    const accuracy = totalCards > 0 ? Math.round((rememberedCount / totalCards) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs text-center">
          {/* Mascot feedback */}
          <div className="flex justify-center">
            <CapTongMascot
              expression={accuracy >= 70 ? 'happy' : accuracy >= 40 ? 'smug' : 'confused'}
              size="lg"
            />
          </div>

          <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#268A59]">
            Hoàn thành buổi học
          </span>

          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#173B2B]">
            {accuracy >= 70
              ? 'Xuất sắc! Não đại ca đỉnh đấy!'
              : accuracy >= 40
              ? 'Tạm được, có cố gắng!'
              : 'Hơi toang rồi đại ca ơi!'}
          </h2>

          {/* Quote speech box */}
          <div className="mt-4 p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#1D2420]">
              "{currentMascotReaction.text}"
            </p>
            <span className="text-[11px] font-semibold text-[#69756D] mt-1 block">
              — Cạp Tổng nhận xét
            </span>
          </div>

          {/* Stats Breakdown */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-[#E5F3E9] border border-[#BDE5C8] rounded-2xl">
              <span className="text-xs font-medium text-[#173B2B] block">Đã nhớ</span>
              <span className="text-2xl font-black text-[#173B2B] tabular-nums mt-1 block">
                {rememberedCount}
              </span>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-xs font-medium text-amber-800 block">Khó</span>
              <span className="text-2xl font-black text-amber-800 tabular-nums mt-1 block">
                {hardCount}
              </span>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <span className="text-xs font-medium text-red-800 block">Chưa nhớ</span>
              <span className="text-2xl font-black text-red-800 tabular-nums mt-1 block">
                {forgotCount}
              </span>
            </div>
          </div>

          <div className="mt-4 text-xs text-[#69756D]">
            Tổng số thẻ: <span className="font-semibold tabular-nums">{totalCards}</span> · Tỷ lệ nhớ chuẩn:{' '}
            <span className="font-semibold text-[#173B2B] tabular-nums">{accuracy}%</span>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => initCards(selectedDeckId, true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Xáo trộn & Ôn lại lần nữa</span>
            </button>
            <button
              onClick={onExit}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
            >
              Về danh sách bộ từ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Top Controls: Deck Selector & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6EBE6]">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-[#69756D] hover:text-[#173B2B] hover:bg-white rounded-lg border border-[#E6EBE6] transition-colors"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="text-base font-bold text-[#173B2B] bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:underline"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-[#69756D] font-mono tabular-nums">
              Thẻ {currentIndex + 1} / {totalCards}
            </span>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setReverseDirection((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              reverseDirection
                ? 'bg-[#173B2B] text-white border-[#173B2B]'
                : 'bg-white text-[#69756D] border-[#E6EBE6] hover:text-[#173B2B]'
            }`}
            title="Đảo chiều lật thẻ (Anh -> Việt hoặc Việt -> Anh)"
          >
            <span>{reverseDirection ? 'Việt ➔ Anh' : 'Anh ➔ Việt'}</span>
          </button>

          <button
            type="button"
            onClick={handleShuffleToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-[#69756D] hover:text-[#173B2B] border border-[#E6EBE6] rounded-lg transition-colors"
            title="Xáo trộn thứ tự các thẻ"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Xáo thẻ</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-[#E6EBE6] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#268A59] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* Mascot Speech Bubble Toast */}
      <div className="mt-4 flex items-center gap-3 bg-white border border-[#E6EBE6] rounded-xl px-4 py-2.5 shadow-xs">
        <CapTongMascot
          expression={currentMascotReaction.expression}
          size="sm"
          interactive
          onClick={() => setCurrentMascotReaction(getRandomDialogue('FLASHCARD_START', tone))}
        />
        <p className="text-xs font-medium text-[#1D2420] flex-1 truncate">
          "{currentMascotReaction.text}"
        </p>
      </div>

      {/* FLASHCARD INTERACTION CONTAINER */}
      <div className="mt-6 perspective-1000">
        <div
          onClick={() => setIsFlipped((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setIsFlipped((prev) => !prev);
            }
          }}
          className="w-full min-h-[300px] sm:min-h-[340px] bg-[#FFFFFF] border-2 border-[#E6EBE6] hover:border-[#268A59]/40 rounded-3xl p-6 sm:p-10 flex flex-col justify-between cursor-pointer select-none transition-all duration-300 shadow-xs relative"
        >
          {/* Card Top Pill: Part of speech or Direction indicator */}
          <div className="flex items-center justify-between text-xs text-[#69756D]">
            <span className="font-medium text-[#268A59]">
              {reverseDirection
                ? isFlipped
                  ? currentCard.partOfSpeech || 'Tiếng Anh'
                  : 'Tiếng Việt'
                : isFlipped
                ? 'Nghĩa tiếng Việt'
                : currentCard.partOfSpeech || 'Tiếng Anh'}
            </span>
            <span className="text-[11px] text-[#69756D] hidden sm:inline">
              Nhấn Space hoặc chạm để lật thẻ
            </span>
          </div>

          {/* Card Main Word Face */}
          <div className="my-auto py-6 text-center">
            {!isFlipped ? (
              // FRONT FACE
              reverseDirection ? (
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#173B2B] leading-tight">
                    {currentCard.vietnameseDefinition}
                  </h3>
                  {currentCard.notes && (
                    <p className="mt-3 text-xs text-[#69756D] italic">
                      Gợi ý: {currentCard.notes}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-3">
                    <h3 className="text-3xl sm:text-4xl font-black text-[#173B2B] tracking-tight">
                      {currentCard.englishWord}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronounce();
                      }}
                      className="p-2 text-[#268A59] hover:bg-[#E5F3E9] rounded-full transition-colors"
                      title="Nghe phát âm (Phím R)"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  {currentCard.partOfSpeech && (
                    <span className="mt-2 inline-block text-xs font-semibold text-[#69756D] italic">
                      ({currentCard.partOfSpeech})
                    </span>
                  )}
                </div>
              )
            ) : (
              // BACK FACE (REVEALED)
              reverseDirection ? (
                <div>
                  <div className="flex items-center justify-center gap-3">
                    <h3 className="text-3xl sm:text-4xl font-black text-[#268A59] tracking-tight">
                      {currentCard.englishWord}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronounce();
                      }}
                      className="p-2 text-[#268A59] hover:bg-[#E5F3E9] rounded-full transition-colors"
                      title="Nghe phát âm (Phím R)"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                  {currentCard.exampleSentence && (
                    <div className="mt-4 p-3 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-xs text-[#1D2420] text-left max-w-lg mx-auto">
                      <span className="font-semibold block text-[#173B2B] mb-0.5">Ví dụ:</span>
                      "{currentCard.exampleSentence}"
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#173B2B] leading-tight">
                    {currentCard.vietnameseDefinition}
                  </h3>
                  {currentCard.exampleSentence && (
                    <div className="mt-4 p-3 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-xs text-[#1D2420] text-left max-w-lg mx-auto">
                      <span className="font-semibold block text-[#173B2B] mb-0.5">Ví dụ:</span>
                      "{currentCard.exampleSentence}"
                    </div>
                  )}
                  {currentCard.notes && (
                    <p className="mt-2 text-xs text-[#69756D]">
                      Ghi chú: {currentCard.notes}
                    </p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Card Bottom Hint */}
          <div className="flex items-center justify-between text-xs text-[#69756D] pt-3 border-t border-[#E6EBE6]">
            <span>Lượt xem: {currentCard.reviewCount} lần</span>
            <span className="text-[#268A59] font-medium">
              {isFlipped ? 'Đã lật xem nghĩa' : 'Chạm để lật'}
            </span>
          </div>
        </div>
      </div>

      {/* RATING BUTTONS (3 OPTIONS REQUIRED) */}
      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        {/* Rating 1: Chưa nhớ */}
        <button
          type="button"
          onClick={() => handleRate('forgot')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-white border border-red-200 hover:bg-red-50 text-red-700 rounded-2xl shadow-xs transition-all active:scale-95"
        >
          <XCircle className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-red-600" />
          <span className="text-xs sm:text-sm font-bold">Chưa nhớ</span>
          <span className="text-[10px] text-red-500 font-mono hidden sm:inline">Phím 1</span>
        </button>

        {/* Rating 2: Khó */}
        <button
          type="button"
          onClick={() => handleRate('hard')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-white border border-amber-200 hover:bg-amber-50 text-amber-800 rounded-2xl shadow-xs transition-all active:scale-95"
        >
          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-amber-600" />
          <span className="text-xs sm:text-sm font-bold">Khó</span>
          <span className="text-[10px] text-amber-600 font-mono hidden sm:inline">Phím 2</span>
        </button>

        {/* Rating 3: Đã nhớ */}
        <button
          type="button"
          onClick={() => handleRate('remembered')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 bg-white border border-[#BDE5C8] hover:bg-[#E5F3E9] text-[#173B2B] rounded-2xl shadow-xs transition-all active:scale-95"
        >
          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mb-1 text-[#268A59]" />
          <span className="text-xs sm:text-sm font-bold">Đã nhớ</span>
          <span className="text-[10px] text-[#268A59] font-mono hidden sm:inline">Phím 3</span>
        </button>
      </div>

      {/* Manual Step Navigation */}
      <div className="mt-4 flex items-center justify-between text-xs text-[#69756D]">
        <button
          disabled={currentIndex === 0}
          onClick={() => {
            if (currentIndex > 0) {
              setCurrentIndex((i) => i - 1);
              setIsFlipped(false);
            }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E6EBE6] bg-white transition-colors ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:text-[#173B2B] hover:bg-[#FAFBF8]'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Thẻ trước</span>
        </button>

        <span className="font-mono tabular-nums text-xs">
          Phím tắt: Space (Lật) · 1, 2, 3 (Đánh giá) · R (Nghe)
        </span>

        <button
          disabled={currentIndex + 1 >= totalCards}
          onClick={() => {
            if (currentIndex + 1 < totalCards) {
              setCurrentIndex((i) => i + 1);
              setIsFlipped(false);
            }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E6EBE6] bg-white transition-colors ${
            currentIndex + 1 >= totalCards
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:text-[#173B2B] hover:bg-[#FAFBF8]'
          }`}
        >
          <span>Thẻ sau</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
