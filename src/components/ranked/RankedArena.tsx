import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Swords,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Flame,
  Award,
  ChevronRight,
  HelpCircle,
  Info,
  Lock,
  Copy,
  Check,
  Settings,
  Eye,
} from 'lucide-react';
import {
  RankedActiveMatch,
  RankedMatchResult,
  RankedProfile,
  RankedSanitizedQuestion,
  RankedPreflightStatus,
} from '../../types';
import {
  fetchRankedPreflight,
  fetchRankedProfile,
  fetchActiveRankedMatch,
  startRankedMatch,
  submitRankedMatch,
  abandonRankedMatch,
  fetchRankedHistory,
  fetchQuestionsReview,
  approveQuestionBank,
} from '../../services/rankedApi';
import { getRankFromRP, getDivisionProgress, getNextRank, getRPRequiredForPromotion } from '../../services/rank';
import { getRandomDialogue } from '../../data/dialogues';
import { CapTongBubble } from '../mascot/CapTongBubble';

interface RankedArenaProps {
  user: any;
  onOpenAuth: () => void;
  onOpenRankModal: () => void;
  onGoToLeaderboard?: () => void;
  mascotTone?: 'puppy' | 'cheeky' | 'boss';
}

type ArenaView = 'lobby' | 'match' | 'review' | 'result';

