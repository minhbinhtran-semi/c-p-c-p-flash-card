import {
  DayActivity,
  LearningMode,
  LearningSessionRecord,
  ProgressionStats,
  ReviewRecord,
  StreakData,
  XpLedgerEntry,
} from '../types';

export const DAILY_XP_CAP = 250;
export const STUDY_TIMEZONE = 'Asia/Ho_Chi_Minh';

const STORAGE_KEYS = {
  XP_LEDGER: 'capcap_xp_ledger_v1',
};

// Safe LocalStorage helpers
function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

/**
 * Convert timestamp to YYYY-MM-DD in Asia/Ho_Chi_Minh (+07:00)
 */
export function getLocalDateString(timestamp: number = Date.now(), timeZone = STUDY_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date(timestamp));
  } catch {
    // Fallback UTC+7 offset
    const d = new Date(timestamp + 7 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  }
}

/**
 * Get date string +/- N days from YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export function getPreviousDay(dateStr: string): string {
  return addDays(dateStr, -1);
}

export function getNextDay(dateStr: string): string {
  return addDays(dateStr, 1);
}

export function daysBetween(dateA: string, dateB: string): number {
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (24 * 3600 * 1000));
}

// ============================================================================
// 1. DETERMINISTIC XP CALCULATION & REWARD CAPS
// ============================================================================

export interface CalculateEligibleXpParams {
  learningMode: LearningMode;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  isRevision?: boolean; // attempt > 1 or retried
  hintsUsed?: number;
  hadMistake?: boolean;
  isOverridden?: boolean;
  vocabularyUsageScore?: number; // 0-4 for Sentence AI
}

/**
 * Pure, deterministic calculation of eligible XP for an attempt according to milestone rules
 */
export function calculateEligibleXp(params: CalculateEligibleXpParams): number {
  const {
    learningMode,
    isCorrect,
    isPartiallyCorrect = false,
    isRevision = false,
    hintsUsed = 0,
    hadMistake = false,
    isOverridden = false,
    vocabularyUsageScore = 4,
  } = params;

  // Flashcards give 0 XP
  if (learningMode === 'flashcard') {
    return 0;
  }

  // Overrides give 0 XP
  if (isOverridden) {
    return 0;
  }

  switch (learningMode) {
    case 'matching': {
      if (!isCorrect) return 0;
      // Correct on first attempt: 2 XP
      // Correct after a mistake involving that pair: 1 XP
      return hadMistake ? 1 : 2;
    }

    case 'typing': {
      if (!isCorrect) return 0;
      // Correct on first attempt without hints: 6 XP
      // Correct after using hints or after previous mistake/revision: max 3 XP
      if (hintsUsed > 0 || hadMistake || isRevision) {
        return 3;
      }
      return 6;
    }

    case 'meaning_ai': {
      if (isCorrect) {
        // Confirmed correct on initial submission: 8 XP
        // Confirmed correct after revision: max 4 XP
        return isRevision ? 4 : 8;
      }
      if (isPartiallyCorrect) {
        // Partially correct: max 2 XP
        return 2;
      }
      return 0;
    }

    case 'sentence_ai': {
      // If incorrect target-word usage, 0 XP
      if (vocabularyUsageScore <= 1) {
        return 0;
      }

      if (isCorrect) {
        // Correct on first submission: 12 XP
        // Correct after revision: max 6 XP
        return isRevision ? 6 : 12;
      }

      if (isPartiallyCorrect) {
        // Partially correct with meaningful target-word usage: max 3 XP
        return 3;
      }

      return 0;
    }

    default:
      return 0;
  }
}

// ============================================================================
// 2. XP LEDGER PERSISTENCE & ANTI-FARMING RULES
// ============================================================================

export function getXpLedger(): XpLedgerEntry[] {
  return safeGetItem<XpLedgerEntry[]>(STORAGE_KEYS.XP_LEDGER, []);
}

export function saveXpLedger(ledger: XpLedgerEntry[]): void {
  safeSetItem(STORAGE_KEYS.XP_LEDGER, ledger);
}

export function getTotalXp(): number {
  const ledger = getXpLedger();
  return ledger.reduce((sum, entry) => sum + Math.max(0, entry.awardedXP), 0);
}

export function getTodayXp(dateStr: string = getLocalDateString()): number {
  const ledger = getXpLedger();
  return ledger
    .filter((e) => e.localDate === dateStr)
    .reduce((sum, entry) => sum + Math.max(0, entry.awardedXP), 0);
}

