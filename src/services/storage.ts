import {
  AppSettings,
  DayActivity,
  Deck,
  LearningMode,
  LearningSessionRecord,
  ReviewRecord,
  StreakData,
  StudyReviewRating,
  VocabularyItem,
  XpLedgerEntry,
} from '../types';
import { SEED_DECKS, SEED_VOCABULARY } from '../data/seedData';
import { getProgressionStats, getXpLedger, saveXpLedger } from './progression';

const KEYS = {
  VERSION: 'capcap_version',
  DECKS: 'capcap_decks_v1',
  VOCAB: 'capcap_vocab_v1',
  REVIEWS: 'capcap_reviews_v1',
  SESSIONS: 'capcap_sessions_v1',
  SETTINGS: 'capcap_settings_v1',
  XP_LEDGER: 'capcap_xp_ledger_v1',
  INIT: 'capcap_initialized_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  mascotTone: 'cheeky',
  autoAudio: true,
  theme: 'light',
  dailyGoal: 10,
};

function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
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
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

export function initStorage(): void {
  const isInitialized = localStorage.getItem(KEYS.INIT);
  if (!isInitialized) {
    // Only seed on virgin launch
    safeSetItem(KEYS.DECKS, SEED_DECKS);
    safeSetItem(KEYS.VOCAB, SEED_VOCABULARY);
    safeSetItem(KEYS.REVIEWS, []);
    safeSetItem(KEYS.SESSIONS, []);
    safeSetItem(KEYS.XP_LEDGER, []);
    safeSetItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
    safeSetItem(KEYS.VERSION, '2.1.0');
    localStorage.setItem(KEYS.INIT, 'true');
  }
}

// DECKS
export function getDecks(): Deck[] {
  return safeGetItem<Deck[]>(KEYS.DECKS, []);
}

export function getDeckById(deckId: string): Deck | undefined {
  const decks = getDecks();
  return decks.find((d) => d.id === deckId);
}

export function saveDeck(deck: Deck): Deck {
  const decks = getDecks();
  const existingIdx = decks.findIndex((d) => d.id === deck.id);
  let updated: Deck[];

  if (existingIdx >= 0) {
    updated = [...decks];
    updated[existingIdx] = { ...deck, updatedAt: Date.now() };
  } else {
    updated = [{ ...deck, createdAt: Date.now(), updatedAt: Date.now() }, ...decks];
  }

  safeSetItem(KEYS.DECKS, updated);
  return deck;
}

export function deleteDeck(deckId: string): void {
  const decks = getDecks().filter((d) => d.id !== deckId);
  safeSetItem(KEYS.DECKS, decks);

  // Cascade delete deck's vocabulary
  const vocab = getVocabulary().filter((v) => v.deckId !== deckId);
  safeSetItem(KEYS.VOCAB, vocab);

  // Cascade delete review records for this deck
  const reviews = getReviewRecords().filter((r) => r.deckId !== deckId);
  safeSetItem(KEYS.REVIEWS, reviews);

  // Cascade delete learning sessions for this deck
  const sessions = getLearningSessions().filter((s) => s.deckId !== deckId);
  safeSetItem(KEYS.SESSIONS, sessions);
}

// VOCABULARY
export function getVocabulary(deckId?: string): VocabularyItem[] {
  const all = safeGetItem<VocabularyItem[]>(KEYS.VOCAB, []);
  if (!deckId) return all;
  return all.filter((item) => item.deckId === deckId);
}

export function getVocabularyById(id: string): VocabularyItem | undefined {
  const all = getVocabulary();
  return all.find((v) => v.id === id);
}

export function saveVocabularyItem(item: VocabularyItem): VocabularyItem {
  const all = getVocabulary();
  const existingIdx = all.findIndex((v) => v.id === item.id);
  let updated: VocabularyItem[];

  if (existingIdx >= 0) {
    updated = [...all];
    updated[existingIdx] = { ...item, updatedAt: Date.now() };
  } else {
    updated = [{ ...item, createdAt: Date.now(), updatedAt: Date.now() }, ...all];
  }

  safeSetItem(KEYS.VOCAB, updated);
  updateDeckTimestamp(item.deckId);
  return item;
}

export function saveBatchVocabulary(items: VocabularyItem[]): number {
  if (items.length === 0) return 0;
  const all = getVocabulary();
  const deckId = items[0].deckId;

  // Append new items
  const updated = [...items, ...all];
  safeSetItem(KEYS.VOCAB, updated);
  updateDeckTimestamp(deckId);
  return items.length;
}

export function deleteVocabularyItem(id: string): void {
  const all = getVocabulary();
  const target = all.find((v) => v.id === id);
  const updated = all.filter((v) => v.id !== id);
  safeSetItem(KEYS.VOCAB, updated);

  if (target) {
    updateDeckTimestamp(target.deckId);
  }
}

function updateDeckTimestamp(deckId: string): void {
  const decks = getDecks();
  const idx = decks.findIndex((d) => d.id === deckId);
  if (idx >= 0) {
    decks[idx].updatedAt = Date.now();
    safeSetItem(KEYS.DECKS, decks);
  }
}

