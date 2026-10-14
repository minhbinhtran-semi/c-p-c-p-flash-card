import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Volume2,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react';
import {
  Deck,
  LearningSessionRecord,
  LearningSessionWordResult,
  MascotTone,
  MeaningEvaluationResponse,
  VocabularyItem,
} from '../../types';
import { recordStudyReview, saveLearningSession } from '../../services/storage';
import { recordXpReward } from '../../services/progression';
import { evaluateMeaning, AiEvaluationError } from '../../services/aiEvaluation';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';
import { samplePracticeVocabulary } from '../../utils/practiceSampling';

interface MeaningAiStudyProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
}

export const MeaningAiStudy: React.FC<MeaningAiStudyProps> = ({
  decks,
  vocabulary,
  defaultDeckId,
  tone,
  onExit,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    defaultDeckId || (decks[0]?.id ?? '')
  );

  const currentDeck = decks.find((d) => d.id === selectedDeckId);
  const deckWords = useMemo(() => {
    return vocabulary.filter((v) => v.deckId === selectedDeckId);
  }, [vocabulary, selectedDeckId]);

  // Session state
  const [questionList, setQuestionList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);

  // Evaluation state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<MeaningEvaluationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState<boolean>(false);

  // Tally & history
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [partialCount, setPartialCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [overriddenCount, setOverriddenCount] = useState<number>(0);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);

  // Session timer & completion
  const [sessionId] = useState<string>(() => `meaning-sess-${Date.now()}`);
  const [sessionEarnedXp, setSessionEarnedXp] = useState<number>(0);
  const [lastAwardedXp, setLastAwardedXp] = useState<number>(0);
  const attemptedWordsRef = useRef<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Mascot reaction
  const [currentMascotReaction, setCurrentMascotReaction] = useState(() =>
    getRandomDialogue('WELCOME', tone)
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Timer
  useEffect(() => {
    if (isCompleted || deckWords.length === 0) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, deckWords.length]);

  // Focus textarea when question changes
  useEffect(() => {
    if (!evaluationResult && !isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, evaluationResult, isLoading]);

  // Speech helper
  const handlePronounce = (word?: string) => {
    const target = word || questionList[currentIndex]?.englishWord;
    if (!target) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(target);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize session
  const initSession = useCallback(
    (words: VocabularyItem[]) => {
      if (words.length === 0) return;
      const sampled = samplePracticeVocabulary(words);
      const shuffled = [...sampled].sort(() => Math.random() - 0.5);

      setQuestionList(shuffled);
      setCurrentIndex(0);
      setUserAnswer('');
      setShowHint(false);
      setIsLoading(false);
      setEvaluationResult(null);
      setErrorMessage(null);
      setIsOverridden(false);
      setCorrectCount(0);
      setPartialCount(0);
      setIncorrectCount(0);
      setOverriddenCount(0);
      setWordResults([]);
      setIsCompleted(false);
      setElapsedSeconds(0);
      setSessionStartTime(Date.now());
      setCurrentMascotReaction(getRandomDialogue('WELCOME', tone));
    },
    [tone]
  );

  useEffect(() => {
    if (selectedDeckId && deckWords.length > 0) {
      initSession(deckWords);
    }
  }, [selectedDeckId, deckWords, initSession]);

  const currentWord = questionList[currentIndex];

  // Submit answer for evaluation
  const handleSubmitAnswer = async () => {
    if (!currentWord || isLoading || userAnswer.trim().length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await evaluateMeaning({
        word: currentWord.englishWord,
        expectedDefinition: currentWord.vietnameseDefinition,
        userAnswer: userAnswer.trim(),
        partOfSpeech: currentWord.partOfSpeech,
        exampleSentence: currentWord.exampleSentence,
        notes: currentWord.notes,
      });

      setEvaluationResult(result);
      setIsOverridden(false);

      // React with mascot based on verdict
      if (result.verdict === 'correct') {
        setCorrectCount((c) => c + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_MEANING_CORRECT', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'remembered');
      } else if (result.verdict === 'partially_correct') {
        setPartialCount((p) => p + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_MEANING_PARTIAL', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'hard');
      } else {
        setIncorrectCount((i) => i + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_MEANING_WRONG', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'forgot');
      }

      // Record word result
      setWordResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          result: result.verdict,
          userAnswer: userAnswer.trim(),
          meaningEvaluation: result,
          timestamp: Date.now(),
        },
      ]);

      // Award XP according to Milestone 2.1 rules:
      // Correct initial: 8 XP, Correct revision: 4 XP, Partial: 2 XP, Wrong: 0 XP
      const isRevision = attemptedWordsRef.current.has(currentWord.id);
      const isCorrect = result.verdict === 'correct';
      const isPartiallyCorrect = result.verdict === 'partially_correct';

      const xpResult = recordXpReward({
        sourceSessionId: sessionId,
        sourceAttemptId: `meaning-${currentWord.id}-${isRevision ? 'rev' : 'init'}`,
        wordId: currentWord.id,
        deckId: selectedDeckId,
        learningMode: 'meaning_ai',
        calculateParams: {
          learningMode: 'meaning_ai',
          isCorrect,
          isPartiallyCorrect,
          isRevision,
          isOverridden: false,
        },
        reason: isCorrect
          ? isRevision
            ? 'Giải nghĩa đúng sau khi sửa lại'
            : 'Giải nghĩa chuẩn xác lần đầu'
          : isPartiallyCorrect
          ? 'Giải nghĩa đúng một phần'
          : 'Chưa đúng nghĩa',
      });

      setLastAwardedXp(xpResult.awardedXP);
      if (xpResult.awardedXP > 0) {
        setSessionEarnedXp((prev) => prev + xpResult.awardedXP);
      }
      attemptedWordsRef.current.add(currentWord.id);
    } catch (err: any) {
      console.error('Error submitting meaning evaluation:', err);
      const msg =
        err instanceof AiEvaluationError
          ? err.message
          : 'Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra mạng và thử lại.';
      setErrorMessage(msg);
      setCurrentMascotReaction(getRandomDialogue('AI_EVALUATION_ERROR', tone));
    } finally {
      setIsLoading(false);
    }
  };

  // Dispute / Override
  const handleOverrideVerdict = () => {
    if (!evaluationResult || isOverridden || !currentWord) return;

    const previousVerdict = evaluationResult.verdict;
    setIsOverridden(true);
    setOverriddenCount((o) => o + 1);

    // Adjust counters
    if (previousVerdict === 'partially_correct') {
      setPartialCount((p) => Math.max(0, p - 1));
      setCorrectCount((c) => c + 1);
    } else if (previousVerdict === 'incorrect') {
      setIncorrectCount((i) => Math.max(0, i - 1));
      setCorrectCount((c) => c + 1);
    }

    // Override word review in storage
    recordStudyReview(selectedDeckId, currentWord.id, 'remembered');

    // Update session record in memory
    setWordResults((prev) =>
      prev.map((wr) =>
        wr.wordId === currentWord.id
          ? { ...wr, result: 'correct', isOverridden: true }
          : wr
      )
    );

    // Mascot reaction to dispute
    setCurrentMascotReaction({
      id: `dispute-${Date.now()}`,
      text: 'Được rồi, nể đại ca lần này đấy! Nhưng lần sau nhớ giải thích kỹ hơn.',
      expression: 'smug',
    });
  };

  // Fallback manual review if AI has an outage or timeout
  const handleFallbackManualReview = (selfVerdict: 'correct' | 'partially_correct' | 'incorrect') => {
    if (!currentWord || !selectedDeckId) return;

    const fallbackResult: MeaningEvaluationResponse = {
      verdict: selfVerdict,
      confidence: 0.8,
      explanationVi: 'Đại ca tự chấm nghĩa (chế độ đối chiếu thủ công khi AI quá tải).',
      expectedMeaningVi: currentWord.vietnameseDefinition,
      userMeaningVi: userAnswer.trim(),
    };

    setEvaluationResult(fallbackResult);
    setErrorMessage(null);
    setIsOverridden(true); // marked overridden so it does not falsely count toward unverified AI mastery

    if (selfVerdict === 'correct') {
      setCorrectCount((c) => c + 1);
      setCurrentMascotReaction(getRandomDialogue('AI_MEANING_CORRECT', tone));
      recordStudyReview(selectedDeckId, currentWord.id, 'remembered');
    } else if (selfVerdict === 'partially_correct') {
      setPartialCount((p) => p + 1);
      setCurrentMascotReaction(getRandomDialogue('AI_MEANING_PARTIAL', tone));
      recordStudyReview(selectedDeckId, currentWord.id, 'hard');
    } else {
      setIncorrectCount((i) => i + 1);
      setCurrentMascotReaction(getRandomDialogue('AI_MEANING_WRONG', tone));
      recordStudyReview(selectedDeckId, currentWord.id, 'forgot');
    }

    setWordResults((prev) => [
      ...prev,
      {
        wordId: currentWord.id,
        result: selfVerdict,
        userAnswer: userAnswer.trim(),
        meaningEvaluation: fallbackResult,
        isOverridden: true,
        timestamp: Date.now(),
      },
    ]);
  };

  // Retry same word
  const handleRetryCurrentWord = () => {
    setEvaluationResult(null);
    setErrorMessage(null);
    setIsOverridden(false);
    setUserAnswer('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Next word or finish
  const handleNextWord = () => {
    if (currentIndex + 1 < questionList.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setShowHint(false);
      setEvaluationResult(null);
      setErrorMessage(null);
      setIsOverridden(false);
    } else {
      // Completed session
      setIsCompleted(true);
      setCurrentMascotReaction(getRandomDialogue('AI_SESSION_COMPLETE', tone));

      const sessionRecord: LearningSessionRecord = {
        id: `session-meaning-ai-${Date.now()}`,
        deckId: selectedDeckId,
        learningMode: 'meaning_ai',
        startedAt: sessionStartTime,
        completedAt: Date.now(),
        durationSeconds: elapsedSeconds,
        totalQuestions: questionList.length,
        correctAnswers: correctCount,
        partiallyCorrectAnswers: partialCount,
        incorrectAnswers: incorrectCount,
        overriddenCount,
        wordResults,
      };
      saveLearningSession(sessionRecord);
    }
  };

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!evaluationResult && !isLoading && userAnswer.trim().length > 0) {
          handleSubmitAnswer();
        } else if (evaluationResult) {
          handleNextWord();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evaluationResult, isLoading, userAnswer, currentWord]);

  // Empty deck guard
  if (deckWords.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-8 sm:p-12 shadow-xs">
          <CapTongMascot expression="confused" size="lg" />
          <h3 className="mt-4 text-lg font-bold text-[#173B2B]">
            Bộ từ này chưa có từ vựng nào
          </h3>
          <p className="mt-2 text-sm text-[#69756D] max-w-md mx-auto">
            Không có từ vựng thì Gemini cũng chịu chết không chấm được. Hãy thêm ít nhất 1 từ để bắt đầu!
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onExit}
              className="px-4 py-2 text-xs font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#BDE5C8] rounded-xl transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: SESSION COMPLETED SCREEN
  // ----------------------------------------------------
  if (isCompleted) {
    const totalAttempted = questionList.length;
    const finalEffectiveScore = correctCount + partialCount * 0.5;
    const accuracy = totalAttempted > 0 ? Math.round((finalEffectiveScore / totalAttempted) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs text-center relative overflow-hidden">
          <div className="flex justify-center mb-4">
            <CapTongMascot
              expression={accuracy >= 80 ? 'happy' : accuracy >= 50 ? 'idle' : 'confused'}
              size="lg"
            />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#268A59] bg-[#E5F3E9] px-3 py-1 rounded-full">
            Hoàn Thành AI Chấm Nghĩa
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#173B2B]">
            {accuracy >= 80
              ? 'Đại ca hiểu bài phết đấy!'
              : accuracy >= 50
              ? 'Tạm ổn, cần nắm sâu sắc thái hơn.'
              : 'Hiểu nghĩa lơ mơ lắm đại ca ơi!'}
          </h2>

          {/* Mascot Speech Bubble */}
          <div className="mt-4 max-w-lg mx-auto bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4 text-sm text-[#173B2B] leading-relaxed">
            <span className="font-bold text-[#D9AA54] block text-xs mb-1">Cạp Tổng:</span>
            "{currentMascotReaction.text}"
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#69756D] uppercase block mb-1">
                Độ chính xác
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#173B2B] font-mono">
                {accuracy}%
              </span>
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-bold text-[#268A59] uppercase block mb-1">
                Nọc XP
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#268A59] font-mono">
                +{sessionEarnedXp}
              </span>
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#268A59] uppercase block mb-1">
                Đúng chuẩn
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#268A59] font-mono">
                {correctCount}
              </span>
              {overriddenCount > 0 && (
                <span className="text-[10px] text-[#69756D] block mt-0.5">
                  ({overriddenCount} khiếu nại)
                </span>
              )}
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#D9AA54] uppercase block mb-1">
                Đúng một phần
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#D9AA54] font-mono">
                {partialCount}
              </span>
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#69756D] uppercase block mb-1">
                Thời gian
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#173B2B] font-mono">
                {formatTime(elapsedSeconds)}
              </span>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="mt-8 text-left">
            <h3 className="text-sm font-bold text-[#173B2B] uppercase tracking-wider mb-3">
              Chi tiết các từ vừa thẩm định ({wordResults.length} từ):
            </h3>
            <div className="space-y-3">
              {wordResults.map((wr, idx) => {
                const wordItem = vocabulary.find((v) => v.id === wr.wordId);
                const evalData = wr.meaningEvaluation;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E6EBE6] bg-[#FAFBF8] text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#173B2B]">
                          {wordItem?.englishWord || 'Từ vựng'}
                        </span>
                        {wordItem?.partOfSpeech && (
                          <span className="text-[10px] bg-white border border-[#E6EBE6] px-1.5 py-0.5 rounded text-[#69756D]">
                            {wordItem.partOfSpeech}
                          </span>
                        )}
                        <button
                          onClick={() => handlePronounce(wordItem?.englishWord)}
                          className="p-1 text-[#69756D] hover:text-[#173B2B]"
                          title="Phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {wr.isOverridden && (
                          <span className="text-[10px] font-bold bg-[#E5F3E9] text-[#268A59] px-2 py-0.5 rounded-full">
                            Tự duyệt đúng
                          </span>
                        )}
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            wr.result === 'correct'
                              ? 'bg-[#E5F3E9] text-[#268A59]'
                              : wr.result === 'partially_correct'
                              ? 'bg-amber-50 text-[#D9AA54] border border-amber-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}
                        >
                          {wr.result === 'correct'
                            ? 'Đúng'
                            : wr.result === 'partially_correct'
                            ? 'Đúng một phần'
                            : 'Chưa đúng'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#E6EBE6]">
                      <div>
                        <span className="text-[#69756D] block">Câu trả lời của đại ca:</span>
                        <span className="font-medium text-[#173B2B]">
                          "{wr.userAnswer || 'Không có'}"
                        </span>
                      </div>
                      <div>
                        <span className="text-[#69756D] block">Nghĩa mục tiêu:</span>
                        <span className="font-medium text-[#268A59]">
                          {evalData?.expectedMeaningVi || wordItem?.vietnameseDefinition}
                        </span>
                      </div>
                    </div>

                    {evalData?.explanationVi && (
                      <p className="text-[#69756D] italic pt-1 text-[11px]">
                        AI: {evalData.explanationVi}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-[#E6EBE6] flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => initSession(deckWords)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Luyện lại bộ này</span>
            </button>

            {incorrectCount + partialCount > 0 && (
              <button
                onClick={() => {
                  const weakWords = questionList.filter((q) => {
                    const res = wordResults.find((w) => w.wordId === q.id);
                    return res && (res.result === 'incorrect' || res.result === 'partially_correct');
                  });
                  if (weakWords.length > 0) initSession(weakWords);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#BDE5C8] rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chỉ luyện {incorrectCount + partialCount} từ chưa vững</span>
              </button>
            )}

            <button
              onClick={onExit}
              className="px-4 py-2.5 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: ACTIVE QUESTION / EVALUATION SCREEN
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 space-y-5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] rounded-xl border border-[#E6EBE6] transition-colors"
            title="Thoát phiên học"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#173B2B] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#268A59]" />
                AI Chấm Nghĩa
              </span>
              <span className="text-xs text-[#69756D]">·</span>
              <span className="text-xs font-semibold text-[#173B2B] truncate max-w-[180px]">
                {currentDeck?.title}
              </span>
            </div>
            <div className="text-[11px] text-[#69756D]">
              Giải nghĩa bằng tiếng Việt theo cách hiểu của đại ca
            </div>
          </div>
        </div>

        {/* Live Counters & Timer */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className="text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-lg" title="Đúng">
              ✓ {correctCount}
            </span>
            <span className="text-[#D9AA54] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" title="Đúng 1 phần">
              ~ {partialCount}
            </span>
            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200" title="Chưa đúng">
              ✕ {incorrectCount}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-[#69756D] font-mono bg-[#FAFBF8] border border-[#E6EBE6] px-2.5 py-1 rounded-xl">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Deck Switcher Dropdown */}
          {decks.length > 1 && (
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="text-xs font-medium text-[#173B2B] bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#268A59]"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E6EBE6] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#268A59] h-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questionList.length) * 100}%`,
          }}
        />
      </div>

      {/* Main Study Card */}
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Card Header & Vocabulary Prompt */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E6EBE6]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-[#69756D] uppercase font-mono tracking-wider">
                Từ vựng {currentIndex + 1} / {questionList.length}
              </span>
              {currentWord?.partOfSpeech && (
                <span className="text-[10px] font-bold text-[#173B2B] bg-[#E5F3E9] px-2 py-0.5 rounded-md">
                  {currentWord.partOfSpeech}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-black text-[#173B2B] tracking-tight">
                {currentWord?.englishWord}
              </h2>
              <button
                onClick={() => handlePronounce(currentWord?.englishWord)}
                className="p-2 text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] rounded-xl border border-[#E6EBE6] transition-colors"
                title="Phát âm từ này"
              >
                <Volume2 className="w-5 h-5 text-[#268A59]" />
              </button>
            </div>
          </div>

          {/* Context / Hint Button */}
          {(currentWord?.exampleSentence || currentWord?.notes) && (
            <button
              onClick={() => setShowHint((h) => !h)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl transition-colors self-start"
            >
              {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#D9AA54]" />}
              <span>{showHint ? 'Ẩn câu ví dụ' : 'Xem câu ví dụ'}</span>
            </button>
          )}
        </div>

        {/* Revealed Context Hint */}
        {showHint && currentWord?.exampleSentence && (
          <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl text-xs text-[#173B2B] space-y-1">
            <span className="font-bold text-[#268A59] block text-[11px]">Ngữ cảnh ví dụ:</span>
            <p className="italic">"{currentWord.exampleSentence}"</p>
          </div>
        )}

        {/* User Input Form (Disabled when evaluation shown) */}
        {!evaluationResult && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="meaning-input"
                className="block text-xs font-bold text-[#173B2B] uppercase tracking-wider mb-2"
              >
                Nhập nghĩa hoặc giải thích bằng tiếng Việt:
              </label>
              <textarea
                id="meaning-input"
                ref={textareaRef}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value.slice(0, 300))}
                disabled={isLoading}
                rows={3}
                placeholder="Ví dụ: làm giảm thiểu rủi ro hoặc tác hại tiêu cực..."
                className="w-full p-4 rounded-2xl border border-[#E6EBE6] bg-[#FAFBF8] text-sm text-[#1D2420] placeholder:text-[#69756D]/60 focus:bg-white focus:outline-none focus:border-[#268A59] transition-all resize-none font-sans leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#69756D]">
                <span>Chấp nhận diễn đạt tự nhiên, từ đồng nghĩa hoặc giải thích bản chất.</span>
                <span className="font-mono">{userAnswer.length}/300</span>
              </div>
            </div>

            {/* Error Banner with Retry & Fallback */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-red-900">Không thể hoàn thành chấm điểm AI:</span>
                    <span className="text-red-700">{errorMessage}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-red-200/60 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-red-600">
                    Nghĩa mục tiêu: <strong>{currentWord?.vietnameseDefinition}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSubmitAnswer}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-red-300 rounded-xl text-red-700 hover:bg-red-100 transition-colors shadow-2xs"
                    >
                      Thử lại chấm AI
                    </button>
                    <button
                      onClick={() => handleFallbackManualReview('correct')}
                      className="px-3 py-1.5 text-xs font-bold bg-[#173B2B] text-white rounded-xl hover:bg-[#268A59] transition-colors shadow-2xs"
                    >
                      Tôi đã hiểu đúng
                    </button>
                    <button
                      onClick={() => handleFallbackManualReview('incorrect')}
                      className="px-2.5 py-1.5 text-xs font-medium bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors"
                    >
                      Chưa đúng
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#69756D] hidden sm:inline">
                Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Ctrl + Enter</kbd> để gửi nhanh.
              </span>

              <button
                onClick={handleSubmitAnswer}
                disabled={isLoading || userAnswer.trim().length === 0}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isLoading || userAnswer.trim().length === 0
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-[#173B2B] hover:bg-[#268A59] text-white cursor-pointer active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D9AA54]" />
                    <span>Gemini đang thẩm định...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Gemini thẩm định</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* EVALUATION RESULT PANEL */}
        {evaluationResult && (
          <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* Verdict Header Card */}
            <div
              className={`p-5 rounded-2xl border ${
                evaluationResult.verdict === 'correct' || isOverridden
                  ? 'bg-[#E5F3E9] border-[#268A59]/40 text-[#173B2B]'
                  : evaluationResult.verdict === 'partially_correct'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  {evaluationResult.verdict === 'correct' || isOverridden ? (
                    <CheckCircle2 className="w-6 h-6 text-[#268A59]" />
                  ) : evaluationResult.verdict === 'partially_correct' ? (
                    <AlertTriangle className="w-6 h-6 text-[#D9AA54]" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}

                  <div>
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {isOverridden
                        ? 'Đã tự duyệt đúng (Khiếu nại thành công)'
                        : evaluationResult.verdict === 'correct'
                        ? 'Chính xác! Hiểu đúng bản chất'
                        : evaluationResult.verdict === 'partially_correct'
                        ? 'Đúng một phần, thiếu sắc thái'
                        : 'Chưa chính xác'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      Độ tự tin của AI: {Math.round(evaluationResult.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lastAwardedXp > 0 && !isOverridden && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black font-mono bg-[#268A59] text-white rounded-xl shadow-2xs animate-in zoom-in-95">
                      +{lastAwardedXp} XP
                    </span>
                  )}

                  {/* Dispute / Override Button */}
                  {!isOverridden && evaluationResult.verdict !== 'correct' && (
                    <button
                      onClick={handleOverrideVerdict}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-[#173B2B] bg-white border border-[#E6EBE6] rounded-xl hover:bg-[#FAFBF8] transition-colors shadow-2xs"
                      title="Nếu đại ca thấy câu trả lời của mình hợp lý mà AI quá khắt khe"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#268A59]" />
                      <span>Tôi thấy tôi đúng mà!</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Side-by-side meaning comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAFBF8] border border-[#E6EBE6]">
                <span className="text-[11px] font-bold text-[#69756D] uppercase block mb-1">
                  Cách đại ca giải thích:
                </span>
                <p className="font-semibold text-[#173B2B] text-sm">
                  "{evaluationResult.userMeaningVi || userAnswer}"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAFBF8] border border-[#E6EBE6]">
                <span className="text-[11px] font-bold text-[#268A59] uppercase block mb-1">
                  Nghĩa mục tiêu chuẩn xác:
                </span>
                <p className="font-semibold text-[#173B2B] text-sm">
                  {evaluationResult.expectedMeaningVi || currentWord?.vietnameseDefinition}
                </p>
              </div>
            </div>

            {/* Pedagogical Explanation */}
            <div className="p-4 rounded-2xl bg-white border border-[#E6EBE6] text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#173B2B]">
                <Sparkles className="w-4 h-4 text-[#268A59]" />
                <span>Nhận xét chi tiết từ Gemini:</span>
              </div>
              <p className="text-[#1D2420] leading-relaxed text-sm">
                {evaluationResult.explanationVi}
              </p>

              {evaluationResult.nuanceNoteVi && (
                <div className="mt-2 pt-2 border-t border-[#E6EBE6] text-[11px] text-[#69756D]">
                  <span className="font-bold text-[#D9AA54]">Lưu ý sắc thái: </span>
                  {evaluationResult.nuanceNoteVi}
                </div>
              )}
            </div>

            {/* Mascot reaction bubble */}
            <div className="flex items-center gap-3 p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <CapTongMascot expression={currentMascotReaction.expression} size="sm" />
              <div className="text-xs text-[#173B2B] leading-relaxed">
                <span className="font-bold text-[#D9AA54] block text-[11px]">Cạp Tổng:</span>
                "{currentMascotReaction.text}"
              </div>
            </div>

            {/* Next / Retry Action Bar */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E6EBE6]">
              {evaluationResult.verdict !== 'correct' && !isOverridden ? (
                <button
                  onClick={handleRetryCurrentWord}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#173B2B] bg-[#FAFBF8] hover:bg-[#E6EBE6] border border-[#E6EBE6] rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử giải thích lại</span>
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={handleNextWord}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors ml-auto cursor-pointer"
              >
                <span>{currentIndex + 1 < questionList.length ? 'Từ tiếp theo' : 'Xem tổng kết'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
