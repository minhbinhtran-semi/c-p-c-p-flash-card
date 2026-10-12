import {
  LearningMode,
  LearningSessionRecord,
  MeaningEvaluationResponse,
  ReviewRecord,
  SentenceEvaluationResponse,
  VocabularyItem,
} from '../types';
import { getLocalDateString } from './progression';

export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120]; // Days for stages 0 to 7

export interface WordSrsState {
  wordId: string;
  stage: number; // 0 to 7
  learningStatus: 'new' | 'learning' | 'improving' | 'stable' | 'mastered';
  difficultyStatus: 'Từ mới' | 'Đang vật lộn' | 'Đang tiến bộ' | 'Nhớ khá ổn' | 'Đã thuần phục';
  lastReviewAt?: number;
  nextReviewAt?: number;
  lastStrongRecallDate?: string;
  consecutiveStrongRecallDays: number;
  lapseCount: number;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  partiallyCorrectAttempts: number;
  lastStudiedDate?: string;
  lastIncorrectDate?: string;
  modeStats: Record<LearningMode, { attempts: number; correct: number; incorrect: number }>;
  schedulingVersion: number;
  processedReviewEventIds: string[];
}

const STORAGE_KEY = 'capcap_srs_v1';

export function getAllSrsStates(): Record<string, WordSrsState> {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, WordSrsState>;
  } catch (err) {
    console.error('Error reading capcap_srs_v1:', err);
    return {};
  }
}

export function saveAllSrsStates(states: Record<string, WordSrsState>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (err) {
    console.error('Error saving capcap_srs_v1:', err);
  }
}

export function getWordSrsState(wordId: string): WordSrsState {
  const all = getAllSrsStates();
  if (all[wordId]) return all[wordId];

  // Default initial state for a word
  return {
    wordId,
    stage: 0,
    learningStatus: 'new',
    difficultyStatus: 'Từ mới',
    consecutiveStrongRecallDays: 0,
    lapseCount: 0,
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    partiallyCorrectAttempts: 0,
    modeStats: {
      flashcard: { attempts: 0, correct: 0, incorrect: 0 },
      matching: { attempts: 0, correct: 0, incorrect: 0 },
      typing: { attempts: 0, correct: 0, incorrect: 0 },
      meaning_ai: { attempts: 0, correct: 0, incorrect: 0 },
      sentence_ai: { attempts: 0, correct: 0, incorrect: 0 },
    },
    schedulingVersion: 1,
    processedReviewEventIds: [],
  };
}

/**
 * Reconstructs or updates word learning statistics and SRS scheduling based on authoritative review records and session history.
 */
