import {
  Achievement,
  AchievementCategory,
  LearningSessionRecord,
  ReviewRecord,
  StreakData,
} from '../types';
import { getAllSrsStates, WordSrsState, classifyLearningEvidence } from './srs';
import { calculateStreakAndActivity, getXpLedger } from './progression';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  categoryLabel: string;
  target: number;
}

export const ACHIEVEMENT_CATALOG: AchievementDefinition[] = [
  // A. Khởi Đầu (Starter)
  {
    id: 'first_session',
    name: 'Tân Binh Có Nọc',
    description: 'Hoàn thành phiên học tập hợp lệ đầu tiên.',
    icon: '🦂',
    category: 'starter',
    categoryLabel: 'Khởi Đầu',
    target: 1,
  },
  {
    id: 'words_10',
    name: 'Mười Từ Đầu Đời',
    description: 'Học 10 từ vựng khác nhau qua các hoạt động học tập thực tế.',
    icon: '📖',
    category: 'starter',
    categoryLabel: 'Khởi Đầu',
    target: 10,
  },

  // B. Thuần Phục (Mastery)
  {
    id: 'mastery_25',
    name: 'Chim Non Tập Bay',
    description: 'Ghi nhớ chuẩn xác 25 từ vựng khác nhau với bằng chứng học tập vững chắc.',
    icon: '🐣',
    category: 'mastery',
    categoryLabel: 'Thuần Phục',
    target: 25,
  },
  {
    id: 'mastery_50',
    name: 'Đầu Không Chỉ Để Đội Mũ',
    description: 'Ghi nhớ chuẩn xác 50 từ vựng khác nhau với bằng chứng học tập vững chắc.',
    icon: '🧠',
    category: 'mastery',
    categoryLabel: 'Thuần Phục',
    target: 50,
  },
  {
    id: 'recovered_5',
    name: 'Não Cá Vàng Hoàn Lương',
    description: 'Phục hồi 5 từ vựng từng bị quên lên ít nhất Cấp 3 trong chu kỳ SRS.',
    icon: '🐟',
    category: 'mastery',
    categoryLabel: 'Thuần Phục',
    target: 5,
  },

  // C. Chuyên Cần (Consistency)
  {
    id: 'streak_3',
    name: 'Ba Ngày Chưa Bỏ Cuộc',
    description: 'Đạt chuỗi học tập liên tục 3 ngày hợp lệ.',
    icon: '🌱',
    category: 'consistency',
    categoryLabel: 'Chuyên Cần',
    target: 3,
  },
  {
    id: 'streak_7',
    name: 'Bảy Ngày Không Trốn',
    description: 'Đạt chuỗi học tập liên tục 7 ngày hợp lệ.',
    icon: '🔥',
    category: 'consistency',
    categoryLabel: 'Chuyên Cần',
    target: 7,
  },
  {
    id: 'streak_30',
    name: 'Học Hành Có Tổ Chức',
    description: 'Đạt chuỗi học tập liên tục 30 ngày hợp lệ.',
    icon: '📅',
    category: 'consistency',
    categoryLabel: 'Chuyên Cần',
    target: 30,
  },

  // D. Chế Độ Học (Learning Modes)
  {
    id: 'typing_10',
    name: 'Gõ Phím Bằng Thực Lực',
    description: 'Trả lời đúng 10 câu trong Thử thách Gõ Từ mà không dùng gợi ý.',
    icon: '⌨️',
    category: 'modes',
    categoryLabel: 'Chế Độ Học',
    target: 10,
  },
  {
    id: 'meaning_ai_5',
    name: 'Gemini Gật Gù',
    description: 'Đạt 5 lần AI Chấm Nghĩa chính xác tuyệt đối mà không cần can thiệp thủ công.',
    icon: '✨',
    category: 'modes',
    categoryLabel: 'Chế Độ Học',
    target: 5,
  },
  {
    id: 'sentence_ai_5',
    name: 'Văn Mẫu Biết Đi',
    description: 'Đạt 5 câu Đặt Câu AI với tổng điểm từ 12/16 trở lên theo barem chuẩn xác.',
    icon: '✍️',
    category: 'modes',
    categoryLabel: 'Chế Độ Học',
    target: 5,
  },

  // E. Kiên Trì (Dedication)
  {
    id: 'sessions_100',
    name: 'Cạp Thủ Chăm Chỉ',
    description: 'Hoàn thành 100 phiên học tập hợp lệ có hoạt động cày từ thực chất.',
    icon: '🏆',
    category: 'dedication',
    categoryLabel: 'Kiên Trì',
    target: 100,
  },
];

