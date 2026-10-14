import React, { useRef, useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trophy,
  ShieldCheck,
} from 'lucide-react';
import { AppSettings, MascotTone } from '../../types';
import { MASCOT_TONE_LABELS } from '../../data/dialogues';
import { CapTongMascot } from '../mascot/CapTongMascot';
import type { UserProfile } from '../../services/cloudSync';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportJson: () => void;
  onImportJson: (fileContent: string) => void;
  onClearAllData: () => void;
  onResetSeedData: () => void;
  userProfile?: UserProfile | null;
  totalXp?: number;
  streakDays?: number;
  onToggleShareLeaderboard?: (enabled: boolean) => Promise<void>;
  onOpenAuth?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportJson,
  onImportJson,
  onClearAllData,
  onResetSeedData,
  userProfile,
  totalXp = 0,
  streakDays = 0,
  onToggleShareLeaderboard,
  onOpenAuth,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleToneChange = (tone: MascotTone) => {
    onUpdateSettings({
      ...settings,
      mascotTone: tone,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportJson(content);
        setImportStatus({ success: true, message: 'Đã nhập dữ liệu thành công từ file backup!' });
      } catch (err) {
        setImportStatus({ success: false, message: 'Không thể đọc nội dung file JSON.' });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#173B2B] tracking-tight">
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-sm text-[#69756D]">
          Tuỳ chỉnh tính cách của Cạp Tổng, sao lưu và đồng bộ dữ liệu cá nhân.
        </p>
      </div>

      {importStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            importStatus.success
              ? 'bg-[#E5F3E9] border-[#BDE5C8] text-[#173B2B]'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#268A59]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="text-[#69756D] hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. Mascot Personality Selection */}
      <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#173B2B]">
              Tính cách linh vật: Cạp Tổng
            </h2>
            <p className="text-xs text-[#69756D] mt-0.5">
              Chọn mức độ xéo xắt và cà khịa trong các câu thoại phản hồi
            </p>
          </div>
          <CapTongMascot
            expression={
              settings.mascotTone === 'puppy'
                ? 'happy'
                : settings.mascotTone === 'boss'
                ? 'confused'
                : 'smug'
            }
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['cheeky', 'puppy', 'boss'] as MascotTone[]).map((toneKey) => {
            const isSelected = settings.mascotTone === toneKey;
            const meta = MASCOT_TONE_LABELS[toneKey];

            return (
              <div
                key={toneKey}
                onClick={() => handleToneChange(toneKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') handleToneChange(toneKey);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#173B2B] bg-[#FAFBF8] shadow-xs'
                    : 'border-[#E6EBE6] bg-white hover:border-[#268A59]/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#173B2B]">
                      {meta.label}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#268A59]" />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-[#69756D] leading-relaxed">
                    {meta.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6EBE6]/60 text-[11px] font-semibold text-[#268A59]">
                  {toneKey === 'cheeky' && 'Mặc định khuyên dùng'}
                  {toneKey === 'puppy' && 'Dành cho tâm hồn nhạy cảm'}
                  {toneKey === 'boss' && 'Chịu đòn tâm lý cực mạnh'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Theme & Audio Preferences */}
      <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#173B2B] border-b border-[#E6EBE6] pb-3">
          Giao diện & Tương tác
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#173B2B] block">Giao diện sáng (Light Theme)</span>
              <span className="text-xs text-[#69756D]">Thiết kế tối giản thanh lịch #FAFBF8</span>
            </div>
            <span className="text-xs font-bold text-[#268A59]">Mặc định</span>
          </div>

          <div className="p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#173B2B] block">Phát âm từ vựng Web Speech</span>
              <span className="text-xs text-[#69756D]">Giọng đọc chuẩn tiếng Anh Mỹ / Anh</span>
            </div>
            <span className="text-xs font-bold text-[#268A59]">Đang bật</span>
          </div>
        </div>
      </div>

      {/* 3. Milestone 4.3A: Friends Leaderboard Opt-in Setting */}
      <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#173B2B] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#268A59]" />
              <span>Bảng Phong Thần & Quyền Riêng Tư</span>
            </h2>
            <p className="text-xs text-[#69756D] mt-0.5">
              Tuỳ chọn tự nguyện chia sẻ tiến độ học tập tối giản với hội bạn bè
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#173B2B]">
                Hiển thị thành tích của tôi trên Bảng Phong Thần
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userProfile?.shareLeaderboard
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {userProfile?.shareLeaderboard ? 'Đang Bật' : 'Mặc định: TẮT'}
              </span>
            </div>
            <p className="text-xs text-[#69756D] leading-relaxed max-w-xl">
              Khi bật, biệt hiệu công khai, tổng Nọc XP ({totalXp} XP) và chuỗi ngày ({streakDays} ngày) sẽ được cập nhật trên Bảng Phong Thần. Khi tắt, thông tin công khai của bạn sẽ bị gỡ bỏ ngay lập tức.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {userProfile ? (
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(userProfile.shareLeaderboard)}
                disabled={shareLoading}
                onClick={async () => {
                  if (!onToggleShareLeaderboard) return;
                  setShareError(null);
                  setShareLoading(true);
                  try {
                    await onToggleShareLeaderboard(!userProfile.shareLeaderboard);
                  } catch (err: any) {
                    setShareError(err.message || 'Không thể cập nhật quyền chia sẻ.');
                  } finally {
                    setShareLoading(false);
                  }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  userProfile.shareLeaderboard ? 'bg-[#268A59]' : 'bg-gray-300'
                } ${shareLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    userProfile.shareLeaderboard ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#BDE5C8] border border-[#BDE5C8] rounded-xl transition-colors"
              >
                Đăng nhập để bật
              </button>
            )}
          </div>
        </div>

        {shareError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{shareError}</span>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-white border border-[#E6EBE6] rounded-xl text-xs text-[#69756D]">
          <ShieldCheck className="w-4 h-4 text-[#268A59] shrink-0 mt-0.5" />
          <p>
            <strong>Cam kết bảo mật dữ liệu:</strong> Bộ từ vựng tự tạo, danh sách từ vựng, tài khoản email, lịch sử các buổi học và đánh giá câu AI luôn được lưu trữ hoàn toàn riêng tư. Không một ai khác có quyền đọc dữ liệu riêng của bạn.
          </p>
        </div>
      </div>

      {/* 4. Data Backup, Export & Import */}
      <div className="bg-white border border-[#E6EBE6] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#173B2B] border-b border-[#E6EBE6] pb-3">
          Sao lưu và Khôi phục dữ liệu
        </h2>

        <p className="text-xs text-[#69756D] leading-relaxed">
          Toàn bộ bộ từ vựng và lịch sử ôn tập được lưu trữ an toàn trong trình duyệt của bạn (localStorage). Bạn có thể tải file JSON dự phòng để chuyển sang máy tính khác hoặc lưu trữ lâu dài.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export button */}
          <button
            onClick={onExportJson}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Xuất dữ liệu ra file JSON</span>
          </button>

          {/* Import button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4 text-[#268A59]" />
            <span>Nhập dữ liệu từ file backup JSON</span>
          </button>
        </div>
      </div>

      {/* 4. Danger Zone */}
      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-red-600 border-b border-red-100 pb-3">
          Vùng nguy hiểm
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1D2420]">
              Khôi phục lại bộ từ mặc định ban đầu
            </h3>
            <p className="text-xs text-[#69756D]">
              Nạp lại 3 bộ từ chuẩn IELTS, Academic và Everyday Slang.
            </p>
          </div>
          <button
            onClick={onResetSeedData}
            className="px-4 py-2 text-xs font-semibold text-[#173B2B] hover:bg-[#E5F3E9] border border-[#BDE5C8] rounded-xl transition-colors shrink-0"
          >
            Khôi phục bộ mẫu
          </button>
        </div>

        <div className="pt-3 border-t border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-red-600">
              Xoá toàn bộ dữ liệu (Clear All)
            </h3>
            <p className="text-xs text-[#69756D]">
              Xoá tất cả bộ từ, từ vựng và lịch sử ôn tập đã lưu. Hành động này không thể hoàn tác!
            </p>
          </div>
          <button
            onClick={onClearAllData}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shrink-0 shadow-xs"
          >
            Xoá sạch dữ liệu
          </button>
        </div>
      </div>
    </div>
  );
};
