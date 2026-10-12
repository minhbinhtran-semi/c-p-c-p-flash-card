import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Search,
  Filter,
  Sparkles,
  Flame,
  BookOpen,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import type { LeaderboardEntry, MascotTone } from '../../types';
import { getLeaderboardEntries } from '../../data/leaderboardDemo';
import { getRankFromXP, getRankProgressInfo } from '../../services/rank';
import { LeaderboardPodium } from './LeaderboardPodium';
import { PlayerProfileModal } from './PlayerProfileModal';
import { CapTongBubble } from '../mascot/CapTongBubble';

interface LeaderboardPageProps {
  user: any;
  userProfile: any;
  totalXp?: number;
  streakDays?: number;
  mascotTone?: MascotTone;
  onOpenRankModal: () => void;
  onGoToStudy?: () => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  user,
  userProfile,
  totalXp = 0,
  streakDays = 1,
  mascotTone = 'cheeky',
  onOpenRankModal,
  onGoToStudy,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // User's own rank info
  const userRankInfo = useMemo(() => getRankFromXP(totalXp), [totalXp]);
  const userProgress = useMemo(() => getRankProgressInfo(totalXp), [totalXp]);

  useEffect(() => {
    getLeaderboardEntries().then((data) => {
      // Build a unified leaderboard that cleanly includes the active user in their true rank position
      const userEntry: LeaderboardEntry = {
        id: user?.uid || 'current_user',
        rankPosition: 0, // will compute after sorting
        nickname: userProfile?.publicNickname || (user ? 'Đại ca' : 'Đại ca (Bạn)'),
        avatarUrl: userProfile?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=CurrentUser&backgroundColor=c0aede',
        xp: totalXp,
        rp: totalXp,
        streakDays: streakDays,
        wordsLearned: 0,
        tierIndex: userRankInfo.tierIndex,
        tierName: userRankInfo.tierName,
        division: userRankInfo.division,
        fullName: userRankInfo.fullName,
        badge: userRankInfo.badge,
        color: userRankInfo.color,
        quote: 'Học từ vựng mỗi ngày, tích lũy XP leo rank bền vững!',
        isDemo: false,
      };

      const all = [...data, userEntry];
      all.sort((a, b) => (b.xp ?? b.rp) - (a.xp ?? a.rp));
      all.forEach((item, idx) => {
        item.rankPosition = idx + 1;
      });

      setEntries(all);
      setIsLoading(false);
    });
  }, [user, userProfile, totalXp, streakDays, userRankInfo]);

  // Top 3 for podium
  const topThree = useMemo(() => entries.slice(0, 3), [entries]);

  // Remaining players filtered (rank 4+)
  const filteredRemaining = useMemo(() => {
    return entries.slice(3).filter((player) => {
      const matchSearch = player.nickname.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchTier = tierFilter === 'all' || player.tierName === tierFilter;
      return matchSearch && matchTier;
    });
  }, [entries, searchQuery, tierFilter]);

  // Available unique tiers for filter
  const availableTiers = useMemo(() => {
    const set = new Set(entries.map((p) => p.tierName));
    return Array.from(set);
  }, [entries]);

  // Find user's place in entries
  const currentUserEntry = useMemo(() => {
    return entries.find((e) => !e.isDemo);
  }, [entries]);

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
            So kè độ chăm chỉ và điểm Nọc XP cùng hội bạn thân (5–30 anh em).
          </p>
        </div>