export const RankedArena: React.FC<RankedArenaProps> = ({
  user,
  onOpenAuth,
  onOpenRankModal,
  onGoToLeaderboard,
  mascotTone = 'cheeky',
}) => {
  // Arena state
  const [currentView, setCurrentView] = useState<ArenaView>('lobby');
  const [profile, setProfile] = useState<RankedProfile | null>(null);
  const [preflight, setPreflight] = useState<RankedPreflightStatus | null>(null);
  const [activeMatch, setActiveMatch] = useState<RankedActiveMatch | null>(null);
  const [history, setHistory] = useState<RankedMatchResult[]>([]);
  const [matchResult, setMatchResult] = useState<RankedMatchResult | null>(null);

  // Match interaction state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 mins in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);

  // Diagnostics & Owner state
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [ownerQuestions, setOwnerQuestions] = useState<any[] | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [ownerMsg, setOwnerMsg] = useState<string | null>(null);

  // Mascot dialogue state
  const [mascotBubble, setMascotBubble] = useState<{ text: string; expression: 'happy' | 'smug' | 'confused' | 'idle' }>({
    text: 'Đại ca định gáy bằng thực lực hay bằng niềm tin?',
    expression: 'smug',
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getGuestId = useCallback(() => {
    let gid = localStorage.getItem('capcap_guest_ranked_id');
    if (!gid) {
      gid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('capcap_guest_ranked_id', gid);
    }
    return gid;
  }, []);

  // 1. Initial Load & Recovery
  const loadArenaData = useCallback(async () => {
    try {
      const gid = !user ? getGuestId() : undefined;
      const [preRes, profRes, activeRes, histRes] = await Promise.all([
        fetchRankedPreflight(),
        fetchRankedProfile(gid),
        fetchActiveRankedMatch(gid),
        fetchRankedHistory(gid),
      ]);

      setPreflight(preRes);
      setProfile(profRes.profile);
      setHistory(histRes);

      if (activeRes) {
        setActiveMatch(activeRes);
        setTimeRemaining(activeRes.durationSeconds);
        setCurrentView('match');
        const dialogue = getRandomDialogue('RANKED_START', mascotTone);
        setMascotBubble({ text: dialogue.text, expression: dialogue.expression });
      }
    } catch (err: any) {
      console.error('Error loading arena data:', err);
    }
  }, [user, getGuestId, mascotTone]);

  useEffect(() => {
    loadArenaData();
  }, [loadArenaData]);

  // 2. Countdown Timer
  useEffect(() => {
    if (currentView === 'match' && activeMatch) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentView, activeMatch]);

  // 3. Handle Start Match
  const handleStart = async (isPractice = false) => {
    if (!user && !isPractice) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const gid = !user ? getGuestId() : undefined;
      const match = await startRankedMatch(isPractice, gid);
      setActiveMatch(match);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeRemaining(match.durationSeconds);
      setCurrentView('match');

      const dialogue = getRandomDialogue('RANKED_START', mascotTone);
      setMascotBubble({ text: dialogue.text, expression: dialogue.expression });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể bắt đầu trận đấu.');
      const dialogue = getRandomDialogue('RANKED_SERVER_ERROR', mascotTone);
      setMascotBubble({ text: dialogue.text, expression: dialogue.expression });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Submitting Answer Form
  const handleFinalSubmit = async (isTimeout = false) => {
    if (!activeMatch) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const gid = !user ? getGuestId() : undefined;
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const result = await submitRankedMatch(activeMatch.matchId, formattedAnswers, gid);
      setMatchResult(result);
      setCurrentView('result');

      if (profile) {
        setProfile({
          ...profile,
          currentRp: result.newRp,
          totalMatches: profile.totalMatches + 1,
          todayMatchesCount: profile.todayMatchesCount + (result.isPracticeMode ? 0 : 1),
          isUnranked: result.isPracticeMode ? profile.isUnranked : false,
        });
      }

      loadArenaData();

      let cat: any = 'RANKED_SUCCESS';
      if (isTimeout) {
        cat = 'RANKED_TIMEOUT';
      } else if (result.correctAnswers === 10) {
        cat = 'RANKED_PERFECT';
      } else if (result.rankChangeType === 'promotion') {
        cat = 'RANKED_PROMOTION';
      } else if (result.rankChangeType === 'demotion') {
        cat = 'RANKED_DEMOTION';
      } else if (result.correctAnswers <= 5) {
        cat = 'RANKED_FAILURE';
      }

      const dialogue = getRandomDialogue(cat, mascotTone);
      setMascotBubble({ text: dialogue.text, expression: dialogue.expression });
    } catch (err: any) {
      setErrorMessage(err.message || 'Nộp bài thi đấu thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Abandon Match
  const handleAbandon = async () => {
    if (!activeMatch) return;
    setIsSubmitting(true);
    try {
      const gid = !user ? getGuestId() : undefined;
      await abandonRankedMatch(activeMatch.matchId, gid);
      setActiveMatch(null);
      setCurrentView('lobby');
      setShowAbandonConfirm(false);
      loadArenaData();
      const dialogue = getRandomDialogue('RANKED_FAILURE', mascotTone);
      setMascotBubble({ text: dialogue.text, expression: dialogue.expression });
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể hủy trận đấu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Owner Actions
  const handleLoadOwnerReview = async () => {
    setIsLoadingReview(true);
    try {
      const data = await fetchQuestionsReview();
      setOwnerQuestions(data.questions);
      setOwnerMsg(`Đã tải ${data.summary.totalQuestions} câu hỏi từ ngân hàng server.`);
    } catch (err: any) {
      setOwnerMsg(`Lỗi tải đề thi: ${err.message}`);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleOwnerApprove = async () => {
    setIsApproving(true);
    try {
      const res = await approveQuestionBank();
      setOwnerMsg(res.message);
      loadArenaData();
    } catch (err: any) {
      setOwnerMsg(`Lỗi phê duyệt: ${err.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // UNRANKED Logic: New account has 0 matches
  const isUnranked = profile?.isUnranked ?? (profile?.totalMatches === 0);
  const currentRankDetail = getRankFromRP(profile?.currentRp || 0);
  const divProgress = isUnranked ? 0 : getDivisionProgress(profile?.currentRp || 0);
  const attemptsLeft = Math.max(0, 3 - (profile?.todayMatchesCount || 0));

  const gcloudCommand = `gcloud projects add-iam-policy-binding ${preflight?.targetProject || 'noted-sphinx-9dtd0'} \\
  --member="serviceAccount:${preflight?.serviceAccount || 'ais-sandbox@ais-asia-east1-ad3b2b5ecb484e5.iam.gserviceaccount.com'}" \\
  --role="roles/datastore.user"`;

  // ==========================================
  // VIEW A: LOBBY VIEW
  // ==========================================
  if (currentView === 'lobby') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Top Header & Mascot Dialogue */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚔️</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173B2B] tracking-tight">
                Đấu Trường Cạp Cạp
              </h1>
            </div>
            <p className="text-[#69756D] text-sm mt-1">
              Thử thách từ vựng chuẩn hóa, xác minh điểm rank máy chủ 10 câu trong 5 phút.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition border border-stone-300"
            >
              <Settings className="w-3.5 h-3.5 text-stone-600" />
              <span>Chẩn Đoán Cloud ({preflight?.cloudPersistenceReady ? 'OK' : '403'})</span>
            </button>

            {onGoToLeaderboard && (
              <button
                onClick={onGoToLeaderboard}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#d4eadd] rounded-xl transition border border-[#c1e2cb]"
              >
                <Trophy className="w-4 h-4 text-[#268A59]" />
                <span>Bảng Phong Thần</span>
              </button>
            )}

            <button
              onClick={onOpenRankModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#69756D] bg-white hover:bg-stone-50 rounded-xl transition border border-[#E6EBE6]"
            >
              <Award className="w-4 h-4 text-[#69756D]" />
              <span>Bảng 15 Bậc Rank</span>
            </button>
          </div>
        </div>

        {/* Mascot Bubble */}
        <CapTongBubble
          customText={mascotBubble.text}
          customExpression={mascotBubble.expression}
          tone={mascotTone}
        />

        {/* Granular Security & Persistence Preflight Status Card */}
        <div className="bg-white border border-[#E6EBE6] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-[#173B2B]">
              <ShieldCheck className="w-4 h-4 text-[#268A59]" />
              <span>Trạng Thái Kiểm Tra Đấu Trường (Preflight Status)</span>
            </div>
            <span className="text-[11px] font-mono text-[#69756D]">
              Target DB: {preflight?.targetDatabase || 'ai-studio-cpcp-0520ee62-0383-4b20-b948-cb813c3da19a'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#FAFBF8] border border-[#E6EBE6] p-2.5 rounded-xl">
              <span className="text-[#69756D] block text-[11px]">Đấu Tập (Practice)</span>
              <strong className="text-emerald-700 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng 100%
              </strong>
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] p-2.5 rounded-xl">
              <span className="text-[#69756D] block text-[11px]">Cloud Persistence</span>
              {preflight?.cloudPersistenceReady ? (
                <strong className="text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối Firestore
                </strong>
              ) : (
                <strong className="text-amber-700 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Bị chặn (Thiếu IAM)
                </strong>
              )}
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] p-2.5 rounded-xl">
              <span className="text-[#69756D] block text-[11px]">Ngân Hàng Đề Thi</span>
              {preflight?.questionBankApproved ? (
                <strong className="text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt (66 câu)
                </strong>
              ) : (
                <strong className="text-stone-700 flex items-center gap-1 mt-0.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" /> Chờ Owner duyệt
                </strong>
              )}
            </div>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] p-2.5 rounded-xl">
              <span className="text-[#69756D] block text-[11px]">Rank Thi Đấu Có RP</span>
              {preflight?.rankedReady ? (
                <strong className="text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kích hoạt chính thức
                </strong>
              ) : (
                <strong className="text-rose-700 flex items-center gap-1 mt-0.5">
                  <Lock className="w-3.5 h-3.5" /> Tạm khóa bảo mật
                </strong>
              )}
            </div>
          </div>

          <p className="text-xs text-[#69756D] leading-relaxed pt-1 border-t border-[#F0F4F0]">
            💡 <strong>Chính sách bảo mật:</strong> Hệ thống tuyệt đối <em>không cho phép trình duyệt tự ghi đè RP</em>.
            Khi Cloud Persistence chưa sẵn sàng, Đấu Trường hoạt động ở chế độ Đấu Tập độc lập, giúp đại ca rèn luyện kỹ năng mà không làm sai lệch bảng điểm chuẩn.
          </p>
        </div>

        {/* Collapsible IAM Diagnostics Panel */}
        {showDiagnostics && (
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 space-y-4 shadow-lg text-xs font-mono">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <span className="font-bold text-amber-400">CHẨN ĐOÁN QUYỀN TRUY CẬP FIRESTORE CLOUD RUN</span>
              <button onClick={() => setShowDiagnostics(false)} className="text-stone-400 hover:text-white">✕ Đóng</button>
            </div>

            <div className="space-y-1.5 text-stone-300">
              <div><span className="text-stone-500">Service Account: </span><span className="text-emerald-300 select-all">{preflight?.serviceAccount}</span></div>
              <div><span className="text-stone-500">Target Project: </span><span>{preflight?.targetProject}</span></div>
              <div><span className="text-stone-500">Named Database: </span><span>{preflight?.targetDatabase}</span></div>
              <div><span className="text-stone-500">Required Role: </span><span className="text-amber-300">{preflight?.requiredRole} (Cloud Datastore User)</span></div>
              <div><span className="text-stone-500">Diagnostic Status: </span><span className="text-rose-400">{preflight?.statusReason}</span></div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-stone-400 block">Lệnh gcloud cấp quyền nhanh cho Project Owner:</span>
              <div className="bg-black/60 p-3 rounded-xl border border-stone-700 flex items-center justify-between gap-2 overflow-x-auto">
                <code className="text-[11px] text-amber-200 whitespace-pre">{gcloudCommand}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(gcloudCommand);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2500);
                  }}
                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg shrink-0 flex items-center gap-1 text-[11px]"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Protected Owner Review Portal (Visible only for Owner) */}
        {preflight?.isOwner && (
          <div className="bg-emerald-950 text-white rounded-2xl p-5 space-y-4 border border-emerald-700/60 shadow-md">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Award className="w-4 h-4" />
                <span>Cổng Quản Trị Dự Án (Owner Review Portal: {user?.email})</span>
              </div>
              <span className="text-xs text-emerald-300">
                Trạng thái duyệt: {preflight.questionBankApproved ? '✅ ĐÃ PHÊ DUYỆT' : '⚠️ CHƯA DUYỆT'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLoadOwnerReview}
                disabled={isLoadingReview}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isLoadingReview ? 'Đang tải...' : 'Kiểm tra 66 câu hỏi đề thi'}</span>
              </button>

              {!preflight.questionBankApproved && (
                <button
                  onClick={handleOwnerApprove}
                  disabled={isApproving}
                  className="px-4 py-2 bg-[#268A59] hover:bg-[#2fa76c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isApproving ? 'Đang duyệt...' : 'Phê duyệt chính thức ngân hàng đề'}</span>
                </button>
              )}
            </div>

            {ownerMsg && (
              <p className="text-xs text-amber-200 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/50">
                {ownerMsg}
              </p>
            )}

            {ownerQuestions && (
              <div className="max-h-60 overflow-y-auto space-y-2 pt-2 text-xs border-t border-emerald-800">
                {ownerQuestions.slice(0, 10).map((q: any) => (
                  <div key={q.id} className="p-2.5 bg-emerald-900/40 rounded-lg border border-emerald-800 flex justify-between gap-2">
                    <div>
                      <span className="font-mono text-emerald-400 font-bold">[{q.id}]</span>{' '}
                      <span className="font-semibold">{q.questionText}</span>
                    </div>
                    <span className="text-amber-300 font-mono shrink-0">Đáp án: {q.correctAnswer}</span>
                  </div>
                ))}
                <p className="text-center text-[11px] text-emerald-400">...và {ownerQuestions.length - 10} câu hỏi khác.</p>
              </div>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Grid: Player Card & Challenge Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Player Rank & RP Status (Accurate UNRANKED Handling) */}
          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[#69756D] uppercase tracking-wider mb-3">
                <span>Hạng Hiện Tại</span>
                <span className="font-mono text-[#268A59]">Hệ Thống 15 Bậc</span>
              </div>

              <div className="flex items-center gap-4 my-2">
                <span className="text-5xl">{isUnranked ? '🛡️' : currentRankDetail.badge}</span>
                <div>
                  <h3 className="text-xl font-bold text-[#173B2B]">
                    {isUnranked ? 'Chưa Xếp Hạng' : currentRankDetail.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-black text-[#268A59] font-mono">
                      {isUnranked ? 0 : profile?.currentRp || 0}
                    </span>
                    <span className="text-xs font-semibold text-[#69756D] uppercase">RP</span>
                  </div>
                </div>
              </div>

              {/* Progress to next division */}
              <div className="mt-4 pt-4 border-t border-[#F0F4F0] space-y-2">
                <div className="flex justify-between text-xs font-medium text-[#69756D]">
                  <span>{isUnranked ? 'Trận phân hạng' : 'Tiến trình bậc rank'}</span>
                  <span>{isUnranked ? '0/1 trận' : `${Math.round(divProgress)}%`}</span>
                </div>
                <div className="w-full bg-[#F0F4F0] rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#268A59] h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${divProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#69756D]">
                  {isUnranked ? (
                    'Tài khoản mới bắt đầu ở trạng thái UNRANKED. Hoàn thành 1 trận đấu để nhận bậc rank chính thức!'
                  ) : (
                    <>Cần thêm <strong className="text-[#173B2B]">{getRPRequiredForPromotion(profile?.currentRp || 0)} RP</strong> để thăng hạng tiếp theo ({getNextRank(profile?.currentRp || 0)}).</>
                  )}
                </p>
              </div>
            </div>

            {/* Daily Attempt Status */}
            <div className="mt-6 pt-4 border-t border-[#F0F4F0] flex items-center justify-between text-xs">
              <span className="text-[#69756D]">Lượt leo rank hôm nay:</span>
              <span className="font-bold text-[#173B2B] font-mono">
                {attemptsLeft}/3 lượt còn lại
              </span>
            </div>
          </div>

          {/* Card 2: Challenge Rules & Scoring Table */}
          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#173B2B] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#268A59]" />
              <span>Quy Tắc Đấu Trường</span>
            </h3>

            <ul className="text-xs text-[#69756D] space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#268A59] font-bold">1.</span>
                <span><strong>10 câu hỏi chuẩn hóa:</strong> 6 câu Trắc nghiệm + 4 câu Gõ từ vựng tiếng Anh.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#268A59] font-bold">2.</span>
                <span><strong>Thời gian: 5 phút.</strong> Hết giờ máy chủ sẽ tự động thu bài.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#268A59] font-bold">3.</span>
                <span><strong>Chấm điểm máy chủ:</strong> Khóa đáp án bảo mật, chống gian lận tuyệt đối.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#268A59] font-bold">4.</span>
                <span><strong>Tối đa 3 trận xếp hạng / ngày</strong> (theo giờ Việt Nam UTC+7).</span>
              </li>
            </ul>

            <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl p-3 text-xs space-y-1.5 font-mono">
              <div className="font-bold text-[#173B2B] font-sans pb-1 border-b border-[#E6EBE6]">Bảng thưởng phạt RP:</div>
              <div className="flex justify-between text-emerald-700"><span>10/10 câu đúng</span><span className="font-bold">+25 RP</span></div>
              <div className="flex justify-between text-emerald-600"><span>8 – 9 câu đúng</span><span className="font-bold">+18 RP</span></div>
              <div className="flex justify-between text-emerald-500"><span>6 – 7 câu đúng</span><span className="font-bold">+8 RP</span></div>
              <div className="flex justify-between text-amber-700"><span>4 – 5 câu đúng</span><span className="font-bold">-5 RP</span></div>
              <div className="flex justify-between text-red-600"><span>0 – 3 câu đúng</span><span className="font-bold">-10 RP</span></div>
            </div>
          </div>

          {/* Card 3: Action & Arena Entry */}
          <div className="bg-[#173B2B] text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-700/50">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Mùa Giải Đấu Trường</span>
              </div>
              <h3 className="text-xl font-black tracking-tight leading-snug">
                Đại ca có thực lực hay chỉ được cái gáy?
              </h3>
              <p className="text-emerald-200/80 text-xs mt-2 leading-relaxed">
                10 câu hỏi từ vựng từ dễ đến nâng cao đang chờ đợi. Thử sức ngay với chế độ Đấu Tập hoặc Đấu Trường chính thức.
              </p>
            </div>

            <div className="space-y-3 mt-6">
              {/* Practice Mode Button: Always Active and Encouraged */}
              <button
                onClick={() => handleStart(true)}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-[#268A59] hover:bg-[#2fa76c] active:bg-[#1f734a] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Swords className="w-4 h-4" />
                <span>Vào Đấu Tập (Practice Mode)</span>
              </button>

              {/* Ranked Button: Clearly Locked if Preflight Not Ready */}
              {preflight?.rankedReady ? (
                attemptsLeft > 0 ? (
                  <button
                    onClick={() => handleStart(false)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-emerald-900/90 hover:bg-emerald-800 text-white font-semibold rounded-xl transition text-xs border border-emerald-600/60 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Thi Đấu Xếp Hạng ({attemptsLeft}/3 lượt)</span>
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-amber-300 bg-emerald-900/80 rounded-xl border border-emerald-700/50 font-medium">
                    Đã hết lượt leo rank hôm nay (3/3).
                  </div>
                )
              ) : (
                <div className="p-2.5 bg-black/40 border border-amber-500/40 rounded-xl text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-amber-300 text-xs font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Rank Có RP Tạm Khóa</span>
                  </div>
                  <p className="text-[10px] text-stone-300">
                    Cần cấp quyền IAM <code className="text-amber-200">roles/datastore.user</code> để lưu RP vĩnh viễn lên Firestore.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Matches History Table */}
        {history.length > 0 && (
          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#173B2B] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#268A59]" />
              <span>Lịch Sử Đấu Gần Đây</span>
            </h3>

            <div className="divide-y divide-[#F0F4F0] text-xs">
              {history.slice(0, 5).map((match, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[#69756D]">
                      {new Date(match.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-semibold text-[#173B2B]">
                      Đúng {match.correctAnswers}/10 câu ({match.accuracy}%)
                    </span>
                    {match.isPracticeMode && (
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded text-[10px] font-medium">
                        Đấu Tập
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold ${
                        match.rpChange > 0
                          ? 'text-emerald-600'
                          : match.rpChange < 0
                          ? 'text-red-500'
                          : 'text-stone-500'
                      }`}
                    >
                      {match.rpChange > 0 ? `+${match.rpChange}` : match.rpChange} RP
                    </span>
                    <span className="text-[#69756D] font-medium">{match.newRankName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW B: DURING THE MATCH (10 QUESTIONS)
  // ==========================================
  if (currentView === 'match' && activeMatch) {
    const currentQ = activeMatch.questions[currentQuestionIndex];
    const userCurrentAns = answers[currentQ.id] || '';
    const answeredCount = Object.keys(answers).length;
    const isUrgent = timeRemaining < 60;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Match Header with Countdown & Abandon */}
        <div className="bg-white border border-[#E6EBE6] rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚔️</span>
            <div>
              <span className="text-xs font-semibold text-[#69756D] uppercase">
                {activeMatch.isPracticeMode ? 'Đấu Tập Thử Nghiệm' : 'Đấu Trường Xếp Hạng'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#173B2B]">
                Câu {currentQuestionIndex + 1} / {activeMatch.questions.length}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Authoritative Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm sm:text-base font-bold transition-colors ${
                isUrgent
                  ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                  : 'bg-[#E5F3E9] text-[#173B2B] border border-[#c1e2cb]'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>{formatTimer(timeRemaining)}</span>
            </div>

            <button
              onClick={() => setShowAbandonConfirm(true)}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-2 py-1"
            >
              Bỏ cuộc
            </button>
          </div>
        </div>

        {/* Navigation Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
          {activeMatch.questions.map((q, idx) => {
            const hasAns = !!answers[q.id];
            const isCurr = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center ${
                  isCurr
                    ? 'bg-[#173B2B] text-white ring-2 ring-[#268A59] ring-offset-2 scale-105'
                    : hasAns
                    ? 'bg-[#E5F3E9] text-[#173B2B] border border-[#c1e2cb]'
                    : 'bg-white text-[#69756D] border border-[#E6EBE6] hover:bg-stone-50'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                currentQ.difficulty === 'easy'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : currentQ.difficulty === 'medium'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              Độ khó: {currentQ.difficulty === 'easy' ? 'Cơ bản' : currentQ.difficulty === 'medium' ? 'Trung cấp' : 'Nâng cao'}
            </span>

            <span className="text-xs font-medium text-[#69756D]">
              Loại: {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm 4 lựa chọn' : 'Gõ từ tiếng Anh'}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-[#173B2B] leading-snug">
              {currentQ.questionText}
            </h3>
            {currentQ.vietnameseContext && (
              <p className="text-sm text-[#69756D] bg-[#FAFBF8] p-3 rounded-xl border border-[#F0F4F0]">
                💡 {currentQ.vietnameseContext}
              </p>
            )}
          </div>

          {/* ANSWER INPUT: TYPE 1 - MULTIPLE CHOICE */}
          {currentQ.type === 'multiple_choice' && currentQ.options && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              {currentQ.options.map((opt) => {
                const isSelected = userCurrentAns === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.key }));
                    }}
                    className={`p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-[#E5F3E9] text-[#173B2B] border-[#268A59] shadow-xs ring-1 ring-[#268A59]'
                        : 'bg-white text-[#1D2420] border-[#E6EBE6] hover:bg-[#FAFBF8] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          isSelected ? 'bg-[#268A59] text-white' : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#268A59] bg-[#268A59]' : 'border-stone-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ANSWER INPUT: TYPE 2 - TYPING CHALLENGE */}
          {currentQ.type === 'typing' && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 text-xs text-[#69756D]">
                <span className="font-semibold text-[#173B2B]">Từ loại:</span>
                <span className="px-2 py-0.5 rounded bg-stone-100 font-mono text-stone-800">
                  {currentQ.partOfSpeech || 'N/A'}
                </span>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="Nhập từ tiếng Anh chính xác..."
                value={userCurrentAns}
                onChange={(e) => {
                  const val = e.target.value;
                  setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (currentQuestionIndex < activeMatch.questions.length - 1) {
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                    }
                  }
                }}
                className="w-full px-4 py-3 text-base font-mono font-semibold rounded-xl border border-[#E6EBE6] focus:outline-hidden focus:border-[#268A59] focus:ring-2 focus:ring-[#268A59]/20 transition bg-[#FAFBF8]"
              />
              <p className="text-[11px] text-[#69756D]">
                Gõ đúng chính tả (không phân biệt hoa/thường). Nhấn Enter để sang câu tiếp theo.
              </p>
            </div>
          )}
        </div>

        {/* Navigation & Submission Footer Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-xs font-semibold text-[#69756D] hover:text-[#173B2B] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Câu trước</span>
          </button>

          <div className="flex items-center gap-3">
            {currentQuestionIndex < activeMatch.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2.5 bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#268A59] hover:bg-[#2fa76c] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Nộp bài thi ({answeredCount}/10)</span>
              </button>
            )}
          </div>
        </div>

        {/* Abandon Confirmation Modal */}
        {showAbandonConfirm && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-stone-200">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-bold text-base text-stone-900">Xác nhận bỏ cuộc?</h4>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Đại ca chắc chắn muốn đầu hàng? Bỏ cuộc sẽ bị trừ <strong>10 RP</strong> và vẫn tiêu tốn 1 lượt đấu hôm nay!
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setShowAbandonConfirm(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                >
                  Ở lại thi đấu
                </button>
                <button
                  onClick={handleAbandon}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                >
                  Đầu hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW C: COMPLETION & RESULT SCREEN
  // ==========================================
  if (currentView === 'result' && matchResult) {
    const isPromoted = matchResult.rankChangeType === 'promotion';
    const isDemoted = matchResult.rankChangeType === 'demotion';

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-4xl">
            {matchResult.correctAnswers >= 8 ? '🎉' : matchResult.correctAnswers >= 5 ? '⚡' : '💥'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#173B2B] tracking-tight">
            Kết Quả Đấu Trường
          </h2>
          <p className="text-xs sm:text-sm text-[#69756D]">
            Bài thi đã được máy chủ chấm điểm độc lập và xác minh kết quả.
          </p>
        </div>

        <CapTongBubble
          customText={mascotBubble.text}
          customExpression={mascotBubble.expression}
          tone={mascotTone}
        />

        {/* Main Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-5 shadow-xs text-center">
            <span className="text-xs font-semibold text-[#69756D] uppercase">Số câu đúng</span>
            <div className="text-3xl font-black text-[#173B2B] font-mono mt-1">
              {matchResult.correctAnswers} / {matchResult.totalQuestions}
            </div>
            <span className="text-xs text-[#268A59] font-medium">Độ chính xác {matchResult.accuracy}%</span>
          </div>

          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-5 shadow-xs text-center">
            <span className="text-xs font-semibold text-[#69756D] uppercase">Điểm Rank (RP)</span>
            <div
              className={`text-3xl font-black font-mono mt-1 ${
                matchResult.rpChange > 0
                  ? 'text-emerald-600'
                  : matchResult.rpChange < 0
                  ? 'text-red-500'
                  : 'text-stone-700'
              }`}
            >
              {matchResult.isPracticeMode ? '+0 RP (Đấu Tập)' : `${matchResult.rpChange > 0 ? `+${matchResult.rpChange}` : matchResult.rpChange} RP`}
            </div>
            <span className="text-xs text-[#69756D]">
              {matchResult.isPracticeMode ? (
                'Chế độ Đấu Tập không ảnh hưởng RP chính thức'
              ) : (
                <>Điểm mới: <strong className="font-mono text-[#173B2B]">{matchResult.newRp} RP</strong></>
              )}
            </span>
          </div>

          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-5 shadow-xs text-center">
            <span className="text-xs font-semibold text-[#69756D] uppercase">Hạng đấu</span>
            <div className="text-xl font-bold text-[#173B2B] mt-2">
              {matchResult.newRankName}
            </div>
            {isPromoted && !matchResult.isPracticeMode && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 animate-bounce">
                🎉 Thăng Hạng!
              </span>
            )}
            {isDemoted && !matchResult.isPracticeMode && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                📉 Tụt Hạng!
              </span>
            )}
            {!isPromoted && !isDemoted && (
              <span className="text-xs text-[#69756D]">Giữ vững phong độ</span>
            )}
          </div>
        </div>

        {/* Detailed Question Review Breakdown */}
        <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#173B2B] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#268A59]" />
              <span>Chi Tiết Đáp Án & Giải Thích Của Máy Chủ</span>
            </span>
            <span className="text-xs font-normal text-[#69756D]">10 câu hỏi</span>
          </h3>

          <div className="space-y-3 pt-2">
            {matchResult.questionResults.map((qr, idx) => (
              <div
                key={qr.questionId}
                className={`p-4 rounded-xl border transition-all text-xs space-y-2 ${
                  qr.isCorrect
                    ? 'bg-emerald-50/40 border-emerald-200'
                    : 'bg-red-50/40 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        qr.isCorrect ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <strong className="text-sm text-[#173B2B]">{qr.questionText}</strong>
                  </div>

                  <span
                    className={`font-semibold shrink-0 ${
                      qr.isCorrect ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {qr.isCorrect ? 'Chính xác' : 'Sai'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 font-mono">
                  <div>
                    <span className="text-[#69756D]">Câu trả lời của đại ca: </span>
                    <strong className={qr.isCorrect ? 'text-emerald-800' : 'text-red-700'}>
                      {qr.userAnswer}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#69756D]">Đáp án đúng: </span>
                    <strong className="text-emerald-900">{qr.correctAnswer}</strong>
                  </div>
                </div>

                <p className="text-stone-600 text-[11px] leading-relaxed pt-1 border-t border-stone-200/50">
                  📖 {qr.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setCurrentView('lobby')}
            className="px-6 py-3 bg-[#173B2B] hover:bg-[#268A59] text-white font-bold rounded-xl text-sm transition shadow-md flex items-center gap-2"
          >
            <span>Về Sảnh Đấu Trường</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
};
