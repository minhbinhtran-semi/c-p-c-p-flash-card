import React from 'react';
import { Crown, Sparkles, UserPlus } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';

interface LeaderboardPodiumProps {
  topThree: LeaderboardEntry[];
  activeTab?: 'xp' | 'streak';
  onSelectPlayer: (player: LeaderboardEntry) => void;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  topThree,
  activeTab = 'xp',
  onSelectPlayer,
}) => {
  const first = topThree.find((p) => p.rankPosition === 1) || topThree[0];
  const second = topThree.find((p) => p.rankPosition === 2) || (topThree.length >= 2 ? topThree[1] : undefined);
  const third = topThree.find((p) => p.rankPosition === 3) || (topThree.length >= 3 ? topThree[2] : undefined);

  if (!first) return null;

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D9AA54]" />
          <h2 className="text-sm sm:text-base font-extrabold text-[#173B2B] uppercase tracking-wider">
            Bục Vinh Quang Top 3
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-[#69756D] bg-[#FAFBF8] px-2.5 py-1 rounded-full border border-[#E6EBE6]">
          {activeTab === 'streak' ? 'Đỉnh Cao Chuỗi Ngày' : 'Bộ Ba Gáy To Nhất'}
        </span>
      </div>

      {/* Podium Grid: #2 (Left), #1 (Center Elevated), #3 (Right) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end pt-6 pb-2">
        {/* RANK #2 - SILVER */}
        {second ? (
          <div
            onClick={() => onSelectPlayer(second)}
            className="flex flex-col items-center cursor-pointer group transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="relative mb-3 flex flex-col items-center">
              <div className="relative">
                <img
                  src={second.avatarUrl}
                  alt={second.nickname}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 object-cover border-2 border-slate-300 shadow-md group-hover:border-slate-400 transition"
                />
                <span className="absolute -bottom-2 -right-2 text-xl sm:text-2xl">
                  {second.badge}
                </span>
              </div>
              <span className="mt-2 text-xs sm:text-sm font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300 font-mono">
                #2 Silver
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#173B2B] text-center truncate max-w-[100px] sm:max-w-[150px] group-hover:text-[#268A59] transition">
              {second.nickname}
            </h3>
            <p className="text-[10px] sm:text-xs text-[#69756D] truncate max-w-[100px] sm:max-w-[140px]">
              {second.fullName}
            </p>
            <div className="mt-1 font-mono text-xs sm:text-sm font-black text-[#173B2B]">
              {activeTab === 'streak' ? (
                <>
                  {second.streakDays} <span className="text-[10px] text-amber-600">ngày 🔥</span>
                  <div className="text-[10px] text-[#69756D] font-normal">{second.xp} XP</div>
                </>
              ) : (
                <>
                  {second.xp} <span className="text-[10px] text-[#268A59]">XP</span>
                  <div className="text-[10px] text-[#69756D] font-normal">{second.streakDays} ngày 🔥</div>
                </>
              )}
            </div>

            {/* Podium Pedestal */}
            <div className="w-full mt-3 h-20 sm:h-28 bg-gradient-to-t from-slate-200 to-slate-100 border border-slate-300 rounded-t-2xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-3xl font-black text-slate-400 font-mono">
                2
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-60">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-[10px] sm:text-xs text-center p-1">
              <UserPlus className="w-5 h-5 mb-0.5 opacity-50" />
              <span>Đang chờ</span>
            </div>
            <span className="mt-2 text-xs font-bold text-slate-400 font-mono">#2 Trống</span>
            <div className="w-full mt-3 h-20 sm:h-28 bg-slate-50 border border-dashed border-slate-300 rounded-t-2xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-300 font-mono">2</span>
            </div>
          </div>
        )}

        {/* RANK #1 - GOLD (ELEVATED) */}
        <div
          onClick={() => onSelectPlayer(first)}
          className="flex flex-col items-center cursor-pointer group transition-transform duration-200 hover:-translate-y-1.5 -mt-6 sm:-mt-8"
        >
          <div className="relative mb-3 flex flex-col items-center">
            {/* Crown */}
            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 fill-amber-400 animate-bounce mb-1 drop-shadow-sm" />
            <div className="relative">
              <img
                src={first.avatarUrl}
                alt={first.nickname}
                className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-amber-50 object-cover border-4 border-amber-400 shadow-xl group-hover:border-amber-500 transition"
              />
              <span className="absolute -bottom-2 -right-2 text-2xl sm:text-3xl">
                {first.badge}
              </span>
            </div>
            <span className="mt-2 text-xs sm:text-sm font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-mono">
              #1 Champion
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-[#173B2B] text-center truncate max-w-[110px] sm:max-w-[170px] group-hover:text-[#268A59] transition">
            {first.nickname}
          </h3>
          <p className="text-[11px] sm:text-xs text-[#69756D] truncate max-w-[110px] sm:max-w-[160px] font-medium">
            {first.fullName}
          </p>
          <div className="mt-1 font-mono text-sm sm:text-base font-black text-amber-700">
            {activeTab === 'streak' ? (
              <>
                {first.streakDays} <span className="text-xs text-amber-600">ngày 🔥</span>
                <div className="text-[11px] text-[#69756D] font-normal">{first.xp} XP</div>
              </>
            ) : (
              <>
                {first.xp} <span className="text-xs text-amber-600">XP</span>
                <div className="text-[11px] text-[#69756D] font-normal">{first.streakDays} ngày 🔥</div>
              </>
            )}
          </div>

          {/* Podium Pedestal */}
          <div className="w-full mt-3 h-28 sm:h-36 bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 border border-amber-300 rounded-t-2xl flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
            <span className="text-3xl sm:text-4xl font-black text-amber-500/80 font-mono">
              1
            </span>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest hidden sm:inline">
              Vương Miện
            </span>
          </div>
        </div>

        {/* RANK #3 - BRONZE */}
        {third ? (
          <div
            onClick={() => onSelectPlayer(third)}
            className="flex flex-col items-center cursor-pointer group transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="relative mb-3 flex flex-col items-center">
              <div className="relative">
                <img
                  src={third.avatarUrl}
                  alt={third.nickname}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-stone-100 object-cover border-2 border-amber-700/40 shadow-md group-hover:border-amber-700/60 transition"
                />
                <span className="absolute -bottom-2 -right-2 text-xl sm:text-2xl">
                  {third.badge}
                </span>
              </div>
              <span className="mt-2 text-xs sm:text-sm font-black text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300 font-mono">
                #3 Bronze
              </span>
            </div>

            <h3 className="text-xs sm:text-sm font-bold text-[#173B2B] text-center truncate max-w-[100px] sm:max-w-[150px] group-hover:text-[#268A59] transition">
              {third.nickname}
            </h3>
            <p className="text-[10px] sm:text-xs text-[#69756D] truncate max-w-[100px] sm:max-w-[140px]">
              {third.fullName}
            </p>
            <div className="mt-1 font-mono text-xs sm:text-sm font-black text-[#173B2B]">
              {activeTab === 'streak' ? (
                <>
                  {third.streakDays} <span className="text-[10px] text-amber-600">ngày 🔥</span>
                  <div className="text-[10px] text-[#69756D] font-normal">{third.xp} XP</div>
                </>
              ) : (
                <>
                  {third.xp} <span className="text-[10px] text-[#268A59]">XP</span>
                  <div className="text-[10px] text-[#69756D] font-normal">{third.streakDays} ngày 🔥</div>
                </>
              )}
            </div>

            {/* Podium Pedestal */}
            <div className="w-full mt-3 h-16 sm:h-24 bg-gradient-to-t from-amber-100 to-stone-100 border border-amber-200/80 rounded-t-2xl flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-3xl font-black text-amber-700/60 font-mono">
                3
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center opacity-60">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-amber-300/70 flex flex-col items-center justify-center text-amber-600/70 text-[10px] sm:text-xs text-center p-1">
              <UserPlus className="w-5 h-5 mb-0.5 opacity-50" />
              <span>Đang chờ</span>
            </div>
            <span className="mt-2 text-xs font-bold text-amber-600/70 font-mono">#3 Trống</span>
            <div className="w-full mt-3 h-16 sm:h-24 bg-amber-50/40 border border-dashed border-amber-300/60 rounded-t-2xl flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-black text-amber-300/80 font-mono">3</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

