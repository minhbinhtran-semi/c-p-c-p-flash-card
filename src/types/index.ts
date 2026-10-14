export type MascotTone = 'puppy' | 'cheeky' | 'boss';

export type MascotExpression = 'idle' | 'happy' | 'confused' | 'smug';

export type StudyReviewRating = 'forgot' | 'hard' | 'remembered' | 'easy';

export interface Deck {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface VocabularyItem {
  id: string;
  deckId: string;
  englishWord: string;
  vietnameseDefinition: string;
  partOfSpeech?: string; // n, v, adj, adv, idiom, etc.
  exampleSentence?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  reviewCount: number;
  lastReviewedAt?: number;
  masteryLevel: 'new' | 'learning' | 'mastered';
}

export interface ReviewRecord {
  id: string;
  deckId: string;
  wordId: string;
  result: StudyReviewRating;
  timestamp: number;
}

export type LearningMode =
  | 'flashcard'
  | 'matching'
  | 'typing'
  | 'meaning_ai'
  | 'sentence_ai';

export interface MeaningEvaluationResponse {
  verdict: 'correct' | 'partially_correct' | 'incorrect';
  confidence: number;
  explanationVi: string;
  expectedMeaningVi: string;
  userMeaningVi: string;
  nuanceNoteVi?: string;
}

export interface SentenceEvaluationResponse {
  verdict: 'correct' | 'partially_correct' | 'incorrect';
  scores: {
    grammar: number;
    vocabularyUsage: number;
    context: number;
    naturalness: number;
  };
  totalScore: number;
  feedbackVi: string;
  grammarIssues: string[];
  usageIssues: string[];
  correctedSentence: string;
  improvedSentence: string;
  explanationVi: string;
}

export interface LearningSessionWordResult {
  wordId: string;
  result: 'correct' | 'partially_correct' | 'incorrect';
  hintsUsed?: number;
  timestamp: number;
  userAnswer?: string;
  meaningEvaluation?: MeaningEvaluationResponse;
  sentenceEvaluation?: SentenceEvaluationResponse;
  isOverridden?: boolean;
  attemptNumber?: number;
}

export interface LearningSessionRecord {
  id: string;
  deckId: string;
  learningMode: LearningMode;
  startedAt: number;
  completedAt: number;
  durationSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  partiallyCorrectAnswers?: number;
  incorrectAnswers: number;
  hintsUsed?: number;
  overriddenCount?: number;
  wordResults: LearningSessionWordResult[];
}

export interface StudySessionSummary {
  deckId: string;
  totalCards: number;
  rememberedCount: number;
  hardCount: number;
  forgotCount: number;
  easyCount?: number;
  timestamp: number;
}

export interface AppSettings {
  mascotTone: MascotTone;
  autoAudio: boolean;
  theme: 'light';
  dailyGoal: number;
}

export interface DialogueItem {
  id: string;
  text: string;
  expression: MascotExpression;
}

export type DialogueCategory =
  | 'WELCOME'
  | 'CREATE_DECK'
  | 'ADD_VOCABULARY'
  | 'BULK_IMPORT'
  | 'FLASHCARD_START'
  | 'FLASHCARD_REMEMBERED'
  | 'FLASHCARD_HARD'
  | 'FLASHCARD_FORGOT'
  | 'SESSION_SUCCESS'
  | 'SESSION_AVERAGE'
  | 'SESSION_FAIL'
  | 'EMPTY_STATE'
  | 'SETTINGS_CHANGE'
  | 'MATCH_CORRECT'
  | 'MATCH_WRONG'
  | 'MATCH_FAST'
  | 'MATCH_PERFECT'
  | 'TYPING_CORRECT'
  | 'TYPING_WRONG'
  | 'TYPING_HINT'
  | 'GAME_COMPLETE'
  | 'AI_MEANING_CORRECT'
  | 'AI_MEANING_PARTIAL'
  | 'AI_MEANING_WRONG'
  | 'AI_SENTENCE_EXCELLENT'
  | 'AI_SENTENCE_PARTIAL'
  | 'AI_SENTENCE_WRONG'
  | 'AI_EVALUATION_ERROR'
  | 'AI_SESSION_COMPLETE'
  | 'STREAK_STARTED'
  | 'STREAK_CONTINUED'
  | 'STREAK_MILESTONE'
  | 'STREAK_BROKEN'
  | 'XP_EARNED'
  | 'XP_DAILY_CAP'
  | 'PERFECT_STUDY_DAY'
  | 'NO_STUDY_ACTIVITY'
  | 'SO_NHUC_OPEN'
  | 'SO_NHUC_REPEATED_ERROR'
  | 'SO_NHUC_VERY_LOW_ACCURACY'
  | 'SO_NHUC_IMPROVEMENT'
  | 'SO_NHUC_WORD_MASTERED'
  | 'SO_NHUC_EMPTY'
  | 'SRS_REVIEW_START'
  | 'SRS_REVIEW_COMPLETE'
  | 'RANKED_ENTER'
  | 'RANKED_START'
  | 'RANKED_PERFECT'
  | 'RANKED_SUCCESS'
  | 'RANKED_FAILURE'
  | 'RANKED_PROMOTION'
  | 'RANKED_DEMOTION'
  | 'RANKED_TIMEOUT'
  | 'RANKED_LIMIT_REACHED'
  | 'RANKED_SERVER_ERROR'
  | 'LEADERBOARD_OPEN'
  | 'LEADERBOARD_DEMO'
  | 'LEADERBOARD_TOP_3'
  | 'LEADERBOARD_UNRANKED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'ACHIEVEMENT_GALLERY_OPEN'
  | 'ACHIEVEMENT_FIRST_UNLOCK'
  | 'ACHIEVEMENT_MILESTONE';

export type AchievementCategory = 'starter' | 'mastery' | 'consistency' | 'modes' | 'dedication';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  categoryLabel: string;
  target: number;
  currentProgress: number;
  unlocked: boolean;
  unlockedAt?: number;
  progressText: string;
}