export function computeWordStatsAndSchedule(
  wordId: string,
  reviews: ReviewRecord[],
  sessions: LearningSessionRecord[]
): WordSrsState {
  const state = getWordSrsState(wordId);
  const wordReviews = reviews.filter((r) => r.wordId === wordId);

  let totalAttempts = 0;
  let correctAttempts = 0;
  let incorrectAttempts = 0;
  let partiallyCorrectAttempts = 0;
  let lastStudiedTimestamp: number | undefined;
  let lastIncorrectTimestamp: number | undefined;

  const modeStats: Record<LearningMode, { attempts: number; correct: number; incorrect: number }> = {
    flashcard: { attempts: 0, correct: 0, incorrect: 0 },
    matching: { attempts: 0, correct: 0, incorrect: 0 },
    typing: { attempts: 0, correct: 0, incorrect: 0 },
    meaning_ai: { attempts: 0, correct: 0, incorrect: 0 },
    sentence_ai: { attempts: 0, correct: 0, incorrect: 0 },
  };

  // Inspect sessions for detailed mode stats & strong recall evidence
  sessions.forEach((s) => {
    s.wordResults.forEach((wr) => {
      if (wr.wordId === wordId) {
        totalAttempts++;
        if (!lastStudiedTimestamp || wr.timestamp > lastStudiedTimestamp) {
          lastStudiedTimestamp = wr.timestamp;
        }

        const mode = s.learningMode;
        if (modeStats[mode]) {
          modeStats[mode].attempts++;
        }

        if (wr.result === 'correct') {
          correctAttempts++;
          if (modeStats[mode]) modeStats[mode].correct++;
        } else if (wr.result === 'partially_correct') {
          partiallyCorrectAttempts++;
          if (modeStats[mode]) modeStats[mode].correct++; // count partial as mild success
        } else {
          incorrectAttempts++;
          if (modeStats[mode]) modeStats[mode].incorrect++;
          if (!lastIncorrectTimestamp || wr.timestamp > lastIncorrectTimestamp) {
            lastIncorrectTimestamp = wr.timestamp;
          }
        }
      }
    });
  });

  // Fallback to reviews if sessions are empty
  if (totalAttempts === 0 && wordReviews.length > 0) {
    totalAttempts = wordReviews.length;
    wordReviews.forEach((r) => {
      if (!lastStudiedTimestamp || r.timestamp > lastStudiedTimestamp) {
        lastStudiedTimestamp = r.timestamp;
      }
      if (r.result === 'remembered' || r.result === 'hard') {
        correctAttempts++;
      } else {
        incorrectAttempts++;
        if (!lastIncorrectTimestamp || r.timestamp > lastIncorrectTimestamp) {
          lastIncorrectTimestamp = r.timestamp;
        }
      }
    });
  }

  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
  const lastStudiedDate = lastStudiedTimestamp ? getLocalDateString(lastStudiedTimestamp) : undefined;
  const lastIncorrectDate = lastIncorrectTimestamp ? getLocalDateString(lastIncorrectTimestamp) : undefined;

  // Difficulty Classification based on Milestone 2.2 rules
  let difficultyStatus: WordSrsState['difficultyStatus'] = 'Từ mới';
  let learningStatus: WordSrsState['learningStatus'] = 'new';

  if (totalAttempts === 0) {
    difficultyStatus = 'Từ mới';
    learningStatus = 'new';
  } else if (incorrectAttempts > correctAttempts || (lastIncorrectDate && lastStudiedDate && lastIncorrectDate === lastStudiedDate && incorrectAttempts > 0)) {
    difficultyStatus = 'Đang vật lộn';
    learningStatus = 'learning';
  } else if (accuracy >= 0.8 && state.stage >= 5 && state.consecutiveStrongRecallDays >= 3) {
    difficultyStatus = 'Đã thuần phục';
    learningStatus = 'mastered';
  } else if (accuracy >= 0.7 && state.stage >= 2) {
    difficultyStatus = 'Nhớ khá ổn';
    learningStatus = 'stable';
  } else {
    difficultyStatus = 'Đang tiến bộ';
    learningStatus = 'improving';
  }

  state.totalAttempts = totalAttempts;
  state.correctAttempts = correctAttempts;
  state.incorrectAttempts = incorrectAttempts;
  state.partiallyCorrectAttempts = partiallyCorrectAttempts;
  state.lastStudiedDate = lastStudiedDate;
  state.lastIncorrectDate = lastIncorrectDate;
  state.difficultyStatus = difficultyStatus;
  state.learningStatus = learningStatus;
  state.modeStats = modeStats;

  return state;
}

export type LearningEvidenceType = 'strong' | 'weak' | 'incorrect';

export interface ClassifyEvidenceParams {
  learningMode?: LearningMode;
  result: 'correct' | 'partially_correct' | 'incorrect' | string;
  hintsUsed?: number;
  isOverridden?: boolean;
  meaningEvaluation?: MeaningEvaluationResponse;
  sentenceEvaluation?: SentenceEvaluationResponse;
  strictVerification?: boolean;
}

/**
 * Centralized evaluation of learning evidence per Milestone 2.2 and 4.1 rules.
 * Shared between SRS stage scheduling and Achievement unlocking.
 *
 * Strong evidence:
 * - Typing Challenge: correct without hints (hintsUsed === 0).
 * - Meaning AI: correct without override, verified verdict 'correct'.
 * - Sentence AI: correct rubric without override, totalScore >= 12/16.
 *
 * Weak evidence:
 * - Flashcard self-ratings ('remembered', 'hard').
 * - Matching pairs games.
 * - Typing with hints (hintsUsed > 0).
 * - Partial AI evaluations ('partially_correct').
 * - Any answer marked with manual override.
 */
