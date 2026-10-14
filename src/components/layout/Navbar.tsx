import React from 'react';
import { Plus, BookOpen, Layers, Settings as SettingsIcon, LayoutDashboard, Swords, Trophy } from 'lucide-react';

export type NavTab = 'dashboard' | 'decks' | 'study' | 'sonhuc' | 'ranked' | 'leaderboard' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onQuickAdd: () => void;
  totalWords: number;
  dueWordsCount?: number;
  user: any;
  profile: any;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onQuickAdd,
  dueWordsCount,
  user,
  profile,
  onOpenAuth,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6EBE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2 text-left group"
            >
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#173B2B] lowercase whitespace-nowrap">
                cạp cạp<span className="text-[#268A59]">.</span>
              </span>
            </button>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#69756D]">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === 'dashboard'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              Tổng quan
            </button>
            <button
              onClick={() => onTabChange('decks')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === 'decks'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              Bộ từ của đại ca
            </button>
            <button
              onClick={() => onTabChange('study')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'study'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              <span>Luyện từ vựng</span>
              {typeof dueWordsCount === 'number' && dueWordsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-stone-900 font-mono font-bold">
                  {dueWordsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onTabChange('sonhuc')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === 'sonhuc'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              📖 Sổ Nhục
            </button>
            <button
              onClick={() => onTabChange('leaderboard')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                currentTab === 'leaderboard'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              <span>🏆 Bảng Phong Thần</span>
            </button>
            <button
              onClick={() => onTabChange('settings')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                currentTab === 'settings'
                  ? 'text-[#173B2B] border-[#173B2B] font-semibold'
                  : 'border-transparent hover:text-[#173B2B]'
              }`}
            >
              Cài đặt
            </button>
          </nav>

          {/* Zone 3: 1 primary action & Auth / Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {user && profile ? (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-200 hover:bg-emerald-100 transition"
              >
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="h-7 w-7 rounded-full object-cover border border-emerald-500"
                />
                <span className="hidden sm:inline font-semibold text-xs text-emerald-900 max-w-[100px] truncate">
                  {profile.publicNickname}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>🔑 Đăng nhập</span>
              </button>
            )}

            <button
              onClick={onQuickAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] active:bg-[#102A1F] rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ nhanh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden border-t border-[#E6EBE6] bg-[#FFFFFF] px-4 py-2 flex items-center justify-around text-xs font-medium text-[#69756D]">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            currentTab === 'dashboard' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tổng quan</span>
        </button>
        <button
          onClick={() => onTabChange('decks')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            currentTab === 'decks' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Bộ từ</span>
        </button>
        <button
          onClick={() => onTabChange('study')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            currentTab === 'study' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <div className="relative">
            <BookOpen className="w-4 h-4" />
            {typeof dueWordsCount === 'number' && dueWordsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] bg-amber-400 text-stone-900 font-mono font-bold">
                {dueWordsCount}
              </span>
            )}
          </div>
          <span>Học</span>
        </button>
        <button
          onClick={() => onTabChange('sonhuc')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            currentTab === 'sonhuc' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <span className="text-base">📖</span>
          <span>Sổ Nhục</span>
        </button>
        <button
          onClick={() => onTabChange('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-1.5 ${
            currentTab === 'leaderboard' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Phong Thần</span>
        </button>
        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 ${
            currentTab === 'settings' ? 'text-[#173B2B] font-semibold' : ''
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Cài đặt</span>
        </button>
      </div>
    </header>
  );
};
