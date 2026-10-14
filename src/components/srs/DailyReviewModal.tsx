import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { X, Sparkles, CheckCircle, ArrowRight, Volume2, Trophy, Clock, AlertCircle } from 'lucide-react';
import { Deck, VocabularyItem, ReviewRecord, LearningSessionRecord, MascotTone } from '../../types';
import { getDueWords, processReviewAttempt, getIntervalPreviews, getSrsQueueStats, SrsReviewOutcome, formatIntervalLabel } from '../../services/srs';
import { getRandomDialogue } from '../../data/dialogues';
import { recordXpReward } from '../../services/progression';
import { recordStudyReview } from '../../services/storage';

interface DailyReviewModalProps {
  isOpen: boolean;
  decks: Deck[];
  vocabulary: VocabularyItem[];
  reviews: ReviewRecord[];
  sessions: LearningSessionRecord[];
  mascotTone: MascotTone;
  onClose: () => void;
  onReviewCompleted: () => void;
}

export const DailyReviewModal: React.FC<DailyReviewModalProps> = ({
  isOpen,
  decks,
  vocabulary,
  reviews,
  sessions,
  mascotTone,
  onClose,
  onReviewCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Outcome counts
  const [forgotCount, setForgotCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [rememberedCount, setRememberedCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [scheduledNextTimes, setScheduledNextTimes] = useState<number[]>([]);

  const isSubmittingRef = useRef(false);

  // Get current queue stats
  const queueStats = useMemo(() => {
    if (!isOpen) return { dueNowCount: 0, overdueCount: 0, upcomingCount: 0 };
    return getSrsQueueStats(vocabulary, reviews, sessions);
  }, [isOpen, vocabulary, reviews, sessions]);

  // Get review queue (due words only)
  const queue = useMemo(() => {
    if (!isOpen) return [];
    return getDueWords(undefined, reviews, sessions, vocabulary);
  }, [isOpen, reviews, sessions, vocabulary]);

  const currentWord = queue[currentIndex];
  const currentDeck = decks.find((d) => d.id === currentWord?.deckId);

  // Real interval previews for current word via SRS engine
  const previews = useMemo(() => {
    if (!currentWord) return null;
    return getIntervalPreviews(currentWord.id, Date.now(), 'flashcard');
  }, [currentWord]);

  const dialogue = useMemo(() => {
    return getRandomDialogue('SRS_REVIEW_START', mascotTone);
  }, [mascotTone]);

  const completionDialogue = useMemo(() => {
    return getRandomDialogue('SRS_REVIEW_COMPLETE', mascotTone);
  }, [mascotTone]);

  const handleRating = useCallback((outcome: SrsReviewOutcome) => {
    if (!currentWord || isSubmittingRef.current || !isFlipped) return;
    isSubmittingRef.current = true;

    const isCorrect = outcome === 'remembered' || outcome === 'easy';
    const isPartiallyCorrect = outcome === 'hard';
    const now = Date.now();
    const eventId = `srs-dm-${now}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Record review event
    recordStudyReview(currentWord.deckId, currentWord.id, outcome);

    // 2. Process review attempt via authoritative SRS scheduling engine
    const srsState = processReviewAttempt(
      {
        eventId,
        wordId: currentWord.id,
        learningMode: 'flashcard',
        isCorrect,
        isPartiallyCorrect,
        outcome,
        timestamp: now,
      },
      reviews,
      sessions
    );

    if (srsState.nextReviewAt) {
      setScheduledNextTimes((prev) => [...prev, srsState.nextReviewAt!]);
    }

    // 3. Record XP attempt (0 XP for flashcards per milestone rules)
    recordXpReward({
      sourceSessionId: `srs-modal-${now}`,
      sourceAttemptId: eventId,
      wordId: currentWord.id,
      deckId: currentWord.deckId,
      learningMode: 'flashcard',
      calculateParams: {
        learningMode: 'flashcard',
        isCorrect,
      },
      timestamp: now,
    });

    if (outcome === 'forgot') setForgotCount((p) => p + 1);
    else if (outcome === 'hard') setHardCount((p) => p + 1);
    else if (outcome === 'remembered') setRememberedCount((p) => p + 1);
    else if (outcome === 'easy') setEasyCount((p) => p + 1);

    setIsFlipped(false);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 100);
    } else {
      setSessionCompleted(true);
      isSubmittingRef.current = false;
      onReviewCompleted();
    }
  }, [currentWord, isFlipped, reviews, sessions, currentIndex, queue.length, onReviewCompleted]);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (!isOpen || sessionCompleted || queue.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === '1' && isFlipped) {
        e.preventDefault();
        handleRating('forgot');
      } else if (e.key === '2' && isFlipped) {
        e.preventDefault();
        handleRating('hard');
      } else if (e.key === '3' && isFlipped) {
        e.preventDefault();
        handleRating('remembered');
      } else if (e.key === '4' && isFlipped) {
        e.preventDefault();
        handleRating('easy');
      } else if (e.key.toLowerCase() === 'r' && currentWord) {
        e.preventDefault();
        handleSpeak(currentWord.englishWord);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, sessionCompleted, queue.length, isFlipped, currentWord, handleRating, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-5 shadow-2xl border border-[#E6EBE6] animate-in fade-in zoom-in duration-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center font-bold text-lg shadow-2xs">
              🔥
            </div>
            <div>
              <h2 className="text-base font-black text-[#1D2420]">Hôm nay ôn gì?</h2>
              <p className="text-xs text-[#69756D]">Ôn tập chủ động Active Recall & Spaced Repetition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SRS Queue Status Banner */}
        <div className="grid grid-cols-3 gap-2 bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6] text-center">
          <div>
            <span className="text-[10px] font-bold text-[#268A59] uppercase block">Ôn ngay</span>
            <span className="text-base font-black text-[#173B2B] font-mono">{queueStats.dueNowCount} từ</span>
          </div>
          <div className="border-x border-[#E6EBE6]">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Quá hạn</span>
            <span className="text-base font-black text-amber-900 font-mono">{queueStats.overdueCount} từ</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#69756D] uppercase block">Sắp đến hạn</span>
            <span className="text-base font-black text-[#69756D] font-mono">{queueStats.upcomingCount} từ</span>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center mx-auto text-2xl font-bold">
              ✨
            </div>
            <h3 className="text-base font-black text-[#1D2420]">
              Hôm nay đại ca tạm hết nợ từ vựng. Giỏi đấy!
            </h3>
            <p className="text-xs text-[#69756D] max-w-sm mx-auto leading-relaxed">
              Tất cả các từ vựng đều đã được lên lịch hẹn tiếp theo theo đúng chu kỳ Spaced Repetition.
              {queueStats.nextScheduledTime && (
                <span className="block mt-1 font-semibold text-[#173B2B]">
                  Từ tiếp theo đến hạn: sau {formatIntervalLabel(Math.max(0, queueStats.nextScheduledTime - Date.now()))}
                </span>
              )}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Đã hiểu, cạp tiếp!
            </button>
          </div>
        ) : sessionCompleted ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F3E9] text-[#268A59] flex items-center justify-center mx-auto shadow-2xs">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-[#1D2420]">
                Đại ca vừa ôn xong {queue.length} từ.
              </h3>
              <p className="text-xs text-[#69756D] max-w-sm mx-auto">
                {completionDialogue.text}
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              <div className="bg-red-50 p-2.5 rounded-2xl border border-red-200">
                <p className="text-[10px] font-bold text-red-700">🔴 Quên</p>
                <p className="text-base font-black text-red-800 font-mono mt-0.5">{forgotCount}</p>
              </div>
              <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                <p className="text-[10px] font-bold text-amber-800">🟠 Khó</p>
                <p className="text-base font-black text-amber-900 font-mono mt-0.5">{hardCount}</p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200">
                <p className="text-[10px] font-bold text-emerald-800">🟢 Nhớ</p>
                <p className="text-base font-black text-emerald-900 font-mono mt-0.5">{rememberedCount}</p>
              </div>
              <div className="bg-blue-50 p-2.5 rounded-2xl border border-blue-200">
                <p className="text-[10px] font-bold text-blue-800">🔵 Dễ</p>
                <p className="text-base font-black text-blue-900 font-mono mt-0.5">{easyCount}</p>
              </div>
            </div>

            {scheduledNextTimes.length > 0 && (
              <p className="text-[11px] text-[#69756D]">
                Đã lên lịch hẹn lại gần nhất: sau{' '}
                <strong className="text-[#173B2B]">
                  {formatIntervalLabel(Math.max(0, Math.min(...scheduledNextTimes) - Date.now()))}
                </strong>
              </p>
            )}

            <button
              onClick={onClose}
              className="px-8 py-3 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Trở về Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Mascot Banner */}
            <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6] flex items-center gap-3 text-xs font-medium text-[#1D2420]">
              <span className="text-xl">🦂</span>
              <p className="truncate">"{dialogue.text}"</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-[#69756D] font-mono font-semibold">
                <span>Tiến độ ca ôn</span>
                <span>{currentIndex + 1} / {queue.length}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#268A59] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Active Recall Card */}
            <div
              onClick={() => {
                if (!isFlipped) setIsFlipped(true);
              }}
              className={`w-full min-h-[220px] rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all select-none relative border-2 ${
                isFlipped
                  ? 'bg-[#FAFBF8] border-[#268A59]/40'
                  : 'bg-white border-[#E6EBE6] cursor-pointer hover:border-[#268A59]/40 shadow-xs'
              }`}
            >
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#E5F3E9] text-[#173B2B]">
                  {currentDeck?.title || 'Bộ từ'}
                </span>
              </div>

              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeak(currentWord.englishWord);
                  }}
                  className="p-1.5 rounded-xl bg-white border border-[#E6EBE6] text-[#173B2B] hover:bg-[#E5F3E9] transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {!isFlipped ? (
                <div className="space-y-2">
                  <h3 className="text-3xl font-black text-[#1D2420] tracking-tight">{currentWord.englishWord}</h3>
                  {currentWord.partOfSpeech && (
                    <span className="inline-block text-xs font-bold text-[#69756D] bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                  <p className="text-xs text-[#69756D] pt-2">
                    💡 Thử tự nhớ nghĩa trước khi lật thẻ nhé đại ca.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <h3 className="text-xl font-bold text-[#1D2420]">{currentWord.englishWord}</h3>
                  <h4 className="text-2xl font-black text-[#268A59]">{currentWord.vietnameseDefinition}</h4>
                  {currentWord.exampleSentence && (
                    <p className="text-xs text-gray-500 italic max-w-sm mx-auto pt-1 bg-white p-2 rounded-xl border border-[#E6EBE6]">
                      "{currentWord.exampleSentence}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* FOUR SELF-EVALUATION BUTTONS WITH REAL SRS PREVIEWS */}
            {isFlipped ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => handleRating('forgot')}
                  className="py-2.5 px-2 rounded-2xl bg-white hover:bg-red-50 border border-red-200 text-red-700 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>🔴 Quên</span>
                  <span className="text-[10px] text-red-500 font-mono mt-0.5">
                    {previews?.forgot.label || '10 phút'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('hard')}
                  className="py-2.5 px-2 rounded-2xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>🟠 Khó</span>
                  <span className="text-[10px] text-amber-600 font-mono mt-0.5">
                    {previews?.hard.label || '1 giờ'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('remembered')}
                  className="py-2.5 px-2 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>🟢 Nhớ</span>
                  <span className="text-[10px] text-emerald-600 font-mono mt-0.5">
                    {previews?.remembered.label || '1 ngày'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('easy')}
                  className="py-2.5 px-2 rounded-2xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs"
                >
                  <span>🔵 Dễ</span>
                  <span className="text-[10px] text-blue-600 font-mono mt-0.5">
                    {previews?.easy.label || '3 ngày'}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3 rounded-2xl bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  👀 Lật thẻ xem đáp án
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
