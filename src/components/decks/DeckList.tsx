import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  MoreVertical,
  Edit2,
  Trash2,
  FolderOpen,
  ArrowUpDown,
  UploadCloud,
} from 'lucide-react';
import { Deck, VocabularyItem } from '../../types';
import { CapTongMascot } from '../mascot/CapTongMascot';

interface DeckListProps {
  decks: Deck[];
  vocabulary: VocabularyItem[];
  onCreateDeck: () => void;
  onOpenDeck: (deckId: string) => void;
  onEditDeck: (deck: Deck) => void;
  onDeleteDeck: (deck: Deck) => void;
  onStudyDeck: (deckId: string) => void;
  onBulkAddDeck: (deckId: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'most_words' | 'alphabetical';

export const DeckList: React.FC<DeckListProps> = ({
  decks,
  vocabulary,
  onCreateDeck,
  onOpenDeck,
  onEditDeck,
  onDeleteDeck,
  onStudyDeck,
  onBulkAddDeck,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeMenuDeckId, setActiveMenuDeckId] = useState<string | null>(null);

  // Map word counts per deck
  const deckWordCounts = useMemo(() => {
    const map: Record<string, number> = {};
    vocabulary.forEach((v) => {
      map[v.deckId] = (map[v.deckId] || 0) + 1;
    });
    return map;
  }, [vocabulary]);

  // Filter and sort decks
  const processedDecks = useMemo(() => {
    let list = decks.filter(
      (d) =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'oldest':
        list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'most_words':
        list.sort((a, b) => (deckWordCounts[b.id] || 0) - (deckWordCounts[a.id] || 0));
        break;
      case 'alphabetical':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return list;
  }, [decks, searchTerm, sortBy, deckWordCounts]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#173B2B] tracking-tight">
            Bộ từ của đại ca
          </h1>
          <p className="mt-1 text-sm text-[#69756D]">
            Quản lý các danh mục từ vựng tiếng Anh theo chủ đề hoặc tài liệu ôn luyện.
          </p>
        </div>

        <button
          onClick={onCreateDeck}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bộ từ mới</span>
        </button>
      </div>

      {/* Toolbar: Search and Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#69756D] absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bộ từ..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] text-[#1D2420]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-[#69756D]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs font-semibold px-3 py-2 bg-white border border-[#E6EBE6] rounded-xl text-[#1D2420] focus:outline-none focus:border-[#268A59]"
          >
            <option value="newest">Cập nhật gần nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="most_words">Nhiều từ vựng nhất</option>
            <option value="alphabetical">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {processedDecks.length === 0 ? (
        <div className="bg-white border border-[#E6EBE6] rounded-3xl p-12 text-center max-w-xl mx-auto">
          <div className="flex justify-center mb-4">
            <CapTongMascot expression="smug" size="lg" />
          </div>
          <h3 className="text-xl font-bold text-[#1D2420]">
            {searchTerm ? 'Không tìm thấy bộ từ phù hợp' : 'Chưa có bộ từ nào cả!'}
          </h3>
          <p className="mt-2 text-sm text-[#69756D] leading-relaxed">
            {searchTerm
              ? 'Thử tìm với từ khoá khác hoặc tạo bộ từ mới nhé đại ca.'
              : 'Trống trơn thế này thì học cái gì hả đại ca? Mau tạo một bộ từ mới rồi nạp từ vựng vào nào!'}
          </p>
          <button
            onClick={onCreateDeck}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo bộ từ đầu tiên</span>
          </button>
        </div>
      ) : (
        /* Grid of Deck Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedDecks.map((deck) => {
            const count = deckWordCounts[deck.id] || 0;
            const isMenuOpen = activeMenuDeckId === deck.id;

            return (
              <div
                key={deck.id}
                className="bg-white border border-[#E6EBE6] hover:border-[#268A59]/40 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Card top banner */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: deck.color || '#173B2B' }}
                      />
                      <h3
                        onClick={() => onOpenDeck(deck.id)}
                        className="text-lg font-bold text-[#173B2B] hover:text-[#268A59] truncate cursor-pointer transition-colors"
                      >
                        {deck.title}
                      </h3>
                    </div>

                    {/* Context menu button */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuDeckId(isMenuOpen ? null : deck.id)}
                        className="p-1.5 text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] rounded-lg transition-colors"
                        title="Tuỳ chọn"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div
                          onMouseLeave={() => setActiveMenuDeckId(null)}
                          className="absolute right-0 top-8 z-20 w-44 bg-white border border-[#E6EBE6] rounded-xl shadow-lg py-1 text-xs"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuDeckId(null);
                              onEditDeck(deck);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAFBF8] text-[#1D2420]"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#69756D]" />
                            <span>Sửa thông tin</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuDeckId(null);
                              onBulkAddDeck(deck.id);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAFBF8] text-[#1D2420]"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-[#268A59]" />
                            <span>Nhập hàng loạt (Bulk)</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuDeckId(null);
                              onDeleteDeck(deck);
                            }}
                            className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xoá bộ từ này</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-2 text-xs text-[#69756D] line-clamp-2 leading-relaxed min-h-[32px]">
                    {deck.description || 'Chưa có mô tả cho bộ từ này.'}
                  </p>
                </div>

                {/* Footer of card */}
                <div className="mt-5 pt-4 border-t border-[#E6EBE6] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#173B2B] font-mono tabular-nums">
                    {count} từ vựng
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDeck(deck.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#1D2420] hover:text-[#173B2B] hover:bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg transition-colors"
                      title="Mở danh sách từ"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Xem từ</span>
                    </button>

                    <button
                      onClick={() => onStudyDeck(deck.id)}
                      disabled={count === 0}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                        count > 0
                          ? 'bg-[#173B2B] hover:bg-[#268A59] text-white cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      }`}
                      title={count > 0 ? 'Bắt đầu học Flashcard' : 'Bộ từ chưa có từ nào'}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Luyện</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
