import React from 'react';
import { X, Award, Sparkles, Flame, BookOpen } from 'lucide-react';
import type { LeaderboardEntry } from '../../types';

interface PlayerProfileModalProps {
  player: LeaderboardEntry | null;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onClose }) => {
  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E6EBE6] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Header */}
        <div className="flex items-center gap-4 pt-1">
          <div className="relative">
            <img
              src={player.avatarUrl}
              alt={player.nickname}
              className="w-16 h-16 rounded-2xl bg-stone-100 object-cover border-2 border-[#E6EBE6] shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 text-2xl">
              {player.badge}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md">
                Top #{player.rankPosition}
              </span>
              {player.isDemo && (
                <span className="text-[10px] font-bold text-[#69756D] bg-stone-100 px-2 py-0.5 rounded-md">
                  Bạn bè minh họa
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-[#173B2B] mt-0.5">
              {player.nickname}
            </h3>
            <p className="text-xs font-medium text-[#69756D]">
              {player.fullName}
            </p>
          </div>
        </div>

        {/* XP, Tier & Streak Details Card */}
        <div className="bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl p-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold text-[#69756D] uppercase">Điểm Nọc</span>
            <div className="text-lg sm:text-xl font-black text-[#268A59] font-mono mt-0.5">
              +{player.xp ?? player.rp} <span className="text-[10px] text-[#173B2B]">XP</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[#69756D] uppercase">Cấp Bậc</span>
            <div className="text-xs sm:text-sm font-bold text-[#173B2B] mt-1.5 truncate">
              {player.tierName} {player.division}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[#69756D] uppercase">Chuỗi Học</span>
            <div className="text-xs sm:text-sm font-bold text-[#D9AA54] mt-1.5 flex items-center justify-center gap-1">
              <span>🔥 {player.streakDays || 1} ngày</span>
            </div>
          </div>
        </div>

        {/* Player Quote / Motto */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-[#173B2B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D9AA54]" />
            <span>Châm ngôn cạp chữ:</span>
          </span>
          <p className="text-xs italic text-[#69756D] bg-white border border-[#F0F4F0] p-3 rounded-xl leading-relaxed">
            "{player.quote}"
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#173B2B] hover:bg-[#268A59] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
