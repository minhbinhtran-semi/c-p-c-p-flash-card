import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  BookOpen,
  Keyboard,
  Lightbulb,
} from 'lucide-react';
import { Deck, LearningSessionRecord, LearningSessionWordResult, MascotTone, VocabularyItem } from '../../types';
import { recordGameWordResult, saveLearningSession } from '../../services/storage';
import { recordXpReward } from '../../services/progression';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';
import { samplePracticeVocabulary } from '../../utils/practiceSampling';

interface TypingGameProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
}

export const TypingGame: React.FC<TypingGameProps> = ({
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

  // Game questions
  const [questionList, setQuestionList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean>(false);

  // Hints
  const [revealedFirstLetter, setRevealedFirstLetter] = useState<boolean>(false);
  const [revealedWordLength, setRevealedWordLength] = useState<boolean>(false);
  const [hintsUsedInQuestion, setHintsUsedInQuestion] = useState<number>(0);
  const [totalHintsUsedSession, setTotalHintsUsedSession] = useState<number>(0);

  // Stats & Progress
  const [sessionId, setSessionId] = useState<string>(() => `typing-sess-${Date.now()}`);
  const [sessionEarnedXp, setSessionEarnedXp] = useState<number>(0);
  const mistakeWordsRef = useRef<Set<string>>(new Set());
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [incorrectWords, setIncorrectWords] = useState<VocabularyItem[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);

  // Mascot reaction
  const [currentMascotReaction, setCurrentMascotReaction] = useState(() =>
    getRandomDialogue('WELCOME', tone)
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Live timer
  useEffect(() => {
    if (isCompleted || deckWords.length === 0) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted, deckWords.length]);

  // Focus input automatically on question change
  useEffect(() => {
    if (!isAnswerChecked && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, isAnswerChecked]);

  // Pronounce helper
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

  // Initialize questions
  const initGameWithWords = useCallback(
    (words: VocabularyItem[]) => {
      if (words.length === 0) return;
      const sampled = samplePracticeVocabulary(words);
      const shuffled = [...sampled].sort(() => Math.random() - 0.5);

      setQuestionList(shuffled);
      setCurrentIndex(0);
      setUserAnswer('');
      setIsAnswerChecked(false);
      setIsCurrentCorrect(false);
      setRevealedFirstLetter(false);
      setRevealedWordLength(false);
      setHintsUsedInQuestion(0);
      setTotalHintsUsedSession(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setIncorrectWords([]);
      setWordResults([]);
      setIsCompleted(false);
      setElapsedSeconds(0);
      setSessionStartTime(Date.now());
      setSessionId(`typing-sess-${Date.now()}`);
      setSessionEarnedXp(0);
      mistakeWordsRef.current.clear();
      setCurrentMascotReaction(getRandomDialogue('WELCOME', tone));
    },
    [tone]
  );

  useEffect(() => {
    if (selectedDeckId && deckWords.length > 0) {
      initGameWithWords(deckWords);
    }
  }, [selectedDeckId, deckWords, initGameWithWords]);

  const currentWord = questionList[currentIndex];

  // Disambiguation: check if multiple words in deck share same Vietnamese definition
  const ambiguousDefinitionsCount = useMemo(() => {
    if (!currentWord) return 0;
    const normDef = currentWord.vietnameseDefinition.trim().toLowerCase();
    return deckWords.filter((w) => w.vietnameseDefinition.trim().toLowerCase() === normDef).length;
  }, [currentWord, deckWords]);

  // Answer normalization & verification
  const normalizeText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .normalize('NFC');
  };

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswerChecked || !currentWord) return;

    const trimmedInput = normalizeText(userAnswer);
    if (!trimmedInput) return; // Don't submit empty

    const targetNormalized = normalizeText(currentWord.englishWord);

    // Exact check
    const isCorrect = trimmedInput === targetNormalized;

    setIsAnswerChecked(true);
    setIsCurrentCorrect(isCorrect);

    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setCurrentMascotReaction(getRandomDialogue('TYPING_CORRECT', tone));

      recordGameWordResult(
        selectedDeckId,
        currentWord.id,
        'correct',
        'typing',
        hintsUsedInQuestion
      );

      // Award XP for typing: 6 XP first attempt without hint, max 3 XP if hint/mistake
      const hadMistake = mistakeWordsRef.current.has(currentWord.id);
      const xpResult = recordXpReward({
        sourceSessionId: sessionId,
        sourceAttemptId: `typing-${currentWord.id}`,
        wordId: currentWord.id,
        deckId: selectedDeckId,
        learningMode: 'typing',
        calculateParams: {
          learningMode: 'typing',
          isCorrect: true,
          hintsUsed: hintsUsedInQuestion,
          hadMistake,
        },
        reason: hintsUsedInQuestion > 0
          ? 'Gõ đúng có gợi ý'
          : hadMistake
          ? 'Gõ đúng sau lần thử sai'
          : 'Gõ đúng không gợi ý',
      });
      if (xpResult.awardedXP > 0) {
        setSessionEarnedXp((prev) => prev + xpResult.awardedXP);
      }

      setWordResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          result: 'correct',
          hintsUsed: hintsUsedInQuestion,
          timestamp: Date.now(),
        },
      ]);
    } else {
      setIncorrectCount((c) => c + 1);
      setIncorrectWords((prev) => [...prev, currentWord]);
      mistakeWordsRef.current.add(currentWord.id);
      setCurrentMascotReaction(getRandomDialogue('TYPING_WRONG', tone));

      recordGameWordResult(selectedDeckId, currentWord.id, 'incorrect', 'typing', 0);

      setWordResults((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          result: 'incorrect',
          hintsUsed: hintsUsedInQuestion,
          timestamp: Date.now(),
        },
      ]);

      // Auto pronounce correct answer
      handlePronounce(currentWord.englishWord);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questionList.length) {
      setCurrentIndex((i) => i + 1);
      setUserAnswer('');
      setIsAnswerChecked(false);
      setIsCurrentCorrect(false);
      setRevealedFirstLetter(false);
      setRevealedWordLength(false);
      setHintsUsedInQuestion(0);
    } else {
      // Complete game session
      setIsCompleted(true);
      setCurrentMascotReaction(getRandomDialogue('GAME_COMPLETE', tone));

      const sessionRecord: LearningSessionRecord = {
        id: `session-typing-${Date.now()}`,
        deckId: selectedDeckId,
        learningMode: 'typing',
        startedAt: sessionStartTime,
        completedAt: Date.now(),
        durationSeconds: elapsedSeconds,
        totalQuestions: questionList.length,
        correctAnswers: correctCount + (isCurrentCorrect ? 1 : 0),
        incorrectAnswers: incorrectCount + (!isCurrentCorrect ? 1 : 0),
        hintsUsed: totalHintsUsedSession,
        wordResults,
      };
      saveLearningSession(sessionRecord);
    }
  };

  // Keyboard navigation: Enter on checked state advances to next
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isAnswerChecked && e.key === 'Enter') {
        e.preventDefault();
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isAnswerChecked, currentIndex, questionList.length]);

  // Hint triggers
  const handleRevealFirstLetter = () => {
    if (revealedFirstLetter || !currentWord) return;
    setRevealedFirstLetter(true);
    setHintsUsedInQuestion((h) => h + 1);
    setTotalHintsUsedSession((t) => t + 1);
    setCurrentMascotReaction(getRandomDialogue('TYPING_HINT', tone));
  };

  const handleRevealWordLength = () => {
    if (revealedWordLength || !currentWord) return;
    setRevealedWordLength(true);
    setHintsUsedInQuestion((h) => h + 1);
    setTotalHintsUsedSession((t) => t + 1);
    setCurrentMascotReaction(getRandomDialogue('TYPING_HINT', tone));
  };

  // Generate blank template representation (e.g. "m _ _ _ _ _ _ _")
  const renderWordLengthTemplate = (word: string) => {
    return word
      .split('')
      .map((char, index) => {
        if (char === ' ') return '  ';
        if (char === '-') return '-';
        if (index === 0 && revealedFirstLetter) return char;
        return '_';
      })
      .join(' ');
  };

  // Retry only mistakes
  const handleRetryMistakes = () => {
    if (incorrectWords.length === 0) return;
    initGameWithWords(incorrectWords);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Empty deck guard
  if (deckWords.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="flex justify-center mb-4">
          <CapTongMascot expression="confused" size="lg" />
        </div>
        <h3 className="text-xl font-bold text-[#1D2420]">
          Bộ từ chưa có từ vựng nào để gõ!
        </h3>
        <p className="mt-2 text-sm text-[#69756D]">
          Hãy thêm từ vựng vào bộ "{currentDeck?.title || 'này'}" để bắt đầu thử thách gõ từ.
        </p>
        <button
          onClick={onExit}
          className="mt-6 px-5 py-2.5 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
        >
          Về danh sách bộ từ
        </button>
      </div>
    );
  }

  // Session Completion Screen
  if (isCompleted) {
    const totalQ = questionList.length;
    const accuracy = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs text-center">
          <div className="flex justify-center">
            <CapTongMascot
              expression={accuracy >= 80 ? 'happy' : accuracy >= 50 ? 'smug' : 'confused'}
              size="lg"
            />
          </div>

          <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#268A59]">
            Gõ Đi Đại Ca — Tổng Kết Màn Chơi
          </span>

          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#173B2B]">
            {accuracy >= 80
              ? 'Tay gõ như bay, nhớ từ siêu đẳng!'
              : accuracy >= 50
              ? 'Tạm ổn, có tiềm năng đấy!'
              : 'Gõ sai tùm lum rồi đại ca!'}
          </h2>

          <div className="mt-4 p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#1D2420]">
              "{currentMascotReaction.text}"
            </p>
            <span className="text-[11px] font-semibold text-[#69756D] mt-1 block">
              — Cạp Tổng chấm điểm
            </span>
          </div>

          {/* Stats Breakdown */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl mx-auto">
            <div className="p-3.5 bg-[#E5F3E9] border border-[#BDE5C8] rounded-2xl">
              <span className="text-[11px] font-medium text-[#173B2B] block">Gõ đúng</span>
              <span className="text-xl sm:text-2xl font-black text-[#173B2B] tabular-nums mt-1 block">
                {correctCount} / {totalQ}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <span className="text-[11px] font-bold text-[#268A59] block uppercase">Nọc XP</span>
              <span className="text-xl sm:text-2xl font-black text-[#268A59] tabular-nums mt-1 block font-mono">
                +{sessionEarnedXp}
              </span>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <span className="text-[11px] font-medium text-red-800 block">Gõ sai</span>
              <span className="text-xl sm:text-2xl font-black text-red-800 tabular-nums mt-1 block">
                {incorrectCount}
              </span>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
              <span className="text-[11px] font-medium text-amber-800 block">Dùng gợi ý</span>
              <span className="text-xl sm:text-2xl font-black text-amber-800 tabular-nums mt-1 block">
                {totalHintsUsedSession} lần
              </span>
            </div>

            <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <span className="text-[11px] font-medium text-[#69756D] block">Độ chính xác</span>
              <span className="text-xl sm:text-2xl font-black text-[#268A59] tabular-nums mt-1 block font-mono">
                {accuracy}%
              </span>
            </div>
          </div>

          {/* List of Incorrect Words to Review */}
          {incorrectWords.length > 0 && (
            <div className="mt-6 text-left max-w-lg mx-auto">
              <span className="text-xs font-bold text-[#173B2B] uppercase tracking-wider block mb-2">
                Các từ cần ôn lại ({incorrectWords.length} từ):
              </span>
              <div className="max-h-36 overflow-y-auto border border-[#E6EBE6] rounded-xl bg-[#FAFBF8] divide-y divide-[#E6EBE6] text-xs">
                {incorrectWords.map((item, idx) => (
                  <div key={idx} className="px-3.5 py-2 flex items-center justify-between">
                    <span className="font-bold text-[#173B2B]">{item.englishWord}</span>
                    <span className="text-[#69756D] truncate max-w-xs">{item.vietnameseDefinition}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {incorrectWords.length > 0 && (
              <button
                onClick={handleRetryMistakes}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Luyện lại {incorrectWords.length} từ sai</span>
              </button>
            )}

            <button
              onClick={() => initGameWithWords(deckWords)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại toàn bộ</span>
            </button>

            <button
              onClick={onExit}
              className="w-full sm:w-auto px-5 py-3 text-sm font-semibold text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
            >
              Về bộ từ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header: Navigation & Counters */}
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
              <span className="text-xs font-bold text-[#268A59] uppercase tracking-wider">
                Gõ Đi Đại Ca
              </span>
              <span aria-hidden="true">·</span>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="text-sm font-bold text-[#173B2B] bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:underline"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-[#69756D] font-mono tabular-nums">
              Câu {currentIndex + 1} / {questionList.length}
            </span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6EBE6] rounded-xl text-[#1D2420] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#268A59]" />
            <span className="tabular-nums font-bold">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E6EBE6] rounded-xl font-mono">
            <span className="text-[#268A59] font-bold">✓ {correctCount}</span>
            <span className="text-red-600 font-bold">✗ {incorrectCount}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E6EBE6] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#268A59] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questionList.length) * 100}%` }}
        />
      </div>

      {/* Mascot Reaction Toast */}
      <div className="flex items-center gap-3 bg-white border border-[#E6EBE6] rounded-2xl px-4 py-3 shadow-xs">
        <CapTongMascot
          expression={currentMascotReaction.expression}
          size="sm"
          interactive
        />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#173B2B] block uppercase tracking-wider">
            Cạp Tổng:
          </span>
          <p className="text-xs sm:text-sm font-medium text-[#1D2420] truncate">
            "{currentMascotReaction.text}"
          </p>
        </div>
      </div>

      {/* MAIN QUESTION CARD */}
      <div className="bg-white border-2 border-[#E6EBE6] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        {/* Vietnamese Definition Prompt */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-[#69756D] uppercase tracking-wider">
              Hãy gõ từ tiếng Anh tương ứng với nghĩa:
            </span>
            {currentWord?.partOfSpeech && (
              <span className="text-xs font-bold text-[#268A59] italic">
                ({currentWord.partOfSpeech})
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-[#173B2B] leading-tight">
            "{currentWord?.vietnameseDefinition}"
          </h3>

          {/* Disambiguation hint if identical definition exists */}
          {ambiguousDefinitionsCount > 1 && (
            <p className="text-xs text-[#D9AA54] font-medium">
              💡 Gợi ý phân biệt: Từ gồm {currentWord.englishWord.length} chữ cái
              {currentWord.partOfSpeech ? `, từ loại ${currentWord.partOfSpeech}` : ''}.
            </p>
          )}
        </div>

        {/* HINT DISPLAY */}
        {(revealedFirstLetter || revealedWordLength) && (
          <div className="p-3 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl text-center space-y-1">
            <span className="text-[11px] font-bold text-[#D9AA54] uppercase tracking-wider block">
              Gợi ý trợ giúp:
            </span>
            {revealedFirstLetter && (
              <p className="text-sm font-semibold text-[#173B2B]">
                Bắt đầu bằng chữ:{' '}
                <span className="text-[#268A59] font-mono text-base uppercase">
                  '{currentWord.englishWord.charAt(0)}'
                </span>
              </p>
            )}
            {revealedWordLength && (
              <p className="font-mono text-base font-bold text-[#173B2B] tracking-widest mt-1">
                {renderWordLengthTemplate(currentWord.englishWord)}
              </p>
            )}
          </div>
        )}

        {/* INPUT FORM */}
        <form onSubmit={handleCheckAnswer} className="space-y-4 max-w-lg mx-auto">
          <div>
            <input
              ref={inputRef}
              type="text"
              disabled={isAnswerChecked}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Gõ từ tiếng Anh vào đây rồi nhấn Enter..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className={`w-full px-5 py-4 text-center text-lg sm:text-xl font-bold rounded-2xl border-2 transition-all focus:outline-none ${
                isAnswerChecked
                  ? isCurrentCorrect
                    ? 'bg-[#E5F3E9] border-[#268A59] text-[#173B2B]'
                    : 'bg-red-50 border-red-500 text-red-700'
                  : 'bg-[#FAFBF8] border-[#E6EBE6] focus:border-[#268A59] focus:bg-white text-[#1D2420]'
              }`}
            />
          </div>

          {/* CHECK BUTTON OR NEXT BUTTON */}
          {!isAnswerChecked ? (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className={`flex-1 py-3.5 px-4 text-sm font-bold text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 ${
                  userAnswer.trim()
                    ? 'bg-[#173B2B] hover:bg-[#268A59] cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Kiểm tra (Enter)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
              {/* Answer Result Callout */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 text-left ${
                  isCurrentCorrect
                    ? 'bg-[#E5F3E9] border-[#BDE5C8] text-[#173B2B]'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {isCurrentCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-[#268A59] shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm uppercase tracking-wide">
                      {isCurrentCorrect ? 'Chính xác!' : 'Chưa đúng!'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePronounce(currentWord.englishWord)}
                      className="text-xs text-[#268A59] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe đọc</span>
                    </button>
                  </div>

                  {!isCurrentCorrect && (
                    <div className="mt-1">
                      <span className="text-xs text-red-700 block">Đáp án chuẩn là:</span>
                      <span className="text-lg font-black text-[#173B2B] block tracking-tight">
                        {currentWord.englishWord}
                      </span>
                    </div>
                  )}

                  {currentWord.exampleSentence && (
                    <div className="mt-2 pt-2 border-t border-black/5 text-xs text-[#1D2420]">
                      <span className="font-semibold block text-[#173B2B]">Ví dụ:</span>
                      "{currentWord.exampleSentence}"
                    </div>
                  )}
                </div>
              </div>

              {/* Next Question Button */}
              <button
                type="button"
                onClick={handleNextQuestion}
                className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {currentIndex + 1 < questionList.length ? 'Câu tiếp theo (Enter)' : 'Xem kết quả tổng kết (Enter)'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>

        {/* HINT BUTTON CONTROLS (Only visible before checking) */}
        {!isAnswerChecked && (
          <div className="pt-4 border-t border-[#E6EBE6] flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-[#69756D] mr-1">Cần trợ giúp?</span>
            <button
              type="button"
              disabled={revealedFirstLetter}
              onClick={handleRevealFirstLetter}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                revealedFirstLetter
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-[#E6EBE6] text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#D9AA54]" />
              <span>Gợi ý chữ cái đầu</span>
            </button>

            <button
              type="button"
              disabled={revealedWordLength}
              onClick={handleRevealWordLength}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                revealedWordLength
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white border-[#E6EBE6] text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#D9AA54]" />
              <span>Gợi ý số lượng chữ cái</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