export interface AwardXpInput {
  sourceSessionId: string;
  sourceAttemptId?: string;
  wordId: string;
  deckId: string;
  learningMode: LearningMode;
  calculateParams: CalculateEligibleXpParams;
  timestamp?: number;
  reason?: string;
}

export interface AwardXpResult {
  awardedXP: number;
  eligibleRewardLevel: number;
  isDailyCapReached: boolean;
  totalTodayXp: number;
  ledgerEntry?: XpLedgerEntry;
}

/**
 * Idempotently awards XP subject to anti-farming delta & daily cap rules
 */
export function recordXpReward(input: AwardXpInput): AwardXpResult {
  const {
    sourceSessionId,
    sourceAttemptId,
    wordId,
    deckId,
    learningMode,
    calculateParams,
    timestamp = Date.now(),
    reason = '',
  } = input;

  const localDate = getLocalDateString(timestamp);
  const ledger = getXpLedger();

  // 1. Idempotency Check:
  // If an exact sourceSessionId + sourceAttemptId + wordId has already been processed, return 0
  const dedupeAttemptKey = sourceAttemptId || `${sourceSessionId}:${wordId}:${calculateParams.isRevision ? 'rev' : 'init'}`;
  const alreadyProcessed = ledger.some(
    (e) => e.sourceSessionId === sourceSessionId && e.sourceAttemptId === dedupeAttemptKey
  );
  if (alreadyProcessed) {
    const todayXp = getTodayXp(localDate);
    return {
      awardedXP: 0,
      eligibleRewardLevel: 0,
      isDailyCapReached: todayXp >= DAILY_XP_CAP,
      totalTodayXp: todayXp,
    };
  }

  // 2. Anti-Farming Key: localDate + learningMode + wordId
  const existingEntriesForWordToday = ledger.filter(
    (e) => e.localDate === localDate && e.learningMode === learningMode && e.wordId === wordId
  );

  const previousMaxAwardedLevel = existingEntriesForWordToday.reduce(
    (max, e) => Math.max(max, e.eligibleRewardLevel || 0),
    0
  );

  // If a previous reward was already awarded today, any subsequent attempt is treated as a revision/repeated attempt
  const isActuallyRevision = calculateParams.isRevision || existingEntriesForWordToday.length > 0;
  const eligibleReward = calculateEligibleXp({
    ...calculateParams,
    isRevision: isActuallyRevision,
  });

  // Calculate delta: only award positive difference
  const delta = Math.max(0, eligibleReward - previousMaxAwardedLevel);

  // Daily XP cap check (default 250 XP)
  const currentTodayXp = ledger
    .filter((e) => e.localDate === localDate)
    .reduce((sum, e) => sum + Math.max(0, e.awardedXP), 0);

  const remainingDailyCapacity = Math.max(0, DAILY_XP_CAP - currentTodayXp);
  const finalAwardedXP = Math.min(delta, remainingDailyCapacity);

  let newEntry: XpLedgerEntry | undefined;

  // Only create ledger entry if there is an attempt with awarded XP or meaningful eligible level
  if (finalAwardedXP > 0) {
    newEntry = {
      id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceSessionId,
      sourceAttemptId: dedupeAttemptKey,
      wordId,
      deckId,
      learningMode,
      localDate,
      awardedXP: finalAwardedXP,
      eligibleRewardLevel: Math.max(eligibleReward, previousMaxAwardedLevel),
      createdAt: timestamp,
      reason: reason || `${learningMode} reward`,
    };

    ledger.unshift(newEntry);
    saveXpLedger(ledger);
  }

  const updatedTodayXp = currentTodayXp + finalAwardedXP;

  return {
    awardedXP: finalAwardedXP,
    eligibleRewardLevel: eligibleReward,
    isDailyCapReached: updatedTodayXp >= DAILY_XP_CAP,
    totalTodayXp: updatedTodayXp,
    ledgerEntry: newEntry,
  };
}

// ============================================================================
// 3. DAILY LEARNING STREAK SYSTEM ("Chuỗi ngày cạp chữ")
// ============================================================================

export interface DailyActivitySummary {
  date: string;
  distinctWordIds: Set<string>;
  completedSessionsCount: number;
  totalAttemptsCount: number;
}

/**
 * Qualifies whether a calendar date is an eligible study day:
 * - At least 5 distinct vocabulary words reviewed/attempted; OR
 * - A completed meaningful learning session involving at least 2 distinct words.
 */
export function isDayQualifying(distinctWordsCount: number, completedSessionsWithAtLeastTwoWords: number): boolean {
  return distinctWordsCount >= 5 || completedSessionsWithAtLeastTwoWords >= 1;
}