export function classifyLearningEvidence(params: ClassifyEvidenceParams): LearningEvidenceType {
  const {
    learningMode,
    result,
    hintsUsed,
    isOverridden = false,
    meaningEvaluation,
    sentenceEvaluation,
    strictVerification = false,
  } = params;

  // Manual overrides are never strong evidence
  if (isOverridden) {
    return 'weak';
  }

  // Incorrect results
  if (result === 'incorrect' || result === 'forgot') {
    return 'incorrect';
  }

  // Partial results
  if (result === 'partially_correct' || result === 'hard') {
    return 'weak';
  }

  // Self-ratings and matching games are inherently weak evidence
  if (!learningMode || learningMode === 'flashcard' || learningMode === 'matching') {
    return 'weak';
  }

  // Typing Challenge
  if (learningMode === 'typing') {
    if (result !== 'correct') return 'incorrect';
    if (strictVerification) {
      if (typeof hintsUsed !== 'number' || hintsUsed > 0) {
        return 'weak';
      }
    } else {
      if (typeof hintsUsed === 'number' && hintsUsed > 0) {
        return 'weak';
      }
    }
    return 'strong';
  }

  // Meaning AI
  if (learningMode === 'meaning_ai') {
    if (result !== 'correct') return result === 'partially_correct' ? 'weak' : 'incorrect';
    if (strictVerification) {
      if (!meaningEvaluation || meaningEvaluation.verdict !== 'correct') {
        return 'weak';
      }
    } else {
      if (meaningEvaluation && meaningEvaluation.verdict !== 'correct') {
        return 'weak';
      }
    }
    return 'strong';
  }

  // Sentence AI
  if (learningMode === 'sentence_ai') {
    if (strictVerification) {
      if (!sentenceEvaluation || sentenceEvaluation.totalScore < 12) {
        return 'weak';
      }
    } else {
      if (sentenceEvaluation && sentenceEvaluation.totalScore < 12) {
        return 'weak';
      }
      if (result !== 'correct' && (!sentenceEvaluation || sentenceEvaluation.totalScore < 12)) {
        return result === 'partially_correct' ? 'weak' : 'incorrect';
      }
    }
    return 'strong';
  }

  return 'weak';
}

export function isStrongLearningEvidence(params: ClassifyEvidenceParams): boolean {
  return classifyLearningEvidence(params) === 'strong';
}

export interface ProcessReviewAttemptParams {
  eventId: string;
  wordId: string;
  learningMode: LearningMode;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  hintsUsed?: number;
  timestamp?: number;
  isManualOverride?: boolean;
  meaningEvaluation?: MeaningEvaluationResponse;
  sentenceEvaluation?: SentenceEvaluationResponse;
}

/**
 * Updates review schedule and evidence rules for a validated review attempt.
 * Implements strong vs weak evidence rules, single promotion per calendar day, and lapse demotion.
 */
