import React from 'react';
import { X, Trophy, Sparkles, TrendingUp } from 'lucide-react';
import { getAllRanks, getRankFromXP, getRankProgressInfo } from '../../services/rank';

interface RankModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalXp: number;
}

export const RankModal: React.FC<RankModalProps> = ({
  isOpen,
  onClose,
  totalXp,
}) => {
  if (!isOpen) return null;

  const allRanks = getAllRanks();
  const progressInfo = getRankProgressInfo(totalXp);
  const { currentRank, nextRankName, xpEarnedInDivision, xpNeededForNextDivision, totalDivisionWidth, percentProgress, isMaxTier } = progressInfo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl border border-emerald-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 font-bold shadow-xs">
              👑
            </span>
            <div>
              <h2 className="text-xl font-black text-gray-900">Bảng Cấp Bậc 15 Cấp Cạp Cạp</h2>
              <p className="text-xs text-gray-500">Milestone 4.2 — Điểm Nọc XP trực tiếp xác định Rank</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Current Status Card */}
        <div className="my-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-[#173B2B] p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-4 -bottom-6 text-7xl opacity-20 pointer-events-none">🦖</div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
                  Cấp Bậc Hiện Tại
                </span>
                <span className="text-xs text-emerald-200">Bậc {currentRank.tierIndex + 1}/15</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentRank.badge}</span>
                <div>
                  <h3 className="text-2xl font-black text-amber-300">{currentRank.fullName}</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    "{currentRank.description}"
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/10 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-300">Tổng Điểm Nọc (XP)</p>
                <p className="text-2xl font-black font-mono text-amber-300 tabular-nums">+{totalXp} XP</p>
              </div>
            </div>
          </div>

          {/* Division progress bar */}
          {!isMaxTier ? (
            <div className="mt-5 pt-3 border-t border-white/15">
              <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
                <span>
                  Tiến độ: <strong className="text-white font-mono">{xpEarnedInDivision} / {totalDivisionWidth} XP</strong> đến <strong>{nextRankName}</strong>
                </span>
                <span className="font-mono font-bold text-amber-300">Còn {xpNeededForNextDivision} XP nữa</span>
              </div>
              <div className="h-2.5 w-full bg-white/15 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-white/15 text-xs text-amber-300 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Đại ca đã đạt cảnh giới tối cao Đại Đế Cạp Cạp! Cả từ điển đều run rẩy!</span>
            </div>
          )}
        </div>

        {/* Philosophy Card */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-[#E5F3E9]/60 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">🌿</span>
            <h4 className="font-bold text-emerald-950 text-sm">Học Từ Vựng Tích Lũy — Tự Động Thăng Cấp</h4>
          </div>
          <p className="text-xs text-emerald-900 leading-relaxed">
            Học tập thực chất và bền bỉ: hoàn thành bài tập, ôn thẻ Flashcard, luyện gõ từ và đặt câu AI để tích lũy Nọc XP. Rank của đại ca chỉ tăng hoặc giữ nguyên khi bạn học, không bao giờ bị trừ điểm vô lý!
          </p>
        </div>

        {/* Rank Ladder List - Exactly 15 ranks */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
            <span>📊</span> Thang Đo 15 Cấp Bậc Cạp Cạp (III → II → I)
          </h4>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {allRanks.map((rank, idx) => {
              const isCurrent = rank.fullName === currentRank.fullName;
              return (
                <div
                  key={`${rank.tierName}-${rank.division || 'top'}-${idx}`}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50/90 shadow-md ring-2 ring-emerald-400/20'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl w-10 text-center">{rank.badge}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-gray-900 text-sm">{rank.fullName}</h5>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                            Cấp hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">"{rank.description}"</p>
                      <p className="text-[11px] text-emerald-700 italic mt-0.5">Cạp Tổng: "{rank.mascotTaunt}"</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 border border-gray-200">
                      {rank.minXp} - {rank.maxXp >= 999999 ? '∞' : rank.maxXp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">Cạp Cạp Học Tiếng Anh — Cấp bậc đồng bộ điểm Nọc XP</p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#173B2B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#268A59] transition"
          >
            Đã hiểu, cạp tiếp!
          </button>
        </div>
      </div>
    </div>
  );
};
