import {
  LearningMode,
  LearningSessionRecord,
  MeaningEvaluationResponse,
  ReviewRecord,
  SentenceEvaluationResponse,
  VocabularyItem,
} from '../types';
import { getLocalDateString } from './progression';

export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export const SRS_INTERVALS_MS = [
  1 * DAY_MS,   // Stage 0 -> 1 day
  1 * DAY_MS,   // Stage 1
  3 * DAY_MS,   // Stage 2
  7 * DAY_MS,   // Stage 3
  14 * DAY_MS,  // Stage 4
  30 * DAY_MS,  // Stage 5
  60 * DAY_MS,  // Stage 6
  120 * DAY_MS, // Stage 7
];

export const SRS_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120]; // Legacy days array for compatibility

export type SrsReviewOutcome = 'forgot' | 'hard' | 'remembered' | 'easy';

export interface SrsIntervalPreview {
  outcome: SrsReviewOutcome;
  intervalMs: number;
  label: string;
  targetTimestamp: number;
}

export interface SrsQueueStats {
  dueNowCount: number;
  overdueCount: number;
  upcomingCount: number;
  nextScheduledTime?: number;
}

export interface WordSrsState {
  wordId: string;
  stage: number; // 0 to 7
  subStep?: '10m' | '1h' | 'day'; // Early learning sub-steps
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

