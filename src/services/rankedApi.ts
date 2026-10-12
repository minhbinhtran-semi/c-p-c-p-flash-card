import { auth } from './firebase';
import type {
  RankedActiveMatch,
  RankedMatchResult,
  RankedProfile,
  RankedPreflightStatus,
  RankedUserAnswer,
} from '../types';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase ID token:', err);
  }

  return headers;
}

export async function fetchRankedPreflight(): Promise<RankedPreflightStatus> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/preflight', { headers });
  if (!res.ok) throw new Error('Không thể tải thông tin kiểm tra đấu trường.');
  return res.json();
}

export async function fetchRankedProfile(guestId?: string): Promise<{ profile: RankedProfile; isAuthenticated: boolean }> {
  const headers = await getAuthHeaders();
  const url = guestId ? `/api/ranked/profile?guestId=${encodeURIComponent(guestId)}` : '/api/ranked/profile';
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Không thể tải thông tin xếp hạng.');
  return res.json();
}

export async function fetchActiveRankedMatch(guestId?: string): Promise<RankedActiveMatch | null> {
  const headers = await getAuthHeaders();
  const url = guestId ? `/api/ranked/active?guestId=${encodeURIComponent(guestId)}` : '/api/ranked/active';
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.activeMatch || null;
}

export async function startRankedMatch(isPractice = false, guestId?: string): Promise<RankedActiveMatch> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/start', {
    method: 'POST',
    headers,
    body: JSON.stringify({ isPractice, guestId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Không thể bắt đầu trận đấu.');
  }

  return data.match;
}

export async function submitRankedMatch(
  matchId: string,
  answers: RankedUserAnswer[],
  guestId?: string
): Promise<RankedMatchResult> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/submit', {
    method: 'POST',
    headers,
    body: JSON.stringify({ matchId, answers, guestId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Nộp bài thi đấu thất bại.');
  }

  return data.result;
}

export async function abandonRankedMatch(matchId: string, guestId?: string): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/abandon', {
    method: 'POST',
    headers,
    body: JSON.stringify({ matchId, guestId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Không thể hủy trận đấu.');
  }

  return data;
}

export async function fetchRankedHistory(guestId?: string): Promise<RankedMatchResult[]> {
  const headers = await getAuthHeaders();
  const url = guestId ? `/api/ranked/history?guestId=${encodeURIComponent(guestId)}` : '/api/ranked/history';
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.history || [];
}

export async function fetchQuestionsReview(): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/questions-review', { headers });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Không có quyền truy cập ngân hàng câu hỏi.');
  }
  return res.json();
}

export async function approveQuestionBank(): Promise<any> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ranked/approve-bank', {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Phê duyệt thất bại.');
  }
  return res.json();
}

