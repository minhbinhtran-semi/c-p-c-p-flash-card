import React, { useState } from 'react';
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
}) => {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(profile?.publicNickname || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !profile) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-emerald-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
              🦂
            </span>
            <h2 className="text-xl font-bold text-gray-800">Hồ Sơ Đại Ca</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="my-6 flex items-center gap-4 rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100">
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
        <div className="mb-6 space-y-2">
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

        {/* Personal Achievements Entry Point */}
        <div className="mb-6 rounded-2xl border border-amber-200/80 p-4 bg-amber-50/50 space-y-3">
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
        <div className="mb-6 rounded-xl border border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
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