  return {
    wordId,
    stage: 0,
    subStep: 'day',
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
    schedulingVersion: 2,
    processedReviewEventIds: [],
  };
}

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
          if (modeStats[mode]) modeStats[mode].correct++;
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

  if (totalAttempts === 0 && wordReviews.length > 0) {
    totalAttempts = wordReviews.length;
    wordReviews.forEach((r) => {
      if (!lastStudiedTimestamp || r.timestamp > lastStudiedTimestamp) {
        lastStudiedTimestamp = r.timestamp;
      }
      if (r.result === 'remembered' || r.result === 'easy' || r.result === 'hard') {
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

  if (isOverridden) return 'weak';
  if (result === 'incorrect' || result === 'forgot') return 'incorrect';
  if (result === 'partially_correct' || result === 'hard') return 'weak';
  if (!learningMode || learningMode === 'flashcard' || learningMode === 'matching') return 'weak';

  if (learningMode === 'typing') {
    if (result !== 'correct') return 'incorrect';
    if (hintsUsed && hintsUsed > 0) return 'weak';
    return 'strong';
  }

  if (learningMode === 'meaning_ai') {
    if (result !== 'correct') return result === 'partially_correct' ? 'weak' : 'incorrect';
    if (meaningEvaluation && meaningEvaluation.verdict !== 'correct') return 'weak';
    return 'strong';
  }

  if (learningMode === 'sentence_ai') {
    if (sentenceEvaluation && sentenceEvaluation.totalScore < 12) return 'weak';
    if (result !== 'correct' && (!sentenceEvaluation || sentenceEvaluation.totalScore < 12)) {
      return result === 'partially_correct' ? 'weak' : 'incorrect';
    }
    return 'strong';
  }

  return 'weak';
}

export function isStrongLearningEvidence(params: ClassifyEvidenceParams): boolean {
  return classifyLearningEvidence(params) === 'strong';
}

/**
 * Formats a duration in milliseconds into a concise Vietnamese interval string
 * e.g., "10 phút", "1 giờ", "1 ngày", "3 ngày", "7 ngày"
 */
export function formatIntervalLabel(intervalMs: number): string {
  if (intervalMs < HOUR_MS) {
    const mins = Math.max(1, Math.round(intervalMs / MINUTE_MS));
    return `${mins} phút`;
  }
  if (intervalMs < DAY_MS) {
    const hours = Math.max(1, Math.round(intervalMs / HOUR_MS));
    return `${hours} giờ`;
  }
  const days = Math.max(1, Math.round(intervalMs / DAY_MS));
  return `${days} ngày`;
}

/**
 * Pure helper: Computes the next scheduled interval, timestamps, and stage transitions
 * WITHOUT mutating stored state. Shared by processReviewAttempt and preview helpers.
 */
export function calculateNextSchedule(
  currentState: WordSrsState,
  outcome: SrsReviewOutcome,
  timestamp: number = Date.now(),
  isStrong: boolean = false
): {
  nextReviewAt: number;
  intervalMs: number;
  intervalLabel: string;
  newStage: number;
  newSubStep: '10m' | '1h' | 'day';
  lapseCount: number;
  consecutiveStrongRecallDays: number;
  lastStrongRecallDate?: string;
} {
  const todayStr = getLocalDateString(timestamp);
  let newStage = currentState.stage || 0;
  let newSubStep: '10m' | '1h' | 'day' = currentState.subStep || 'day';
  let intervalMs: number = DAY_MS;
  let lapseCount = currentState.lapseCount || 0;
  let consecutiveStrongRecallDays = currentState.consecutiveStrongRecallDays || 0;
  let lastStrongRecallDate = currentState.lastStrongRecallDate;

  if (outcome === 'forgot') {
    newStage = Math.max(0, newStage - 1);
    newSubStep = '10m';
    lapseCount += 1;
    consecutiveStrongRecallDays = 0;
    intervalMs = 10 * MINUTE_MS;
  } else if (outcome === 'hard') {
    if (newStage === 0) {
      newSubStep = '1h';
      intervalMs = HOUR_MS;
    } else {
      newSubStep = 'day';
      intervalMs = DAY_MS;
    }
  } else if (outcome === 'easy') {
    if (newStage === 0) {
      newSubStep = 'day';
      newStage = 1;
      intervalMs = 3 * DAY_MS;
    } else {
      newSubStep = 'day';
      if (isStrong) {
        newStage = Math.min(7, newStage + 2);
        if (lastStrongRecallDate !== todayStr) {
          consecutiveStrongRecallDays += 1;
          lastStrongRecallDate = todayStr;
        }
      } else {
        newStage = Math.min(7, newStage + 1);
      }
      const base = SRS_INTERVALS_MS[newStage] || DAY_MS;
      intervalMs = Math.max(3 * DAY_MS, Math.round(base * 1.5));
    }
  } else {
    // outcome === 'remembered'
    if (newStage === 0) {
      if (!currentState.subStep || currentState.subStep === '10m') {
        newSubStep = '1h';
        newStage = 0;
        intervalMs = HOUR_MS;
      } else if (currentState.subStep === '1h') {
        newSubStep = 'day';
        newStage = 1;
        intervalMs = DAY_MS;
      } else {
        newSubStep = 'day';
        newStage = 1;
        intervalMs = DAY_MS;
      }
    } else {
      newSubStep = 'day';
      if (isStrong) {
        if (lastStrongRecallDate !== todayStr) {
          newStage = Math.min(7, newStage + 1);
          consecutiveStrongRecallDays += 1;
          lastStrongRecallDate = todayStr;
        }
      } else {
        newStage = Math.min(7, newStage + 1);
      }
      intervalMs = SRS_INTERVALS_MS[newStage] || DAY_MS;
    }
  }

  const nextReviewAt = timestamp + intervalMs;
  const intervalLabel = formatIntervalLabel(intervalMs);

  return {
    nextReviewAt,
    intervalMs,
    intervalLabel,
    newStage,
    newSubStep,
    lapseCount,
    consecutiveStrongRecallDays,
    lastStrongRecallDate,
  };
}

/**
 * Pure helper: Previews the next interval for a specific outcome WITHOUT modifying stored data.
 */
export function previewNextInterval(
  wordId: string,
  outcome: SrsReviewOutcome,
  now: number = Date.now(),
  learningMode: LearningMode = 'flashcard'
): SrsIntervalPreview {
  const state = getWordSrsState(wordId);
  const isStrong = classifyLearningEvidence({
    learningMode,
    result: outcome === 'forgot' ? 'incorrect' : 'correct',
  }) === 'strong';

  const schedule = calculateNextSchedule(state, outcome, now, isStrong);
  return {
    outcome,
    intervalMs: schedule.intervalMs,
    label: schedule.intervalLabel,
    targetTimestamp: schedule.nextReviewAt,
  };
}

/**
 * Pure helper: Previews expected next intervals for all four outcomes.
 */
export function getIntervalPreviews(
  wordId: string,
  now: number = Date.now(),
  learningMode: LearningMode = 'flashcard'
): Record<SrsReviewOutcome, SrsIntervalPreview> {
  return {
    forgot: previewNextInterval(wordId, 'forgot', now, learningMode),
    hard: previewNextInterval(wordId, 'hard', now, learningMode),
    remembered: previewNextInterval(wordId, 'remembered', now, learningMode),
    easy: previewNextInterval(wordId, 'easy', now, learningMode),
  };
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
  outcome?: SrsReviewOutcome;
}

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
    outcome,
  } = params;

  let state = computeWordStatsAndSchedule(wordId, reviews, sessions);

  // Idempotency: Ignore already processed eventIds
  if (state.processedReviewEventIds.includes(eventId)) {
    return state;
  }
  state.processedReviewEventIds.push(eventId);
  if (state.processedReviewEventIds.length > 200) {
    state.processedReviewEventIds.shift();
  }

  const todayStr = getLocalDateString(timestamp);

  const evidenceType = classifyLearningEvidence({
    learningMode,
    result: isCorrect ? 'correct' : isPartiallyCorrect ? 'partially_correct' : 'incorrect',
    hintsUsed,
    isOverridden: isManualOverride,
    meaningEvaluation,
    sentenceEvaluation,
    strictVerification: false,
  });

  const isStrong = evidenceType === 'strong';
  const resolvedOutcome: SrsReviewOutcome =
    outcome ||
    (evidenceType === 'incorrect'
      ? 'forgot'
      : isPartiallyCorrect
      ? 'hard'
      : isCorrect
      ? 'remembered'
      : 'forgot');

  // Calculate schedule via unified pure function
  const schedule = calculateNextSchedule(state, resolvedOutcome, timestamp, isStrong);

  state.stage = schedule.newStage;
  state.subStep = schedule.newSubStep;
  state.nextReviewAt = schedule.nextReviewAt;
  state.lapseCount = schedule.lapseCount;
  state.consecutiveStrongRecallDays = schedule.consecutiveStrongRecallDays;
  if (schedule.lastStrongRecallDate) {
    state.lastStrongRecallDate = schedule.lastStrongRecallDate;
  }
  if (resolvedOutcome === 'forgot') {
    state.lastIncorrectDate = todayStr;
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

/**
 * Returns statistics for the current review queue:
 * - dueNowCount: nextReviewAt <= now
 * - overdueCount: due > 24 hours ago
 * - upcomingCount: scheduled in future
 * - nextScheduledTime: lowest future timestamp
 */
export function getSrsQueueStats(
  vocab: VocabularyItem[],
  reviews: ReviewRecord[] = [],
  sessions: LearningSessionRecord[] = [],
  now: number = Date.now()
): SrsQueueStats {
  const allStates = getAllSrsStates();
  let dueNowCount = 0;
  let overdueCount = 0;
  let upcomingCount = 0;
  let minNextScheduledTime: number | undefined;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  vocab.forEach((v) => {
    const st = allStates[v.id];
    if (!st || !st.nextReviewAt) return; // unstudied words are not due

    if (st.nextReviewAt <= now) {
      dueNowCount++;
      if (now - st.nextReviewAt > ONE_DAY_MS) {
        overdueCount++;
      }
    } else {
      upcomingCount++;
      if (!minNextScheduledTime || st.nextReviewAt < minNextScheduledTime) {
        minNextScheduledTime = st.nextReviewAt;
      }
    }
  });

  return {
    dueNowCount,
    overdueCount,
    upcomingCount,
    nextScheduledTime: minNextScheduledTime,
  };
}

export function getDueWords(
  todayDateStr: string = getLocalDateString(),
  reviews: ReviewRecord[] = [],
  sessions: LearningSessionRecord[] = [],
  vocab: VocabularyItem[] = [],
  now: number = Date.now()
): VocabularyItem[] {
  const allStates = getAllSrsStates();

  const dueItems = vocab.filter((v) => {
    const st = allStates[v.id] || computeWordStatsAndSchedule(v.id, reviews, sessions);
    if (!st.nextReviewAt) {
      return false; // Unstudied words are not due until first genuine study event
    }
    return st.nextReviewAt <= now;
  });

  // Sort by urgency: overdue and recently lapsed first
  return dueItems.sort((a, b) => {
    const stA = allStates[a.id];
    const stB = allStates[b.id];
    const timeA = stA?.nextReviewAt || 0;
    const timeB = stB?.nextReviewAt || 0;
    const lapseA = stA?.lapseCount || 0;
    const lapseB = stB?.lapseCount || 0;

    const urgencyA = (now - timeA) + lapseA * (6 * HOUR_MS);
    const urgencyB = (now - timeB) + lapseB * (6 * HOUR_MS);
    return urgencyB - urgencyA;
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

export function getDailyReviewQueue(limit: number = 10, reviews: ReviewRecord[], sessions: LearningSessionRecord[], vocab: VocabularyItem[], now: number = Date.now()): VocabularyItem[] {
  const due = getDueWords(getLocalDateString(now), reviews, sessions, vocab, now);
  const weak = getWeakWords(reviews, sessions, vocab);

  const queueMap = new Map<string, VocabularyItem>();

  // Only include weak words that are ACTUALLY due now (Requirement 6: weak words scheduled in future are not overdue)
  due.forEach((d) => queueMap.set(d.id, d));

  const combined = Array.from(queueMap.values());
  return combined.slice(0, limit);
}
