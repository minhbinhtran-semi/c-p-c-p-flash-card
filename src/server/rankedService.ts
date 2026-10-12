import type { Request, Response, Router } from 'express';
import express from 'express';
import crypto from 'crypto';
import firebaseConfigData from '../../firebase-applet-config.json';
import { RANKED_QUESTION_BANK } from '../data/rankedQuestionBank';
import { getRankFromRP } from '../services/rank';
import {
  probeNamedDatabaseAccess,
  getRankedProfileFromFirestore,
  saveRankedProfileToFirestore,
  saveRankedMatchToFirestore,
  getRankedMatchFromFirestore,
  TARGET_PROJECT_ID,
  TARGET_DATABASE_ID,
  REQUIRED_IAM_ROLE,
} from './firestoreService';
import type {
  RankedQuestion,
  RankedSanitizedQuestion,
  RankedMatchStatus,
  RankedUserAnswer,
  RankedQuestionResult,
  RankedMatchResult,
  RankedActiveMatch,
  RankedProfile,
  RankedPreflightStatus,
} from '../types';

export const OWNER_EMAIL = 'minhbinhtran.semi@gmail.com';

// State flag for human/owner question bank approval
let isQuestionBankApproved = false;

// ==========================================
// 1. GOOGLE AUTH TOKEN VERIFICATION HELPER
// ==========================================
interface GoogleCertsCache {
  certs: Record<string, string>;
  fetchedAt: number;
}

let certsCache: GoogleCertsCache | null = null;

async function getGooglePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certsCache && now - certsCache.fetchedAt < 3600000) {
    return certsCache.certs;
  }
  try {
    const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
    if (!res.ok) throw new Error(`Failed to fetch certs: ${res.status}`);
    const certs = await res.json();
    certsCache = { certs, fetchedAt: now };
    return certs;
  } catch (err) {
    console.error('Error fetching Google public certs:', err);
    if (certsCache) return certsCache.certs;
    return {};
  }
}

export interface VerifiedUser {
  uid: string;
  email?: string;
  name?: string;
  isOwner: boolean;
}

export async function verifyAuthToken(req: Request): Promise<VerifiedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    const expectedProject = firebaseConfigData.projectId;
    const nowInSec = Math.floor(Date.now() / 1000);

    if (payload.aud !== expectedProject) {
      console.warn(`Token aud mismatch: expected ${expectedProject}, got ${payload.aud}`);
      return null;
    }
    if (payload.iss !== `https://securetoken.google.com/${expectedProject}`) {
      console.warn(`Token iss mismatch: expected https://securetoken.google.com/${expectedProject}, got ${payload.iss}`);
      return null;
    }
    if (payload.exp && payload.exp < nowInSec) {
      console.warn('Token expired');
      return null;
    }

    const uid = payload.sub || payload.user_id;
    if (!uid || typeof uid !== 'string') return null;

    // Cryptographic signature check against Google public cert
    const certs = await getGooglePublicCerts();
    const cert = header.kid ? certs[header.kid] : null;

    if (cert) {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      const isSignatureValid = verifier.verify(cert, signatureB64, 'base64url');
      if (!isSignatureValid) {
        console.warn('Cryptographic signature verification failed');
        return null;
      }
    } else {
      console.warn(`Public certificate for kid ${header.kid} not found; falling back to valid claims.`);
    }

    const email = payload.email ? String(payload.email).toLowerCase() : undefined;
    const isOwner = email === OWNER_EMAIL.toLowerCase();

    return {
      uid,
      email,
      name: payload.name,
      isOwner,
    };
  } catch (err) {
    console.error('Error verifying auth token:', err);
    return null;
  }
}

// ==========================================
// 2. STATE & CACHING FOR MATCHES
// ==========================================
interface AuthoritativeMatch {
  matchId: string;
  userId: string;
  startedAt: number;
  expiresAt: number;
  status: RankedMatchStatus;
  questions: RankedQuestion[];
  isPracticeMode: boolean;
  finalResult?: RankedMatchResult;
}

const authoritativeMatches = new Map<string, AuthoritativeMatch>();
const userActiveMatches = new Map<string, string>(); // userId -> matchId
const userRankedProfiles = new Map<string, RankedProfile>(); // in-memory cache
const userMatchHistories = new Map<string, RankedMatchResult[]>();
const userDailyAttempts = new Map<string, number>();
const inFlightSubmissions = new Set<string>(); // Lock for concurrent submissions

function getVietnamDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

async function getUserProfile(userId: string, isCloudReady: boolean): Promise<RankedProfile> {
  // If cloud persistence is ready, load from Firestore first
  if (isCloudReady) {
    const cloudProfile = await getRankedProfileFromFirestore(userId);
    if (cloudProfile) {
      userRankedProfiles.set(userId, cloudProfile);
      return cloudProfile;
    }
  }

  // Fallback to local cache
  let profile = userRankedProfiles.get(userId);
  if (!profile) {
    profile = {
      userId,
      currentRp: 0,
      tierIndex: 0,
      tierName: 'UNRANKED',
      division: '',
      fullName: 'Chưa Xếp Hạng (UNRANKED)',
      totalMatches: 0,
      highestRp: 0,
      perfectMatches: 0,
      todayMatchesCount: 0,
      lastMatchDate: getVietnamDateString(),
      isPracticeMode: true,
      isUnranked: true, // New account is strictly UNRANKED until first rated match
    };
    userRankedProfiles.set(userId, profile);
  }

  // Update todayMatchesCount based on current date
  const today = getVietnamDateString();
  const attemptKey = `${userId}:${today}`;
  profile.todayMatchesCount = userDailyAttempts.get(attemptKey) || 0;
  profile.lastMatchDate = today;

  return profile;
}

function normalizeTypingString(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .replace(/\s+/g, ' ');
}

function gradeQuestion(q: RankedQuestion, rawAnswer: string): { isCorrect: boolean; sanitizedAnswer: string } {
  if (q.type === 'multiple_choice') {
    const clean = rawAnswer.trim().toUpperCase();
    const isCorrect = clean === q.correctAnswer.toUpperCase();
    return { isCorrect, sanitizedAnswer: clean };
  }

  // Typing question
  const normUser = normalizeTypingString(rawAnswer);
  const normTarget = normalizeTypingString(q.correctAnswer);

  if (normUser === normTarget) {
    return { isCorrect: true, sanitizedAnswer: rawAnswer.trim() };
  }

  if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
    for (const alt of q.acceptedAnswers) {
      if (normUser === normalizeTypingString(alt)) {
        return { isCorrect: true, sanitizedAnswer: rawAnswer.trim() };
      }
    }
  }

  return { isCorrect: false, sanitizedAnswer: rawAnswer.trim() };
}

function calculateRpChange(correctAnswers: number): number {
  if (correctAnswers >= 10) return 25;
  if (correctAnswers >= 8) return 18;
  if (correctAnswers >= 6) return 8;
  if (correctAnswers >= 4) return -5;
  return -10;
}

function selectAuthoritativeQuestions(): RankedQuestion[] {
  const mcEasy = RANKED_QUESTION_BANK.filter((q) => q.type === 'multiple_choice' && q.difficulty === 'easy');
  const mcMed = RANKED_QUESTION_BANK.filter((q) => q.type === 'multiple_choice' && q.difficulty === 'medium');
  const mcHard = RANKED_QUESTION_BANK.filter((q) => q.type === 'multiple_choice' && q.difficulty === 'hard');

  const tyEasy = RANKED_QUESTION_BANK.filter((q) => q.type === 'typing' && q.difficulty === 'easy');
  const tyMed = RANKED_QUESTION_BANK.filter((q) => q.type === 'typing' && q.difficulty === 'medium');
  const tyHard = RANKED_QUESTION_BANK.filter((q) => q.type === 'typing' && q.difficulty === 'hard');

  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const selectedMC: RankedQuestion[] = [
    ...shuffle(mcEasy).slice(0, 2),
    ...shuffle(mcMed).slice(0, 3),
    ...shuffle(mcHard).slice(0, 1),
  ];

  const selectedTY: RankedQuestion[] = [
    ...shuffle(tyEasy).slice(0, 1),
    ...shuffle(tyMed).slice(0, 2),
    ...shuffle(tyHard).slice(0, 1),
  ];

  const interleaved: RankedQuestion[] = [];
  const mcPool = shuffle(selectedMC);
  const tyPool = shuffle(selectedTY);

  interleaved.push(mcPool[0]); // 1
  interleaved.push(mcPool[1]); // 2
  interleaved.push(tyPool[0]); // 3
  interleaved.push(mcPool[2]); // 4
  interleaved.push(mcPool[3]); // 5
  interleaved.push(tyPool[1]); // 6
  interleaved.push(mcPool[4]); // 7
  interleaved.push(tyPool[2]); // 8
  interleaved.push(mcPool[5]); // 9
  interleaved.push(tyPool[3]); // 10

  return interleaved;
}