export interface LeaderboardEntry {
  id: string;
  rankPosition: number;
  nickname: string;
  avatarUrl: string;
  xp: number;
  streakDays: number;
  rp?: number;
  tierIndex: number;
  tierName: string;
  division: 'III' | 'II' | 'I' | '';
  fullName: string;
  badge: string;
  color: string;
  quote: string;
  isDemo: boolean;
}

export type RankedDifficulty = 'easy' | 'medium' | 'hard';
export type RankedQuestionType = 'multiple_choice' | 'typing';

export interface RankedQuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

// Client-facing sanitized question (no answer key or explanation)
export interface RankedSanitizedQuestion {
  id: string;
  difficulty: RankedDifficulty;
  type: RankedQuestionType;
  questionText: string;
  vietnameseContext?: string;
  partOfSpeech?: string;
  options?: RankedQuestionOption[];
}

// Full server-side question definition
export interface RankedQuestion extends RankedSanitizedQuestion {
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  validationStatus: 'approved' | 'pending' | 'rejected';
  version: number;
}

export type RankedMatchStatus = 'active' | 'completed' | 'abandoned' | 'expired';

export interface RankedUserAnswer {
  questionId: string;
  answer: string;
}

export interface RankedQuestionResult {
  questionId: string;
  questionText: string;
  vietnameseContext?: string;
  type: RankedQuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface RankedMatchResult {
  matchId: string;
  status: RankedMatchStatus;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  previousRp: number;
  rpChange: number;
  newRp: number;
  previousRankName: string;
  newRankName: string;
  rankChangeType: 'promotion' | 'demotion' | 'maintained';
  completedAt: number;
  timeSpentSeconds: number;
  questionResults: RankedQuestionResult[];
  mascotReactionText?: string;
  isPracticeMode?: boolean;
}

export interface RankedActiveMatch {
  matchId: string;
  startedAt: number;
  expiresAt: number;
  durationSeconds: number;
  questions: RankedSanitizedQuestion[];
  isPracticeMode?: boolean;
}

export interface RankedProfile {
  userId: string;
  currentRp: number;
  tierIndex: number;
  tierName: string;
  division: string;
  fullName: string;
  totalMatches: number;
  highestRp: number;
  perfectMatches: number;
  todayMatchesCount: number;
  lastMatchDate: string; // YYYY-MM-DD
  isPracticeMode?: boolean;
  isUnranked: boolean; // True for accounts with 0 completed ranked matches
}

export interface RankedPreflightStatus {
  practiceReady: boolean;
  rankedReady: boolean;
  cloudPersistenceReady: boolean;
  questionBankApproved: boolean;
  serviceAccount: string;
  targetProject: string;
  targetDatabase: string;
  requiredRole: string;
  iamStatus: 'granted' | 'missing_permissions' | 'unverified';
  statusReason: string;
  testedAt: number;
  isOwner?: boolean;
  note?: string;
}

export interface XpLedgerEntry {
  id: string;
  sourceSessionId?: string;
  sourceAttemptId?: string;
  wordId: string;
  deckId: string;
  learningMode: LearningMode;
  localDate: string; // YYYY-MM-DD
  awardedXP: number; // non-negative integer
  eligibleRewardLevel: number;
  createdAt: number;
  reason: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  lastActiveDate: string | null;
  isStudiedToday: boolean;
  isStreakAtRisk: boolean; // Studied yesterday, waiting for today
}

export interface DayActivity {
  date: string; // YYYY-MM-DD
  distinctWordsCount: number;
  sessionsCount: number;
  xpEarned: number;
  isQualifying: boolean;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ProgressionStats {
  totalXp: number;
  todayXp: number;
  dailyXpCap: number;
  streak: StreakData;
  activityHistory: Record<string, DayActivity>;
}



