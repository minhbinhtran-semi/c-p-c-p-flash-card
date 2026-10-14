import React, { useMemo } from 'react';
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
  Clock,
} from 'lucide-react';
import { Deck, MascotTone, VocabularyItem, Achievement } from '../../types';
import { DashboardStats, getReviewRecords, getLearningSessions } from '../../services/storage';
import { getDueWords } from '../../services/srs';
import { CapTongBubble } from '../mascot/CapTongBubble';
import { VuonNocHeatmap } from './VuonNocHeatmap';
import { getRankFromXP, getDivisionProgress, getXPRequiredForPromotion, getNextRank } from '../../services/rank';

interface DashboardProps {
  stats: DashboardStats;
  recentDecks: Deck[];
  vocabulary: VocabularyItem[];
  tone: MascotTone;
  onCreateDeck: () => void;
  onOpenDeck: (deckId: string) => void;
  onStudyDeck: (deckId: string) => void;
  onOpenDailyReview?: () => void;
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
  onOpenDailyReview,
  onQuickAdd,
  onGoToDecks,
  onOpenRank,
  onEnterArena,
  onGoToLeaderboard,
  achievements = [],
  onOpenAchievements,
}) => {
  const currentRank = getRankFromXP(stats.totalXp);
  const progress = getDivisionProgress(stats.totalXp);
  const xpNeeded = getXPRequiredForPromotion(stats.totalXp);
  const nextRankName = getNextRank(stats.totalXp);

  const dueCount = useMemo(() => {
    const revs = getReviewRecords();
    const sess = getLearningSessions();
    return getDueWords(undefined, revs, sess, vocabulary).length;
  }, [vocabulary]);

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

            {dueCount > 0 && onOpenDailyReview && (
              <button
                onClick={onOpenDailyReview}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#d5ebdc] border border-[#BDE5C8] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Clock className="w-4 h-4 text-[#268A59]" />
                <span>Ôn {dueCount} từ đến hạn (SRS)</span>
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

      {/* 1.5 CLICKABLE RANK & XP PROGRESSION CARD */}
      <div
        onClick={onOpenRank}
        className="bg-gradient-to-r from-emerald-900 to-[#173B2B] text-white rounded-3xl p-6 sm:p-7 shadow-lg cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden border border-emerald-700/50"
      >
        <div className="absolute right-4 -bottom-6 text-7xl opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
          {currentRank.badge}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                Bậc Rank Hiện Tại
              </span>
              <span className="text-xs text-emerald-300 font-mono font-bold">
                {stats.totalXp} Nọc XP
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentRank.badge}</span>
              <div>
                <h3 className="text-2xl font-black">{currentRank.fullName}</h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  "{currentRank.description}" (Click xem 15 bậc rank ➔)
                </p>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between bg-white/10 rounded-2xl p-4 backdrop-blur-xs border border-white/15 gap-2">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-300">Tiến độ thăng hạng</p>
              <p className="text-sm font-bold text-amber-300 font-mono">{xpNeeded} XP đến {nextRankName}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-700/80 px-2.5 py-1 rounded-xl">
                🔥 Streak: {stats.streak.currentStreak} ngày
              </span>
            </div>
          </div>
        </div>

        {/* Division Progress bar */}
        {currentRank.tierIndex < 14 && (
          <div className="mt-5 pt-3 border-t border-white/15">
            <div className="flex justify-between text-xs text-emerald-200 mb-1">
              <span>Tiến độ phân đoạn</span>
              <span className="font-mono font-bold text-amber-300">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
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

        {/* Metric 4: Nọc XP & Streak */}
        <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-[#69756D]">
            <span>Điểm Nọc & Chuỗi</span>
            <span className="text-[#268A59] font-bold">XP & Streak</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#268A59] tabular-nums font-mono">
              +{stats.totalXp}
            </span>
            <span className="text-xs text-[#69756D]">tổng XP</span>
          </div>
          <div className="mt-3 pt-3 border-t border-[#E6EBE6] text-xs text-[#69756D] flex items-center justify-between">
            <span>Hôm nay: <strong className="text-[#173B2B] font-mono">+{stats.todayXp}</strong> / {stats.dailyXpCap} XP</span>
            <span className="font-bold text-[#D9AA54] flex items-center gap-1">
              🔥 {stats.streak.currentStreak} ngày
            </span>
          </div>
        </div>
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

      {/* 4. LEADERBOARD BANNER CALLOUT */}
      <div 
        onClick={onGoToLeaderboard}
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
                  Bảng Phong Thần — Thi Đua Nọc XP & Streak Cùng Chiến Hữu
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-600/50 px-2 py-0.5 rounded-full">
                  M4.2B Live
                </span>
              </div>
              <p className="mt-1.5 text-xs text-emerald-200/80 leading-relaxed max-w-2xl">
                So kè tổng Nọc XP và chuỗi ngày học liên tục với các chiến hữu. Càng học nhiều, rank càng cao!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onGoToLeaderboard) onGoToLeaderboard();
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
