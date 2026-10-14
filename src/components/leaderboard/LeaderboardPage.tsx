import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Trophy,
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  Flame,
  Star,
  RefreshCw,
  Lock,
  WifiOff,
  AlertCircle,
  Users,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { LeaderboardEntry, MascotTone } from '../../types';
import { getLeaderboardEntries } from '../../data/leaderboardDemo';
import { LeaderboardPodium } from './LeaderboardPodium';
import { PlayerProfileModal } from './PlayerProfileModal';
import { CapTongBubble } from '../mascot/CapTongBubble';
import { getRankFromXP } from '../../services/rank';
import {
  fetchPublicLeaderboardEntries,
  LeaderboardError,
} from '../../services/publicLeaderboard';

interface LeaderboardPageProps {
  user: any;
  userProfile: any;
  totalXp: number;
  streakDays: number;
  mascotTone?: MascotTone;
  onOpenRankModal: () => void;
  onGoToArena: () => void;
  onToggleShareLeaderboard?: (enabled: boolean) => Promise<void>;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

type ViewMode = 'real' | 'demo';
type FetchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'permission_denied' | 'network_error' | 'guest';

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  user,
  userProfile,
  totalXp = 0,
  streakDays = 0,
  mascotTone = 'cheeky',
  onOpenRankModal,
  onGoToArena,
  onToggleShareLeaderboard,
  onOpenProfile,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'xp' | 'streak'>('xp');
  const [viewMode, setViewMode] = useState<ViewMode>('real');
  const [realEntries, setRealEntries] = useState<LeaderboardEntry[]>([]);
  const [demoEntries, setDemoEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Load real public learning statistics from Firestore
  const loadRealData = useCallback(async () => {
    if (!user) {
      setStatus('guest');
      setRealEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const items = await fetchPublicLeaderboardEntries(activeTab, user.uid);
      setRealEntries(items);
      setLastRefreshedAt(Date.now());
      if (items.length === 0) {
        setStatus('empty');
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      console.warn('Error loading public leaderboard from Firestore:', err);
      if (err instanceof LeaderboardError) {
        if (err.code === 'permission_denied') {
          setStatus('permission_denied');
          setErrorMessage(err.message);
        } else if (err.code === 'network_error') {
          setStatus('network_error');
          setErrorMessage(err.message);
        } else if (err.code === 'unauthenticated') {
          setStatus('guest');
          setErrorMessage(err.message);
        } else {
          setStatus('network_error');
          setErrorMessage(err.message);
        }
      } else {
        setStatus('network_error');
        setErrorMessage('Không thể kết nối đến máy chủ Firestore. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab]);

  // Load demo entries when demo mode is active
  const loadDemoData = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getLeaderboardEntries(activeTab);
      setDemoEntries(list);
    } catch (e) {
      console.warn('Error loading demo leaderboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Trigger load on tab, mode, or user change
  useEffect(() => {
    if (viewMode === 'real') {
      loadRealData();
    } else {
      loadDemoData();
    }
  }, [viewMode, activeTab, user, loadRealData, loadDemoData]);

  // Current active list: STRICTLY REAL when viewMode is 'real', STRICTLY DEMO when viewMode is 'demo'
  // NEVER mix demo players into the real leaderboard!
  const activeEntries = useMemo(() => {
    return viewMode === 'real' ? realEntries : demoEntries;
  }, [viewMode, realEntries, demoEntries]);

  // Current user's real XP rank info
  const myRankInfo = useMemo(() => getRankFromXP(totalXp), [totalXp]);

  // Current user's rank position in the REAL leaderboard (if participating)
  const myRealRankPosition = useMemo(() => {
    if (!user || !userProfile?.shareLeaderboard || realEntries.length === 0) return null;
    const found = realEntries.find((e) => e.id === user.uid);
    return found ? found.rankPosition : null;
  }, [user, userProfile?.shareLeaderboard, realEntries]);

  // Top 3 for podium
  const topThree = useMemo(() => activeEntries.slice(0, 3), [activeEntries]);

  // Filtered remaining players (Ranks 4+)
  const filteredRemaining = useMemo(() => {
    return activeEntries.slice(3).filter((player) => {
      const matchSearch = player.nickname.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchTier = tierFilter === 'all' || player.tierName === tierFilter;
      return matchSearch && matchTier;
    });
  }, [activeEntries, searchQuery, tierFilter]);

  // Available unique tiers for filter
  const availableTiers = useMemo(() => {
    const set = new Set(activeEntries.map((p) => p.tierName));
    return Array.from(set);
  }, [activeEntries]);

  // Formatted last refreshed time string
  const formattedRefreshedTime = useMemo(() => {
    if (!lastRefreshedAt) return null;
    const d = new Date(lastRefreshedAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }, [lastRefreshedAt]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173B2B] tracking-tight">
              Bảng Phong Thần
            </h1>
          </div>
          <p className="text-[#69756D] text-sm mt-1">
            Bảng vàng thi đua học tập cùng hội bạn — So tài Nọc XP và chuỗi ngày kiên trì.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRankModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#d4eadd] rounded-xl transition border border-[#c1e2cb] shrink-0 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-[#268A59]" />
            <span>Tra cứu 15 Bậc Rank</span>
          </button>
        </div>
      </div>

      {/* 2. Cạp Tổng Mascot Dialogue */}
      <CapTongBubble category="LEADERBOARD_OPEN" tone={mascotTone} />

      {/* 3. Controls Bar: Tab A (XP) vs Tab B (Streak) + Mode Toggle + Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-[#E6EBE6] shadow-2xs">
        {/* Metric Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('xp')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'xp'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B] bg-[#FAFBF8]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Bảng XP (Nọc XP)</span>
          </button>

          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'streak'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B] bg-[#FAFBF8]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Bảng Streak (Chuỗi Ngày)</span>
          </button>
        </div>

        {/* View Mode & Refresh */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          {formattedRefreshedTime && viewMode === 'real' && (
            <span className="text-[11px] text-[#69756D] hidden md:inline font-mono">
              Cập nhật: {formattedRefreshedTime}
            </span>
          )}

          {viewMode === 'real' ? (
            <>
              <button
                onClick={() => loadRealData()}
                disabled={isLoading || !user}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#173B2B] bg-[#FAFBF8] hover:bg-[#F0F4F0] border border-[#E6EBE6] font-semibold transition disabled:opacity-50 cursor-pointer"
                title="Tải lại dữ liệu Bảng Phong Thần"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#268A59] ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>

              <button
                onClick={() => setViewMode('demo')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] border border-transparent font-medium transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem bản demo</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-md text-[11px]">
                ĐANG XEM BẢN DEMO
              </span>
              <button
                onClick={() => setViewMode('real')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white bg-[#268A59] hover:bg-[#1f7048] font-bold transition shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quay lại Bảng Thật</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Current User Personal Status Card (Real Data) */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#173B2B] text-white border border-emerald-700/60 rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-7xl opacity-20 pointer-events-none">🦖</div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl shrink-0 shadow-xs">
              {myRankInfo.badge}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Tài khoản của đại ca (Thật)
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                  {myRankInfo.fullName}
                </span>
              </div>

              <h3 className="text-xl font-black text-white">
                {user ? (userProfile?.publicNickname || user.displayName || 'Đại ca') : 'Đại ca (Khách)'}
              </h3>

              <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs text-emerald-200">
                <span>⭐ Tổng Nọc XP: <strong className="text-amber-300 font-mono font-bold">+{totalXp} XP</strong></span>
                <span>·</span>
                <span>🔥 Chuỗi ngày: <strong className="text-amber-300 font-mono font-bold">{streakDays} ngày</strong></span>
                <span>·</span>
                <span>Cấp bậc: <strong className="text-amber-300 font-bold">{myRankInfo.fullName}</strong></span>
              </div>

              {/* Opt-in Public Leaderboard Status & Position Indicator */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {user ? (
                  <div className="flex flex-wrap items-center gap-2.5">
                    {userProfile?.shareLeaderboard ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 border border-emerald-400/40 text-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        {myRealRankPosition ? (
                          <span>Đại ca đang ở Hạng #{myRealRankPosition} trên BXH Hội Bạn! 🌟</span>
                        ) : (
                          <span>Đã bật hiển thị trên Bảng Phong Thần</span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-white/80">
                        ⚪ Chưa tham gia BXH (Chưa bật chia sẻ)
                      </span>
                    )}

                    {onToggleShareLeaderboard && (
                      <button
                        type="button"
                        disabled={toggleLoading}
                        onClick={async () => {
                          setToggleLoading(true);
                          try {
                            await onToggleShareLeaderboard(!userProfile?.shareLeaderboard);
                            // Refresh leaderboard after toggle
                            await loadRealData();
                          } catch (e) {
                            // error is handled in toast
                          } finally {
                            setToggleLoading(false);
                          }
                        }}
                        className="text-xs font-bold underline text-amber-300 hover:text-amber-200 cursor-pointer disabled:opacity-50"
                      >
                        {userProfile?.shareLeaderboard ? 'Tắt chia sẻ' : 'Bật hiển thị công khai ngay'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-200">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Khách chưa thể chia sẻ thành tích và xem BXH bạn bè.</span>
                    </span>
                    {onOpenAuth && (
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="underline text-amber-300 hover:text-amber-200 font-bold cursor-pointer"
                      >
                        Đăng nhập ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onOpenRankModal}
            className="w-full sm:w-auto px-5 py-3 bg-amber-400 hover:bg-amber-500 text-stone-900 text-xs font-black rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>Xem Chi Tiết Cấp Bậc</span>
          </button>
        </div>
      </div>

      {/* 5. Main Leaderboard Content Based on State */}

      {/* STATE A: Guest User (Real Mode) */}
      {viewMode === 'real' && status === 'guest' && !user && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 text-2xl">
            🔒
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-extrabold text-amber-950">
              Đăng nhập để xem Bảng Phong Thần Hội Bạn
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Bảng xếp hạng bạn bè chỉ hiển thị cho các tài khoản đã đăng nhập. Đăng nhập để chia sẻ tiến độ học tập và cùng đua top với nhóm bạn thân!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-xl bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setViewMode('demo')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-bold transition cursor-pointer"
            >
              Xem bản demo mẫu
            </button>
          </div>
        </div>
      )}

      {/* STATE B: Permission Denied Error */}
      {viewMode === 'real' && status === 'permission_denied' && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-extrabold text-rose-950">
              Không thể truy cập Bảng Phong Thần
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed">
              {errorMessage || 'Tài khoản của bạn chưa được cấp quyền truy cập hoặc phiên đăng nhập đã hết hạn.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => loadRealData()}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Thử lại
            </button>
            <button
              onClick={() => setViewMode('demo')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-300 text-rose-900 text-xs font-semibold transition cursor-pointer"
            >
              Xem bản demo
            </button>
          </div>
        </div>
      )}

      {/* STATE C: Network Failure Error */}
      {viewMode === 'real' && status === 'network_error' && (
        <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-200 flex items-center justify-center text-stone-700">
            <WifiOff className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-extrabold text-stone-900">
              Mất kết nối mạng
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {errorMessage || 'Không thể kết nối đến máy chủ Firestore để tải bảng xếp hạng hội bạn. Vui lòng kiểm tra đường truyền.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => loadRealData()}
              className="px-4 py-2 rounded-xl bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold transition cursor-pointer"
            >
              Thử lại
            </button>
            <button
              onClick={() => setViewMode('demo')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold transition cursor-pointer"
            >
              Xem bản demo
            </button>
          </div>
        </div>
      )}

      {/* STATE D: Loading */}
      {isLoading && (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block p-3 rounded-full bg-[#E5F3E9] text-[#268A59]">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-xs font-bold text-[#173B2B]">
            Đang tải dữ liệu Bảng Phong Thần...
          </p>
        </div>
      )}

      {/* STATE E: Empty State (Real Mode, user is logged in, but 0 users have opted in) */}
      {!isLoading && viewMode === 'real' && status === 'empty' && (
        <div className="bg-white border border-[#E6EBE6] rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#E5F3E9] flex items-center justify-center text-3xl">
            🐣
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-[#173B2B]">
              Chưa có chiến hữu nào bật chia sẻ thành tích
            </h3>
            <p className="text-xs text-[#69756D] leading-relaxed">
              Bảng Phong Thần hoàn toàn bảo mật và chỉ hiển thị những ai đồng ý chia sẻ tiến độ học tập. Hãy là người mở bát đầu tiên để các chiến hữu khác cùng noi gương!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            {user && !userProfile?.shareLeaderboard && onToggleShareLeaderboard && (
              <button
                type="button"
                disabled={toggleLoading}
                onClick={async () => {
                  setToggleLoading(true);
                  try {
                    await onToggleShareLeaderboard(true);
                    await loadRealData();
                  } catch (e) {
                    // handled
                  } finally {
                    setToggleLoading(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#268A59] hover:bg-[#1f7048] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Bật hiển thị công khai ngay
              </button>
            )}

            <button
              onClick={() => loadRealData()}
              className="px-4 py-2.5 rounded-xl bg-[#FAFBF8] hover:bg-[#F0F4F0] border border-[#E6EBE6] text-[#173B2B] text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#268A59]" />
              <span>Làm mới dữ liệu</span>
            </button>

            <button
              onClick={() => setViewMode('demo')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-[#69756D] text-xs font-semibold transition cursor-pointer"
            >
              Xem bản demo mẫu
            </button>
          </div>
        </div>
      )}

      {/* STATE F: Active Leaderboard (Real with 1+ users, OR Demo) */}
      {!isLoading && (viewMode === 'demo' || (viewMode === 'real' && status === 'success' && activeEntries.length > 0)) && (
        <>
          {/* Status / Notice Banner */}
          <div className={`rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs border ${
            viewMode === 'demo'
              ? 'bg-amber-50 border-amber-200/90 text-amber-900'
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
          }`}>
            {viewMode === 'demo' ? (
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#268A59] shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-md text-[11px] ${
                  viewMode === 'demo'
                    ? 'bg-amber-200/80 text-amber-950'
                    : 'bg-emerald-200/80 text-emerald-900'
                }`}>
                  {viewMode === 'demo'
                    ? 'DỮ LIỆU DEMO MINH HỌA'
                    : `BẢNG PHONG THẦN THẬT · ${activeEntries.length} THÀNH VIÊN`}
                </span>
                <span className="font-bold">
                  {viewMode === 'demo' ? 'Chiến hữu mẫu' : 'Hội bạn bè Cạp Cạp'}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${viewMode === 'demo' ? 'text-amber-800' : 'text-emerald-800'}`}>
                {viewMode === 'demo'
                  ? 'Đây là các tài khoản giả lập để bạn xem thử giao diện. Dữ liệu này hoàn toàn tách biệt và không ảnh hưởng đến số liệu thật.'
                  : 'Bảng xếp hạng hiển thị những chiến hữu đã tự nguyện bật chia sẻ thành tích. Dữ liệu được tính từ Nọc XP và chuỗi ngày học thực tế.'}
              </p>
            </div>
          </div>

          {/* Top 3 Podium (Renders gracefully for 1, 2, or 3+ players) */}
          {topThree.length > 0 && (
            <LeaderboardPodium
              topThree={topThree}
              activeTab={activeTab}
              onSelectPlayer={(player) => setSelectedPlayer(player)}
            />
          )}

          {/* Ranking Table ("BXH Hội Bạn") */}
          <div className="bg-white border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F4F0] pb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#173B2B] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#268A59]" />
                  <span>
                    BXH Hội Bạn ({activeTab === 'xp' ? 'Theo Nọc XP' : 'Theo Chuỗi Streak'})
                  </span>
                </h2>
                <p className="text-xs text-[#69756D] mt-0.5">
                  {activeEntries.length > 3
                    ? 'Từ hạng 4 trở xuống trong danh sách chiến hữu'
                    : `Toàn bộ ${activeEntries.length} thành viên đang tham gia`}
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-[#69756D] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm biệt danh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E6EBE6] bg-[#FAFBF8] focus:outline-hidden focus:border-[#268A59] w-full sm:w-48 transition"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#69756D]" />
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="text-xs py-2 px-2.5 rounded-xl border border-[#E6EBE6] bg-[#FAFBF8] focus:outline-hidden focus:border-[#268A59] transition text-[#173B2B] font-medium cursor-pointer"
                  >
                    <option value="all">Tất cả bậc rank</option>
                    {availableTiers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Players List */}
            {activeEntries.length <= 3 ? (
              <div className="py-8 text-center text-xs text-[#69756D] space-y-2">
                <p className="font-semibold text-[#173B2B]">
                  Tất cả {activeEntries.length} thành viên đang tham gia đã có mặt trên Bục Vinh Quang Top 3 phía trên! 🌟
                </p>
                <p className="text-[11px] text-[#69756D]">
                  Hãy rủ thêm bạn bè cùng học để bảng xếp hạng thêm sôi động nhé.
                </p>
              </div>
            ) : filteredRemaining.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#69756D] space-y-1">
                <p>Không tìm thấy thành viên nào khớp với bộ lọc.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTierFilter('all');
                  }}
                  className="text-[#268A59] font-semibold hover:underline cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#F0F4F0]">
                {filteredRemaining.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="py-3.5 px-3 rounded-2xl hover:bg-[#FAFBF8] transition flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    {/* Left: Position, Avatar, Name */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-7 text-center font-mono font-black text-xs sm:text-sm text-[#69756D] group-hover:text-[#173B2B]">
                        #{player.rankPosition}
                      </span>

                      <div className="relative shrink-0">
                        <img
                          src={player.avatarUrl}
                          alt={player.nickname}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-stone-100 object-cover border border-[#E6EBE6]"
                        />
                        <span className="absolute -bottom-1 -right-1 text-sm">
                          {player.badge}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-[#173B2B] truncate group-hover:text-[#268A59] transition">
                            {player.nickname}
                          </h4>
                          {player.isDemo ? (
                            <span className="text-[9px] font-bold bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-md">
                              DEMO
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              🌟 BẠN BÈ THẬT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#69756D] truncate">
                          {player.fullName}
                        </p>
                      </div>
                    </div>

                    {/* Right: Score (XP or Streak) and Action */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black font-mono text-[#173B2B]">
                          {activeTab === 'xp' ? (
                            <>
                              +{player.xp} XP
                              <div className="text-[10px] text-[#69756D] font-normal">{player.streakDays} ngày 🔥</div>
                            </>
                          ) : (
                            <>
                              {player.streakDays} ngày 🔥
                              <div className="text-[10px] text-[#69756D] font-normal">+{player.xp} XP</div>
                            </>
                          )}
                        </div>
                        <span className="text-[10px] text-[#69756D]">
                          {player.tierName}
                        </span>
                      </div>

                      <span className="text-xs text-[#268A59] font-bold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                        Xem hồ sơ ➔
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footnote on client synchronization */}
            <div className="pt-2 border-t border-[#F0F4F0] text-[11px] text-[#69756D] flex items-center justify-between flex-wrap gap-2">
              <span>
                💡 Chuỗi ngày (Streak) và Nọc XP được đồng bộ từ client mỗi khi người học hoàn thành bài học.
              </span>
              {viewMode === 'real' && formattedRefreshedTime && (
                <span className="font-mono text-[10px]">
                  Lần tải cuối: {formattedRefreshedTime}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* 6. Player Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
};

