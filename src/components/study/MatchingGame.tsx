import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Sparkles,
  Zap,
  ArrowRight,
  BookOpen,
  Trophy,
} from 'lucide-react';
import { Deck, LearningSessionRecord, LearningSessionWordResult, MascotTone, VocabularyItem } from '../../types';
import { recordGameWordResult, saveLearningSession } from '../../services/storage';
import { recordXpReward } from '../../services/progression';
import { CapTongMascot } from '../mascot/CapTongMascot';
import { getRandomDialogue } from '../../data/dialogues';
import { samplePracticeVocabulary } from '../../utils/practiceSampling';

interface MatchingGameProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  defaultDeckId?: string;
  tone: MascotTone;
  onExit: () => void;
  onSelectDeck: (deckId: string) => void;
}

interface MatchCard {
  id: string; // unique card element id (e.g. `en-${wordId}`)
  wordId: string;
  text: string;
  type: 'english' | 'vietnamese';
}

const MAX_PAIRS_PER_ROUND = 6;

export const MatchingGame: React.FC<MatchingGameProps> = ({
  decks,
  vocabulary,
  defaultDeckId,
  tone,
  onExit,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    defaultDeckId || (decks[0]?.id ?? '')
  );

  // Deck vocabulary
  const currentDeck = decks.find((d) => d.id === selectedDeckId);
  const deckWords = useMemo(() => {
    return vocabulary.filter((v) => v.deckId === selectedDeckId);
  }, [vocabulary, selectedDeckId]);

  // Round queue management
  const [unplayedWords, setUnplayedWords] = useState<VocabularyItem[]>([]);
  const [currentRoundWords, setCurrentRoundWords] = useState<VocabularyItem[]>([]);
  const [englishCards, setEnglishCards] = useState<MatchCard[]>([]);
  const [vietnameseCards, setVietnameseCards] = useState<MatchCard[]>([]);

  // Selection states
  const [selectedEnCardId, setSelectedEnCardId] = useState<string | null>(null);
  const [selectedViCardId, setSelectedViCardId] = useState<string | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [mismatchCardIds, setMismatchCardIds] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Session scoring & progression
  const [sessionId, setSessionId] = useState<string>(() => `match-sess-${Date.now()}`);
  const [sessionEarnedXp, setSessionEarnedXp] = useState<number>(0);
  const pairMistakesRef = useRef<Set<string>>(new Set());
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [totalPairsMatched, setTotalPairsMatched] = useState<number>(0);
  const [totalMistakes, setTotalMistakes] = useState<number>(0);
  const [roundMistakes, setRoundMistakes] = useState<number>(0);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(1);
  const [totalRounds, setTotalRounds] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [wordResults, setWordResults] = useState<LearningSessionWordResult[]>([]);
  const lastPairMatchTimeRef = useRef<number>(Date.now());

  // Mascot commentary
  const [currentMascotReaction, setCurrentMascotReaction] = useState(() =>
    getRandomDialogue('WELCOME', tone)
  );

  // Timer interval
  useEffect(() => {
    if (isCompleted || deckWords.length < 2) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, deckWords.length]);

  // Disambiguation helper: avoid picking words with identical Vietnamese definitions in the same round
  const filterDistinctDefinitions = (pool: VocabularyItem[], count: number): VocabularyItem[] => {
    const selected: VocabularyItem[] = [];
    const usedDefs = new Set<string>();

    // First pass: distinct definitions
    for (const item of pool) {
      const normDef = item.vietnameseDefinition.trim().toLowerCase();
      if (!usedDefs.has(normDef)) {
        selected.push(item);
        usedDefs.add(normDef);
        if (selected.length === count) break;
      }
    }

    // Second pass if not enough: take remaining
    if (selected.length < count) {
      for (const item of pool) {
        if (!selected.some((s) => s.id === item.id)) {
          selected.push(item);
          if (selected.length === count) break;
        }
      }
    }

    return selected;
  };

  // Setup round
  const startRoundWithWords = useCallback(
    (roundItems: VocabularyItem[], remainingPool: VocabularyItem[]) => {
      setCurrentRoundWords(roundItems);
      setUnplayedWords(remainingPool);

      // Create distinct cards
      const en: MatchCard[] = roundItems.map((item) => ({
        id: `en-${item.id}`,
        wordId: item.id,
        text: item.englishWord,
        type: 'english',
      }));

      const vi: MatchCard[] = roundItems.map((item) => ({
        id: `vi-${item.id}`,
        wordId: item.id,
        text: item.vietnameseDefinition,
        type: 'vietnamese',
      }));

      // Randomize independently
      setEnglishCards([...en].sort(() => Math.random() - 0.5));
      setVietnameseCards([...vi].sort(() => Math.random() - 0.5));

      setSelectedEnCardId(null);
      setSelectedViCardId(null);
      setMatchedWordIds(new Set());
      setMismatchCardIds([]);
      setIsChecking(false);
      setRoundMistakes(0);
      lastPairMatchTimeRef.current = Date.now();
    },
    []
  );

  // Start / Restart entire game
  const initializeGame = useCallback(
    (deckId: string) => {
      const rawWords = vocabulary.filter((v) => v.deckId === deckId);
      const sampled = samplePracticeVocabulary(rawWords);
      if (sampled.length < 2) return;

      const shuffled = [...sampled].sort(() => Math.random() - 0.5);
      const calculatedTotalRounds = Math.ceil(shuffled.length / MAX_PAIRS_PER_ROUND);

      setTotalRounds(calculatedTotalRounds);
      setCurrentRoundNumber(1);
      setTotalPairsMatched(0);
      setTotalMistakes(0);
      setWordResults([]);
      setIsCompleted(false);
      setElapsedSeconds(0);
      setSessionStartTime(Date.now());
      setSessionId(`match-sess-${Date.now()}`);
      setSessionEarnedXp(0);
      pairMistakesRef.current.clear();
      setCurrentMascotReaction(getRandomDialogue('WELCOME', tone));

      const roundCount = Math.min(shuffled.length, MAX_PAIRS_PER_ROUND);
      const roundItems = filterDistinctDefinitions(shuffled, roundCount);
      const remaining = shuffled.filter((w) => !roundItems.some((r) => r.id === w.id));

      startRoundWithWords(roundItems, remaining);
    },
    [vocabulary, tone, startRoundWithWords]
  );

  useEffect(() => {
    if (selectedDeckId) {
      initializeGame(selectedDeckId);
    }
  }, [selectedDeckId, initializeGame]);

  // Check matching pair
  const evaluateMatch = (enCard: MatchCard, viCard: MatchCard) => {
    setIsChecking(true);
    const now = Date.now();
    const timeForThisPair = (now - lastPairMatchTimeRef.current) / 1000;
    lastPairMatchTimeRef.current = now;

    // Direct match check:
    // Either exact wordId matches, OR Vietnamese definition matches identically (semantic fairness safeguard)
    const enWord = currentRoundWords.find((w) => w.id === enCard.wordId);
    const viWord = currentRoundWords.find((w) => w.id === viCard.wordId);

    const isMatch =
      enCard.wordId === viCard.wordId ||
      (enWord &&
        viWord &&
        enWord.vietnameseDefinition.trim().toLowerCase() ===
          viWord.vietnameseDefinition.trim().toLowerCase());

    if (isMatch) {
      // SUCCESS MATCH
      const matchedId = enCard.wordId;
      const nextMatched = new Set(matchedWordIds);
      nextMatched.add(matchedId);
      // If alternate wordId matched semantically, mark both as resolved
      if (viCard.wordId !== enCard.wordId) {
        nextMatched.add(viCard.wordId);
      }
      setMatchedWordIds(nextMatched);

      setTotalPairsMatched((c) => c + 1);
      recordGameWordResult(selectedDeckId, matchedId, 'correct', 'matching');

      // Award XP for matching pair: 2 XP on first attempt, 1 XP after mistake
      const hadMistake = pairMistakesRef.current.has(matchedId);
      const xpResult = recordXpReward({
        sourceSessionId: sessionId,
        sourceAttemptId: `match-${matchedId}`,
        wordId: matchedId,
        deckId: selectedDeckId,
        learningMode: 'matching',
        calculateParams: {
          learningMode: 'matching',
          isCorrect: true,
          hadMistake,
        },
        reason: hadMistake ? 'Ghép đúng sau lần thử sai' : 'Ghép đúng lần đầu',
      });
      if (xpResult.awardedXP > 0) {
        setSessionEarnedXp((prev) => prev + xpResult.awardedXP);
      }

      setWordResults((prev) => [
        ...prev,
        {
          wordId: matchedId,
          result: 'correct',
          timestamp: Date.now(),
        },
      ]);

      // Reaction
      if (timeForThisPair < 1.8) {
        setCurrentMascotReaction(getRandomDialogue('MATCH_FAST', tone));
      } else {
        setCurrentMascotReaction(getRandomDialogue('MATCH_CORRECT', tone));
      }

      setSelectedEnCardId(null);
      setSelectedViCardId(null);
      setIsChecking(false);

      // Check if current round completed
      if (nextMatched.size >= currentRoundWords.length) {
        handleRoundCompletion(nextMatched.size);
      }
    } else {
      // MISMATCH
      setMismatchCardIds([enCard.id, viCard.id]);
      setTotalMistakes((m) => m + 1);
      setRoundMistakes((m) => m + 1);
      pairMistakesRef.current.add(enCard.wordId);
      pairMistakesRef.current.add(viCard.wordId);

      recordGameWordResult(selectedDeckId, enCard.wordId, 'incorrect', 'matching');
      setWordResults((prev) => [
        ...prev,
        {
          wordId: enCard.wordId,
          result: 'incorrect',
          timestamp: Date.now(),
        },
      ]);

      setCurrentMascotReaction(getRandomDialogue('MATCH_WRONG', tone));

      // Reset selection after delay
      setTimeout(() => {
        setMismatchCardIds([]);
        setSelectedEnCardId(null);
        setSelectedViCardId(null);
        setIsChecking(false);
      }, 700);
    }
  };

  const handleRoundCompletion = (roundPairsCount: number) => {
    if (roundMistakes === 0) {
      setCurrentMascotReaction(getRandomDialogue('MATCH_PERFECT', tone));
    }

    if (unplayedWords.length > 0) {
      // Continue to next round
      setTimeout(() => {
        const nextRoundCount = Math.min(unplayedWords.length, MAX_PAIRS_PER_ROUND);
        const nextRoundItems = filterDistinctDefinitions(unplayedWords, nextRoundCount);
        const nextRemaining = unplayedWords.filter((w) => !nextRoundItems.some((r) => r.id === w.id));

        setCurrentRoundNumber((r) => r + 1);
        startRoundWithWords(nextRoundItems, nextRemaining);
      }, 800);
    } else {
      // ALL ROUNDS COMPLETED
      setTimeout(() => {
        finishGameSession();
      }, 800);
    }
  };

  const finishGameSession = () => {
    setIsCompleted(true);
    setCurrentMascotReaction(getRandomDialogue('GAME_COMPLETE', tone));

    // Persist learning session record
    const totalQ = totalPairsMatched + 1; // current total
    const sessionRecord: LearningSessionRecord = {
      id: `session-matching-${Date.now()}`,
      deckId: selectedDeckId,
      learningMode: 'matching',
      startedAt: sessionStartTime,
      completedAt: Date.now(),
      durationSeconds: elapsedSeconds,
      totalQuestions: totalQ,
      correctAnswers: totalPairsMatched,
      incorrectAnswers: totalMistakes,
      wordResults,
    };
    saveLearningSession(sessionRecord);
  };

  // Card click handlers
  const handleCardClick = (card: MatchCard) => {
    if (isChecking) return;
    if (matchedWordIds.has(card.wordId)) return;

    if (card.type === 'english') {
      if (selectedEnCardId === card.id) {
        setSelectedEnCardId(null); // deselect
        return;
      }
      setSelectedEnCardId(card.id);

      if (selectedViCardId) {
        const viCard = vietnameseCards.find((c) => c.id === selectedViCardId);
        if (viCard) evaluateMatch(card, viCard);
      }
    } else {
      if (selectedViCardId === card.id) {
        setSelectedViCardId(null); // deselect
        return;
      }
      setSelectedViCardId(card.id);

      if (selectedEnCardId) {
        const enCard = englishCards.find((c) => c.id === selectedEnCardId);
        if (enCard) evaluateMatch(enCard, card);
      }
    }
  };

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Handle deck with fewer than 2 words
  if (deckWords.length < 2) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="flex justify-center mb-4">
          <CapTongMascot expression="confused" size="lg" />
        </div>
        <h3 className="text-xl font-bold text-[#1D2420]">
          Bộ từ cần ít nhất 2 từ để Ghép Cặp Đại Chiến!
        </h3>
        <p className="mt-2 text-sm text-[#69756D] leading-relaxed">
          Hiện bộ từ "{currentDeck?.title || 'này'}" chỉ có {deckWords.length} từ. Cạp Tổng cần ít nhất 2 cặp để bày trận đại chiến.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={onExit}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
          >
            Về danh sách bộ từ
          </button>
        </div>
      </div>
    );
  }

  // End-of-session completion screen
  if (isCompleted) {
    const accuracy =
      totalPairsMatched + totalMistakes > 0
        ? Math.round((totalPairsMatched / (totalPairsMatched + totalMistakes)) * 100)
        : 100;

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
            Ghép Cặp Đại Chiến — Hoàn Thành
          </span>

          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#173B2B]">
            {accuracy >= 80
              ? 'Chiến thắng vang dội!'
              : accuracy >= 50
              ? 'Hoàn thành trận đấu!'
              : 'Thua trận tơi tả rồi đại ca!'}
          </h2>

          <div className="mt-4 p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl max-w-lg mx-auto">
            <p className="text-sm font-medium text-[#1D2420]">
              "{currentMascotReaction.text}"
            </p>
            <span className="text-[11px] font-semibold text-[#69756D] mt-1 block">
              — Cạp Tổng bình luận
            </span>
          </div>

          {/* Stats Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl mx-auto">
            <div className="p-3.5 bg-[#E5F3E9] border border-[#BDE5C8] rounded-2xl">
              <span className="text-[11px] font-medium text-[#173B2B] block">Đã ghép đúng</span>
              <span className="text-xl sm:text-2xl font-black text-[#173B2B] tabular-nums mt-1 block">
                {totalPairsMatched} cặp
              </span>
            </div>

            <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <span className="text-[11px] font-bold text-[#268A59] block uppercase">Nọc XP</span>
              <span className="text-xl sm:text-2xl font-black text-[#268A59] tabular-nums mt-1 block font-mono">
                +{sessionEarnedXp}
              </span>
            </div>

            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl">
              <span className="text-[11px] font-medium text-red-800 block">Số lần ghép sai</span>
              <span className="text-xl sm:text-2xl font-black text-red-800 tabular-nums mt-1 block">
                {totalMistakes}
              </span>
            </div>

            <div className="p-3.5 bg-white border border-[#E6EBE6] rounded-2xl">
              <span className="text-[11px] font-medium text-[#69756D] block">Thời gian</span>
              <span className="text-xl sm:text-2xl font-black text-[#1D2420] tabular-nums mt-1 block font-mono">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            <div className="p-3.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl">
              <span className="text-[11px] font-medium text-[#69756D] block">Độ chính xác</span>
              <span className="text-xl sm:text-2xl font-black text-[#268A59] tabular-nums mt-1 block font-mono">
                {accuracy}%
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => initializeGame(selectedDeckId)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Chơi lại ván mới</span>
            </button>
            <button
              onClick={onExit}
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
            >
              Về bộ từ vựng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
      {/* Top Header: Navigation & Status */}
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
                Ghép Cặp Đại Chiến
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
            <div className="flex items-center gap-2 text-xs text-[#69756D] mt-0.5 font-mono">
              <span className="tabular-nums">
                Vòng {currentRoundNumber} / {totalRounds}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {matchedWordIds.size} / {currentRoundWords.length} cặp
              </span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6EBE6] rounded-xl text-[#1D2420] font-mono">
            <Clock className="w-3.5 h-3.5 text-[#268A59]" />
            <span className="tabular-nums font-bold">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6EBE6] rounded-xl text-[#69756D]">
            <span>Sai:</span>
            <span className="tabular-nums font-bold text-red-600 font-mono">
              {totalMistakes}
            </span>
          </div>

          <button
            onClick={() => initializeGame(selectedDeckId)}
            className="p-2 text-[#69756D] hover:text-[#173B2B] hover:bg-white rounded-xl border border-[#E6EBE6] transition-colors"
            title="Chơi lại ván này"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mascot Live Speech Box */}
      <div className="flex items-center gap-3 bg-white border border-[#E6EBE6] rounded-2xl px-4 py-3 shadow-xs">
        <CapTongMascot
          expression={currentMascotReaction.expression}
          size="sm"
          interactive
        />
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#173B2B] block uppercase tracking-wider">
            Cạp Tổng nhận định:
          </span>
          <p className="text-xs sm:text-sm font-medium text-[#1D2420] truncate">
            "{currentMascotReaction.text}"
          </p>
        </div>
      </div>

      {/* MATCHING BOARD: 2 COLUMNS (English vs Vietnamese) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {/* COLUMN 1: ENGLISH WORDS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#173B2B]">
              Từ tiếng Anh ({englishCards.length} từ)
            </span>
            <span className="text-[11px] text-[#69756D]">Chọn 1 từ bên trái</span>
          </div>

          <div className="space-y-2.5">
            {englishCards.map((card) => {
              const isMatched = matchedWordIds.has(card.wordId);
              const isSelected = selectedEnCardId === card.id;
              const isMismatched = mismatchCardIds.includes(card.id);

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isMatched || isChecking}
                  onClick={() => handleCardClick(card)}
                  className={`w-full min-h-[58px] px-4 py-3 text-left rounded-2xl border-2 transition-all flex items-center justify-between text-sm sm:text-base font-bold shadow-xs select-none ${
                    isMatched
                      ? 'opacity-25 bg-[#FAFBF8] border-[#E6EBE6] text-[#69756D] line-through cursor-not-allowed'
                      : isMismatched
                      ? 'bg-red-50 border-red-500 text-red-700 animate-pulse'
                      : isSelected
                      ? 'bg-[#E5F3E9] border-[#268A59] text-[#173B2B] ring-2 ring-[#268A59]/30 scale-[1.01]'
                      : 'bg-white border-[#E6EBE6] hover:border-[#268A59]/50 text-[#1D2420] hover:bg-[#FAFBF8]'
                  }`}
                >
                  <span className="truncate">{card.text}</span>
                  {isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#268A59] shrink-0" />
                  ) : isSelected ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268A59] shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: VIETNAMESE DEFINITIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#173B2B]">
              Nghĩa tiếng Việt
            </span>
            <span className="text-[11px] text-[#69756D]">Ghép với nghĩa tương ứng</span>
          </div>

          <div className="space-y-2.5">
            {vietnameseCards.map((card) => {
              const isMatched = matchedWordIds.has(card.wordId);
              const isSelected = selectedViCardId === card.id;
              const isMismatched = mismatchCardIds.includes(card.id);

              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={isMatched || isChecking}
                  onClick={() => handleCardClick(card)}
                  className={`w-full min-h-[58px] px-4 py-3 text-left rounded-2xl border-2 transition-all flex items-center justify-between text-xs sm:text-sm font-medium leading-relaxed shadow-xs select-none ${
                    isMatched
                      ? 'opacity-25 bg-[#FAFBF8] border-[#E6EBE6] text-[#69756D] line-through cursor-not-allowed'
                      : isMismatched
                      ? 'bg-red-50 border-red-500 text-red-700 animate-pulse'
                      : isSelected
                      ? 'bg-[#E5F3E9] border-[#268A59] text-[#173B2B] ring-2 ring-[#268A59]/30 scale-[1.01]'
                      : 'bg-white border-[#E6EBE6] hover:border-[#268A59]/50 text-[#1D2420] hover:bg-[#FAFBF8]'
                  }`}
                >
                  <span className="line-clamp-2">{card.text}</span>
                  {isMatched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#268A59] shrink-0 ml-2" />
                  ) : isSelected ? (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#268A59] shrink-0 ml-2" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Round Progress Tracker Bar */}
      <div className="pt-4 flex items-center justify-between text-xs text-[#69756D] border-t border-[#E6EBE6]">
        <span>
          Mỗi hiệp tối đa 6 cặp · {unplayedWords.length > 0 ? `Còn ${unplayedWords.length} từ ở các hiệp sau` : 'Hiệp cuối cùng'}
        </span>
        <span className="font-semibold text-[#173B2B]">
          Đã xong: {matchedWordIds.size} / {currentRoundWords.length}
        </span>
      </div>
    </div>
  );
};