/**
 * Reconstruct daily activity and calculate current/longest streak
 */
export function calculateStreakAndActivity(
  reviews: ReviewRecord[],
  sessions: LearningSessionRecord[],
  ledger: XpLedgerEntry[],
  referenceDateStr?: string
): {
  streak: StreakData;
  activityHistory: Record<string, DayActivity>;
} {
  const today = referenceDateStr || getLocalDateString();
  const yesterday = getPreviousDay(today);

  // Group activity by localDate
  const dailyMap = new Map<string, {
    distinctWords: Set<string>;
    completedSessions: number;
    completedMultiWordSessions: number;
    xpEarned: number;
  }>();

  const getOrCreateDay = (dateStr: string) => {
    let day = dailyMap.get(dateStr);
    if (!day) {
      day = {
        distinctWords: new Set<string>(),
        completedSessions: 0,
        completedMultiWordSessions: 0,
        xpEarned: 0,
      };
      dailyMap.set(dateStr, day);
    }
    return day;
  };

  // 1. Process ReviewRecords
  for (const rev of reviews) {
    if (!rev.timestamp || !rev.wordId) continue;
    const dateStr = getLocalDateString(rev.timestamp);
    const day = getOrCreateDay(dateStr);
    day.distinctWords.add(rev.wordId);
  }

  // 2. Process LearningSessionRecords
  for (const sess of sessions) {
    if (!sess.completedAt) continue;
    const dateStr = getLocalDateString(sess.completedAt);
    const day = getOrCreateDay(dateStr);
    day.completedSessions += 1;

    // Count distinct words in this session
    const sessionWordIds = new Set<string>();
    if (Array.isArray(sess.wordResults)) {
      for (const wr of sess.wordResults) {
        if (wr.wordId) {
          sessionWordIds.add(wr.wordId);
          day.distinctWords.add(wr.wordId);
        }
      }
    }

    if (sessionWordIds.size >= 2) {
      day.completedMultiWordSessions += 1;
    }
  }

  // 3. Process Ledger entries for XP
  for (const entry of ledger) {
    if (!entry.localDate || entry.awardedXP <= 0) continue;
    const day = getOrCreateDay(entry.localDate);
    day.xpEarned += entry.awardedXP;
    if (entry.wordId) {
      day.distinctWords.add(entry.wordId);
    }
  }

  // 4. Build activityHistory and determine qualifying dates
  const activityHistory: Record<string, DayActivity> = {};
  const qualifyingDates = new Set<string>();

  dailyMap.forEach((data, dateStr) => {
    const isQualifying = isDayQualifying(data.distinctWords.size, data.completedMultiWordSessions);
    if (isQualifying) {
      qualifyingDates.add(dateStr);
    }

    // Determine intensity level (0 to 4)
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    const count = data.distinctWords.size;
    if (count >= 20) level = 4;
    else if (count >= 10) level = 3;
    else if (count >= 5) level = 2;
    else if (count >= 1) level = 1;

    activityHistory[dateStr] = {
      date: dateStr,
      distinctWordsCount: data.distinctWords.size,
      sessionsCount: data.completedSessions,
      xpEarned: data.xpEarned,
      isQualifying,
      level,
    };
  });

  // 5. Calculate Current Streak
  const isStudiedToday = qualifyingDates.has(today);
  const isStudiedYesterday = qualifyingDates.has(yesterday);
  const isStreakAtRisk = !isStudiedToday && isStudiedYesterday;

  let currentStreak = 0;
  if (isStudiedToday) {
    currentStreak = 1;
    let checkDate = yesterday;
    while (qualifyingDates.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPreviousDay(checkDate);
    }
  } else if (isStudiedYesterday) {
    // Studying yesterday but not yet today: streak is recoverable today!
    currentStreak = 1;
    let checkDate = getPreviousDay(yesterday);
    while (qualifyingDates.has(checkDate)) {
      currentStreak += 1;
      checkDate = getPreviousDay(checkDate);
    }
  } else {
    currentStreak = 0;
  }

  // 6. Calculate Longest Streak in history
  const sortedDates = Array.from(qualifyingDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const d of sortedDates) {
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diff = daysBetween(prevDate, d);
      if (diff === 1) {
        tempStreak += 1;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = d;
  }

  // Find most recent active qualifying date
  const lastActiveDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  return {
    streak: {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      activeDays: qualifyingDates.size,
      lastActiveDate,
      isStudiedToday,
      isStreakAtRisk,
    },
    activityHistory,
  };
}

// ============================================================================
// 4. VƯỜN NỌC HEATMAP GENERATION (365 DAYS GRID)
// ============================================================================

export interface HeatmapDayCell {
  date: string;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  distinctWordsCount: number;
  sessionsCount: number;
  xpEarned: number;
  isQualifying: boolean;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  isFuture: boolean;
}

export interface HeatmapMonthLabel {
  name: string;
  columnIndex: number;
}

export interface VườnNọcGridData {
  weeks: HeatmapDayCell[][];
  monthLabels: HeatmapMonthLabel[];
  totalWordsTrainedYear: number;
  totalActiveDaysYear: number;
  totalSessionsYear: number;
  totalXpYear: number;
}

/**
 * Generates trailing ~52-53 weeks ending on the current week for GitHub-style layout
 */
export function generateVườnNọcGrid(
  activityHistory: Record<string, DayActivity>,
  referenceDateStr?: string
): VườnNọcGridData {
  const today = referenceDateStr || getLocalDateString();
  const [tY, tM, tD] = today.split('-').map(Number);
  const todayObj = new Date(Date.UTC(tY, tM - 1, tD));
  const todayDayOfWeek = todayObj.getUTCDay(); // 0 is Sunday, 1 is Monday...

  // Ending day of the grid is the coming Saturday (or Sunday) to keep full weeks
  const daysUntilSaturday = 6 - todayDayOfWeek;
  const endDateStr = addDays(today, daysUntilSaturday);

  // We want approximately 52 weeks = 52 * 7 = 364 days total
  const TOTAL_WEEKS = 53;
  const TOTAL_DAYS = TOTAL_WEEKS * 7;
  const startDateStr = addDays(endDateStr, -(TOTAL_DAYS - 1));

  const weeks: HeatmapDayCell[][] = [];
  const monthLabels: HeatmapMonthLabel[] = [];
  let currentMonth = -1;

  let totalWordsTrainedYear = 0;
  let totalActiveDaysYear = 0;
  let totalSessionsYear = 0;
  let totalXpYear = 0;

  let currentDateCursor = startDateStr;

  for (let w = 0; w < TOTAL_WEEKS; w++) {
    const weekCells: HeatmapDayCell[] = [];

    for (let d = 0; d < 7; d++) {
      const isToday = currentDateCursor === today;
      const isFuture = daysBetween(today, currentDateCursor) > 0;
      const [curY, curM, curD] = currentDateCursor.split('-').map(Number);
      const curDateObj = new Date(Date.UTC(curY, curM - 1, curD));
      const dayOfWeek = curDateObj.getUTCDay();

      // Check month boundary on first row (or start of week)
      if (d === 0 && curM !== currentMonth) {
        currentMonth = curM;
        const monthNames = [
          'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
          'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
        ];
        monthLabels.push({
          name: monthNames[curM - 1],
          columnIndex: w,
        });
      }

      const act = activityHistory[currentDateCursor];
      const distinctWords = act?.distinctWordsCount || 0;
      const sessions = act?.sessionsCount || 0;
      const xp = act?.xpEarned || 0;
      const isQualifying = !!act?.isQualifying;
      const level = isFuture ? 0 : (act?.level || 0);

      if (!isFuture) {
        totalWordsTrainedYear += distinctWords;
        totalSessionsYear += sessions;
        totalXpYear += xp;
        if (isQualifying) {
          totalActiveDaysYear += 1;
        }
      }

      weekCells.push({
        date: currentDateCursor,
        dayOfWeek,
        distinctWordsCount: distinctWords,
        sessionsCount: sessions,
        xpEarned: xp,
        isQualifying,
        level,
        isToday,
        isFuture,
      });

      currentDateCursor = addDays(currentDateCursor, 1);
    }

    weeks.push(weekCells);
  }

  return {
    weeks,
    monthLabels,
    totalWordsTrainedYear,
    totalActiveDaysYear,
    totalSessionsYear,
    totalXpYear,
  };
}

/**
 * Get comprehensive progression stats for dashboard
 */
export function getProgressionStats(
  reviews: ReviewRecord[],
  sessions: LearningSessionRecord[]
): ProgressionStats {
  const ledger = getXpLedger();
  const totalXp = getTotalXp();
  const todayXp = getTodayXp();
  const { streak, activityHistory } = calculateStreakAndActivity(reviews, sessions, ledger);

  return {
    totalXp,
    todayXp,
    dailyXpCap: DAILY_XP_CAP,
    streak,
    activityHistory,
  };
}
