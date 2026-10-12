import React, { useState, useMemo } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Lock,
  Sparkles,
  Filter,
  Calendar,
  Flame,
  BookOpen,
  Keyboard,
  Brain,
} from 'lucide-react';
import { Achievement, AchievementCategory, MascotTone } from '../../types';
import { CapTongBubble } from '../mascot/CapTongBubble';

interface AchievementGalleryProps {
  achievements: Achievement[];
  isOpen?: boolean;
  onClose?: () => void;
  mascotTone?: MascotTone;
}

export const AchievementGallery: React.FC<AchievementGalleryProps> = ({
  achievements,
  isOpen = true,
  onClose,
  mascotTone = 'cheeky',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const totalAchievements = achievements.length;
  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements]
  );
  const unlockedCount = unlockedAchievements.length;
  const completionPercentage = totalAchievements > 0
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      const matchCat = selectedCategory === 'all' || ach.category === selectedCategory;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unlocked' && ach.unlocked) ||
        (statusFilter === 'locked' && !ach.unlocked);
      return matchCat && matchStatus;
    });
  }, [achievements, selectedCategory, statusFilter]);

  const categories: { id: string; label: string; count: number }[] = useMemo(() => {
    return [
      { id: 'all', label: 'Tất cả', count: achievements.length },
      { id: 'starter', label: 'Khởi Đầu', count: achievements.filter((a) => a.category === 'starter').length },
      { id: 'mastery', label: 'Thuần Phục', count: achievements.filter((a) => a.category === 'mastery').length },
      { id: 'consistency', label: 'Chuyên Cần', count: achievements.filter((a) => a.category === 'consistency').length },
      { id: 'modes', label: 'Chế Độ Học', count: achievements.filter((a) => a.category === 'modes').length },
      { id: 'dedication', label: 'Kiên Trì', count: achievements.filter((a) => a.category === 'dedication').length },
    ];
  }, [achievements]);

  const content = (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173B2B] tracking-tight">
                Tủ Thành Tích Cạp Cạp
              </h1>
              <p className="text-xs sm:text-sm text-[#69756D] mt-0.5">
                Học thì có thể chậm, nhưng thành tích phải có cái để gáy.
              </p>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#69756D] hover:text-[#173B2B] hover:bg-stone-100 transition self-end sm:self-center"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Cạp Tổng Mascot Dialogue */}
      <CapTongBubble category="ACHIEVEMENT_GALLERY_OPEN" tone={mascotTone} />

      {/* 3. Progress Overview Summary Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-[#173B2B] to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-emerald-800/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800/80 text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-emerald-700/60">
                Bộ Sưu Tập Cá Nhân
              </span>
              <span className="text-xs text-emerald-200">
                Phần thưởng kỷ niệm học tập
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Tiến Độ Mở Khóa: {unlockedCount} / {totalAchievements} Huy Hiệu
            </h2>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Các huy hiệu được ghi nhận tự động từ nỗ lực học từ vựng thực tế. Huy hiệu Thuần Phục & Chế Độ Học yêu cầu bằng chứng thực chất (Gõ từ không gợi ý, Gemini Chấm Nghĩa, Đặt Câu AI); tự đánh giá lật thẻ không tính là bằng chứng vững chắc.
            </p>
          </div>

          <div className="w-full md:w-64 bg-emerald-950/60 p-4 rounded-2xl border border-emerald-700/50 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-semibold">Tỷ lệ hoàn thành</span>
              <span className="font-mono font-black text-amber-300 text-sm">{completionPercentage}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-3 bg-emerald-900/80 rounded-full overflow-hidden p-0.5 border border-emerald-700/40">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-emerald-400/80 pt-0.5">
              <span>{unlockedCount} đã mở</span>
              <span>{totalAchievements - unlockedCount} còn khóa</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Category Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-[#173B2B] text-white shadow-xs'
                  : 'bg-white text-[#69756D] hover:text-[#173B2B] hover:bg-stone-50 border border-[#E6EBE6]'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          <Filter className="w-3.5 h-3.5 text-[#69756D]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-[#E6EBE6] bg-white text-[#173B2B] font-medium focus:outline-hidden focus:border-[#268A59]"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="unlocked">Đã mở khóa ({unlockedCount})</option>
            <option value="locked">Còn khóa ({totalAchievements - unlockedCount})</option>
          </select>
        </div>
      </div>

      {/* 5. Achievement Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="bg-white border border-[#E6EBE6] rounded-3xl p-12 text-center text-xs text-[#69756D] space-y-2">
          <p>Không có huy hiệu nào phù hợp với bộ lọc đã chọn.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setStatusFilter('all');
            }}
            className="text-[#268A59] font-bold hover:underline"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredAchievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            const progressRatio = Math.min(100, Math.round((ach.currentProgress / ach.target) * 100));

            return (
              <div
                key={ach.id}
                className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-200 border flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-white border-amber-200/80 shadow-xs hover:border-amber-300 hover:shadow-md'
                    : 'bg-[#FAFBF8] border-[#E6EBE6] opacity-80 hover:opacity-100'
                }`}
              >
                {/* Top Badge Banner */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    {/* Badge Icon Display */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 border transition-transform duration-200 hover:scale-105 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-300 shadow-xs'
                          : 'bg-stone-100 border-stone-200 grayscale'
                      }`}
                    >
                      <span>{ach.icon}</span>
                    </div>

                    {/* Status Pill */}
                    <div className="shrink-0">
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Đã Mở Khóa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-stone-100 text-stone-600 border border-stone-300">
                          <Lock className="w-3 h-3 text-stone-500" />
                          <span>Chưa Mở</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#69756D] bg-stone-100 px-2 py-0.5 rounded-md">
                        {ach.categoryLabel}
                      </span>
                    </div>
                    <h3
                      className={`text-base font-black tracking-tight ${
                        isUnlocked ? 'text-[#173B2B]' : 'text-stone-700'
                      }`}
                    >
                      {ach.name}
                    </h3>
                    <p className="text-xs text-[#69756D] leading-relaxed pt-1">
                      {ach.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Progress Bar & Details */}
                <div className="mt-5 pt-4 border-t border-[#F0F4F0] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-[#69756D]">Tiến độ</span>
                    <span className="font-mono font-bold text-xs text-[#173B2B]">
                      {ach.progressText}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                          : 'bg-emerald-700/60'
                      }`}
                      style={{ width: `${progressRatio}%` }}
                    />
                  </div>

                  {isUnlocked && ach.unlockedAt && (
                    <div className="text-[10px] text-[#69756D] text-right pt-0.5">
                      Ghi danh ngày {new Date(ach.unlockedAt).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // If used as modal
  if (onClose) {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white border border-[#E6EBE6] rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  // Standalone component view
  return <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-200">{content}</div>;
};
