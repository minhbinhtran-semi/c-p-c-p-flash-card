import React, { useState, useMemo } from 'react';
import { BookOpen, AlertTriangle, RefreshCw, Search, Filter, ArrowUpDown, CheckCircle, ShieldAlert, Sparkles, Play, Award, Clock } from 'lucide-react';
import { Deck, VocabularyItem, ReviewRecord, LearningSessionRecord, MascotTone } from '../../types';
import { getWordLearningStats, WordSrsState, SRS_INTERVALS } from '../../services/srs';
import { getRandomDialogue } from '../../data/dialogues';

interface SoNhucViewProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  reviews: ReviewRecord[];
  sessions: LearningSessionRecord[];
  mascotTone: MascotTone;
  onStartDailyReview: () => void;
  onStudyWord?: (wordId: string) => void;
}

export const SoNhucView: React.FC<SoNhucViewProps> = ({
  decks,
  vocabulary,
  reviews,
  sessions,
  mascotTone,
  onStartDailyReview,
  onStudyWord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mistakes' | 'accuracy' | 'due' | 'word'>('mistakes');
  const [selectedWordForDetail, setSelectedWordForDetail] = useState<(VocabularyItem & { deckTitle: string; stats: WordSrsState }) | null>(null);

  // Mascot dialogue
  const dialogue = useMemo(() => {
    return getRandomDialogue('SO_NHUC_OPEN', mascotTone);
  }, [mascotTone]);

  // Compute SRS stats for all vocabulary items
  const wordStatsList = useMemo(() => {
    return vocabulary.map((v) => {
      const stats = getWordLearningStats(v.id, reviews, sessions);
      const deck = decks.find((d) => d.id === v.deckId);
      return {
        ...v,
        deckTitle: deck?.title || 'Bộ từ chung',
        stats,
      };
    });
  }, [vocabulary, reviews, sessions, decks]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    return wordStatsList.filter((item) => {
      const matchSearch =
        item.englishWord.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vietnameseDefinition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDeck = selectedDeckId === 'all' || item.deckId === selectedDeckId;
      const matchDifficulty =
        selectedDifficulty === 'all' || item.stats.difficultyStatus === selectedDifficulty;
      
      // Sổ Nhục focuses on weak or challenging words, but user can view all or filter
      return matchSearch && matchDeck && matchDifficulty;
    }).sort((a, b) => {
      if (sortBy === 'mistakes') {
        return b.stats.incorrectAttempts - a.stats.incorrectAttempts;
      }
      if (sortBy === 'accuracy') {
        const accA = a.stats.totalAttempts > 0 ? a.stats.correctAttempts / a.stats.totalAttempts : 1;
        const accB = b.stats.totalAttempts > 0 ? b.stats.correctAttempts / b.stats.totalAttempts : 1;
        return accA - accB; // lowest accuracy first
      }
      if (sortBy === 'due') {
        const nextA = a.stats.nextReviewAt || 0;
        const nextB = b.stats.nextReviewAt || 0;
        return nextA - nextB;
      }
      return a.englishWord.localeCompare(b.englishWord);
    });
  }, [wordStatsList, searchQuery, selectedDeckId, selectedDifficulty, sortBy]);

  // Top "lì lợm" words (highest incorrect attempts or lapses)
  const topStubbornWords = useMemo(() => {
    return [...wordStatsList]
      .filter((i) => i.stats.incorrectAttempts > 0 || i.stats.lapseCount > 0)
      .sort((a, b) => (b.stats.incorrectAttempts + b.stats.lapseCount * 2) - (a.stats.incorrectAttempts + a.stats.lapseCount * 2))
      .slice(0, 5);
  }, [wordStatsList]);

  const difficultyColors: Record<string, string> = {
    'Từ mới': 'bg-gray-100 text-gray-700 border-gray-200',
    'Đang vật lộn': 'bg-red-50 text-red-700 border-red-200',
    'Đang tiến bộ': 'bg-amber-50 text-amber-700 border-amber-200',
    'Nhớ khá ổn': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Đã thuần phục': 'bg-green-100 text-[#173B2B] border-green-300 font-bold',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Mascot Banner */}
      <div className="bg-[#173B2B] text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10 pointer-events-none">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="space-y-2 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#268A59]/40 text-[#BDE5C8] text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Bảo Tàng Từ Vựng Yếu</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Sổ Nhục</h1>
          <p className="text-[#BDE5C8] text-sm md:text-base max-w-xl">
            Những từ đã làm đại ca mất mặt không biết bao nhiêu lần. Hệ thống tự động phân tích và theo dõi tiến độ để thuần phục từng kẻ cứng đầu.
          </p>
        </div>

        {/* Mascot Speech Bubble */}
        <div className="bg-[#FAFBF8] text-[#1D2420] rounded-2xl p-4 shadow-md max-w-xs z-10 relative border border-[#E6EBE6]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E5F3E9] flex items-center justify-center shrink-0 text-[#173B2B] font-black text-sm">
              🦂
            </div>
            <div>
              <p className="text-xs font-bold text-[#173B2B]">Cạp Tổng:</p>
              <p className="text-xs text-[#69756D] mt-0.5">{dialogue.text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#E6EBE6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#69756D] uppercase">Tổng từ trong Sổ</p>
            <p className="text-2xl font-black text-[#1D2420] mt-1">{vocabulary.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E6EBE6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#69756D] uppercase">Đang vật lộn</p>
            <p className="text-2xl font-black text-red-600 mt-1">
              {wordStatsList.filter((i) => i.stats.difficultyStatus === 'Đang vật lộn').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#E6EBE6] shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#69756D] uppercase">Đã thuần phục</p>
            <p className="text-2xl font-black text-[#268A59] mt-1">
              {wordStatsList.filter((i) => i.stats.difficultyStatus === 'Đã thuần phục').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#E5F3E9] text-[#268A59] flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#173B2B] text-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#BDE5C8] uppercase">Ôn tập hôm nay</p>
            <button
              onClick={onStartDailyReview}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-[#268A59] hover:bg-[#1f734a] text-white rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Hôm nay ôn gì?</span>
            </button>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#268A59]/40 text-[#BDE5C8] flex items-center justify-center font-bold">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Lì Lợm Section */}
      {topStubbornWords.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-[#E6EBE6] shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-base font-bold text-[#1D2420]">Top từ lì lợm nhất</h2>
            </div>
            <span className="text-xs font-semibold text-[#69756D]">Cần đặc biệt lưu ý</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topStubbornWords.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedWordForDetail(item)}
                className="p-3.5 rounded-xl bg-[#FAFBF8] border border-[#E6EBE6] hover:border-[#268A59] transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#173B2B] truncate">{item.englishWord}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 font-semibold">
                    {item.stats.incorrectAttempts} lỗi
                  </span>
                </div>
                <p className="text-xs text-[#69756D] truncate">{item.vietnameseDefinition}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#69756D]">
                  <span className="truncate">{item.deckTitle}</span>
                  <span className="text-red-600 font-bold">
                    {item.stats.totalAttempts > 0
                      ? Math.round((item.stats.correctAttempts / item.stats.totalAttempts) * 100)
                      : 0}
                    % đúng
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E6EBE6] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69756D]" />
          <input
            type="text"
            placeholder="Tìm từ vựng hoặc nghĩa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-[#1D2420] focus:ring-1 focus:ring-[#268A59]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Deck Filter */}
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-[#1D2420] font-medium"
          >
            <option value="all">Tất cả bộ từ ({decks.length})</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-[#1D2420] font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Từ mới">Từ mới</option>
            <option value="Đang vật lộn">Đang vật lộn</option>
            <option value="Đang tiến bộ">Đang tiến bộ</option>
            <option value="Nhớ khá ổn">Nhớ khá ổn</option>
            <option value="Đã thuần phục">Đã thuần phục</option>
          </select>

          {/* Sorting */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-[#1D2420] font-medium"
          >
            <option value="mistakes">Nhiều lỗi nhất</option>
            <option value="accuracy">Độ chính xác thấp nhất</option>
            <option value="due">Lịch ôn gần nhất</option>
            <option value="word">Thứ tự A-Z</option>
          </select>
        </div>
      </div>

      {/* Vocabulary Weakness List Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E6EBE6] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E6EBE6] bg-[#FAFBF8] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#173B2B] uppercase tracking-wider">
            Danh sách phân tích từ vựng ({filteredItems.length})
          </h3>
          <span className="text-xs text-[#69756D]">Chạm vào từ để xem chi tiết thống kê học tập</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#E5F3E9] text-[#173B2B] flex items-center justify-center mx-auto text-2xl">
              🌱
            </div>
            <p className="text-sm font-bold text-[#1D2420]">Không tìm thấy từ vựng phù hợp</p>
            <p className="text-xs text-[#69756D]">Thử thay đổi bộ lọc hoặc thêm từ vựng mới vào bộ từ.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E6EBE6]">
            {filteredItems.map((item) => {
              const acc =
                item.stats.totalAttempts > 0
                  ? Math.round((item.stats.correctAttempts / item.stats.totalAttempts) * 100)
                  : 0;
              const badgeClass = difficultyColors[item.stats.difficultyStatus] || 'bg-gray-100 text-gray-700';

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedWordForDetail(item)}
                  className="p-4 hover:bg-[#FAFBF8] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-bold text-[#1D2420]">{item.englishWord}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                        {item.stats.difficultyStatus}
                      </span>
                      <span className="text-xs font-medium text-[#69756D] bg-gray-100 px-2 py-0.5 rounded-md">
                        {item.deckTitle}
                      </span>
                    </div>
                    <p className="text-xs text-[#69756D]">
                      <strong>Nghĩa:</strong> {item.vietnameseDefinition}
                      {item.exampleSentence && (
                        <span className="italic ml-2 text-gray-500">"{item.exampleSentence}"</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end text-xs">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#69756D] uppercase">Thử thách</p>
                      <p className="font-bold text-[#1D2420]">{item.stats.totalAttempts} lần</p>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#69756D] uppercase">Độ chính xác</p>
                      <p className={`font-bold ${acc < 50 && item.stats.totalAttempts > 0 ? 'text-red-600' : 'text-[#268A59]'}`}>
                        {item.stats.totalAttempts > 0 ? `${acc}%` : 'Chưa học'}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#69756D] uppercase">Lỗi sai / Lần quên</p>
                      <p className="font-bold text-red-600">{item.stats.incorrectAttempts} / {item.stats.lapseCount}</p>
                    </div>

                    <div className="text-center hidden sm:block">
                      <p className="text-[10px] font-bold text-[#69756D] uppercase">Giai đoạn SRS</p>
                      <p className="font-bold text-[#173B2B]">Stage {item.stats.stage} (đợi {SRS_INTERVALS[item.stats.stage]} ngày)</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Word Detail Modal */}
      {selectedWordForDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-[#E6EBE6] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4">
              <div>
                <span className="text-xs font-bold text-[#268A59] uppercase">{selectedWordForDetail.deckTitle}</span>
                <h3 className="text-xl font-black text-[#1D2420] mt-0.5">{selectedWordForDetail.englishWord}</h3>
              </div>
              <button
                onClick={() => setSelectedWordForDetail(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FAFBF8] p-4 rounded-2xl border border-[#E6EBE6] space-y-2">
                <p className="text-xs text-[#69756D]"><strong>Định nghĩa:</strong> {selectedWordForDetail.vietnameseDefinition}</p>
                {selectedWordForDetail.partOfSpeech && (
                  <p className="text-xs text-[#69756D]"><strong>Từ loại:</strong> {selectedWordForDetail.partOfSpeech}</p>
                )}
                {selectedWordForDetail.exampleSentence && (
                  <p className="text-xs text-[#69756D] italic"><strong>Ví dụ:</strong> "{selectedWordForDetail.exampleSentence}"</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E5F3E9]/50 p-3.5 rounded-2xl border border-[#BDE5C8]">
                  <p className="text-[10px] font-bold text-[#173B2B] uppercase">Trạng thái độ khó</p>
                  <p className="text-sm font-black text-[#173B2B] mt-1">{selectedWordForDetail.stats.difficultyStatus}</p>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-2xl border border-[#E6EBE6]">
                  <p className="text-[10px] font-bold text-[#69756D] uppercase">Giai đoạn SRS (Stage)</p>
                  <p className="text-sm font-black text-[#1D2420] mt-1">
                    Stage {selectedWordForDetail.stats.stage} ({SRS_INTERVALS[selectedWordForDetail.stats.stage]} ngày)
                  </p>
                </div>
              </div>

              {/* Mode Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#1D2420]">Hiệu suất theo từng chế độ học:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedWordForDetail.stats.modeStats).map(([mode, data]: [string, { attempts: number; correct: number; incorrect: number }]) => {
                    const modeNames: Record<string, string> = {
                      flashcard: 'Flashcard',
                      matching: 'Nối từ',
                      typing: 'Gõ từ',
                      meaning_ai: 'AI Nghĩa',
                      sentence_ai: 'AI Đặt câu',
                    };
                    const total = data.attempts;
                    const correct = data.correct;
                    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                    return (
                      <div key={mode} className="bg-[#FAFBF8] p-2.5 rounded-xl border border-[#E6EBE6] flex items-center justify-between">
                        <span className="font-medium text-[#69756D]">{modeNames[mode] || mode}</span>
                        <span className="font-bold text-[#1D2420]">
                          {total > 0 ? `${correct}/${total} (${pct}%)` : 'Chưa học'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6EBE6]">
              <button
                onClick={() => setSelectedWordForDetail(null)}
                className="px-4 py-2.5 text-xs font-bold text-[#69756D] hover:bg-gray-100 rounded-xl transition-colors"
              >
                Đóng
              </button>
              {onStudyWord && (
                <button
                  onClick={() => {
                    const wordId = selectedWordForDetail.id;
                    setSelectedWordForDetail(null);
                    onStudyWord(wordId);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ôn từ này ngay</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
