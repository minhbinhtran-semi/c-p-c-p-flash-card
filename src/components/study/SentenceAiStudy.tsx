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
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Copy,
  Check,
  ThumbsUp,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  Deck,
  LearningSessionRecord,
  LearningSessionWordResult,
  MascotTone,
  SentenceEvaluationResponse,
  VocabularyItem,
} from '../../types';
import { recordStudyReview, saveLearningSession } from '../../services/storage';
import { recordXpReward } from '../../services/progression';
import { evaluateSentence, AiEvaluationError } from '../../services/aiEvaluation';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';

interface SentenceAiStudyProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
}

export const SentenceAiStudy: React.FC<SentenceAiStudyProps> = ({
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

  // Session question list
  const [questionList, setQuestionList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userSentence, setUserSentence] = useState<string>('');
  const [showExample, setShowExample] = useState<boolean>(false);

  // Evaluation states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<SentenceEvaluationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOverridden, setIsOverridden] = useState<boolean>(false);
  const [copiedSentence, setCopiedSentence] = useState<boolean>(false);

  // Stats
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [partialCount, setPartialCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [overriddenCount, setOverriddenCount] = useState<number>(0);
  const [totalAccumulatedScore, setTotalAccumulatedScore] = useState<number>(0);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);

  // Timer & completion
  const [sessionId] = useState<string>(() => `sentence-sess-${Date.now()}`);
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

  // Focus textarea on question change
  useEffect(() => {
    if (!evaluationResult && !isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentIndex, evaluationResult, isLoading]);

  // Audio pronunciation helper
  const handlePronounce = (text?: string) => {
    const target = text || questionList[currentIndex]?.englishWord;
    if (!target) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(target);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSentence(true);
    setTimeout(() => setCopiedSentence(false), 2000);
  };

  // Init session
  const initSession = useCallback(
    (words: VocabularyItem[]) => {
      if (words.length === 0) return;
      const shuffled = [...words].sort(() => Math.random() - 0.5);

      setQuestionList(shuffled);
      setCurrentIndex(0);
      setUserSentence('');
      setShowExample(false);
      setIsLoading(false);
      setEvaluationResult(null);
      setErrorMessage(null);
      setIsOverridden(false);
      setCorrectCount(0);
      setPartialCount(0);
      setIncorrectCount(0);
      setOverriddenCount(0);
      setTotalAccumulatedScore(0);
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

  // Submit sentence for evaluation
  const handleSubmitSentence = async () => {
    if (!currentWord || isLoading || userSentence.trim().length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await evaluateSentence({
        word: currentWord.englishWord,
        expectedDefinition: currentWord.vietnameseDefinition,
        userSentence: userSentence.trim(),
        partOfSpeech: currentWord.partOfSpeech,
        exampleSentence: currentWord.exampleSentence,
      });

      setEvaluationResult(result);
      setIsOverridden(false);
      setTotalAccumulatedScore((prev) => prev + result.totalScore);

      // React with mascot based on verdict
      if (result.verdict === 'correct') {
        setCorrectCount((c) => c + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_SENTENCE_EXCELLENT', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'remembered');
      } else if (result.verdict === 'partially_correct') {
        setPartialCount((p) => p + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_SENTENCE_PARTIAL', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'hard');
      } else {
        setIncorrectCount((i) => i + 1);
        setCurrentMascotReaction(getRandomDialogue('AI_SENTENCE_WRONG', tone));
        recordStudyReview(selectedDeckId, currentWord.id, 'forgot');
      }

      // Record word result
      setWordResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          result: result.verdict,
          userAnswer: userSentence.trim(),
          sentenceEvaluation: result,
          timestamp: Date.now(),
        },
      ]);

      // Award XP according to Milestone 2.1 rules:
      // Correct initial: 12 XP, Correct revision: 6 XP, Partial: 3 XP, Incorrect/vocabUsage <= 1: 0 XP
      const isRevision = attemptedWordsRef.current.has(currentWord.id);
      const isCorrect = result.verdict === 'correct';
      const isPartiallyCorrect = result.verdict === 'partially_correct';
      const vocabScore = result.scores?.vocabularyUsage ?? 4;

      const xpResult = recordXpReward({
        sourceSessionId: sessionId,
        sourceAttemptId: `sentence-${currentWord.id}-${isRevision ? 'rev' : 'init'}`,
        wordId: currentWord.id,
        deckId: selectedDeckId,
        learningMode: 'sentence_ai',
        calculateParams: {
          learningMode: 'sentence_ai',
          isCorrect,
          isPartiallyCorrect,
          isRevision,
          vocabularyUsageScore: vocabScore,
          isOverridden: false,
        },
        reason: isCorrect
          ? isRevision
            ? 'Đặt câu đúng sau khi sửa lại'
            : 'Đặt câu xuất sắc lần đầu'
          : isPartiallyCorrect
          ? 'Đặt câu đạt một phần yêu cầu'
          : 'Chưa đạt yêu cầu đặt câu',
      });

      setLastAwardedXp(xpResult.awardedXP);
      if (xpResult.awardedXP > 0) {
        setSessionEarnedXp((prev) => prev + xpResult.awardedXP);
      }
      attemptedWordsRef.current.add(currentWord.id);
    } catch (err: any) {
      console.error('Error submitting sentence evaluation:', err);
      const msg =
        err instanceof AiEvaluationError
          ? err.message
          : 'Không thể kết nối đến máy chủ chấm điểm câu. Vui lòng thử lại sau.';
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

    if (previousVerdict === 'partially_correct') {
      setPartialCount((p) => Math.max(0, p - 1));
      setCorrectCount((c) => c + 1);
    } else if (previousVerdict === 'incorrect') {
      setIncorrectCount((i) => Math.max(0, i - 1));
      setCorrectCount((c) => c + 1);
    }

    recordStudyReview(selectedDeckId, currentWord.id, 'remembered');

    setWordResults((prev) =>
      prev.map((wr) =>
        wr.wordId === currentWord.id
          ? { ...wr, result: 'correct', isOverridden: true }
          : wr
      )
    );

    setCurrentMascotReaction({
      id: `dispute-sentence-${Date.now()}`,
      text: 'Đại ca tự tin với câu của mình thì tôi duyệt! Nhưng nhớ ngữ pháp người ta đã sửa nhé.',
      expression: 'smug',
    });
  };

  // Rewrite / Retry sentence
  const handleRetrySentence = () => {
    setEvaluationResult(null);
    setErrorMessage(null);
    setIsOverridden(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Next word or finish
  const handleNextWord = () => {
    if (currentIndex + 1 < questionList.length) {
      setCurrentIndex((i) => i + 1);
      setUserSentence('');
      setShowExample(false);
      setEvaluationResult(null);
      setErrorMessage(null);
      setIsOverridden(false);
    } else {
      setIsCompleted(true);
      setCurrentMascotReaction(getRandomDialogue('AI_SESSION_COMPLETE', tone));

      const sessionRecord: LearningSessionRecord = {
        id: `session-sentence-ai-${Date.now()}`,
        deckId: selectedDeckId,
        learningMode: 'sentence_ai',
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
        if (!evaluationResult && !isLoading && userSentence.trim().length > 0) {
          handleSubmitSentence();
        } else if (evaluationResult) {
          handleNextWord();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evaluationResult, isLoading, userSentence, currentWord]);

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
            Vui lòng thêm từ vựng trước khi thử thách đặt câu cùng Gemini!
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

  // Helper render for Score Dots / Bars (0-4)
  const renderScoreBar = (score: number, maxScore: number = 4) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((point) => (
          <div
            key={point}
            className={`w-4 h-2 rounded-sm transition-all ${
              point <= score
                ? score >= 3
                  ? 'bg-[#268A59]'
                  : score === 2
                  ? 'bg-[#D9AA54]'
                  : 'bg-red-400'
                : 'bg-[#E6EBE6]'
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-mono font-bold text-[#173B2B]">
          {score}/{maxScore}
        </span>
      </div>
    );
  };

  // ----------------------------------------------------
  // VIEW: SESSION COMPLETED SCREEN
  // ----------------------------------------------------
  if (isCompleted) {
    const totalAttempted = questionList.length;
    const maxPossiblePoints = totalAttempted * 16;
    const averageScore =
      totalAttempted > 0 ? (totalAccumulatedScore / totalAttempted).toFixed(1) : '0';
    const overallPercentage =
      maxPossiblePoints > 0 ? Math.round((totalAccumulatedScore / maxPossiblePoints) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs text-center relative overflow-hidden">
          <div className="flex justify-center mb-4">
            <CapTongMascot
              expression={overallPercentage >= 75 ? 'happy' : overallPercentage >= 50 ? 'idle' : 'confused'}
              size="lg"
            />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-[#268A59] bg-[#E5F3E9] px-3 py-1 rounded-full">
            Hoàn Thành Thử Thách Đặt Câu
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#173B2B]">
            {overallPercentage >= 75
              ? 'Văn phong rất mượt mà, đại ca!'
              : overallPercentage >= 50
              ? 'Ý tốt nhưng ngữ pháp còn vấp nhiều!'
              : 'Câu cú toang hoang, cần rèn luyện thêm!'}
          </h2>

          {/* Mascot Speech Bubble */}
          <div className="mt-4 max-w-lg mx-auto bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4 text-sm text-[#173B2B] leading-relaxed">
            <span className="font-bold text-[#D9AA54] block text-xs mb-1">Cạp Tổng:</span>
            "{currentMascotReaction.text}"
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8">
            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-[#69756D] uppercase block mb-1">
                Điểm trung bình
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#173B2B] font-mono">
                {averageScore}<span className="text-sm text-[#69756D] font-normal">/16</span>
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
                Câu đạt chuẩn
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
                Cần cải thiện
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[#D9AA54] font-mono">
                {partialCount + incorrectCount}
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

          {/* List of Sentences Review */}
          <div className="mt-8 text-left">
            <h3 className="text-sm font-bold text-[#173B2B] uppercase tracking-wider mb-3">
              Tổng hợp câu văn và nhận xét ({wordResults.length} câu):
            </h3>
            <div className="space-y-4">
              {wordResults.map((wr, idx) => {
                const wordItem = vocabulary.find((v) => v.id === wr.wordId);
                const evalData = wr.sentenceEvaluation;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-[#E6EBE6] bg-[#FAFBF8] text-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#173B2B]">
                          {wordItem?.englishWord}
                        </span>
                        {wordItem?.partOfSpeech && (
                          <span className="text-[10px] bg-white border border-[#E6EBE6] px-1.5 py-0.5 rounded text-[#69756D]">
                            {wordItem.partOfSpeech}
                          </span>
                        )}
                        <span className="text-[#69756D] font-mono">
                          · {evalData?.totalScore || 0}/16 điểm
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
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
                            ? 'Đạt chuẩn'
                            : wr.result === 'partially_correct'
                            ? 'Cần sửa'
                            : 'Chưa đạt'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-[#E6EBE6]">
                      <div className="text-[#69756D]">
                        Câu đại ca viết:{' '}
                        <span className="font-semibold text-[#173B2B]">
                          "{wr.userAnswer}"
                        </span>
                      </div>
                      {evalData?.correctedSentence && (
                        <div className="text-[#268A59]">
                          Câu sửa chuẩn:{' '}
                          <span className="font-semibold">"{evalData.correctedSentence}"</span>
                        </div>
                      )}
                    </div>

                    {evalData?.feedbackVi && (
                      <p className="text-[#69756D] italic text-[11px]">
                        AI: {evalData.feedbackVi}
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
              <span>Luyện lại toàn bộ</span>
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
                <span>Chỉ luyện {incorrectCount + partialCount} từ điểm thấp</span>
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
  // VIEW: ACTIVE SENTENCE WRITING SCREEN
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
                <Award className="w-3.5 h-3.5 text-[#268A59]" />
                Thử Thách Đặt Câu
              </span>
              <span className="text-xs text-[#69756D]">·</span>
              <span className="text-xs font-semibold text-[#173B2B] truncate max-w-[180px]">
                {currentDeck?.title}
              </span>
            </div>
            <div className="text-[11px] text-[#69756D]">
              Viết câu tiếng Anh chứa từ mục tiêu và nhận điểm chi tiết từ Gemini
            </div>
          </div>
        </div>

        {/* Live Counters & Timer */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold font-mono">
            <span className="text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-lg" title="Đạt chuẩn">
              ✓ {correctCount}
            </span>
            <span className="text-[#D9AA54] bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" title="Cần sửa">
              ~ {partialCount}
            </span>
            <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-200" title="Chưa đạt">
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

      {/* Main Sentence Challenge Card */}
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Card Header & Vocabulary Prompt */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E6EBE6]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-[#69756D] uppercase font-mono tracking-wider">
                Thử thách {currentIndex + 1} / {questionList.length}
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
                title="Phát âm"
              >
                <Volume2 className="w-5 h-5 text-[#268A59]" />
              </button>
            </div>

            <p className="mt-2 text-sm text-[#1D2420] font-medium">
              Nghĩa: <span className="text-[#268A59]">{currentWord?.vietnameseDefinition}</span>
            </p>
          </div>

          {/* Example Sentence Reveal Button */}
          {currentWord?.exampleSentence && (
            <button
              onClick={() => setShowExample((e) => !e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl transition-colors self-start"
            >
              {showExample ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#D9AA54]" />}
              <span>{showExample ? 'Ẩn câu mẫu' : 'Xem câu mẫu'}</span>
            </button>
          )}
        </div>

        {/* Revealed Example Sentence */}
        {showExample && currentWord?.exampleSentence && (
          <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl text-xs text-[#173B2B] space-y-1">
            <span className="font-bold text-[#268A59] block text-[11px]">Câu mẫu tham khảo:</span>
            <p className="italic">"{currentWord.exampleSentence}"</p>
          </div>
        )}

        {/* User Sentence Textarea Form */}
        {!evaluationResult && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="sentence-input"
                className="block text-xs font-bold text-[#173B2B] uppercase tracking-wider mb-2"
              >
                Viết một câu tiếng Anh hoàn chỉnh có chứa từ trên:
              </label>
              <textarea
                id="sentence-input"
                ref={textareaRef}
                value={userSentence}
                onChange={(e) => setUserSentence(e.target.value.slice(0, 500))}
                disabled={isLoading}
                rows={3}
                placeholder={`Ví dụ: The government introduced new policies to ${currentWord?.englishWord || 'mitigate'} the economic crisis.`}
                className="w-full p-4 rounded-2xl border border-[#E6EBE6] bg-[#FAFBF8] text-sm text-[#1D2420] placeholder:text-[#69756D]/60 focus:bg-white focus:outline-none focus:border-[#268A59] transition-all resize-none font-sans leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1 text-[11px] text-[#69756D]">
                <span>Chấp nhận chia thì, số nhiều hoặc biến thể từ phù hợp.</span>
                <span className="font-mono">{userSentence.length}/500</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold block">Không thể hoàn thành chấm câu:</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={handleSubmitSentence}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-red-300 rounded-lg text-red-700 hover:bg-red-100"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#69756D] hidden sm:inline">
                Mẹo: Nhấn <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono">Ctrl + Enter</kbd> để gửi chấm điểm.
              </span>

              <button
                onClick={handleSubmitSentence}
                disabled={isLoading || userSentence.trim().length === 0}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  isLoading || userSentence.trim().length === 0
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    : 'bg-[#173B2B] hover:bg-[#268A59] text-white cursor-pointer active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#D9AA54]" />
                    <span>Gemini đang chấm điểm 4 tiêu chí...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Chấm câu với Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* EVALUATION RESULT PANEL */}
        {evaluationResult && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Overall Verdict & Total Score Card */}
            <div
              className={`p-5 rounded-2xl border ${
                evaluationResult.verdict === 'correct' || isOverridden
                  ? 'bg-[#E5F3E9] border-[#268A59]/40 text-[#173B2B]'
                  : evaluationResult.verdict === 'partially_correct'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {evaluationResult.verdict === 'correct' || isOverridden ? (
                    <CheckCircle2 className="w-7 h-7 text-[#268A59]" />
                  ) : evaluationResult.verdict === 'partially_correct' ? (
                    <AlertTriangle className="w-7 h-7 text-[#D9AA54]" />
                  ) : (
                    <XCircle className="w-7 h-7 text-red-600" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-wider">
                        {isOverridden
                          ? 'Đã tự duyệt đúng'
                          : evaluationResult.verdict === 'correct'
                          ? 'Xuất sắc! Câu đạt tiêu chuẩn'
                          : evaluationResult.verdict === 'partially_correct'
                          ? 'Đạt một phần, cần hoàn thiện'
                          : 'Chưa đạt yêu cầu'}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-90">
                      {evaluationResult.feedbackVi}
                    </p>
                  </div>
                </div>

                {/* Score badge & Override button */}
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-[#E6EBE6] px-3.5 py-1.5 rounded-xl font-mono text-center shadow-2xs">
                    <span className="text-xs text-[#69756D] block">Tổng điểm</span>
                    <span className="text-xl font-black text-[#173B2B]">
                      {evaluationResult.totalScore}
                      <span className="text-xs text-[#69756D] font-normal">/16</span>
                    </span>
                  </div>

                  {!isOverridden && evaluationResult.verdict !== 'correct' && (
                    <button
                      onClick={handleOverrideVerdict}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-[#173B2B] bg-white border border-[#E6EBE6] rounded-xl hover:bg-[#FAFBF8] transition-colors shadow-2xs"
                      title="Nếu đại ca thấy câu mình đã đúng ngữ pháp và ngữ cảnh"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-[#268A59]" />
                      <span>Tôi thấy tôi đúng mà!</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4 CRITERIA SCORECARD BREAKDOWN */}
            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4 sm:p-5">
              <span className="text-xs font-bold text-[#173B2B] uppercase tracking-wider block mb-3">
                Chi tiết 4 tiêu chí khảo thí (Thang điểm 0 - 4):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Grammar */}
                <div className="bg-white border border-[#E6EBE6] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#173B2B] block">1. Ngữ pháp (Grammar)</span>
                    <span className="text-[11px] text-[#69756D]">Cấu trúc câu, trật tự từ, thì, giới từ</span>
                  </div>
                  {renderScoreBar(evaluationResult.scores.grammar)}
                </div>

                {/* 2. Vocabulary Usage */}
                <div className="bg-white border border-[#E6EBE6] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#173B2B] block">2. Dùng từ mục tiêu (Usage)</span>
                    <span className="text-[11px] text-[#69756D]">Đúng nét nghĩa, đúng từ loại và ngữ cảnh</span>
                  </div>
                  {renderScoreBar(evaluationResult.scores.vocabularyUsage)}
                </div>

                {/* 3. Context & Logic */}
                <div className="bg-white border border-[#E6EBE6] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#173B2B] block">3. Ngữ cảnh & Logic (Context)</span>
                    <span className="text-[11px] text-[#69756D]">Tính hợp lý của thông điệp trong thực tế</span>
                  </div>
                  {renderScoreBar(evaluationResult.scores.context)}
                </div>

                {/* 4. Naturalness */}
                <div className="bg-white border border-[#E6EBE6] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#173B2B] block">4. Độ tự nhiên (Naturalness)</span>
                    <span className="text-[11px] text-[#69756D]">Mạch lạc, thói quen diễn đạt bản xứ</span>
                  </div>
                  {renderScoreBar(evaluationResult.scores.naturalness)}
                </div>
              </div>
            </div>

            {/* ISSUES IDENTIFIED (IF ANY) */}
            {(evaluationResult.grammarIssues?.length > 0 || evaluationResult.usageIssues?.length > 0) && (
              <div className="space-y-2 text-xs">
                {evaluationResult.grammarIssues?.length > 0 && (
                  <div className="p-3.5 bg-red-50/60 border border-red-200 rounded-xl space-y-1">
                    <span className="font-bold text-red-700 block">Lỗi ngữ pháp phát hiện:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-red-600 text-[11px]">
                      {evaluationResult.grammarIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluationResult.usageIssues?.length > 0 && (
                  <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                    <span className="font-bold text-amber-800 block">Lỗi dùng từ mục tiêu:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-amber-700 text-[11px]">
                      {evaluationResult.usageIssues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* SENTENCE RECONCILIATION & CORRECTION BOX */}
            <div className="space-y-3 text-xs">
              {/* User Original Sentence */}
              <div className="p-3.5 rounded-xl bg-[#FAFBF8] border border-[#E6EBE6]">
                <span className="text-[11px] font-bold text-[#69756D] block mb-1">
                  Câu của đại ca:
                </span>
                <p className="font-semibold text-[#173B2B] text-sm font-sans">
                  "{userSentence}"
                </p>
              </div>

              {/* Minimally Corrected Sentence */}
              <div className="p-3.5 rounded-xl bg-[#E5F3E9] border border-[#268A59]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#268A59]">
                    Câu sửa chuẩn ngữ pháp:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePronounce(evaluationResult.correctedSentence)}
                      className="text-[#268A59] hover:text-[#173B2B]"
                      title="Nghe câu chuẩn"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyText(evaluationResult.correctedSentence)}
                      className="text-[#268A59] hover:text-[#173B2B] flex items-center gap-1 font-semibold text-[10px]"
                    >
                      {copiedSentence ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSentence ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
                <p className="font-bold text-[#173B2B] text-sm font-sans">
                  "{evaluationResult.correctedSentence}"
                </p>
              </div>

              {/* Improved Natural Alternative */}
              {evaluationResult.improvedSentence &&
                evaluationResult.improvedSentence !== evaluationResult.correctedSentence && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#E6EBE6]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-[#D9AA54] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#D9AA54]" />
                        Gợi ý nâng cấp tự nhiên hơn:
                      </span>
                      <button
                        onClick={() => handlePronounce(evaluationResult.improvedSentence)}
                        className="text-[#69756D] hover:text-[#173B2B]"
                        title="Nghe câu gợi ý"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="font-medium text-[#1D2420] text-sm italic">
                      "{evaluationResult.improvedSentence}"
                    </p>
                  </div>
                )}

              {/* Pedagogical Explanation */}
              <div className="p-3.5 rounded-xl bg-white border border-[#E6EBE6] space-y-1">
                <span className="text-[11px] font-bold text-[#173B2B] block">
                  Phân tích sư phạm:
                </span>
                <p className="text-[#69756D] leading-relaxed text-xs">
                  {evaluationResult.explanationVi}
                </p>
              </div>
            </div>

            {/* Mascot reaction bubble */}
            <div className="flex items-center gap-3 p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <CapTongMascot expression={currentMascotReaction.expression} size="sm" />
              <div className="text-xs text-[#173B2B] leading-relaxed">
                <span className="font-bold text-[#D9AA54] block text-[11px]">Cạp Tổng:</span>
                "{currentMascotReaction.text}"
              </div>
            </div>

            {/* Bottom Actions: Rewrite / Next Word */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E6EBE6]">
              {evaluationResult.verdict !== 'correct' && !isOverridden ? (
                <button
                  onClick={handleRetrySentence}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#173B2B] bg-[#FAFBF8] hover:bg-[#E6EBE6] border border-[#E6EBE6] rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Thử viết lại câu</span>
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
