import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Deck, VocabularyItem, LearningSessionRecord, XpLedgerEntry, AppSettings } from '../types';
import { WordSrsState, getAllSrsStates } from './srs';
import { getDecks, getVocabulary, getReviewRecords, getLearningSessions, getSettings, BackupData } from './storage';
import { getXpLedger } from './progression';

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  publicNickname: string;
  createdAt: number;
  lastActiveAt: number;
  profileVisibility: 'public' | 'private';
  rankedTier?: string;
  rp?: number;
  achievements?: string[];
  shareLeaderboard?: boolean;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'idle';

// Get or create user profile in Firestore
export async function fetchOrCreateUserProfile(firebaseUser: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }): Promise<UserProfile> {
  const now = Date.now();
  const defaultProfile: UserProfile = {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || 'Đại ca vô danh',
    email: firebaseUser.email || undefined,
    avatarUrl: firebaseUser.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + firebaseUser.uid,
    publicNickname: firebaseUser.displayName || ('DaiCa_' + firebaseUser.uid.substring(0, 5)),
    createdAt: now,
    lastActiveAt: now,
    profileVisibility: 'public',
    rankedTier: 'Đồng Cạp',
    rp: 0,
    achievements: ['welcome_cadre'],
    shareLeaderboard: false, // Milestone 4.3A: Default: OFF
  };

  try {
    const userRef = doc(db, 'users', firebaseUser.uid, 'profile', 'data');
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      await setDoc(userRef, { lastActiveAt: now }, { merge: true }).catch(() => {});
      return {
        ...data,
        lastActiveAt: now,
        shareLeaderboard: data.shareLeaderboard ?? false,
      };
    } else {
      await setDoc(userRef, defaultProfile).catch(() => {});
      return defaultProfile;
    }
  } catch (err) {
    console.warn('Could not read user profile from Firestore, using local fallback profile:', err);
    return defaultProfile;
  }
}

// Update user profile nickname
export async function updatePublicNickname(uid: string, nickname: string): Promise<void> {
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 30) {
    throw new Error('Biệt hiệu phải từ 2 đến 30 ký tự.');
  }
  const userRef = doc(db, 'users', uid, 'profile', 'data');
  await setDoc(userRef, { publicNickname: trimmed }, { merge: true });
}

// Check if cloud data exists for user
export async function checkCloudDataExists(uid: string): Promise<boolean> {
  try {
    const decksRef = collection(db, 'users', uid, 'decks');
    const snap = await getDocs(decksRef);
    return !snap.empty;
  } catch (err) {
    console.error('Error checking cloud data:', err);
    return false;
  }
}

// Upload all local data to cloud (Option 1)
export async function uploadLocalDataToCloud(uid: string): Promise<void> {
  const decks = getDecks();
  const vocabulary = getVocabulary();
  const reviews = getReviewRecords();
  const sessions = getLearningSessions();
  const xpLedger = getXpLedger();
  const settings = getSettings();
  const srsStates = getAllSrsStates();

  const batch = writeBatch(db);

  decks.forEach((deck) => {
    const ref = doc(db, 'users', uid, 'decks', deck.id);
    batch.set(ref, deck);
  });

  vocabulary.forEach((item) => {
    const ref = doc(db, 'users', uid, 'vocabulary', item.id);
    batch.set(ref, item);
  });

  sessions.forEach((session) => {
    const ref = doc(db, 'users', uid, 'sessions', session.id);
    batch.set(ref, session);
  });

  xpLedger.forEach((entry) => {
    const ref = doc(db, 'users', uid, 'xpEvents', entry.id);
    batch.set(ref, entry);
  });

  Object.entries(srsStates).forEach(([wordId, srs]) => {
    const ref = doc(db, 'users', uid, 'srsStates', wordId);
    batch.set(ref, srs);
  });

  const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
  batch.set(settingsRef, settings);

  await batch.commit();
}

