import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  initStorage,
  getDecks,
  getVocabulary,
  getReviewRecords,
  getLearningSessions,
  getSettings,
  saveSettings,
  saveDeck,
  deleteDeck,
  saveVocabularyItem,
  saveBatchVocabulary,
  deleteVocabularyItem,
  getDashboardStats,
  exportDataToJson,
  importDataFromJson,
  clearDataCompletely,
  resetAllData,
  DashboardStats,
} from './services/storage';
import { BookOpen, Sparkles, Keyboard, Award } from 'lucide-react';
import { AppSettings, Deck, LearningMode, VocabularyItem, ReviewRecord, LearningSessionRecord } from './types';
import { Navbar, NavTab } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { DeckList } from './components/decks/DeckList';
import { DeckDetail } from './components/decks/DeckDetail';
import { FlashcardStudy } from './components/study/FlashcardStudy';
import { MatchingGame } from './components/study/MatchingGame';
import { TypingGame } from './components/study/TypingGame';
import { MeaningAiStudy } from './components/study/MeaningAiStudy';
import { SentenceAiStudy } from './components/study/SentenceAiStudy';
import { SettingsView } from './components/settings/SettingsView';
import { DeckModal } from './components/decks/DeckModal';
import { VocabularyModal } from './components/vocabulary/VocabularyModal';
import { BulkImportModal } from './components/vocabulary/BulkImportModal';
import { AiQuickAddModal } from './components/vocabulary/AiQuickAddModal';
import { SoNhucView } from './components/srs/SoNhucView';
import { DailyReviewModal } from './components/srs/DailyReviewModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { CapTongMascot } from './components/mascot/CapTongMascot';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  UserProfile,
  fetchOrCreateUserProfile,
  checkCloudDataExists,
  uploadLocalDataToCloud,
  downloadCloudDataToLocal,
  mergeLocalAndCloudData,
  SyncStatus,
} from './services/cloudSync';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { MigrationModal } from './components/auth/MigrationModal';
import { RankModal } from './components/rank/RankModal';
import { RankedArena } from './components/ranked/RankedArena';
import { LeaderboardPage } from './components/leaderboard/LeaderboardPage';
import { AchievementGallery } from './components/achievements/AchievementGallery';
import {
  calculateAchievementProgress,
  initializeAcknowledgedAchievements,
  detectNewlyUnlockedAchievements,
} from './services/achievements';
import { getDueWords } from './services/srs';
import {
  publishPublicLearningStats,
  toggleLeaderboardSharing,
} from './services/publicLeaderboard';

