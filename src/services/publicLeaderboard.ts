import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import { getRankFromXP } from './rank';
import type { LeaderboardEntry } from '../types';

export interface PublicLearningStat {
  uid: string;
  nickname: string;
  avatar?: string;
  totalXp: number;
  streakDays: number;
  updatedAt: number;
}

// In-memory cache of last synced public stats to prevent redundant writes
let lastSyncedSignature = '';

function computeStatSignature(stat: { uid: string; nickname: string; totalXp: number; streakDays: number }): string {
  return `${stat.uid}_${stat.nickname}_${stat.totalXp}_${stat.streakDays}`;
}

/**
 * Publishes or updates the minimal public learning summary to Firestore: publicLearningStats/{uid}
 * Strictly includes ONLY: uid, nickname, avatar, totalXp, streakDays, updatedAt.
 * NEVER writes private vocabulary, decks, email, SRS, or Gemini data.
 */
export async function publishPublicLearningStats(params: {
  uid: string;
  nickname: string;
  avatar?: string;
  totalXp: number;
  streakDays: number;
  force?: boolean;
}): Promise<void> {
  const { uid, nickname, avatar, totalXp, streakDays, force = false } = params;

  if (!uid) {
    throw new Error('Cần đăng nhập tài khoản để chia sẻ thành tích.');
  }

  let cleanNickname = (nickname || '').trim().substring(0, 40);
  if (cleanNickname.length < 2) {
    cleanNickname = cleanNickname.length === 1 ? `${cleanNickname} Cạp` : 'Đại ca';
  }
  const cleanXp = Math.max(0, Math.floor(totalXp || 0));
  const cleanStreak = Math.max(0, Math.floor(streakDays || 0));

  const sig = computeStatSignature({ uid, nickname: cleanNickname, totalXp: cleanXp, streakDays: cleanStreak });
  if (!force && sig === lastSyncedSignature) {
    // No change since last sync, skip Firestore write to conserve quota
    return;
  }

  const payload: PublicLearningStat = {
    uid,
    nickname: cleanNickname,
    totalXp: cleanXp,
    streakDays: cleanStreak,
    updatedAt: Date.now(),
  };

  if (avatar && typeof avatar === 'string' && avatar.trim().length > 0 && avatar.length <= 1000) {
    payload.avatar = avatar.trim();
  }

  const docRef = doc(db, 'publicLearningStats', uid);
  await setDoc(docRef, payload);
  lastSyncedSignature = sig;
}

/**
 * Removes the public learning summary document when the user opts out.
 */
export async function removePublicLearningStats(uid: string): Promise<void> {
  if (!uid) return;
  const docRef = doc(db, 'publicLearningStats', uid);
  await deleteDoc(docRef);
  lastSyncedSignature = '';
}

/**
 * Toggles the public leaderboard sharing preference.
 * Updates both the user's private profile document and the publicLearningStats document.
 * Throws if the write operation fails, ensuring UI never displays false success.
 */
export async function toggleLeaderboardSharing(params: {
  uid: string;
  enabled: boolean;
  nickname: string;
  avatar?: string;
  totalXp: number;
  streakDays: number;
}): Promise<void> {
  const { uid, enabled, nickname, avatar, totalXp, streakDays } = params;

  if (!uid) {
    throw new Error('Chỉ tài khoản đã đăng nhập mới có thể tham gia Bảng Phong Thần.');
  }

  if (enabled) {
    // 1. Write the public stat document first to verify permissions
    await publishPublicLearningStats({
      uid,
      nickname,
      avatar,
      totalXp,
      streakDays,
      force: true,
    });

    // 2. Persist the opt-in flag to the user's profile
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    await setDoc(profileRef, { shareLeaderboard: true }, { merge: true });
  } else {
    // 1. Remove public document
    await removePublicLearningStats(uid);

    // 2. Persist the opt-out flag to the user's profile
    const profileRef = doc(db, 'users', uid, 'profile', 'data');
    await setDoc(profileRef, { shareLeaderboard: false }, { merge: true });
  }
}

export type LeaderboardErrorCode = 'unauthenticated' | 'permission_denied' | 'network_error' | 'unknown';