// REVIEWS
export function getReviewRecords(): ReviewRecord[] {
  return safeGetItem<ReviewRecord[]>(KEYS.REVIEWS, []);
}

export function recordStudyReview(deckId: string, wordId: string, result: StudyReviewRating): void {
  const reviews = getReviewRecords();
  const newRecord: ReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deckId,
    wordId,
    result,
    timestamp: Date.now(),
  };

  reviews.unshift(newRecord);
  // Keep last 1000 review records
  if (reviews.length > 1000) {
    reviews.length = 1000;
  }
  safeSetItem(KEYS.REVIEWS, reviews);

  // Update vocabulary mastery level
  const vocab = getVocabulary();
  const itemIdx = vocab.findIndex((v) => v.id === wordId);
  if (itemIdx >= 0) {
    const item = vocab[itemIdx];
    const newCount = (item.reviewCount || 0) + 1;
    let newLevel: 'new' | 'learning' | 'mastered' = 'learning';
    if (result === 'remembered') {
      newLevel = newCount >= 3 ? 'mastered' : 'learning';
    } else if (result === 'forgot') {
      newLevel = 'learning';
    }

    vocab[itemIdx] = {
      ...item,
      reviewCount: newCount,
      lastReviewedAt: Date.now(),
      masteryLevel: newLevel,
    };
    safeSetItem(KEYS.VOCAB, vocab);
  }
}

export function recordGameWordResult(
  deckId: string,
  wordId: string,
  result: 'correct' | 'incorrect',
  mode: LearningMode,
  hintsUsed: number = 0
): void {
  const rating: StudyReviewRating =
    result === 'correct' ? (hintsUsed > 0 ? 'hard' : 'remembered') : 'forgot';
  const reviews = getReviewRecords();
  const newRecord: ReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deckId,
    wordId,
    result: rating,
    timestamp: Date.now(),
  };

  reviews.unshift(newRecord);
  if (reviews.length > 1000) {
    reviews.length = 1000;
  }
  safeSetItem(KEYS.REVIEWS, reviews);

  // Update vocabulary mastery level with fine-grained rules
  const vocab = getVocabulary();
  const itemIdx = vocab.findIndex((v) => v.id === wordId);
  if (itemIdx >= 0) {
    const item = vocab[itemIdx];
    const newCount = (item.reviewCount || 0) + 1;
    let newLevel = item.masteryLevel;

    if (result === 'correct') {
      if (mode === 'matching') {
        // Do NOT classify a vocabulary word as permanently mastered after only one correct matching answer
        newLevel = newCount >= 5 && item.masteryLevel === 'learning' ? 'mastered' : 'learning';
      } else if (mode === 'typing') {
        // Typing without hint is a strong recall signal
        newLevel = hintsUsed === 0 && newCount >= 3 ? 'mastered' : 'learning';
      } else {
        newLevel = newCount >= 3 ? 'mastered' : 'learning';
      }
    } else {
      newLevel = 'learning';
    }

    vocab[itemIdx] = {
      ...item,
      reviewCount: newCount,
      lastReviewedAt: Date.now(),
      masteryLevel: newLevel,
    };
    safeSetItem(KEYS.VOCAB, vocab);
  }
}

// SESSIONS
export function getLearningSessions(deckId?: string): LearningSessionRecord[] {
  const all = safeGetItem<LearningSessionRecord[]>(KEYS.SESSIONS, []);
  if (!deckId) return all;
  return all.filter((s) => s.deckId === deckId);
}

export function saveLearningSession(session: LearningSessionRecord): void {
  const sessions = getLearningSessions();
  sessions.unshift(session);
  if (sessions.length > 500) {
    sessions.length = 500;
  }
  safeSetItem(KEYS.SESSIONS, sessions);
}

// SETTINGS
export function getSettings(): AppSettings {
  return safeGetItem<AppSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): AppSettings {
  safeSetItem(KEYS.SETTINGS, settings);
  return settings;
}

// DASHBOARD STATS
export interface DashboardStats {
  totalWords: number;
  totalDecks: number;
  wordsReviewed: number;
  totalReviewsCount: number;
  rememberedCount: number;
  masteryPercentage: number;
  decks: Array<Deck & { wordCount: number }>;
  totalXp: number;
  todayXp: number;
  dailyXpCap: number;
  streak: StreakData;
  activityHistory: Record<string, DayActivity>;
}

