import React, { useState, useMemo } from 'react';
import { Calendar, Sparkles, Flame, CheckCircle2, Info } from 'lucide-react';
import { DayActivity } from '../../types';
import { generateVườnNọcGrid, HeatmapDayCell } from '../../services/progression';

interface VuonNocHeatmapProps {
  activityHistory: Record<string, DayActivity>;
  currentStreak: number;
}

export const VuonNocHeatmap: React.FC<VuonNocHeatmapProps> = ({
  activityHistory,
  currentStreak,
}) => {
  const [selectedCell, setSelectedCell] = useState<HeatmapDayCell | null>(null);

  const gridData = useMemo(() => {
    return generateVườnNọcGrid(activityHistory);
  }, [activityHistory]);

  const levelColors: Record<number, string> = {
    0: 'bg-[#E6EBE6]',
    1: 'bg-[#D1EBD9]',
    2: 'bg-[#9BD5AD]',
    3: 'bg-[#5AAF79]',
    4: 'bg-[#268A59]',
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const dayOfWeekLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E6EBE6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#E5F3E9] text-[#268A59] rounded-xl">
              <Calendar className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-black text-[#173B2B]">
              Vườn Nọc
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#268A59] bg-[#E5F3E9] px-2.5 py-0.5 rounded-full">
              Hoạt động năm
            </span>
          </div>
          <p className="mt-1 text-xs text-[#69756D]">
            "Càng chăm học, nọc càng xanh." Bản đồ ghi nhận từng ngày cạp chữ thực tế của đại ca.
          </p>
        </div>

        {/* Highlight Badges */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div className="bg-[#FAFBF8] border border-[#E6EBE6] px-3 py-1.5 rounded-xl font-mono">
            <span className="text-[#69756D] text-[10px] uppercase block font-sans">Số ngày xanh</span>
            <span className="font-black text-[#268A59] text-sm">
              {gridData.totalActiveDaysYear} <span className="text-xs font-normal text-[#69756D]">ngày</span>
            </span>
          </div>

          <div className="bg-[#FAFBF8] border border-[#E6EBE6] px-3 py-1.5 rounded-xl font-mono">
            <span className="text-[#69756D] text-[10px] uppercase block font-sans">Chuỗi hiện tại</span>
            <span className="font-black text-[#D9AA54] text-sm flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#D9AA54] inline" />
              {currentStreak} <span className="text-xs font-normal text-[#69756D]">ngày</span>
            </span>
          </div>

          <div className="bg-[#FAFBF8] border border-[#E6EBE6] px-3 py-1.5 rounded-xl font-mono">
            <span className="text-[#69756D] text-[10px] uppercase block font-sans">Tổng lượt từ</span>
            <span className="font-black text-[#173B2B] text-sm">
              {gridData.totalWordsTrainedYear} <span className="text-xs font-normal text-[#69756D]">lượt</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Heatmap Grid Container (Scrollable) */}
      <div className="relative">
        <div className="overflow-x-auto pb-2 focus:outline-none">
          <div className="min-w-[740px] select-none">
            {/* Month Labels Bar */}
            <div className="flex text-[10px] text-[#69756D] font-mono mb-2 ml-7">
              {gridData.monthLabels.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    marginLeft: idx === 0 ? `${m.columnIndex * 13}px` : `${(m.columnIndex - (gridData.monthLabels[idx - 1]?.columnIndex || 0)) * 13 - 20}px`,
                  }}
                  className="whitespace-nowrap font-semibold"
                >
                  {m.name}
                </div>
              ))}
            </div>

            {/* Weeks & Days Matrix */}
            <div className="flex items-start gap-1">
              {/* Day of Week Labels Column */}
              <div className="flex flex-col gap-1 text-[9px] text-[#69756D] font-mono pr-1.5 pt-0.5 shrink-0">
                <span className="h-[10px] leading-[10px]"></span>
                <span className="h-[10px] leading-[10px]">T2</span>
                <span className="h-[10px] leading-[10px]"></span>
                <span className="h-[10px] leading-[10px]">T4</span>
                <span className="h-[10px] leading-[10px]"></span>
                <span className="h-[10px] leading-[10px]">T6</span>
                <span className="h-[10px] leading-[10px]"></span>
              </div>

              {/* 53 Columns of 7 Days */}
              <div className="flex gap-1">
                {gridData.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((cell) => {
                      const isHovered = selectedCell?.date === cell.date;

                      return (
                        <button
                          key={cell.date}
                          type="button"
                          disabled={cell.isFuture}
                          onClick={() => setSelectedCell(cell)}
                          onMouseEnter={() => setSelectedCell(cell)}
                          aria-label={`${cell.date}: ${cell.distinctWordsCount} từ`}
                          className={`w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-xs transition-all cursor-pointer ${
                            levelColors[cell.level]
                          } ${
                            cell.isToday
                              ? 'ring-1.5 ring-[#D9AA54] ring-offset-0.5'
                              : ''
                          } ${
                            isHovered
                              ? 'scale-125 z-10 shadow-xs'
                              : ''
                          } ${
                            cell.isFuture ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hover / Active Day Details Tooltip Banner */}
        <div className="mt-4 min-h-[46px] p-3 rounded-2xl bg-[#FAFBF8] border border-[#E6EBE6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          {selectedCell ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-bold text-[#173B2B] bg-white border border-[#E6EBE6] px-2 py-0.5 rounded-lg">
                {formatDateDisplay(selectedCell.date)}
                {selectedCell.isToday && ' (Hôm nay)'}
              </span>

              <span className="text-[#173B2B]">
                Luyện <strong className="font-bold text-[#268A59]">{selectedCell.distinctWordsCount}</strong> từ
              </span>

              <span className="text-[#69756D]">·</span>

              <span className="text-[#173B2B]">
                <strong className="font-bold">{selectedCell.sessionsCount}</strong> phiên học
              </span>

              <span className="text-[#69756D]">·</span>

              <span className="text-[#268A59] font-mono font-bold">
                +{selectedCell.xpEarned} XP
              </span>

              {selectedCell.isQualifying ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  Đạt chỉ tiêu chuỗi
                </span>
              ) : (
                <span className="text-[11px] text-[#69756D]">
                  Chưa đạt chỉ tiêu ngày
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#69756D] text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Rê chuột hoặc chạm vào ô bất kỳ để xem chi tiết ngày học.</span>
            </div>
          )}

          {/* Color Scale Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#69756D] self-end sm:self-auto">
            <span>Ít</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#E6EBE6]" title="0 từ" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#D1EBD9]" title="1 - 4 từ" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#9BD5AD]" title="5 - 9 từ" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#5AAF79]" title="10 - 19 từ" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#268A59]" title="20+ từ" />
            </div>
            <span>Nhiều</span>
          </div>
        </div>
      </div>
    </div>
  );
};