export class LeaderboardError extends Error {
  code: LeaderboardErrorCode;
  constructor(code: LeaderboardErrorCode, message: string) {
    super(message);
    this.name = 'LeaderboardError';
    this.code = code;
  }
}

/**
 * Fetches all participating public learning statistics from Firestore.
 * Converts each public summary into a LeaderboardEntry using the authoritative getRankFromXP() engine.
 * Deduplicates by UID and applies deterministic tie-breaking.
 * Throws typed LeaderboardError so UI can display honest permission/network states.
 */
export async function fetchPublicLeaderboardEntries(
  sortBy: 'xp' | 'streak' = 'xp',
  currentUid?: string | null
): Promise<LeaderboardEntry[]> {
  if (!currentUid) {
    throw new LeaderboardError(
      'unauthenticated',
      'Chỉ tài khoản đã đăng nhập mới có thể xem Bảng Phong Thần của hội bạn.'
    );
  }

  try {
    const colRef = collection(db, 'publicLearningStats');
    const q = query(colRef, limit(100));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const seenUids = new Set<string>();
    const rawStats: PublicLearningStat[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as PublicLearningStat;
      if (data && data.uid && typeof data.totalXp === 'number' && !seenUids.has(data.uid)) {
        seenUids.add(data.uid);
        rawStats.push(data);
      }
    });

    // Deterministic tie-breaking rules:
    // When sorting by XP: totalXp (desc) -> streakDays (desc) -> updatedAt (asc) -> uid (asc)
    // When sorting by Streak: streakDays (desc) -> totalXp (desc) -> updatedAt (asc) -> uid (asc)
    rawStats.sort((a, b) => {
      if (sortBy === 'streak') {
        if (b.streakDays !== a.streakDays) {
          return b.streakDays - a.streakDays;
        }
        if (b.totalXp !== a.totalXp) {
          return b.totalXp - a.totalXp;
        }
      } else {
        if (b.totalXp !== a.totalXp) {
          return b.totalXp - a.totalXp;
        }
        if (b.streakDays !== a.streakDays) {
          return b.streakDays - a.streakDays;
        }
      }
      const timeA = a.updatedAt || 0;
      const timeB = b.updatedAt || 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.uid.localeCompare(b.uid);
    });

    return rawStats.map((stat, index) => {
      // Authoritative rank engine - derived strictly from totalXp, no second rank value
      const rankInfo = getRankFromXP(stat.totalXp);
      return {
        id: stat.uid,
        rankPosition: index + 1,
        nickname: stat.nickname || 'Đại ca',
        avatarUrl: stat.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(stat.uid)}`,
        xp: stat.totalXp,
        streakDays: stat.streakDays,
        rp: stat.totalXp,
        tierIndex: rankInfo.tierIndex,
        tierName: rankInfo.tierName,
        division: rankInfo.division as any,
        fullName: rankInfo.fullName,
        badge: rankInfo.badge,
        color: rankInfo.color,
        quote: 'Học cùng hội bạn trên Cạp Cạp.',
        isDemo: false,
      };
    });
  } catch (err: any) {
    if (err instanceof LeaderboardError) {
      throw err;
    }
    console.warn('Could not fetch public learning stats from Firestore:', err);
    const code = err?.code || '';
    const message = err?.message || String(err);
    if (
      code.includes('permission-denied') ||
      code.includes('unauthenticated') ||
      message.includes('Missing or insufficient permissions')
    ) {
      throw new LeaderboardError(
        'permission_denied',
        'Tài khoản của bạn chưa được cấp quyền truy cập hoặc phiên đăng nhập đã hết hạn.'
      );
    }
    if (
      code.includes('unavailable') ||
      code.includes('network') ||
      code.includes('deadline-exceeded') ||
      message.includes('offline') ||
      message.includes('network')
    ) {
      throw new LeaderboardError(
        'network_error',
        'Không thể kết nối đến máy chủ Firestore. Vui lòng kiểm tra kết nối mạng.'
      );
    }
    throw new LeaderboardError(
      'unknown',
      err?.message || 'Có lỗi không xác định xảy ra khi tải Bảng Phong Thần.'
    );
  }
}