export function getDashboardStats(): DashboardStats {
  const decks = getDecks();
  const allVocab = getVocabulary();
  const reviews = getReviewRecords();
  const sessions = getLearningSessions();

  const decksWithCount = decks.map((deck) => {
    const wordCount = allVocab.filter((v) => v.deckId === deck.id).length;
    return { ...deck, wordCount };
  });

  const reviewedWordIds = new Set(reviews.map((r) => r.wordId));
  const rememberedReviews = reviews.filter((r) => r.result === 'remembered');
  const masteryPercentage =
    reviews.length > 0 ? Math.round((rememberedReviews.length / reviews.length) * 100) : 0;

  const progression = getProgressionStats(reviews, sessions);

  return {
    totalWords: allVocab.length,
    totalDecks: decks.length,
    wordsReviewed: reviewedWordIds.size,
    totalReviewsCount: reviews.length,
    rememberedCount: rememberedReviews.length,
    masteryPercentage,
    decks: decksWithCount,
    totalXp: progression.totalXp,
    todayXp: progression.todayXp,
    dailyXpCap: progression.dailyXpCap,
    streak: progression.streak,
    activityHistory: progression.activityHistory,
  };
}

// EXPORT / IMPORT
export interface BackupData {
  version: string;
  exportedAt: number;
  appName: string;
  decks: Deck[];
  vocabulary: VocabularyItem[];
  reviews: ReviewRecord[];
  sessions?: LearningSessionRecord[];
  xpLedger?: XpLedgerEntry[];
  srsStates?: Record<string, any>;
  acknowledgedAchievements?: string[];
  settings: AppSettings;
}

export function exportDataToJson(): string {
  let srsStates = {};
  try {
    const rawSrs = localStorage.getItem('capcap_srs_v1');
    if (rawSrs) srsStates = JSON.parse(rawSrs);
  } catch (e) {
    // ignore
  }

  let acknowledgedAchievements: string[] = [];
  try {
    const rawAch = localStorage.getItem('capcap_achievements_seen_v1');
    if (rawAch) acknowledgedAchievements = JSON.parse(rawAch);
  } catch (e) {
    // ignore
  }

  const data: BackupData = {
    version: '2.4.0',
    exportedAt: Date.now(),
    appName: 'cạp cạp.',
    decks: getDecks(),
    vocabulary: getVocabulary(),
    reviews: getReviewRecords(),
    sessions: getLearningSessions(),
    xpLedger: getXpLedger(),
    srsStates,
    acknowledgedAchievements,
    settings: getSettings(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDataFromJson(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const parsed = JSON.parse(jsonString) as Partial<BackupData>;

    if (!parsed || !Array.isArray(parsed.decks) || !Array.isArray(parsed.vocabulary)) {
      return { success: false, message: 'Dữ liệu không đúng định dạng sao lưu của Cạp Cạp.' };
    }

    // Validate structure of decks
    const validDecks = parsed.decks.filter((d) => d && typeof d.id === 'string' && typeof d.title === 'string');
    const validVocab = parsed.vocabulary.filter(
      (v) => v && typeof v.id === 'string' && typeof v.deckId === 'string' && typeof v.englishWord === 'string'
    );

    if (validDecks.length === 0 && validVocab.length === 0) {
      return { success: false, message: 'Không tìm thấy bộ từ hoặc từ vựng hợp lệ trong file sao lưu.' };
    }

    safeSetItem(KEYS.DECKS, validDecks);
    safeSetItem(KEYS.VOCAB, validVocab);

    if (Array.isArray(parsed.reviews)) {
      safeSetItem(KEYS.REVIEWS, parsed.reviews);
    }

    if (Array.isArray(parsed.sessions)) {
      safeSetItem(KEYS.SESSIONS, parsed.sessions);
    } else {
      safeSetItem(KEYS.SESSIONS, []);
    }

    if (Array.isArray(parsed.xpLedger)) {
      saveXpLedger(parsed.xpLedger);
    } else {
      saveXpLedger([]);
    }

    if (parsed.srsStates && typeof parsed.srsStates === 'object') {
      safeSetItem('capcap_srs_v1', parsed.srsStates);
    }

    if (Array.isArray(parsed.acknowledgedAchievements)) {
      safeSetItem('capcap_achievements_seen_v1', parsed.acknowledgedAchievements);
    }

    if (parsed.settings && typeof parsed.settings.mascotTone === 'string') {
      safeSetItem(KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...parsed.settings });
    }

    return {
      success: true,
      message: `Khôi phục thành công ${validDecks.length} bộ từ và ${validVocab.length} từ vựng!`,
      count: validVocab.length,
    };
  } catch (err) {
    return { success: false, message: `Lỗi đọc file JSON: ${err instanceof Error ? err.message : 'Không xác định'}` };
  }
}

export function resetAllData(): void {
  localStorage.removeItem(KEYS.DECKS);
  localStorage.removeItem(KEYS.VOCAB);
  localStorage.removeItem(KEYS.REVIEWS);
  localStorage.removeItem(KEYS.SESSIONS);
  localStorage.removeItem(KEYS.XP_LEDGER);
  localStorage.removeItem(KEYS.SETTINGS);
  localStorage.removeItem(KEYS.INIT);
  initStorage();
}

export function clearDataCompletely(): void {
  safeSetItem(KEYS.DECKS, []);
  safeSetItem(KEYS.VOCAB, []);
  safeSetItem(KEYS.REVIEWS, []);
  safeSetItem(KEYS.SESSIONS, []);
  safeSetItem(KEYS.XP_LEDGER, []);
  safeSetItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
}