export default function App() {
  // 1. Data states
  const [isInitialized, setIsInitialized] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [settings, setSettingsState] = useState<AppSettings>({
    mascotTone: 'cheeky',
    autoAudio: true,
    theme: 'light',
    dailyGoal: 10,
  });
  const [stats, setStats] = useState<DashboardStats>(() => getDashboardStats());

  // 2. Navigation states
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [activeStudyMode, setActiveStudyMode] = useState<LearningMode>('flashcard');

  // 3. Modals states
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [deckToEdit, setDeckToEdit] = useState<Deck | null>(null);

  const [isVocabModalOpen, setIsVocabModalOpen] = useState(false);
  const [vocabToEdit, setVocabToEdit] = useState<VocabularyItem | null>(null);
  const [vocabDefaultDeckId, setVocabDefaultDeckId] = useState<string | undefined>(undefined);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkDefaultDeckId, setBulkDefaultDeckId] = useState<string | undefined>(undefined);

  const [isAiQuickAddOpen, setIsAiQuickAddOpen] = useState(false);
  const [aiQuickAddDefaultDeckId, setAiQuickAddDefaultDeckId] = useState<string | undefined>(undefined);

  const [isRankModalOpen, setIsRankModalOpen] = useState(false);
  const [isAchievementGalleryOpen, setIsAchievementGalleryOpen] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Global Notification Banner for Mascot Feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    expression: 'happy' | 'smug' | 'confused' | 'idle';
  } | null>(null);

  const showToast = (text: string, expression: 'happy' | 'smug' | 'confused' | 'idle' = 'smug') => {
    setToastMessage({ text, expression });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [sessions, setSessions] = useState<LearningSessionRecord[]>([]);
  const [isDailyReviewOpen, setIsDailyReviewOpen] = useState(false);
  const [flashcardInitialMode, setFlashcardInitialMode] = useState<'deck' | 'due'>('deck');

  // Synchronize state from storage
  const refreshData = useCallback((checkNewAchievements: boolean = false) => {
    const loadedDecks = getDecks();
    const loadedVocab = getVocabulary();
    const loadedReviews = getReviewRecords();
    const loadedSessions = getLearningSessions();
    const loadedSettings = getSettings();
    const loadedStats = getDashboardStats();

    setDecks(loadedDecks);
    setVocabulary(loadedVocab);
    setReviews(loadedReviews);
    setSessions(loadedSessions);
    setSettingsState(loadedSettings);
    setStats(loadedStats);

    if (checkNewAchievements) {
      const currentList = calculateAchievementProgress({
        reviews: loadedReviews,
        sessions: loadedSessions,
        streak: loadedStats.streak,
      });
      const newlyUnlocked = detectNewlyUnlockedAchievements(currentList);
      if (newlyUnlocked.length > 0) {
        newlyUnlocked.forEach((ach) => {
          showToast(`🏅 Mở khóa: ${ach.name}!`, 'happy');
        });
      }
    }
  }, []);

  // Compute personal achievements purely from authoritative local study data
  const achievements = useMemo(() => {
    return calculateAchievementProgress({
      reviews,
      sessions,
      streak: stats.streak,
    });
  }, [reviews, sessions, stats.streak]);

  // Compute due words count across all vocabulary
  const dueWordsCount = useMemo(() => {
    return getDueWords(undefined, reviews, sessions, vocabulary).length;
  }, [reviews, sessions, vocabulary]);

  // Auth & Cloud Sync states
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const profile = await fetchOrCreateUserProfile(user);
          setUserProfile(profile);
          showToast(`Đại ca ${profile.publicNickname} đã đăng nhập thành công!`, 'happy');

          const hasCloud = await checkCloudDataExists(user.uid);
          const localDecks = getDecks();
          if (!hasCloud && localDecks.length > 0) {
            setIsMigrationModalOpen(true);
          } else if (hasCloud) {
            await downloadCloudDataToLocal(user.uid);
            refreshData();
            setSyncStatus('synced');
          }
        } catch (err) {
          console.error('Error fetching profile or cloud data:', err);
          setSyncStatus('error');
        }
      } else {
        setUserProfile(null);
        setSyncStatus('idle');
      }
    });
    return () => unsubscribe();
  }, [refreshData]);

  const handleManualSync = async () => {
    if (!firebaseUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      await uploadLocalDataToCloud(firebaseUser.uid);
      setSyncStatus('synced');
      showToast('Đã đồng bộ dữ liệu lên mây thành công!', 'happy');
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      showToast('Đồng bộ thất bại. Mây đang bận đại ca ơi.', 'confused');
    }
  };

  // Milestone 4.3A: Opt-in public learning stats handler
  const handleToggleShareLeaderboard = async (enabled: boolean): Promise<void> => {
    if (!firebaseUser || !userProfile) {
      setIsAuthModalOpen(true);
      throw new Error('Vui lòng đăng nhập để tham gia Bảng Phong Thần.');
    }
    await toggleLeaderboardSharing({
      uid: firebaseUser.uid,
      enabled,
      nickname: userProfile.publicNickname || firebaseUser.displayName || 'Đại ca',
      avatar: userProfile.avatarUrl || firebaseUser.photoURL || undefined,
      totalXp: stats.totalXp,
      streakDays: stats.streak.currentStreak,
    });
    setUserProfile((prev) => (prev ? { ...prev, shareLeaderboard: enabled } : prev));
    showToast(
      enabled
        ? 'Đã bật hiển thị trên Bảng Phong Thần thành công!'
        : 'Đã tắt và gỡ thông tin của bạn khỏi Bảng Phong Thần.',
      'happy'
    );
  };

  // Milestone 4.3A: Auto-sync public summary only when enabled and relevant stats change
  useEffect(() => {
    if (!firebaseUser || !userProfile?.shareLeaderboard) return;
    publishPublicLearningStats({
      uid: firebaseUser.uid,
      nickname: userProfile.publicNickname || firebaseUser.displayName || 'Đại ca',
      avatar: userProfile.avatarUrl || firebaseUser.photoURL || undefined,
      totalXp: stats.totalXp,
      streakDays: stats.streak.currentStreak,
    }).catch((err) => {
      console.warn('Auto-sync public learning stats error:', err);
    });
  }, [
    firebaseUser,
    userProfile?.shareLeaderboard,
    userProfile?.publicNickname,
    userProfile?.avatarUrl,
    stats.totalXp,
    stats.streak.currentStreak,
  ]);

  // Initialize on boot
  useEffect(() => {
    initStorage();
    refreshData();
    setIsInitialized(true);
    const initialList = calculateAchievementProgress({
      reviews: getReviewRecords(),
      sessions: getLearningSessions(),
      streak: getDashboardStats().streak,
    });
    initializeAcknowledgedAchievements(initialList);
  }, [refreshData]);

  // Tab switching handler
  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab !== 'decks') {
      setActiveDeckId(null);
    }
  };

  // DECK ACTIONS
  const handleCreateDeck = () => {
    setDeckToEdit(null);
    setIsDeckModalOpen(true);
  };

  const handleEditDeck = (deck: Deck) => {
    setDeckToEdit(deck);
    setIsDeckModalOpen(true);
  };

  const handleSaveDeck = (deckData: { title: string; description: string; color: string }) => {
    if (deckToEdit) {
      saveDeck({
        ...deckToEdit,
        title: deckData.title,
        description: deckData.description,
        color: deckData.color,
      });
      showToast('Đã sửa xong bộ từ. Mong đại ca học tử tế hơn.', 'smug');
    } else {
      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        title: deckData.title,
        description: deckData.description,
        color: deckData.color,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      saveDeck(newDeck);
      showToast(`Bộ từ "${newDeck.title}" đã tạo xong. Mau nhét từ vào học đi!`, 'happy');
    }
    refreshData();
  };

  const handleDeleteDeck = (deck: Deck) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá bộ từ vựng',
      message: `Đại ca có chắc muốn xoá bộ "${deck.title}" không? Toàn bộ từ vựng bên trong sẽ biến mất vĩnh viễn!`,
      isDestructive: true,
      onConfirm: () => {
        deleteDeck(deck.id);
        if (activeDeckId === deck.id) {
          setActiveDeckId(null);
        }
        refreshData();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Đã xoá sổ bộ từ. Trông có vẻ nhẹ nợ nhỉ?', 'smug');
      },
    });
  };

  const handleOpenDeck = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentTab('decks');
  };

  // VOCABULARY ACTIONS
  const handleAddWord = (deckId?: string) => {
    setVocabToEdit(null);
    setVocabDefaultDeckId(deckId || activeDeckId || decks[0]?.id);
    setIsVocabModalOpen(true);
  };

  const handleEditWord = (item: VocabularyItem) => {
    setVocabToEdit(item);
    setVocabDefaultDeckId(item.deckId);
    setIsVocabModalOpen(true);
  };

  const handleSaveWord = (
    itemData: Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>
  ) => {
    if (vocabToEdit) {
      saveVocabularyItem({
        ...vocabToEdit,
        ...itemData,
      });
      showToast(`Đã sửa từ "${itemData.englishWord}".`, 'smug');
    } else {
      const newItem: VocabularyItem = {
        ...itemData,
        id: `vocab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        reviewCount: 0,
        masteryLevel: 'new',
      };
      saveVocabularyItem(newItem);
      showToast(`Từ "${newItem.englishWord}" đã nhập kho. Mai kiểm tra đấy!`, 'happy');
    }
    refreshData();
  };

  const handleDeleteWord = (item: VocabularyItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá từ vựng',
      message: `Đại ca muốn xoá từ "${item.englishWord}" khỏi bộ từ này à?`,
      isDestructive: true,
      onConfirm: () => {
        deleteVocabularyItem(item.id);
        refreshData();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(`Đã xoá từ "${item.englishWord}". Não bớt được 1 từ.`, 'smug');
      },
    });
  };

  // BULK IMPORT
  const handleOpenBulkAdd = (deckId?: string) => {
    setBulkDefaultDeckId(deckId || activeDeckId || decks[0]?.id);
    setIsBulkModalOpen(true);
  };

  const handleImportBulk = (
    items: Array<Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>>
  ) => {
    const fullItems: VocabularyItem[] = items.map((item, idx) => ({
      ...item,
      id: `vocab-bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewCount: 0,
      masteryLevel: 'new',
    }));

    const count = saveBatchVocabulary(fullItems);
    refreshData();
    showToast(`Đã nạp ${count} từ vào kho. Bắt đầu cày cuốc thôi đại ca!`, 'happy');
  };

  // AI QUICK ADD
  const handleOpenAiQuickAdd = (deckId?: string) => {
    setAiQuickAddDefaultDeckId(deckId || activeDeckId || decks[0]?.id);
    setIsAiQuickAddOpen(true);
  };

  const handleImportAiQuickAdd = (
    items: Array<Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>>
  ) => {
    const fullItems: VocabularyItem[] = items.map((item, idx) => ({
      ...item,
      id: `vocab-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reviewCount: 0,
      masteryLevel: 'new',
    }));

    const count = saveBatchVocabulary(fullItems);
    refreshData();
    showToast(`Cạp Tổng đã nạp thành công ${count} từ AI vào kho!`, 'happy');
  };

  // STUDY MODE HANDLER
  const handleStartStudy = (
    deckId: string,
    mode: LearningMode = 'flashcard',
    srsMode: 'deck' | 'due' = 'deck'
  ) => {
    setStudyDeckId(deckId);
    setActiveStudyMode(mode);
    setFlashcardInitialMode(srsMode);
    setCurrentTab('study');
  };

  // SETTINGS & BACKUP ACTIONS
  const handleUpdateSettings = (newSettings: AppSettings) => {
    saveSettings(newSettings);
    setSettingsState(newSettings);
    showToast('Đã cập nhật cài đặt tính cách Cạp Tổng!', 'happy');
  };

  const handleExportJson = () => {
    const jsonString = exportDataToJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `capcap_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file backup JSON thành công.', 'smug');
  };

  const handleImportJson = (content: string) => {
    const res = importDataFromJson(content);
    if (res.success) {
      refreshData();
      showToast(res.message, 'happy');
    } else {
      showToast(res.message, 'confused');
    }
  };

  const handleResetSeedData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục bộ từ mẫu',
      message: 'Khôi phục lại dữ liệu bộ từ mặc định (IELTS Writing, AWL, Slang).',
      isDestructive: false,
      onConfirm: () => {
        resetAllData();
        refreshData();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Đã khôi phục bộ từ mẫu ban đầu.', 'happy');
      },
    });
  };

  const handleClearAllData = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xoá sạch toàn bộ dữ liệu',
      message: 'Bạn có chắc chắn muốn xoá hết tất cả bộ từ và từ vựng? Toàn bộ dữ liệu trong trình duyệt sẽ biến mất hoàn toàn.',
      isDestructive: true,
      onConfirm: () => {
        clearDataCompletely();
        refreshData();
        setActiveDeckId(null);
        setCurrentTab('dashboard');
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast('Trắng tinh như chưa từng bắt đầu. Não thảnh thơi rồi nhé.', 'confused');
      },
    });
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFBF8]">
        <div className="text-center">
          <CapTongMascot expression="idle" size="md" />
          <p className="mt-3 text-xs font-semibold text-[#173B2B] tracking-wider uppercase">
            Cạp Cạp đang khởi động...
          </p>
        </div>
      </div>
    );
  }

  const activeDeck = activeDeckId ? decks.find((d) => d.id === activeDeckId) : null;

  return (
    <div className="min-h-screen bg-[#FAFBF8] flex flex-col font-sans selection:bg-[#E5F3E9] selection:text-[#173B2B]">
      {/* 1. Header Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={handleTabChange}
        onQuickAdd={() => handleOpenBulkAdd()}
        totalWords={stats.totalWords}
        dueWordsCount={dueWordsCount}
        user={firebaseUser}
        profile={userProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Floating Mascot Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#173B2B] text-white px-4 py-3 rounded-2xl shadow-xl max-w-md animate-in slide-in-from-bottom-5 duration-200 border border-[#268A59]">
          <CapTongMascot expression={toastMessage.expression} size="sm" />
          <div className="text-xs font-medium leading-relaxed">
            <span className="font-bold block text-[#D9AA54] text-[11px] mb-0.5">
              Cạp Tổng:
            </span>
            "{toastMessage.text}"
          </div>
        </div>
      )}

      {/* 2. Main View Routing */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <Dashboard
            stats={stats}
            recentDecks={decks}
            vocabulary={vocabulary}
            tone={settings.mascotTone}
            onCreateDeck={handleCreateDeck}
            onOpenDeck={handleOpenDeck}
            onStudyDeck={handleStartStudy}
            onOpenDailyReview={() => {
              handleStartStudy(decks[0]?.id || '', 'flashcard', 'due');
            }}
            onQuickAdd={() => handleOpenBulkAdd()}
            onGoToDecks={() => setCurrentTab('decks')}
            onOpenRank={() => setIsRankModalOpen(true)}
            onEnterArena={() => setCurrentTab('ranked')}
            onGoToLeaderboard={() => setCurrentTab('leaderboard')}
            achievements={achievements}
            onOpenAchievements={() => setIsAchievementGalleryOpen(true)}
          />
        )}

        {currentTab === 'ranked' && (
          <RankedArena
            user={firebaseUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenRankModal={() => setIsRankModalOpen(true)}
            onGoToLeaderboard={() => setCurrentTab('leaderboard')}
            mascotTone={settings.mascotTone}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardPage
            user={firebaseUser}
            userProfile={userProfile}
            totalXp={stats.totalXp}
            streakDays={stats.streak.currentStreak}
            mascotTone={settings.mascotTone}
            onOpenRankModal={() => setIsRankModalOpen(true)}
            onGoToArena={() => setCurrentTab('ranked')}
            onToggleShareLeaderboard={handleToggleShareLeaderboard}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentTab === 'sonhuc' && (
          <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
            <SoNhucView
              decks={decks}
              vocabulary={vocabulary}
              reviews={reviews}
              sessions={sessions}
              mascotTone={settings.mascotTone}
              onStartDailyReview={() => setIsDailyReviewOpen(true)}
              onStudyWord={(wordId) => {
                const item = vocabulary.find((v) => v.id === wordId);
                if (item) {
                  handleStartStudy(item.deckId);
                }
              }}
            />
          </div>
        )}

        {currentTab === 'decks' && !activeDeck && (
          <DeckList
            decks={decks}
            vocabulary={vocabulary}
            onCreateDeck={handleCreateDeck}
            onOpenDeck={handleOpenDeck}
            onEditDeck={handleEditDeck}
            onDeleteDeck={handleDeleteDeck}
            onStudyDeck={handleStartStudy}
            onBulkAddDeck={(deckId) => handleOpenBulkAdd(deckId)}
          />
        )}

        {currentTab === 'decks' && activeDeck && (
          <DeckDetail
            deck={activeDeck}
            vocabulary={vocabulary}
            onBack={() => setActiveDeckId(null)}
            onAddWord={() => handleAddWord(activeDeck.id)}
            onBulkAdd={() => handleOpenBulkAdd(activeDeck.id)}
            onAiQuickAdd={() => handleOpenAiQuickAdd(activeDeck.id)}
            onEditWord={handleEditWord}
            onDeleteWord={handleDeleteWord}
            onStartStudy={handleStartStudy}
          />
        )}

        {currentTab === 'study' && (
          <div className="space-y-4">
            {/* Elegant Mode Switcher Controls */}
            <div className="max-w-4xl mx-auto px-4 pt-2">
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center p-1 bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl shadow-xs text-xs font-semibold overflow-x-auto max-w-full">
                  <button
                    onClick={() => setActiveStudyMode('flashcard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      activeStudyMode === 'flashcard'
                        ? 'bg-[#173B2B] text-white shadow-xs'
                        : 'text-[#69756D] hover:text-[#173B2B]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Flashcard</span>
                  </button>

                  <button
                    onClick={() => setActiveStudyMode('matching')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      activeStudyMode === 'matching'
                        ? 'bg-[#173B2B] text-white shadow-xs'
                        : 'text-[#69756D] hover:text-[#173B2B]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ghép Cặp</span>
                  </button>

                  <button
                    onClick={() => setActiveStudyMode('typing')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      activeStudyMode === 'typing'
                        ? 'bg-[#173B2B] text-white shadow-xs'
                        : 'text-[#69756D] hover:text-[#173B2B]'
                    }`}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Gõ Từ</span>
                  </button>

                  <button
                    onClick={() => setActiveStudyMode('meaning_ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      activeStudyMode === 'meaning_ai'
                        ? 'bg-[#173B2B] text-white shadow-xs'
                        : 'text-[#69756D] hover:text-[#173B2B]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D9AA54]" />
                    <span>AI Chấm Nghĩa</span>
                  </button>

                  <button
                    onClick={() => setActiveStudyMode('sentence_ai')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      activeStudyMode === 'sentence_ai'
                        ? 'bg-[#173B2B] text-white shadow-xs'
                        : 'text-[#69756D] hover:text-[#173B2B]'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5 text-[#268A59]" />
                    <span>Đặt Câu AI</span>
                  </button>
                </div>
              </div>
            </div>

            {activeStudyMode === 'flashcard' && (
              <FlashcardStudy
                decks={decks}
                vocabulary={vocabulary}
                defaultDeckId={studyDeckId || decks[0]?.id}
                initialMode={flashcardInitialMode}
                tone={settings.mascotTone}
                onExit={() => {
                  refreshData(true);
                  setCurrentTab('dashboard');
                }}
                onSelectDeck={(id) => setStudyDeckId(id)}
                onGoToTyping={() => {
                  refreshData(true);
                  setActiveStudyMode('typing');
                }}
                onGoToSoNhuc={() => {
                  refreshData(true);
                  setCurrentTab('sonhuc');
                }}
              />
            )}

            {activeStudyMode === 'matching' && (
              <MatchingGame
                decks={decks}
                vocabulary={vocabulary}
                defaultDeckId={studyDeckId || decks[0]?.id}
                tone={settings.mascotTone}
                onExit={() => {
                  refreshData(true);
                  setCurrentTab('dashboard');
                }}
                onSelectDeck={(id) => setStudyDeckId(id)}
              />
            )}

            {activeStudyMode === 'typing' && (
              <TypingGame
                decks={decks}
                vocabulary={vocabulary}
                defaultDeckId={studyDeckId || decks[0]?.id}
                tone={settings.mascotTone}
                onExit={() => {
                  refreshData(true);
                  setCurrentTab('dashboard');
                }}
                onSelectDeck={(id) => setStudyDeckId(id)}
              />
            )}

            {activeStudyMode === 'meaning_ai' && (
              <MeaningAiStudy
                decks={decks}
                vocabulary={vocabulary}
                defaultDeckId={studyDeckId || decks[0]?.id}
                tone={settings.mascotTone}
                onExit={() => {
                  refreshData(true);
                  setCurrentTab('dashboard');
                }}
                onSelectDeck={(id) => setStudyDeckId(id)}
              />
            )}

            {activeStudyMode === 'sentence_ai' && (
              <SentenceAiStudy
                decks={decks}
                vocabulary={vocabulary}
                defaultDeckId={studyDeckId || decks[0]?.id}
                tone={settings.mascotTone}
                onExit={() => {
                  refreshData(true);
                  setCurrentTab('dashboard');
                }}
                onSelectDeck={(id) => setStudyDeckId(id)}
              />
            )}
          </div>
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onExportJson={handleExportJson}
            onImportJson={handleImportJson}
            onClearAllData={handleClearAllData}
            onResetSeedData={handleResetSeedData}
            userProfile={userProfile}
            totalXp={stats.totalXp}
            streakDays={stats.streak.currentStreak}
            onToggleShareLeaderboard={handleToggleShareLeaderboard}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#E6EBE6] bg-[#FFFFFF] py-6 px-4 text-center text-xs text-[#69756D]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#173B2B] lowercase">cạp cạp.</span>
            <span aria-hidden="true">·</span>
            <span>Học không vào thì cạp.</span>
          </div>
          <div>
            <span>Bản quyền © 2026 cạp cạp. Nền tảng học từ vựng xéo xắt.</span>
          </div>
        </div>
      </footer>

      {/* 4. Modals */}
      <DeckModal
        isOpen={isDeckModalOpen}
        deckToEdit={deckToEdit}
        onClose={() => {
          setIsDeckModalOpen(false);
          setDeckToEdit(null);
        }}
        onSave={handleSaveDeck}
      />

      <VocabularyModal
        isOpen={isVocabModalOpen}
        decks={decks}
        defaultDeckId={vocabDefaultDeckId}
        itemToEdit={vocabToEdit}
        existingItemsInDeck={
          vocabDefaultDeckId
            ? vocabulary.filter((v) => v.deckId === vocabDefaultDeckId)
            : []
        }
        onClose={() => {
          setIsVocabModalOpen(false);
          setVocabToEdit(null);
        }}
        onSave={handleSaveWord}
      />

      <BulkImportModal
        isOpen={isBulkModalOpen}
        decks={decks}
        defaultDeckId={bulkDefaultDeckId}
        existingItemsInDeck={
          bulkDefaultDeckId
            ? vocabulary.filter((v) => v.deckId === bulkDefaultDeckId)
            : []
        }
        onClose={() => setIsBulkModalOpen(false)}
        onImport={handleImportBulk}
      />

      <AiQuickAddModal
        isOpen={isAiQuickAddOpen}
        decks={decks}
        defaultDeckId={aiQuickAddDefaultDeckId}
        existingItemsInDeck={
          aiQuickAddDefaultDeckId
            ? vocabulary.filter((v) => v.deckId === aiQuickAddDefaultDeckId)
            : []
        }
        onClose={() => setIsAiQuickAddOpen(false)}
        onImport={handleImportAiQuickAdd}
      />

      <DailyReviewModal
        isOpen={isDailyReviewOpen}
        decks={decks}
        vocabulary={vocabulary}
        reviews={reviews}
        sessions={sessions}
        mascotTone={settings.mascotTone}
        onClose={() => {
          setIsDailyReviewOpen(false);
          refreshData();
        }}
        onReviewCompleted={() => {
          refreshData(true);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setFirebaseUser(user);
          showToast('Đăng nhập thành công đại ca ơi!', 'happy');
        }}
        tone={settings.mascotTone as any}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onProfileUpdated={(updated) => setUserProfile(updated)}
        onLogout={() => {
          setFirebaseUser(null);
          setUserProfile(null);
          showToast('Đã đăng xuất. Hẹn gặp lại đại ca!', 'smug');
        }}
        syncStatus={syncStatus}
        onManualSync={handleManualSync}
        achievements={achievements}
        onOpenAchievements={() => setIsAchievementGalleryOpen(true)}
        totalXp={stats.totalXp}
        streakDays={stats.streak.currentStreak}
        onToggleShareLeaderboard={handleToggleShareLeaderboard}
      />

      <AchievementGallery
        isOpen={isAchievementGalleryOpen}
        onClose={() => setIsAchievementGalleryOpen(false)}
        achievements={achievements}
        mascotTone={settings.mascotTone}
      />

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onUploadLocal={async () => {
          if (firebaseUser) {
            await uploadLocalDataToCloud(firebaseUser.uid);
            setSyncStatus('synced');
            showToast('Đã đẩy toàn bộ từ vựng lên mây thành công!', 'happy');
          }
        }}
        onDownloadCloud={async () => {
          if (firebaseUser) {
            await downloadCloudDataToLocal(firebaseUser.uid);
            refreshData();
            setSyncStatus('synced');
            showToast('Đã tải dữ liệu từ mây về máy thành công!', 'happy');
          }
        }}
        onMerge={async () => {
          if (firebaseUser) {
            await mergeLocalAndCloudData(firebaseUser.uid);
            refreshData();
            setSyncStatus('synced');
            showToast('Đã hợp nhất dữ liệu máy và mây thành công!', 'happy');
          }
        }}
      />

      <RankModal
        isOpen={isRankModalOpen}
        onClose={() => setIsRankModalOpen(false)}
        totalXp={stats.totalXp}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
