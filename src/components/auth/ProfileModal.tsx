import React, { useState, useEffect } from 'react';
import { X, User, Shield, LogOut, Edit2, Check, Sparkles, Cloud, Award, ChevronRight } from 'lucide-react';
import { UserProfile, updatePublicNickname } from '../../services/cloudSync';
import { logoutUser } from '../../services/firebase';
import { Achievement } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  onLogout: () => void;
  syncStatus: string;
  onManualSync: () => void;
  achievements?: Achievement[];
  onOpenAchievements?: () => void;
  totalXp?: number;
  streakDays?: number;
  onToggleShareLeaderboard?: (enabled: boolean) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  onLogout,
  syncStatus,
  onManualSync,
  achievements = [],
  onOpenAchievements,
  totalXp = 0,
  streakDays = 0,
  onToggleShareLeaderboard,
}) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile?.publicNickname || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Sync nicknameInput when profile updates
  useEffect(() => {
    if (profile?.publicNickname) {
      setNicknameInput(profile.publicNickname);
    }
  }, [profile?.publicNickname]);

  // Handle Escape key and background scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !profile) return null;

  const handleToggleShare = async () => {
    if (!profile || !onToggleShareLeaderboard) return;
    setShareError(null);
    setShareLoading(true);
    try {
      const nextState = !profile.shareLeaderboard;
      await onToggleShareLeaderboard(nextState);
      onProfileUpdated({ ...profile, shareLeaderboard: nextState });
    } catch (err: any) {
      setShareError(err.message || 'Không thể cập nhật quyền chia sẻ.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    setError(null);
    setLoading(true);
    try {
      await updatePublicNickname(profile.uid, nicknameInput);
      onProfileUpdated({ ...profile, publicNickname: nicknameInput.trim() });
      setIsEditingNickname(false);
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật biệt hiệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logoutUser();
      onLogout();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-emerald-100 flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-6 pb-4 bg-white rounded-t-2xl shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              🦂
            </span>
            <h2 className="text-xl font-bold text-gray-800">Hồ Sơ Đại Ca</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            title="Đóng (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Profile Card */}
          <div className="flex items-center gap-4 rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100">
            <img
              src={profile.avatarUrl}
              alt="Avatar"
              className="h-16 w-16 rounded-full border-2 border-emerald-500 bg-white object-cover shadow-md"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg">{profile.displayName}</h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">UID: {profile.uid.substring(0, 10)}...</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  🛡️ {profile.rankedTier || 'Đồng Cạp'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  ⭐ {profile.rp || 0} RP
                </span>
              </div>
            </div>
          </div>

          {/* Nickname Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Biệt hiệu công khai (dùng cho bảng xếp hạng)
            </label>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={30}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Nhập biệt hiệu..."
                />
                <button
                  onClick={handleSaveNickname}
                  disabled={loading}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                >
                  Lưu
                </button>
                <button
                  onClick={() => setIsEditingNickname(false)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <span className="font-medium text-gray-800">{profile.publicNickname}</span>
                <button
                  onClick={() => {
                    setNicknameInput(profile.publicNickname);
                    setIsEditingNickname(true);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Sửa
                </button>
              </div>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          {/* Milestone 4.3A: Opt-in Public Learning Stats for Friends Leaderboard */}
          <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label htmlFor="share-leaderboard-toggle" className="text-xs font-bold text-gray-800 flex items-center gap-1.5 cursor-pointer">
                  <span>🏆</span>
                  <span>Hiển thị thành tích của tôi trên Bảng Phong Thần</span>
                </label>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Chia sẻ biệt hiệu, tổng Nọc XP ({totalXp} XP) và chuỗi ngày ({streakDays} ngày) lên BXH hội bạn.
                </p>
              </div>
              <button
                id="share-leaderboard-toggle"
                type="button"
                role="switch"
                aria-checked={Boolean(profile.shareLeaderboard)}
                disabled={shareLoading}
                onClick={handleToggleShare}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  profile.shareLeaderboard ? 'bg-emerald-600' : 'bg-gray-300'
                } ${shareLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    profile.shareLeaderboard ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[10px] text-emerald-800 bg-white/70 rounded-lg p-2 border border-emerald-100 flex items-start gap-1.5">
              <span className="text-emerald-600 font-bold">🔒</span>
              <span>
                <strong>Bảo mật:</strong> Bộ từ vựng, email, lịch sử học tập và tiến độ SRS riêng tư của bạn <em>không bao giờ</em> được chia sẻ.
              </span>
            </div>

            {shareError && (
              <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                {shareError}
              </p>
            )}
          </div>

          {/* Personal Achievements Entry Point */}
          <div className="rounded-2xl border border-amber-200/80 p-4 bg-amber-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  Tủ Thành Tích Cạp Cạp
                </h4>
              </div>
              <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                {achievements.filter((a) => a.unlocked).length} / {achievements.length}
              </span>
            </div>

            {/* 3 recently unlocked badges */}
            <div className="flex items-center gap-2">
              {achievements.filter((a) => a.unlocked).length > 0 ? (
                achievements
                  .filter((a) => a.unlocked)
                  .slice(0, 3)
                  .map((ach) => (
                    <div
                      key={ach.id}
                      title={ach.name}
                      className="flex-1 bg-white border border-amber-200 rounded-xl p-2 flex items-center gap-2 shadow-2xs"
                    >
                      <span className="text-xl shrink-0">{ach.icon}</span>
                      <span className="text-[11px] font-bold text-gray-800 truncate">
                        {ach.name}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-xs text-amber-800/80 italic py-1">
                  Chưa mở khóa huy hiệu nào. Hãy hoàn thành phiên học đầu tiên!
                </p>
              )}
            </div>

            {onOpenAchievements && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAchievements();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold rounded-xl transition border border-amber-300"
              >
                <span>Xem Toàn Bộ Tủ Thành Tích</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sync Status Section */}
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cloud className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-gray-500">Trạng thái đồng bộ</p>
                <p className="text-sm font-semibold text-gray-800 capitalize">
                  {syncStatus === 'synced'
                    ? 'Đã đồng bộ lên mây'
                    : syncStatus === 'syncing'
                    ? 'Đang đồng bộ...'
                    : 'Sẵn sàng'}
                </p>
              </div>
            </div>
            <button
              onClick={onManualSync}
              className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-200 transition"
            >
              Đồng bộ ngay
            </button>
          </div>
        </div>

        {/* Sticky Footer / Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 p-6 pt-4 bg-white rounded-b-2xl shrink-0">
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-900 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
