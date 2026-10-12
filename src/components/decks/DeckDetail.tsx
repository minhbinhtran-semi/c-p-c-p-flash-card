import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  UploadCloud,
  BookOpen,
  Volume2,
  Trash2,
  Edit2,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Deck, VocabularyItem } from '../../types';

interface DeckDetailProps {
  deck: Deck;
  vocabulary: VocabularyItem[];
  onBack: () => void;
  onAddWord: () => void;
  onBulkAdd: () => void;
  onAiQuickAdd?: () => void;
  onEditWord: (item: VocabularyItem) => void;
  onDeleteWord: (item: VocabularyItem) => void;
  onStartStudy: (
    deckId: string,
    mode?: 'flashcard' | 'matching' | 'typing' | 'meaning_ai' | 'sentence_ai'
  ) => void;
}

export const DeckDetail: React.FC<DeckDetailProps> = ({
  deck,
  vocabulary,
  onBack,
  onAddWord,
  onBulkAdd,
  onAiQuickAdd,
  onEditWord,
  onDeleteWord,
  onStartStudy,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMastery, setFilterMastery] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');

  const deckVocab = useMemo(() => {
    return vocabulary.filter((v) => v.deckId === deck.id);
  }, [vocabulary, deck.id]);

  const filteredVocab = useMemo(() => {
    return deckVocab.filter((item) => {
      const matchSearch =
        item.englishWord.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vietnameseDefinition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.exampleSentence && item.exampleSentence.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMastery =
        filterMastery === 'all' || item.masteryLevel === filterMastery;

      return matchSearch && matchMastery;
    });
  }, [deckVocab, searchTerm, filterMastery]);

  const handlePronounce = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Deck Banner */}
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="mt-0.5 p-2 text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] rounded-xl border border-[#E6EBE6] transition-colors"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#173B2B]">
                  {deck.title}
                </h1>
                <span className="text-xs text-[#69756D] font-mono tabular-nums">
                  · {deckVocab.length} từ vựng
                </span>
              </div>
              {deck.description && (
                <p className="mt-1 text-sm text-[#69756D] max-w-2xl">
                  {deck.description}
                </p>
              )}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onStartStudy(deck.id, 'flashcard')}
              disabled={deckVocab.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-colors shadow-xs ${
                deckVocab.length > 0
                  ? 'bg-[#173B2B] hover:bg-[#268A59] text-white cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Ôn Flashcard</span>
            </button>

            <button
              onClick={onAddWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-[#173B2B] bg-[#E5F3E9] hover:bg-[#BDE5C8] rounded-xl transition-colors cursor-pointer"
              title="Thêm thủ công"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm thủ công</span>
            </button>

            <button
              onClick={onBulkAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] bg-white rounded-xl transition-colors cursor-pointer"
              title="Dán từ và nghĩa"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Dán từ và nghĩa</span>
              <span className="sm:hidden">Bulk</span>
            </button>

            <button
              onClick={onAiQuickAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-white bg-[#268A59] hover:bg-[#1f734a] rounded-xl transition-colors cursor-pointer shadow-xs"
              title="AI tự điền nghĩa — Cạp Tổng tra từ hộ"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI tự điền nghĩa</span>
            </button>
          </div>
        </div>

        {/* Learning Mode Selection (5 Modes specified in Milestone 1.2) */}
        <div className="mt-6 pt-5 border-t border-[#E6EBE6]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#173B2B] block mb-3">
            Chọn chế độ luyện tập từ vựng:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Mode 1: Traditional Flashcards */}
            <div
              onClick={() => deckVocab.length > 0 && onStartStudy(deck.id, 'flashcard')}
              role="button"
              tabIndex={deckVocab.length > 0 ? 0 : undefined}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                deckVocab.length > 0
                  ? 'bg-white border-[#E6EBE6] hover:border-[#268A59] hover:shadow-xs cursor-pointer group'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-xl group-hover:bg-[#268A59] group-hover:text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md uppercase">
                    Khả dụng
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#173B2B] group-hover:text-[#268A59] transition-colors">
                  Flashcard
                </h4>
                <p className="mt-1 text-xs text-[#69756D] line-clamp-2">
                  Lật thẻ 3D ghi nhớ mặt chữ, từ loại và nghĩa.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E6EBE6] text-[11px] font-semibold text-[#173B2B] flex items-center justify-between">
                <span>Vào ôn ngay</span>
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>

            {/* Mode 2: Ghép Cặp Đại Chiến (Matching Pairs) */}
            <div
              onClick={() => deckVocab.length >= 2 && onStartStudy(deck.id, 'matching')}
              role="button"
              tabIndex={deckVocab.length >= 2 ? 0 : undefined}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                deckVocab.length >= 2
                  ? 'bg-white border-[#E6EBE6] hover:border-[#268A59] hover:shadow-xs cursor-pointer group'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-xl group-hover:bg-[#268A59] group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md uppercase">
                    Khả dụng
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#173B2B] group-hover:text-[#268A59] transition-colors">
                  Ghép Cặp Đại Chiến
                </h4>
                <p className="mt-1 text-xs text-[#69756D] line-clamp-2">
                  Nối từ tiếng Anh với nghĩa tương ứng theo hiệp.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E6EBE6] text-[11px] font-semibold text-[#173B2B] flex items-center justify-between">
                <span>Chơi game</span>
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>

            {/* Mode 3: Gõ Đi Đại Ca (Typing Challenge) */}
            <div
              onClick={() => deckVocab.length > 0 && onStartStudy(deck.id, 'typing')}
              role="button"
              tabIndex={deckVocab.length > 0 ? 0 : undefined}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                deckVocab.length > 0
                  ? 'bg-white border-[#E6EBE6] hover:border-[#268A59] hover:shadow-xs cursor-pointer group'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-xl group-hover:bg-[#268A59] group-hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md uppercase">
                    Khả dụng
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#173B2B] group-hover:text-[#268A59] transition-colors">
                  Gõ Đi Đại Ca
                </h4>
                <p className="mt-1 text-xs text-[#69756D] line-clamp-2">
                  Nhìn nghĩa gõ từ chuẩn xác, có gợi ý chữ cái.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E6EBE6] text-[11px] font-semibold text-[#173B2B] flex items-center justify-between">
                <span>Gõ thử thách</span>
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>

            {/* Mode 4: AI Chấm Nghĩa */}
            <div
              onClick={() => deckVocab.length > 0 && onStartStudy(deck.id, 'meaning_ai')}
              role="button"
              tabIndex={deckVocab.length > 0 ? 0 : undefined}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                deckVocab.length > 0
                  ? 'bg-white border-[#E6EBE6] hover:border-[#268A59] hover:shadow-xs cursor-pointer group'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-xl group-hover:bg-[#268A59] group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md uppercase">
                    Gemini AI
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#173B2B] group-hover:text-[#268A59] transition-colors">
                  AI Chấm Nghĩa
                </h4>
                <p className="mt-1 text-xs text-[#69756D] line-clamp-2">
                  Giải nghĩa theo cách hiểu của đại ca với Gemini AI.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E6EBE6] text-[11px] font-semibold text-[#173B2B] flex items-center justify-between">
                <span>Vào thử thách</span>
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>

            {/* Mode 5: Thử Thách Đặt Câu */}
            <div
              onClick={() => deckVocab.length > 0 && onStartStudy(deck.id, 'sentence_ai')}
              role="button"
              tabIndex={deckVocab.length > 0 ? 0 : undefined}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                deckVocab.length > 0
                  ? 'bg-white border-[#E6EBE6] hover:border-[#268A59] hover:shadow-xs cursor-pointer group'
                  : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-xl group-hover:bg-[#268A59] group-hover:text-white transition-colors">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-[#268A59] bg-[#E5F3E9] px-2 py-0.5 rounded-md uppercase">
                    Gemini AI
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#173B2B] group-hover:text-[#268A59] transition-colors">
                  Thử Thách Đặt Câu
                </h4>
                <p className="mt-1 text-xs text-[#69756D] line-clamp-2">
                  Viết câu chứa từ vựng và nhận điểm 4 tiêu chí.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E6EBE6] text-[11px] font-semibold text-[#173B2B] flex items-center justify-between">
                <span>Luyện viết câu</span>
                <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#69756D] absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] text-[#1D2420]"
          />
        </div>

        {/* Filter segment tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] border border-[#E6EBE6] rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterMastery('all')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMastery === 'all'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B]'
            }`}
          >
            Tất cả ({deckVocab.length})
          </button>
          <button
            onClick={() => setFilterMastery('mastered')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMastery === 'mastered'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B]'
            }`}
          >
            Đã nhớ ({deckVocab.filter((v) => v.masteryLevel === 'mastered').length})
          </button>
          <button
            onClick={() => setFilterMastery('learning')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMastery === 'learning'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B]'
            }`}
          >
            Đang học ({deckVocab.filter((v) => v.masteryLevel === 'learning').length})
          </button>
          <button
            onClick={() => setFilterMastery('new')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMastery === 'new'
                ? 'bg-[#173B2B] text-white shadow-xs'
                : 'text-[#69756D] hover:text-[#173B2B]'
            }`}
          >
            Từ mới ({deckVocab.filter((v) => v.masteryLevel === 'new').length})
          </button>
        </div>
      </div>

      {/* Vocabulary List */}
      {filteredVocab.length === 0 ? (
        <div className="bg-white border border-[#E6EBE6] rounded-2xl p-12 text-center">
          <p className="text-base font-medium text-[#1D2420]">
            {searchTerm || filterMastery !== 'all'
              ? 'Không tìm thấy từ vựng nào khớp với bộ lọc.'
              : 'Bộ từ này chưa có từ nào. Hãy thêm từ vựng để bắt đầu!'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={onAddWord}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm từ đầu tiên</span>
            </button>
            <button
              onClick={onBulkAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#1D2420] border border-[#E6EBE6] bg-white rounded-xl hover:bg-[#FAFBF8] transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Dán danh sách (Bulk)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVocab.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#E6EBE6] hover:border-[#268A59]/40 rounded-2xl p-4 sm:p-5 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                {/* Header row with word, audio, and actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg font-extrabold text-[#173B2B] truncate tracking-tight">
                      {item.englishWord}
                    </span>
                    <button
                      onClick={() => handlePronounce(item.englishWord)}
                      className="p-1.5 text-[#268A59] hover:bg-[#E5F3E9] rounded-lg transition-colors"
                      title="Phát âm tiếng Anh"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditWord(item)}
                      className="p-1.5 text-[#69756D] hover:text-[#173B2B] hover:bg-[#FAFBF8] rounded-lg transition-colors"
                      title="Sửa từ này"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteWord(item)}
                      className="p-1.5 text-[#69756D] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xoá từ này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Part of speech & Vietnamese definition */}
                <div className="mt-1 flex items-baseline gap-2">
                  {item.partOfSpeech && (
                    <span className="text-xs font-semibold text-[#69756D] italic shrink-0">
                      ({item.partOfSpeech})
                    </span>
                  )}
                  <p className="text-sm font-medium text-[#1D2420]">
                    {item.vietnameseDefinition}
                  </p>
                </div>

                {/* Example sentence */}
                {item.exampleSentence && (
                  <div className="mt-3 p-2.5 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-xs text-[#1D2420]">
                    <span className="font-semibold text-[#173B2B] block mb-0.5">Ví dụ:</span>
                    "{item.exampleSentence}"
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="mt-2 text-xs text-[#69756D] italic">
                    Ghi chú: {item.notes}
                  </p>
                )}
              </div>

              {/* Card Footer: Metadata and Mastery */}
              <div className="mt-4 pt-3 border-t border-[#E6EBE6] flex items-center justify-between text-xs text-[#69756D]">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      item.masteryLevel === 'mastered'
                        ? 'text-[#268A59]'
                        : item.masteryLevel === 'learning'
                        ? 'text-amber-700'
                        : 'text-[#69756D]'
                    }`}
                  >
                    {item.masteryLevel === 'mastered'
                      ? 'Đã nhớ'
                      : item.masteryLevel === 'learning'
                      ? 'Đang học'
                      : 'Từ mới'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-mono">
                    Đã xem {item.reviewCount} lần
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