        <button
          onClick={onOpenRankModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#d4eadd] rounded-xl transition border border-[#c1e2cb] shrink-0"
        >
          <Trophy className="w-4 h-4 text-[#268A59]" />
          <span>Tra cứu 15 Bậc Rank XP</span>
        </button>
      </div>

      {/* 2. Cạp Tổng Mascot Dialogue */}
      <CapTongBubble category="LEADERBOARD_OPEN" tone={mascotTone} />

      {/* 3. Top 3 Podium */}
      {topThree.length === 3 && (
        <LeaderboardPodium
          topThree={topThree}
          onSelectPlayer={(player) => setSelectedPlayer(player)}
        />
      )}

      {/* 4. Current User Status Card */}
      <div className="bg-white border-2 border-[#BDE5C8] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E5F3E9] border border-[#c1e2cb] flex items-center justify-center text-3xl shrink-0 shadow-xs">
              {userRankInfo.badge}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#69756D]">
                  Vị trí của đại ca
                </span>
                <span className="text-[10px] font-bold text-[#173B2B] bg-[#E5F3E9] px-2 py-0.5 rounded-full border border-[#c1e2cb]">
                  Top #{currentUserEntry?.rankPosition || 1} Hội Bạn
                </span>
              </div>

              <h3 className="text-lg font-black text-[#173B2B]">
                {currentUserEntry?.nickname || 'Đại ca'} — {userRankInfo.fullName}
              </h3>

              <p className="text-xs text-[#69756D] leading-relaxed max-w-xl">
                Điểm Nọc tích lũy:{' '}
                <strong className="text-[#268A59] font-mono font-bold">+{totalXp} XP</strong> · Chuỗi học liên tục:{' '}
                <strong className="text-[#D9AA54] font-bold">🔥 {streakDays} ngày</strong>.
                {!userProgress.isMaxTier && (
                  <span> (Còn <strong className="font-mono text-[#173B2B]">{userProgress.xpNeededForNextDivision} XP</strong> để lên <strong>{userProgress.nextRankName}</strong>)</span>
                )}
              </p>
            </div>
          </div>

          {onGoToStudy && (
            <button
              onClick={onGoToStudy}
              className="w-full sm:w-auto px-5 py-3 bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 shrink-0"
            >
              <BookOpen className="w-4 h-4" />
              <span>Học từ kiếm thêm XP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 5. Friend Group Ranking List ("BXH Hội Bạn") */}
      <div className="bg-white border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F4F0] pb-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#173B2B] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#268A59]" />
              <span>BXH Hội Bạn Cạp Chữ</span>
            </h2>
            <p className="text-xs text-[#69756D] mt-0.5">
              Từ hạng 4 trở xuống trong nhóm chiến hữu cùng học tiếng Anh
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
                className="text-xs py-2 px-2.5 rounded-xl border border-[#E6EBE6] bg-[#FAFBF8] focus:outline-hidden focus:border-[#268A59] transition text-[#173B2B] font-medium"
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
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#69756D]">
            Đang tải dữ liệu Bảng Phong Thần...
          </div>
        ) : filteredRemaining.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#69756D] space-y-1">
            <p>Không tìm thấy thành viên nào khớp với bộ lọc.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTierFilter('all');
              }}
              className="text-[#268A59] font-semibold hover:underline"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F0F4F0]">
            {filteredRemaining.map((player) => {
              const isCurrentUser = !player.isDemo;
              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`py-3.5 px-3 rounded-2xl transition flex items-center justify-between gap-4 cursor-pointer group ${
                    isCurrentUser ? 'bg-[#E5F3E9]/50 border border-[#BDE5C8]' : 'hover:bg-[#FAFBF8]'
                  }`}
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
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-[#173B2B] truncate group-hover:text-[#268A59] transition">
                          {player.nickname}
                        </h4>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold text-[#173B2B] bg-emerald-200 px-1.5 py-0.2 rounded-sm">
                            Đại ca
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#69756D] truncate">
                        {player.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Right: XP, Streak and Action */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black font-mono text-[#268A59]">
                        +{player.xp ?? player.rp} <span className="text-[10px] text-[#173B2B]">XP</span>
                      </div>
                      <div className="text-[10px] text-[#D9AA54] font-semibold flex items-center justify-end gap-0.5">
                        <span>🔥 {player.streakDays || 1} ngày</span>
                      </div>
                    </div>

                    <span className="text-xs text-[#268A59] font-bold hidden sm:inline opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem hồ sơ ➔
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Player Profile Modal */}
      <PlayerProfileModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
};
