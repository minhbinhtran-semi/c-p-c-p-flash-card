import React from 'react';
import {
  Layers,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Trophy,
  UploadCloud,
  CheckCircle,
} from 'lucide-react';
import { Deck, MascotTone, VocabularyItem, Achievement } from '../../types';
import { DashboardStats } from '../../services/storage';
import { CapTongBubble } from '../mascot/CapTongBubble';
import { VuonNocHeatmap } from './VuonNocHeatmap';
import { getRankFromXP, getRankProgressInfo } from '../../services/rank';

interface DashboardProps {
  stats: DashboardStats;
  recentDecks: Deck[];
  vocabulary: VocabularyItem[];
  tone: MascotTone;
  onCreateDeck: () => void;
  onOpenDeck: (deckId: string) => void;
  onStudyDeck: (deckId: string) => void;
  onQuickAdd: () => void;
  onGoToDecks: () => void;
  onOpenRank: () => void;
  onEnterArena?: () => void;
  onGoToLeaderboard?: () => void;
  achievements?: Achievement[];
  onOpenAchievements?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentDecks,
  vocabulary,
  tone,
  onCreateDeck,
  onOpenDeck,
  onStudyDeck,
  onQuickAdd,
  onGoToDecks,
  onOpenRank,
  onEnterArena,
  onGoToLeaderboard,
  achievements = [],
  onOpenAchievements,
}) => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* 1. HERO & WELCOME BANNER WITH CẠP TỔNG MASCOT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Branding & Action Callout */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#268A59]">
              <span>Cạp Cạp Học Tiếng Anh</span>
              <span aria-hidden="true">·</span>
              <span>Gemini AI Edition</span>
            </div>

            <h1 className="mt-2 text-3xl sm:text-4xl font-black text-[#173B2B] tracking-tight leading-tight">
              Học không vào thì cạp.
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#69756D] leading-relaxed max-w-xl">
              Nền tảng học từ vựng tiếng Anh tối giản nhưng có phong cách xéo xắt, châm chọc của Cạp Tổng. Nhớ từ sâu hơn, bớt lười hơn.
            </p>
          </div>

          {/* Primary CTA Buttons */}
          <div className="mt-6 pt-6 border-t border-[#E6EBE6] flex flex-wrap items-center gap-3">
            {stats.totalDecks > 0 ? (
              <button
                onClick={() => onStudyDeck(recentDecks[0]?.id || '')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#173B2B] hover:bg-[#268A59] active:bg-[#102A1F] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Vào ôn Flashcard ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onCreateDeck}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo bộ từ đầu tiên</span>
              </button>
            )}

            <button
              onClick={onQuickAdd}
              className="inline-flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-[#173B2B] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-[#268A59]" />
              <span>Dán danh sách từ (Bulk)</span>
            </button>
          </div>
        </div>

        {/* Right: Cạp Tổng Mascot Speech Bubble */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <CapTongBubble category="WELCOME" tone={tone} />
        </div>
      </div>

      {/* 2. REAL SUMMARY METRIC CARDS (NO FAKE DATA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Vocabulary */}
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#69756D]">
            <span>Tổng số từ vựng</span>
            <span className="text-[#173B2B]">Trong kho</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#173B2B] tabular-nums">
              {stats.totalWords}
            </span>
            <span className="text-xs text-[#69756D]">từ đã lưu</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E6EBE6] text-xs text-[#69756D] flex items-center justify-between">
            <span>Dữ liệu thực tế</span>
            <button
              onClick={onQuickAdd}
              className="text-[#268A59] font-medium hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Thêm mới</span>
            </button>
          </div>
        </div>

        {/* Metric 2: Total Decks */}
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#69756D]">
            <span>Bộ từ của đại ca</span>
            <span className="text-[#173B2B]">Đang quản lý</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#173B2B] tabular-nums">
              {stats.totalDecks}
            </span>
            <span className="text-xs text-[#69756D]">bộ chủ đề</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E6EBE6] text-xs text-[#69756D] flex items-center justify-between">
            <span>Phân loại rõ ràng</span>
            <button
              onClick={onGoToDecks}
              className="text-[#268A59] font-medium hover:underline inline-flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              <span>Xem tất cả</span>
            </button>
          </div>
        </div>

        {/* Metric 3: Words Reviewed */}
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#69756D]">
            <span>Từ đã từng ôn tập</span>
            <span className="text-[#173B2B]">Tiến độ học</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#173B2B] tabular-nums">
              {stats.wordsReviewed}
            </span>
            <span className="text-xs text-[#69756D]">
              / {stats.totalWords} từ
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E6EBE6] text-xs text-[#69756D] flex items-center justify-between">
            <span>
              {stats.totalReviewsCount > 0
                ? `${stats.totalReviewsCount} lượt lật thẻ đã ghi nhận`
                : 'Chưa có lượt ôn nào'}
            </span>
            {stats.masteryPercentage > 0 && (
              <span className="font-semibold text-[#268A59] tabular-nums">
                {stats.masteryPercentage}% nhớ tốt
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Nọc XP & Rank */}
        {(() => {
          const rankInfo = getRankFromXP(stats.totalXp);
          const progressInfo = getRankProgressInfo(stats.totalXp);
          return (
            <div 
              onClick={onOpenRank}
              className="bg-[#FFFFFF] border border-[#E6EBE6] hover:border-[#268A59]/50 rounded-2xl p-5 shadow-xs flex flex-col justify-between cursor-pointer transition group"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-[#69756D]">
                <span>Cấp Bậc & Điểm Nọc</span>
                <span className="text-[#268A59] font-bold flex items-center gap-1 group-hover:underline">
                  {rankInfo.badge} {rankInfo.fullName}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#268A59] tabular-nums font-mono">
                  +{stats.totalXp}
                </span>
                <span className="text-xs text-[#69756D]">tổng XP</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#E6EBE6] text-xs text-[#69756D] flex items-center justify-between">
                <span>
                  {progressInfo.isMaxTier
                    ? 'Đại Đế Cạp Cạp'
                    : `${progressInfo.xpEarnedInDivision} / ${progressInfo.totalDivisionWidth} XP`}
                </span>
                <span className="font-bold text-[#D9AA54] flex items-center gap-1">
                  🔥 {stats.streak.currentStreak} ngày
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2.4 PERSONAL ACHIEVEMENTS SUMMARY CARD */}
      {onOpenAchievements && (
        <div className="bg-white border border-[#E6EBE6] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
              🏅
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#173B2B]">
                  Tủ Thành Tích Cạp Cạp
                </h3>
                <span className="text-[11px] font-black font-mono text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {achievements.filter((a) => a.unlocked).length} / {achievements.length} Đã Mở
                </span>
              </div>
              <p className="text-xs text-[#69756D] mt-0.5">
                {achievements.filter((a) => a.unlocked).length > 0
                  ? `Huy hiệu gần nhất: ${achievements.filter((a) => a.unlocked).slice(-1)[0]?.name}`
                  : 'Học từ vựng để mở khóa huy hiệu đầu tiên!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
            <div className="hidden md:flex items-center gap-1.5 mr-1">
              {achievements
                .filter((a) => a.unlocked)
                .slice(0, 4)
                .map((ach) => (
                  <span
                    key={ach.id}
                    className="text-lg bg-[#FAFBF8] border border-amber-200/80 rounded-xl p-1.5 shadow-2xs"
                    title={ach.name}
                  >
                    {ach.icon}
                  </span>
                ))}
            </div>
            <button
              onClick={onOpenAchievements}
              className="px-4 py-2 text-xs font-bold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#d4eadd] rounded-xl transition border border-[#c1e2cb] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xem Tủ Thành Tích</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#268A59]" />
            </button>
          </div>
        </div>
      )}

      {/* 2.5 VƯỜN NỌC HEATMAP SECTION */}
      <VuonNocHeatmap
        activityHistory={stats.activityHistory}
        currentStreak={stats.streak.currentStreak}
      />

      {/* 3. RECENT DECKS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#173B2B]">
              Bộ từ vựng gần đây
            </h2>
            <p className="text-xs text-[#69756D] mt-0.5">
              Chọn một bộ để xem từ hoặc bắt đầu cày thẻ
            </p>
          </div>
          <button
            onClick={onGoToDecks}
            className="text-xs font-semibold text-[#268A59] hover:text-[#173B2B] inline-flex items-center gap-1"
          >
            <span>Tất cả bộ từ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.decks.length === 0 ? (
          <div className="bg-white border border-[#E6EBE6] rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-[#1D2420]">
              Chưa có bộ từ nào trong tài khoản.
            </p>
            <button
              onClick={onCreateDeck}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo ngay một bộ</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.decks.slice(0, 3).map((deck) => (
              <div
                key={deck.id}
                className="bg-white border border-[#E6EBE6] hover:border-[#268A59]/40 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: deck.color || '#173B2B' }}
                      />
                      <h3
                        onClick={() => onOpenDeck(deck.id)}
                        className="text-base font-bold text-[#173B2B] hover:text-[#268A59] cursor-pointer transition-colors truncate"
                      >
                        {deck.title}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-[#69756D] line-clamp-2 min-h-[32px]">
                    {deck.description || 'Chưa có mô tả cho bộ này.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6EBE6] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#173B2B] font-mono tabular-nums">
                    {deck.wordCount} từ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDeck(deck.id)}
                      className="px-2.5 py-1 text-xs font-medium text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg transition-colors"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => onStudyDeck(deck.id)}
                      disabled={deck.wordCount === 0}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                        deck.wordCount > 0
                          ? 'bg-[#173B2B] text-white hover:bg-[#268A59]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Học
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. FRIENDS LEADERBOARD CALLOUT BANNER */}
      <div 
        onClick={onGoToLeaderboard || onOpenRank}
        className="bg-gradient-to-r from-emerald-950 to-[#173B2B] text-white border border-emerald-800/60 rounded-3xl p-6 sm:p-7 hover:border-emerald-500 cursor-pointer transition-all group shadow-md hover:shadow-lg"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-900/80 border border-emerald-700/60 text-amber-400 rounded-2xl shrink-0 group-hover:scale-105 transition-transform text-2xl">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Bảng Phong Thần Hội Bạn (5–30 Người) — So Kè Điểm Nọc XP
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                  M4.2 Live
                </span>
              </div>
              <p className="mt-1.5 text-xs text-emerald-200/80 leading-relaxed max-w-2xl">
                Nọc XP là thước đo duy nhất cho cấp bậc và độ chăm chỉ của bạn. Luyện từ vựng, duy trì chuỗi học và so kè thứ hạng vui nhộn cùng hội bạn thân!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {onOpenRank && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRank();
                }}
                className="px-4 py-2.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 hover:text-white font-bold text-xs rounded-xl border border-emerald-700/60 transition flex items-center gap-1.5"
              >
                <span>Xem 15 Bậc Rank</span>
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onGoToLeaderboard) onGoToLeaderboard();
                else onOpenRank();
              }}
              className="px-5 py-2.5 bg-[#268A59] hover:bg-[#2fa76c] active:bg-[#1f734a] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>Xem Bảng Phong Thần</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
