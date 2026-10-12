import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Volume2 } from 'lucide-react';
import { Deck, VocabularyItem } from '../../types';

interface VocabularyModalProps {
  isOpen: boolean;
  decks: Deck[];
  defaultDeckId?: string;
  itemToEdit?: VocabularyItem | null;
  existingItemsInDeck?: VocabularyItem[];
  onClose: () => void;
  onSave: (itemData: Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>) => void;
}

const PART_OF_SPEECH_OPTIONS = [
  { value: 'noun', label: 'noun (danh từ)' },
  { value: 'verb', label: 'verb (động từ)' },
  { value: 'adj', label: 'adj (tính từ)' },
  { value: 'adv', label: 'adv (trạng từ)' },
  { value: 'idiom', label: 'idiom (thành ngữ)' },
  { value: 'phrasal_verb', label: 'phrasal verb (cụm động từ)' },
  { value: 'collocation', label: 'collocation' },
  { value: 'other', label: 'khác' },
];

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  decks,
  defaultDeckId,
  itemToEdit,
  existingItemsInDeck = [],
  onClose,
  onSave,
}) => {
  const [deckId, setDeckId] = useState(defaultDeckId || (decks[0]?.id ?? ''));
  const [englishWord, setEnglishWord] = useState('');
  const [vietnameseDefinition, setVietnameseDefinition] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [exampleSentence, setExampleSentence] = useState('');
  const [notes, setNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setDeckId(itemToEdit.deckId);
      setEnglishWord(itemToEdit.englishWord);
      setVietnameseDefinition(itemToEdit.vietnameseDefinition);
      setPartOfSpeech(itemToEdit.partOfSpeech || 'noun');
      setExampleSentence(itemToEdit.exampleSentence || '');
      setNotes(itemToEdit.notes || '');
    } else {
      setDeckId(defaultDeckId || (decks[0]?.id ?? ''));
      setEnglishWord('');
      setVietnameseDefinition('');
      setPartOfSpeech('noun');
      setExampleSentence('');
      setNotes('');
    }
    setDuplicateWarning(null);
    setValidationError('');
  }, [itemToEdit, defaultDeckId, decks, isOpen]);

  // Check duplicate on englishWord change
  useEffect(() => {
    if (!englishWord.trim() || itemToEdit) {
      setDuplicateWarning(null);
      return;
    }
    const cleanWord = englishWord.trim().toLowerCase();
    const dup = existingItemsInDeck.find(
      (item) => item.englishWord.trim().toLowerCase() === cleanWord
    );

    if (dup) {
      setDuplicateWarning(
        `Từ "${dup.englishWord}" đã có sẵn trong bộ này với nghĩa: "${dup.vietnameseDefinition}". Lưu sẽ cập nhật thêm từ mới.`
      );
    } else {
      setDuplicateWarning(null);
    }
  }, [englishWord, existingItemsInDeck, itemToEdit]);

  if (!isOpen) return null;

  const handleTestAudio = () => {
    if (!englishWord.trim()) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(englishWord.trim());
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = englishWord.trim();
    const cleanDef = vietnameseDefinition.trim();

    if (!deckId) {
      setValidationError('Vui lòng chọn bộ từ để lưu.');
      return;
    }
    if (!cleanWord) {
      setValidationError('Đại ca chưa điền từ tiếng Anh.');
      return;
    }
    if (!cleanDef) {
      setValidationError('Đại ca chưa điền định nghĩa tiếng Việt.');
      return;
    }

    onSave({
      deckId,
      englishWord: cleanWord,
      vietnameseDefinition: cleanDef,
      partOfSpeech,
      exampleSentence: exampleSentence.trim(),
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1D2420]">
                {itemToEdit ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}
              </h3>
              <p className="text-xs text-[#69756D]">
                Thêm đi đại ca, biết đâu mai nhớ được
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#69756D] hover:text-[#1D2420] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Deck select */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Lưu vào bộ từ <span className="text-red-500">*</span>
            </label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420]"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {/* English word + speech preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#173B2B]">
                Từ tiếng Anh <span className="text-red-500">*</span>
              </label>
              {englishWord.trim() && (
                <button
                  type="button"
                  onClick={handleTestAudio}
                  className="text-xs text-[#268A59] hover:underline flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe phát âm</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              value={englishWord}
              onChange={(e) => {
                setEnglishWord(e.target.value);
                setValidationError('');
              }}
              placeholder="VD: inevitable, enhance, bite the bullet..."
              className="w-full px-3.5 py-2.5 text-sm font-semibold bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420]"
            />
          </div>

          {/* Vietnamese definition */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Định nghĩa tiếng Việt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vietnameseDefinition}
              onChange={(e) => {
                setVietnameseDefinition(e.target.value);
                setValidationError('');
              }}
              placeholder="VD: không thể tránh khỏi, chắc chắn xảy ra..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420]"
            />
          </div>

          {/* Part of speech */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Từ loại
            </label>
            <select
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420]"
            >
              {PART_OF_SPEECH_OPTIONS.map((pos) => (
                <option key={pos.value} value={pos.value}>
                  {pos.label}
                </option>
              ))}
            </select>
          </div>

          {/* Example sentence */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Câu ví dụ (tuỳ chọn)
            </label>
            <textarea
              rows={2}
              value={exampleSentence}
              onChange={(e) => setExampleSentence(e.target.value)}
              placeholder="VD: Technological change is an inevitable process."
              className="w-full px-3.5 py-2 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420] resize-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Ghi chú thêm (tuỳ chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Collocation đi kèm, mẹo nhớ từ, từ đồng nghĩa..."
              className="w-full px-3.5 py-2 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E6EBE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-[#173B2B] hover:bg-[#268A59] rounded-lg transition-colors shadow-xs"
            >
              {itemToEdit ? 'Lưu cập nhật' : 'Nhập kho từ vựng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