// Fetch cloud data and save to localStorage (Option 2)
export async function downloadCloudDataToLocal(uid: string): Promise<void> {
  // Make backup of local
  const backup: BackupData = {
    version: '1.0',
    exportedAt: Date.now(),
    appName: 'CapCapVocab',
    decks: getDecks(),
    vocabulary: getVocabulary(),
    reviews: getReviewRecords(),
    sessions: getLearningSessions(),
    xpLedger: getXpLedger(),
    srsStates: getAllSrsStates(),
    settings: getSettings(),
  };
  try {
    localStorage.setItem('capcap_backup_slot', JSON.stringify(backup));
  } catch (e) {
    // ignore
  }

  const decksSnap = await getDocs(collection(db, 'users', uid, 'decks'));
  const decks: Deck[] = decksSnap.docs.map(d => d.data() as Deck);

  const vocabSnap = await getDocs(collection(db, 'users', uid, 'vocabulary'));
  const vocabulary: VocabularyItem[] = vocabSnap.docs.map(d => d.data() as VocabularyItem);

  const sessionsSnap = await getDocs(collection(db, 'users', uid, 'sessions'));
  const sessions: LearningSessionRecord[] = sessionsSnap.docs.map(d => d.data() as LearningSessionRecord);

  const xpSnap = await getDocs(collection(db, 'users', uid, 'xpEvents'));
  const xpLedger: XpLedgerEntry[] = xpSnap.docs.map(d => d.data() as XpLedgerEntry);

  const srsSnap = await getDocs(collection(db, 'users', uid, 'srsStates'));
  const srsStates: Record<string, WordSrsState> = {};
  srsSnap.docs.forEach(d => {
    srsStates[d.id] = d.data() as WordSrsState;
  });

  const settingsSnap = await getDoc(doc(db, 'users', uid, 'settings', 'preferences'));
  const settings = settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : getSettings();

  localStorage.setItem('capcap_decks_v1', JSON.stringify(decks));
  localStorage.setItem('capcap_vocab_v1', JSON.stringify(vocabulary));
  localStorage.setItem('capcap_sessions_v1', JSON.stringify(sessions));
  localStorage.setItem('capcap_xp_ledger_v1', JSON.stringify(xpLedger));
  localStorage.setItem('capcap_srs_v1', JSON.stringify(srsStates));
  localStorage.setItem('capcap_settings_v1', JSON.stringify(settings));
}

// Merge local and cloud data safely (Option 3)
export async function mergeLocalAndCloudData(uid: string): Promise<void> {
  const decksSnap = await getDocs(collection(db, 'users', uid, 'decks'));
  const cloudDecks = decksSnap.docs.map(d => d.data() as Deck);
  const localDecks = getDecks();

  const vocabSnap = await getDocs(collection(db, 'users', uid, 'vocabulary'));
  const cloudVocab = vocabSnap.docs.map(d => d.data() as VocabularyItem);
  const localVocab = getVocabulary();

  const sessionsSnap = await getDocs(collection(db, 'users', uid, 'sessions'));
  const cloudSessions = sessionsSnap.docs.map(d => d.data() as LearningSessionRecord);
  const localSessions = getLearningSessions();

  const xpSnap = await getDocs(collection(db, 'users', uid, 'xpEvents'));
  const cloudXp = xpSnap.docs.map(d => d.data() as XpLedgerEntry);
  const localXp = getXpLedger();

  const srsSnap = await getDocs(collection(db, 'users', uid, 'srsStates'));
  const cloudSrs: Record<string, WordSrsState> = {};
  srsSnap.docs.forEach(d => {
    cloudSrs[d.id] = d.data() as WordSrsState;
  });
  const localSrs = getAllSrsStates();

  // Merge Decks by ID
  const deckMap = new Map<string, Deck>();
  cloudDecks.forEach(d => deckMap.set(d.id, d));
  localDecks.forEach(d => {
    if (!deckMap.has(d.id) || (d.updatedAt || 0) > (deckMap.get(d.id)?.updatedAt || 0)) {
      deckMap.set(d.id, d);
    }
  });
  const mergedDecks = Array.from(deckMap.values());

  // Merge Vocabulary by ID
  const vocabMap = new Map<string, VocabularyItem>();
  cloudVocab.forEach(v => vocabMap.set(v.id, v));
  localVocab.forEach(v => {
    if (!vocabMap.has(v.id) || (v.createdAt || 0) > (vocabMap.get(v.id)?.createdAt || 0)) {
      vocabMap.set(v.id, v);
    }
  });
  const mergedVocab = Array.from(vocabMap.values());

  // Merge Sessions by ID
  const sessionMap = new Map<string, LearningSessionRecord>();
  cloudSessions.forEach(s => sessionMap.set(s.id, s));
  localSessions.forEach(s => sessionMap.set(s.id, s));
  const mergedSessions = Array.from(sessionMap.values());

  // Merge XP ledger by ID
  const xpMap = new Map<string, XpLedgerEntry>();
  cloudXp.forEach(x => xpMap.set(x.id, x));
  localXp.forEach(x => xpMap.set(x.id, x));
  const mergedXp = Array.from(xpMap.values());

  // Merge SRS states by wordId
  const mergedSrs: Record<string, WordSrsState> = { ...cloudSrs };
  Object.entries(localSrs).forEach(([wordId, srs]) => {
    if (!mergedSrs[wordId] || srs.lastReviewAt! > (mergedSrs[wordId].lastReviewAt || 0)) {
      mergedSrs[wordId] = srs;
    }
  });

  localStorage.setItem('capcap_decks_v1', JSON.stringify(mergedDecks));
  localStorage.setItem('capcap_vocab_v1', JSON.stringify(mergedVocab));
  localStorage.setItem('capcap_sessions_v1', JSON.stringify(mergedSessions));
  localStorage.setItem('capcap_xp_ledger_v1', JSON.stringify(mergedXp));
  localStorage.setItem('capcap_srs_v1', JSON.stringify(mergedSrs));

  await uploadLocalDataToCloud(uid);
}