export function getAchievementCatalog(): AchievementDefinition[] {
  return [...ACHIEVEMENT_CATALOG];
}

export interface CalculateAchievementsParams {
  reviews: ReviewRecord[];
  sessions: LearningSessionRecord[];
  srsStates?: Record<string, WordSrsState>;
  streak?: StreakData;
}

/**
 * Pure, deterministic calculation of personal achievement progress.
 * Does NOT award XP, RP, or modify SRS/streaks.
 */
export function calculateAchievementProgress(params: CalculateAchievementsParams): Achievement[] {
  const { reviews = [], sessions = [], srsStates = getAllSrsStates(), streak } = params;

  // 1. Qualifying Sessions calculation
  // A session must be completed and contain at least 1 actual question/result.
  const qualifyingSessions = sessions.filter(
    (s) => s && s.completedAt > 0 && s.totalQuestions > 0 && Array.isArray(s.wordResults) && s.wordResults.length > 0
  );

  // Sort qualifying sessions by completedAt to find accurate unlock timestamps
  const sortedSessions = [...qualifyingSessions].sort((a, b) => a.completedAt - b.completedAt);

  // 2. Distinct words studied in genuine learning activities (NOT imported alone)
  const studiedWordsChronological: { wordId: string; timestamp: number }[] = [];
  const seenStudiedWordIds = new Set<string>();

  // Process reviews chronologically
  const sortedReviews = [...reviews]
    .filter((r) => r && r.wordId && r.timestamp)
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const rev of sortedReviews) {
    if (!seenStudiedWordIds.has(rev.wordId)) {
      seenStudiedWordIds.add(rev.wordId);
      studiedWordsChronological.push({ wordId: rev.wordId, timestamp: rev.timestamp });
    }
  }

  // Process sessions for studied words
  for (const s of sortedSessions) {
    for (const wr of s.wordResults) {
      if (wr && wr.wordId && !seenStudiedWordIds.has(wr.wordId)) {
        seenStudiedWordIds.add(wr.wordId);
        studiedWordsChronological.push({ wordId: wr.wordId, timestamp: wr.timestamp || s.completedAt });
      }
    }
  }

  // 3. Strong recall evidence:
  // Under Milestone 2.2 and 4.1 rules:
  // Strong evidence requires verified high-effort learning evidence:
  // - Typing Challenge: correct without hints (hintsUsed === 0).
  // - Meaning AI: correct without override, verified verdict 'correct'.
  // - Sentence AI: correct rubric without override, totalScore >= 12/16.
  // Weak evidence (flashcard self-ratings 'remembered', matching games, typing with hints, or overrides)
  // is strictly EXCLUDED from unlocking strong recall mastery achievements.
  // ReviewRecords alone do not contain learningMode or provenance, so they are not strong evidence.
  const strongRecallWordsChronological: { wordId: string; timestamp: number }[] = [];
  const seenStrongWordIds = new Set<string>();

  for (const s of sortedSessions) {
    for (const wr of s.wordResults) {
      if (!wr || !wr.wordId) continue;
      if (seenStrongWordIds.has(wr.wordId)) continue;

      const isStrong = classifyLearningEvidence({
        learningMode: s.learningMode,
        result: wr.result,
        hintsUsed: wr.hintsUsed,
        isOverridden: wr.isOverridden,
        meaningEvaluation: wr.meaningEvaluation,
        sentenceEvaluation: wr.sentenceEvaluation,
        strictVerification: true,
      }) === 'strong';

      if (isStrong) {
        seenStrongWordIds.add(wr.wordId);
        strongRecallWordsChronological.push({ wordId: wr.wordId, timestamp: wr.timestamp || s.completedAt });
      }
    }
  }

  // 4. Recovered words from lapse (lapseCount > 0 and stage >= 3)
  const recoveredWordIds = new Set<string>();
  const forgotReviewWordIds = new Set(
    reviews.filter((r) => r.result === 'forgot').map((r) => r.wordId)
  );

  Object.entries(srsStates).forEach(([wordId, state]) => {
    if (!state) return;
    const hasLapse = (state.lapseCount && state.lapseCount > 0) || forgotReviewWordIds.has(wordId);
    const hasStage3OrAbove = (state.stage && state.stage >= 3) || state.learningStatus === 'stable' || state.learningStatus === 'mastered';
    if (hasLapse && hasStage3OrAbove) {
      recoveredWordIds.add(wordId);
    }
  });

  // 5. Streak data
  let currentStreak = 0;
  let longestStreak = 0;
  if (streak) {
    currentStreak = streak.currentStreak || 0;
    longestStreak = streak.longestStreak || 0;
  } else {
    const computed = calculateStreakAndActivity(reviews, sessions, getXpLedger());
    currentStreak = computed.streak.currentStreak;
    longestStreak = computed.streak.longestStreak;
  }
  const effectiveMaxStreak = Math.max(currentStreak, longestStreak);

  // 6. Mode specific counts with conservative legacy metadata handling
  // Typing without hints: requires proven hintsUsed === 0
  const validTypingAnswers: number[] = [];
  // Meaning AI without overrides: requires verified verdict 'correct'
  const validMeaningAiAnswers: number[] = [];
  // Sentence AI score >= 12 without overrides: requires verified rubric totalScore >= 12
  const validSentenceAiAnswers: number[] = [];

  for (const s of sortedSessions) {
    for (const wr of s.wordResults) {
      if (!wr) continue;
      const ts = wr.timestamp || s.completedAt;

      // Typing challenge: strict verification requires proven 0 hints
      if (
        s.learningMode === 'typing' &&
        wr.result === 'correct' &&
        typeof wr.hintsUsed === 'number' &&
        wr.hintsUsed === 0
      ) {
        validTypingAnswers.push(ts);
      }

      // Meaning AI: requires verified AI evaluation without override
      if (
        s.learningMode === 'meaning_ai' &&
        wr.result === 'correct' &&
        wr.isOverridden !== true &&
        wr.meaningEvaluation &&
        wr.meaningEvaluation.verdict === 'correct'
      ) {
        validMeaningAiAnswers.push(ts);
      }

      // Sentence AI: requires verified passing rubric without override
      if (
        s.learningMode === 'sentence_ai' &&
        wr.isOverridden !== true &&
        wr.sentenceEvaluation &&
        typeof wr.sentenceEvaluation.totalScore === 'number' &&
        wr.sentenceEvaluation.totalScore >= 12
      ) {
        validSentenceAiAnswers.push(ts);
      }
    }
  }

  // Build each achievement result
  return ACHIEVEMENT_CATALOG.map((def): Achievement => {
    let currentProgress = 0;
    let unlocked = false;
    let unlockedAt: number | undefined = undefined;
    let progressText = '';

    switch (def.id) {
      case 'first_session': {
        const totalActivity = sortedSessions.length + (sortedReviews.length > 0 ? 1 : 0);
        currentProgress = totalActivity > 0 ? 1 : 0;
        unlocked = currentProgress >= def.target;
        if (unlocked) {
          unlockedAt = sortedSessions[0]?.completedAt || sortedReviews[0]?.timestamp;
        }
        progressText = `${currentProgress} / ${def.target} phiên học`;
        break;
      }

      case 'words_10': {
        currentProgress = Math.min(def.target, studiedWordsChronological.length);
        unlocked = studiedWordsChronological.length >= def.target;
        if (unlocked && studiedWordsChronological[def.target - 1]) {
          unlockedAt = studiedWordsChronological[def.target - 1].timestamp;
        }
        progressText = `${currentProgress} / ${def.target} từ đã học`;
        break;
      }

      case 'mastery_25': {
        currentProgress = Math.min(def.target, strongRecallWordsChronological.length);
        unlocked = strongRecallWordsChronological.length >= def.target;
        if (unlocked && strongRecallWordsChronological[def.target - 1]) {
          unlockedAt = strongRecallWordsChronological[def.target - 1].timestamp;
        }
        progressText = `${currentProgress} / ${def.target} từ nhớ đúng`;
        break;
      }

      case 'mastery_50': {
        currentProgress = Math.min(def.target, strongRecallWordsChronological.length);
        unlocked = strongRecallWordsChronological.length >= def.target;
        if (unlocked && strongRecallWordsChronological[def.target - 1]) {
          unlockedAt = strongRecallWordsChronological[def.target - 1].timestamp;
        }
        progressText = `${currentProgress} / ${def.target} từ nhớ đúng`;
        break;
      }

      case 'recovered_5': {
        currentProgress = Math.min(def.target, recoveredWordIds.size);
        unlocked = recoveredWordIds.size >= def.target;
        progressText = `${currentProgress} / ${def.target} từ phục hồi`;
        break;
      }

      case 'streak_3': {
        currentProgress = Math.min(def.target, effectiveMaxStreak);
        unlocked = effectiveMaxStreak >= def.target;
        progressText = `${currentProgress} / ${def.target} ngày chuỗi`;
        break;
      }

      case 'streak_7': {
        currentProgress = Math.min(def.target, effectiveMaxStreak);
        unlocked = effectiveMaxStreak >= def.target;
        progressText = `${currentProgress} / ${def.target} ngày chuỗi`;
        break;
      }

      case 'streak_30': {
        currentProgress = Math.min(def.target, effectiveMaxStreak);
        unlocked = effectiveMaxStreak >= def.target;
        progressText = `${currentProgress} / ${def.target} ngày chuỗi`;
        break;
      }

      case 'typing_10': {
        currentProgress = Math.min(def.target, validTypingAnswers.length);
        unlocked = validTypingAnswers.length >= def.target;
        if (unlocked && validTypingAnswers[def.target - 1]) {
          unlockedAt = validTypingAnswers[def.target - 1];
        }
        progressText = `${currentProgress} / ${def.target} câu gõ chuẩn`;
        break;
      }

      case 'meaning_ai_5': {
        currentProgress = Math.min(def.target, validMeaningAiAnswers.length);
        unlocked = validMeaningAiAnswers.length >= def.target;
        if (unlocked && validMeaningAiAnswers[def.target - 1]) {
          unlockedAt = validMeaningAiAnswers[def.target - 1];
        }
        progressText = `${currentProgress} / ${def.target} câu AI duyệt`;
        break;
      }

      case 'sentence_ai_5': {
        currentProgress = Math.min(def.target, validSentenceAiAnswers.length);
        unlocked = validSentenceAiAnswers.length >= def.target;
        if (unlocked && validSentenceAiAnswers[def.target - 1]) {
          unlockedAt = validSentenceAiAnswers[def.target - 1];
        }
        progressText = `${currentProgress} / ${def.target} câu điểm cao`;
        break;
      }

      case 'sessions_100': {
        currentProgress = Math.min(def.target, sortedSessions.length);
        unlocked = sortedSessions.length >= def.target;
        if (unlocked && sortedSessions[def.target - 1]) {
          unlockedAt = sortedSessions[def.target - 1].completedAt;
        }
        progressText = `${currentProgress} / ${def.target} phiên học`;
        break;
      }
    }

    return {
      ...def,
      currentProgress,
      unlocked,
      unlockedAt,
      progressText,
    };
  });
}

