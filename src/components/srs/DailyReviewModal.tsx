import React, { useState, useMemo } from 'react';
import { X, Sparkles, CheckCircle, ArrowRight, RefreshCw, Volume2, Trophy, Flame } from 'lucide-react';
import { Deck, VocabularyItem, ReviewRecord, LearningSessionRecord, MascotTone } from '../../types';
import { getDailyReviewQueue, processReviewAttempt } from '../../services/srs';
import { getRandomDialogue } from '../../data/dialogues';
import { recordXpReward } from '../../services/progression';

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
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedXpTotal, setEarnedXpTotal] = useState(0);

  // Get review queue (default 10 due words)
  const queue = useMemo(() => {
    if (!isOpen) return [];
    return getDailyReviewQueue(10, reviews, sessions, vocabulary);
  }, [isOpen, reviews, sessions, vocabulary]);

  const currentWord = queue[currentIndex];
  const currentDeck = decks.find((d) => d.id === currentWord?.deckId);

  const dialogue = useMemo(() => {
    return getRandomDialogue('SRS_REVIEW_START', mascotTone);
  }, [mascotTone]);

  const completionDialogue = useMemo(() => {
    return getRandomDialogue('SRS_REVIEW_COMPLETE', mascotTone);
  }, [mascotTone]);

  if (!isOpen) return null;

  const handleRating = (rating: 'forgot' | 'hard' | 'remembered') => {
    if (!currentWord) return;

    const isCorrect = rating === 'remembered' || rating === 'hard';
    const eventId = `srs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Process SRS schedule update
    processReviewAttempt(
      {
        eventId,
        wordId: currentWord.id,
        learningMode: 'flashcard',
        isCorrect,
        isPartiallyCorrect: rating === 'hard',
      },
      reviews,
      sessions
    );

    // Record XP reward (flashcard gives 0 XP per milestone rules, but counts towards streak)
    const xpResult = recordXpReward({
      sourceSessionId: `srs-session-${Date.now()}`,
      sourceAttemptId: eventId,
      wordId: currentWord.id,
      deckId: currentWord.deckId,
      learningMode: 'flashcard',
      calculateParams: {
        learningMode: 'flashcard',
        isCorrect,
      },
    });

    setReviewedCount((prev) => prev + 1);
    if (isCorrect) setCorrectCount((prev) => prev + 1);
    setEarnedXpTotal((prev) => prev + xpResult.awardedXP);

    setIsFlipped(false);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
      onReviewCompleted();
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#E6EBE6] animate-in fade-in zoom-in duration-200 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center font-bold">
              🔥
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D2420]">Hôm nay ôn gì?</h2>
              <p className="text-xs text-[#69756D]">Ôn tập thông minh Spaced Repetition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {queue.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center mx-auto text-2xl font-bold">
              ✨
            </div>
            <h3 className="text-base font-bold text-[#1D2420]">Tuyệt vời! Không còn từ nào cần ôn hôm nay.</h3>
            <p className="text-xs text-[#69756D] max-w-sm mx-auto">
              Đại ca đã hoàn thành tất cả lịch ôn tập định kỳ. Hãy quay lại học từ mới hoặc kiểm tra Sổ Nhục nhé!
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors shadow-xs"
            >
              Hoàn tất
            </button>
          </div>
        ) : sessionCompleted ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F3E9] text-[#268A59] flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#1D2420]">Hoàn thành ca ôn tập!</h3>
              <p className="text-xs text-[#69756D] max-w-sm mx-auto">
                {completionDialogue.text}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6]">
                <p className="text-[10px] font-bold text-[#69756D] uppercase">Đã ôn</p>
                <p className="text-lg font-black text-[#1D2420] mt-0.5">{reviewedCount} từ</p>
              </div>
              <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6]">
                <p className="text-[10px] font-bold text-[#69756D] uppercase">Nhớ đúng</p>
                <p className="text-lg font-black text-[#268A59] mt-0.5">{correctCount} từ</p>
              </div>
              <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6]">
                <p className="text-[10px] font-bold text-[#69756D] uppercase">XP nhận</p>
                <p className="text-lg font-black text-[#173B2B] mt-0.5">+{earnedXpTotal}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors shadow-xs"
            >
              Trở về Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mascot Banner */}
            <div className="bg-[#FAFBF8] p-3 rounded-2xl border border-[#E6EBE6] flex items-center gap-3">
              <span className="text-xl">🦂</span>
              <p className="text-xs text-[#1D2420] font-medium">{dialogue.text}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#69756D] font-semibold">
                <span>Tiến độ ôn tập</span>
                <span>{currentIndex + 1} / {queue.length}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#268A59] transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Flashcard Card */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full h-64 bg-[#FAFBF8] border-2 border-[#E6EBE6] hover:border-[#268A59] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer shadow-sm transition-all relative select-none"
            >
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#E5F3E9] text-[#173B2B]">
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
                  className="p-2 rounded-xl bg-white border border-[#E6EBE6] text-[#173B2B] hover:bg-[#E5F3E9] transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {!isFlipped ? (
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-[#1D2420] tracking-tight">{currentWord.englishWord}</h3>
                  {currentWord.partOfSpeech && (
                    <span className="inline-block text-xs font-bold text-[#69756D] bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {currentWord.partOfSpeech}
                    </span>
                  )}
                  <p className="text-xs text-[#69756D] pt-4 animate-pulse">Chạm để lật xem nghĩa</p>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-xs font-bold text-[#69756D] uppercase">Định nghĩa tiếng Việt</p>
                  <h4 className="text-2xl font-black text-[#268A59]">{currentWord.vietnameseDefinition}</h4>
                  {currentWord.exampleSentence && (
                    <p className="text-xs text-gray-500 italic max-w-sm mx-auto pt-2">
                      "{currentWord.exampleSentence}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Rating Buttons */}
            {isFlipped ? (
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleRating('forgot')}
                  className="py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Quên rồi 🔴
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('hard')}
                  className="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hơi khó 🟡
                </button>
                <button
                  type="button"
                  onClick={() => handleRating('remembered')}
                  className="py-3 px-4 rounded-xl bg-[#E5F3E9] hover:bg-[#BDE5C8] border border-[#BDE5C8] text-[#173B2B] text-xs font-bold transition-colors cursor-pointer"
                >
                  Nhớ rõ 🟢
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsFlipped(true)}
                  className="w-full py-3 rounded-xl bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Lật thẻ xem đáp án
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