function sanitizeQuestion(q: RankedQuestion): RankedSanitizedQuestion {
  return {
    id: q.id,
    difficulty: q.difficulty,
    type: q.type,
    questionText: q.questionText,
    vietnameseContext: q.vietnameseContext,
    partOfSpeech: q.partOfSpeech,
    options: q.options,
  };
}

// ==========================================
// 3. RANKED CHALLENGE ARENA ROUTER
// ==========================================
export function createRankedRouter(): Router {
  const router = express.Router();

  // ------------------------------------------
  // GET /api/ranked/preflight
  // ------------------------------------------
  router.get('/preflight', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const probe = await probeNamedDatabaseAccess();

    const cloudPersistenceReady = probe.available;
    const questionBankApproved = isQuestionBankApproved;
    const practiceReady = true;
    // Ranked mode is ONLY ready when BOTH cloud persistence is verified AND question bank is approved
    const rankedReady = cloudPersistenceReady && questionBankApproved;

    const status: RankedPreflightStatus = {
      practiceReady,
      rankedReady,
      cloudPersistenceReady,
      questionBankApproved,
      serviceAccount: probe.serviceAccount,
      targetProject: TARGET_PROJECT_ID,
      targetDatabase: TARGET_DATABASE_ID,
      requiredRole: REQUIRED_IAM_ROLE,
      iamStatus: probe.available ? 'granted' : probe.httpStatus === 403 ? 'missing_permissions' : 'unverified',
      statusReason: probe.message,
      testedAt: probe.testedAt,
      isOwner: user?.isOwner || false,
      note: rankedReady
        ? 'Đấu Trường sẵn sàng: Cloud Persistence và Ngân hàng đề thi đã được thẩm định.'
        : `Chế độ Đấu Tập sẵn sàng. Đấu Trường Xếp Hạng tạm khóa vì: ${
            !cloudPersistenceReady
              ? `Thiếu quyền IAM [${REQUIRED_IAM_ROLE}] trên Service Account [${probe.serviceAccount}].`
              : 'Ngân hàng đề thi chưa được Owner phê duyệt chính thức.'
          }`,
    };

    return res.json(status);
  });

  // ------------------------------------------
  // GET /api/ranked/profile
  // ------------------------------------------
  router.get('/profile', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const effectiveUid = user?.uid || (req.query.guestId as string) || 'guest_default';
    const probe = await probeNamedDatabaseAccess();
    const profile = await getUserProfile(effectiveUid, probe.available);

    return res.json({
      profile,
      isAuthenticated: !!user,
      isOwner: user?.isOwner || false,
    });
  });

  // ------------------------------------------
  // GET /api/ranked/active
  // ------------------------------------------
  router.get('/active', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const effectiveUid = user?.uid || (req.query.guestId as string);
    if (!effectiveUid) {
      return res.json({ activeMatch: null });
    }

    const activeMatchId = userActiveMatches.get(effectiveUid);
    if (!activeMatchId) {
      return res.json({ activeMatch: null });
    }

    const match = authoritativeMatches.get(activeMatchId);
    if (!match || match.status !== 'active') {
      userActiveMatches.delete(effectiveUid);
      return res.json({ activeMatch: null });
    }

    const now = Date.now();
    if (now > match.expiresAt) {
      match.status = 'expired';
      userActiveMatches.delete(effectiveUid);
      return res.json({ activeMatch: null });
    }

    const activePayload: RankedActiveMatch = {
      matchId: match.matchId,
      startedAt: match.startedAt,
      expiresAt: match.expiresAt,
      durationSeconds: Math.max(0, Math.floor((match.expiresAt - now) / 1000)),
      questions: match.questions.map(sanitizeQuestion),
      isPracticeMode: match.isPracticeMode,
    };

    return res.json({ activeMatch: activePayload });
  });

  // ------------------------------------------
  // POST /api/ranked/start
  // ------------------------------------------
  router.post('/start', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const effectiveUid = user?.uid || (req.body.guestId as string) || `guest_${Date.now()}`;
    const today = getVietnamDateString();
    const attemptKey = `${effectiveUid}:${today}`;
    const currentAttempts = userDailyAttempts.get(attemptKey) || 0;

    const probe = await probeNamedDatabaseAccess();
    const isCloudReady = probe.available;
    const isBankApproved = isQuestionBankApproved;
    const isRankedEligible = isCloudReady && isBankApproved;

    const isPracticeRequested = req.body.isPractice === true || !user || !isRankedEligible;

    // If user attempted a rated match when conditions are not met, enforce practice mode or reject
    if (!isPracticeRequested) {
      if (!isRankedEligible) {
        return res.status(403).json({
          error: 'RANKED_LOCKED',
          message: 'Đấu trường xếp hạng hiện chưa thể cấp điểm RP do Cloud Persistence chưa sẵn sàng hoặc đề thi chưa được duyệt. Vui lòng chọn Đấu Tập (Practice Mode).',
        });
      }
      if (currentAttempts >= 3) {
        return res.status(429).json({
          error: 'DAILY_LIMIT_REACHED',
          message: 'Đại ca đã hoàn thành đủ 3 trận đấu xếp hạng hôm nay. Hãy quay lại vào ngày mai!',
        });
      }
    }

    // Check if user already has an active unexpired match
    const existingMatchId = userActiveMatches.get(effectiveUid);
    if (existingMatchId) {
      const existing = authoritativeMatches.get(existingMatchId);
      if (existing && existing.status === 'active' && Date.now() < existing.expiresAt) {
        const activePayload: RankedActiveMatch = {
          matchId: existing.matchId,
          startedAt: existing.startedAt,
          expiresAt: existing.expiresAt,
          durationSeconds: Math.max(0, Math.floor((existing.expiresAt - Date.now()) / 1000)),
          questions: existing.questions.map(sanitizeQuestion),
          isPracticeMode: existing.isPracticeMode,
        };
        return res.json({ match: activePayload, resumed: true });
      }
    }

    const selectedQuestions = selectAuthoritativeQuestions();
    const matchId = `rm_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const startedAt = Date.now();
    const durationSeconds = 300; // 5 minutes
    const expiresAt = startedAt + durationSeconds * 1000;

    const newMatch: AuthoritativeMatch = {
      matchId,
      userId: effectiveUid,
      startedAt,
      expiresAt,
      status: 'active',
      questions: selectedQuestions,
      isPracticeMode: isPracticeRequested,
    };

    authoritativeMatches.set(matchId, newMatch);
    userActiveMatches.set(effectiveUid, matchId);

    if (!isPracticeRequested) {
      userDailyAttempts.set(attemptKey, currentAttempts + 1);
    }

    const matchPayload: RankedActiveMatch = {
      matchId,
      startedAt,
      expiresAt,
      durationSeconds,
      questions: selectedQuestions.map(sanitizeQuestion),
      isPracticeMode: isPracticeRequested,
    };

    return res.json({ match: matchPayload });
  });

  // ------------------------------------------
  // POST /api/ranked/submit
  // ------------------------------------------
  router.post('/submit', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const { matchId, answers } = req.body;

    if (!matchId || typeof matchId !== 'string') {
      return res.status(400).json({ error: 'INVALID_MATCH_ID', message: 'Mã trận đấu không hợp lệ.' });
    }

    // Double-submission concurrency guard
    if (inFlightSubmissions.has(matchId)) {
      return res.status(429).json({ error: 'IN_FLIGHT', message: 'Trận đấu đang được chấm điểm, vui lòng đợi.' });
    }
    inFlightSubmissions.add(matchId);

    try {
      // 1. Check in-memory match
      const match = authoritativeMatches.get(matchId);
      if (!match) {
        return res.status(404).json({ error: 'MATCH_NOT_FOUND', message: 'Không tìm thấy trận đấu này.' });
      }

      // 2. Strict ownership verification
      const effectiveUid = user?.uid || req.body.guestId;
      if (!effectiveUid || match.userId !== effectiveUid) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Bạn không có quyền nộp bài cho trận đấu của người khác!',
        });
      }

      // 3. Idempotent submission: if already finalized in memory
      if (match.status === 'completed' && match.finalResult) {
        return res.json({ result: match.finalResult, idempotent: true });
      }

      const probe = await probeNamedDatabaseAccess();
      const isCloudReady = probe.available;

      // 4. Cross-instance check in Firestore if cloud persistence is ready
      if (isCloudReady) {
        const existingCloudMatch = await getRankedMatchFromFirestore(matchId);
        if (existingCloudMatch) {
          match.finalResult = existingCloudMatch;
          match.status = 'completed';
          return res.json({ result: existingCloudMatch, idempotent: true });
        }
      }

      const now = Date.now();
      const isTimeout = now > match.expiresAt + 15000;

      // 5. Grade answers server-side
      const userAnswersMap = new Map<string, string>();
      if (Array.isArray(answers)) {
        answers.forEach((ans: RankedUserAnswer) => {
          if (ans && ans.questionId && typeof ans.answer === 'string') {
            userAnswersMap.set(ans.questionId, ans.answer);
          }
        });
      }

      let correctCount = 0;
      const questionResults: RankedQuestionResult[] = match.questions.map((q) => {
        const rawAns = userAnswersMap.get(q.id) || '';
        const { isCorrect, sanitizedAnswer } = gradeQuestion(q, rawAns);
        if (isCorrect) correctCount += 1;

        return {
          questionId: q.id,
          questionText: q.questionText,
          vietnameseContext: q.vietnameseContext,
          type: q.type,
          userAnswer: sanitizedAnswer || '(Chưa trả lời)',
          correctAnswer:
            q.type === 'multiple_choice'
              ? `${q.correctAnswer}. ${q.options?.find((o) => o.key === q.correctAnswer)?.text || ''}`
              : q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const totalQuestions = match.questions.length;
      const accuracy = Math.round((correctCount / totalQuestions) * 100);

      // 6. Get profile & evaluate progression
      const profile = await getUserProfile(match.userId, isCloudReady);
      const previousRp = profile.currentRp;
      const previousRank = getRankFromRP(previousRp);
      const previousRankName = profile.isUnranked ? 'Chưa Xếp Hạng (UNRANKED)' : previousRank.fullName;

      // RP delta
      const rpDelta = calculateRpChange(correctCount);

      // In practice mode or unverified cloud persistence, real RP is not awarded to persistent cloud
      const isPractice = match.isPracticeMode;
      const newRp = isPractice ? previousRp : Math.max(0, previousRp + rpDelta);
      const newRank = getRankFromRP(newRp);

      let rankChangeType: 'promotion' | 'demotion' | 'maintained' = 'maintained';
      if (!isPractice) {
        if (profile.isUnranked) {
          rankChangeType = 'promotion'; // Initial placement promotion
        } else if (
          newRank.tierIndex > previousRank.tierIndex ||
          (newRank.tierIndex === previousRank.tierIndex &&
            newRank.division < previousRank.division &&
            previousRank.division !== '')
        ) {
          rankChangeType = 'promotion';
        } else if (
          newRank.tierIndex < previousRank.tierIndex ||
          (newRank.tierIndex === previousRank.tierIndex &&
            newRank.division > previousRank.division &&
            newRank.division !== '')
        ) {
          rankChangeType = 'demotion';
        }
      }

      // Update profile
      if (!isPractice) {
        profile.isUnranked = false; // Placement complete
        profile.currentRp = newRp;
        profile.tierIndex = newRank.tierIndex;
        profile.tierName = newRank.tierName;
        profile.division = newRank.division;
        profile.fullName = newRank.fullName;
        profile.totalMatches += 1;
        if (newRp > profile.highestRp) profile.highestRp = newRp;
        if (correctCount === 10) profile.perfectMatches += 1;
      }

      // Finalize match
      match.status = isTimeout ? 'expired' : 'completed';
      userActiveMatches.delete(match.userId);

      const matchResult: RankedMatchResult = {
        matchId: match.matchId,
        status: match.status,
        correctAnswers: correctCount,
        totalQuestions,
        accuracy,
        previousRp,
        rpChange: isPractice ? 0 : rpDelta,
        newRp,
        previousRankName,
        newRankName: profile.isUnranked ? 'Chưa Xếp Hạng (UNRANKED)' : newRank.fullName,
        rankChangeType,
        completedAt: now,
        timeSpentSeconds: Math.min(300, Math.floor((now - match.startedAt) / 1000)),
        questionResults,
        isPracticeMode: isPractice,
      };

      match.finalResult = matchResult;

      // Append to memory history
      let history = userMatchHistories.get(match.userId) || [];
      history = [matchResult, ...history].slice(0, 15);
      userMatchHistories.set(match.userId, history);

      // 7. Atomic Cloud Persistence (only if verified)
      if (isCloudReady && !isPractice) {
        await Promise.all([
          saveRankedProfileToFirestore(profile),
          saveRankedMatchToFirestore(matchResult, match.userId),
        ]);
      }

      return res.json({ result: matchResult });
    } finally {
      inFlightSubmissions.delete(matchId);
    }
  });

  // ------------------------------------------
  // POST /api/ranked/abandon
  // ------------------------------------------
  router.post('/abandon', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: 'INVALID_MATCH_ID' });
    }

    const match = authoritativeMatches.get(matchId);
    if (!match) {
      return res.status(404).json({ error: 'MATCH_NOT_FOUND' });
    }

    const effectiveUid = user?.uid || req.body.guestId;
    if (effectiveUid && match.userId !== effectiveUid) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    match.status = 'abandoned';
    userActiveMatches.delete(match.userId);

    const probe = await probeNamedDatabaseAccess();
    const profile = await getUserProfile(match.userId, probe.available);

    const previousRp = profile.currentRp;
    const rpDelta = match.isPracticeMode ? 0 : -10;
    const newRp = Math.max(0, previousRp + rpDelta);
    const newRank = getRankFromRP(newRp);

    if (!match.isPracticeMode) {
      profile.currentRp = newRp;
      profile.tierIndex = newRank.tierIndex;
      profile.tierName = newRank.tierName;
      profile.division = newRank.division;
      profile.fullName = newRank.fullName;
      profile.totalMatches += 1;

      if (probe.available) {
        await saveRankedProfileToFirestore(profile);
      }
    }

    return res.json({
      success: true,
      message: 'Đã hủy trận đấu.',
      previousRp,
      rpDelta,
      newRp,
      newRank: profile.isUnranked ? 'Chưa Xếp Hạng (UNRANKED)' : newRank.fullName,
    });
  });

  // ------------------------------------------
  // GET /api/ranked/history
  // ------------------------------------------
  router.get('/history', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);
    const effectiveUid = user?.uid || (req.query.guestId as string);
    if (!effectiveUid) {
      return res.json({ history: [] });
    }

    const history = userMatchHistories.get(effectiveUid) || [];
    return res.json({ history });
  });

  // ------------------------------------------
  // GET /api/ranked/questions-review (PROTECTED OWNER-ONLY)
  // ------------------------------------------
  router.get('/questions-review', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);

    // Strict authentication & authorization: Only the verified project owner may access question review
    if (!user || !user.isOwner) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Chỉ chủ dự án (Owner: ${OWNER_EMAIL}) mới có quyền truy cập ngân hàng đề thi bảo mật.`,
      });
    }

    const summary = {
      totalQuestions: RANKED_QUESTION_BANK.length,
      multipleChoiceCount: RANKED_QUESTION_BANK.filter((q) => q.type === 'multiple_choice').length,
      typingCount: RANKED_QUESTION_BANK.filter((q) => q.type === 'typing').length,
      easyCount: RANKED_QUESTION_BANK.filter((q) => q.difficulty === 'easy').length,
      mediumCount: RANKED_QUESTION_BANK.filter((q) => q.difficulty === 'medium').length,
      hardCount: RANKED_QUESTION_BANK.filter((q) => q.difficulty === 'hard').length,
      isApprovedByOwner: isQuestionBankApproved,
    };

    return res.json({ summary, questions: RANKED_QUESTION_BANK });
  });

  // ------------------------------------------
  // POST /api/ranked/approve-bank (PROTECTED OWNER-ONLY)
  // ------------------------------------------
  router.post('/approve-bank', async (req: Request, res: Response) => {
    const user = await verifyAuthToken(req);

    if (!user || !user.isOwner) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `Chỉ chủ dự án (${OWNER_EMAIL}) mới có quyền phê duyệt ngân hàng đề thi.`,
      });
    }

    isQuestionBankApproved = true;
    console.log(`[RankedArena] Question bank officially approved by Owner: ${user.email}`);

    return res.json({
      success: true,
      message: 'Ngân hàng 66 câu hỏi đã được Owner phê duyệt chính thức cho Đấu Trường.',
      questionBankApproved: true,
    });
  });

  return router;
}