// ============================================================================
// Notification & Acknowledgment Helpers (Prevents spam on load / reload)
// ============================================================================

const ACKNOWLEDGED_STORAGE_KEY = 'capcap_achievements_seen_v1';

export function getAcknowledgedAchievementIds(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading acknowledged achievements:', err);
    return [];
  }
}

export function saveAcknowledgedAchievementIds(ids: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch (err) {
    console.error('Error saving acknowledged achievements:', err);
  }
}

/**
 * Initializes acknowledged achievements on first app load so existing users
 * are NOT spammed with notifications for badges they already qualified for in the past.
 */
export function initializeAcknowledgedAchievements(unlockedAchievements: Achievement[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const existing = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
    if (existing === null) {
      // First time initialization: acknowledge all currently unlocked achievements silently
      const currentUnlockedIds = unlockedAchievements.filter((a) => a.unlocked).map((a) => a.id);
      localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(currentUnlockedIds));
    }
  } catch (err) {
    console.error('Error initializing acknowledged achievements:', err);
  }
}

/**
 * Detects achievements that are genuinely newly unlocked and have not been acknowledged yet.
 */
export function detectNewlyUnlockedAchievements(currentAchievements: Achievement[]): Achievement[] {
  const acknowledged = new Set(getAcknowledgedAchievementIds());
  const newlyUnlocked = currentAchievements.filter((a) => a.unlocked && !acknowledged.has(a.id));

  if (newlyUnlocked.length > 0) {
    const updatedIds = [...Array.from(acknowledged), ...newlyUnlocked.map((a) => a.id)];
    saveAcknowledgedAchievementIds(updatedIds);
  }

  return newlyUnlocked;
}