export function processReviewAttempt(
  params: ProcessReviewAttemptParams,
  reviews: ReviewRecord[],
  sessions: LearningSessionRecord[]
): WordSrsState {
  const {
    eventId,
    wordId,
    learningMode,
    isCorrect,
    isPartiallyCorrect = false,
    hintsUsed = 0,
    timestamp = Date.now(),
    isManualOverride = false,
    meaningEvaluation,
    sentenceEvaluation,
  } = params;
  let state = computeWordStatsAndSchedule(wordId, reviews, sessions);

  // Idempotency check for eventId
  if (state.processedReviewEventIds.includes(eventId)) {
    return state;
  }
  state.processedReviewEventIds.push(eventId);
  if (state.processedReviewEventIds.length > 200) {
    state.processedReviewEventIds.shift();
  }

  const todayStr = getLocalDateString(timestamp);
  const intervalDays = SRS_INTERVALS[state.stage] || 1;

  // Centralized evidence classification
  const evidenceType = classifyLearningEvidence({
    learningMode,
    result: isCorrect ? 'correct' : isPartiallyCorrect ? 'partially_correct' : 'incorrect',
    hintsUsed,
    isOverridden: isManualOverride,
    meaningEvaluation,
    sentenceEvaluation,
    strictVerification: false,
  });

  const isStrongEvidence = evidenceType === 'strong';
  const isWeakEvidence = evidenceType === 'weak';
  const isIncorrect = evidenceType === 'incorrect';

  if (isIncorrect) {
    // Genuine forgetting -> demote stage, increase lapse count, schedule near-term review
    state.stage = Math.max(0, state.stage - 1);
    state.lapseCount = (state.lapseCount || 0) + 1;
    state.lastIncorrectDate = todayStr;
    state.nextReviewAt = timestamp + 12 * 3600 * 1000; // review later today / tomorrow
    state.consecutiveStrongRecallDays = 0;
  } else if (isWeakEvidence || isPartiallyCorrect) {
    // Weak evidence or partial success -> update stats, do not aggressively extend interval
    state.nextReviewAt = timestamp + intervalDays * 24 * 3600 * 1000;
  } else if (isStrongEvidence) {
    // Strong evidence -> can advance stage (at most 1 stage per calendar day)
    if (state.lastStrongRecallDate !== todayStr) {
      state.stage = Math.min(SRS_INTERVALS.length - 1, state.stage + 1);
      state.lastStrongRecallDate = todayStr;
      state.consecutiveStrongRecallDays = (state.consecutiveStrongRecallDays || 0) + 1;
    }
    const newInterval = SRS_INTERVALS[state.stage] || 1;
    state.nextReviewAt = timestamp + newInterval * 24 * 3600 * 1000;
  }

  state.lastReviewAt = timestamp;
  const allStates = getAllSrsStates();
  allStates[wordId] = state;
  saveAllSrsStates(allStates);

  return state;
}

export function getWordLearningStats(wordId: string, reviews: ReviewRecord[], sessions: LearningSessionRecord[]) {
  return computeWordStatsAndSchedule(wordId, reviews, sessions);
}

export function getDueWords(todayDateStr: string = getLocalDateString(), reviews: ReviewRecord[], sessions: LearningSessionRecord[], vocab: VocabularyItem[]): VocabularyItem[] {
  const allStates = getAllSrsStates();
  const now = Date.now();

  return vocab.filter((v) => {
    const st = allStates[v.id] || computeWordStatsAndSchedule(v.id, reviews, sessions);
    if (!st.nextReviewAt) {
      // New or never scheduled words due for first review if studied or in review queue
      return st.totalAttempts === 0 || st.stage === 0;
    }
    return st.nextReviewAt <= now;
  });
}

export function getWeakWords(reviews: ReviewRecord[], sessions: LearningSessionRecord[], vocab: VocabularyItem[]): Array<VocabularyItem & { srs: WordSrsState }> {
  const allStates = getAllSrsStates();
  return vocab
    .map((v) => {
      const srs = allStates[v.id] || computeWordStatsAndSchedule(v.id, reviews, sessions);
      return { ...v, srs };
    })
    .filter((item) => item.srs.difficultyStatus === 'Đang vật lộn' || item.srs.incorrectAttempts > item.srs.correctAttempts || item.srs.lapseCount > 0);
}

export function getDailyReviewQueue(limit: number = 10, reviews: ReviewRecord[], sessions: LearningSessionRecord[], vocab: VocabularyItem[]): VocabularyItem[] {
  const due = getDueWords(getLocalDateString(), reviews, sessions, vocab);
  const weak = getWeakWords(reviews, sessions, vocab);

  // Prioritization queue:
  // 1. Overdue / weak words with high lapse count or recent errors
  // 2. Due today
  // 3. Learning words
  const queueMap = new Map<string, VocabularyItem>();

  weak.forEach((w) => queueMap.set(w.id, w));
  due.forEach((d) => {
    if (!queueMap.has(d.id)) queueMap.set(d.id, d);
  });

  const combined = Array.from(queueMap.values());
  return combined.slice(0, limit);
}
