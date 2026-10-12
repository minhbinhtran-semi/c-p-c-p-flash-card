import React, { useState, useEffect } from 'react';
import { X, Layers } from 'lucide-react';
import { Deck } from '../../types';

interface DeckModalProps {
  isOpen: boolean;
  deckToEdit?: Deck | null;
  onClose: () => void;
  onSave: (deckData: { title: string; description: string; color: string }) => void;
}

const COLOR_OPTIONS = [
  '#173B2B', // Deep green
  '#268A59', // Accent green
  '#D9AA54', // Rank gold
  '#0284C7', // Azure
  '#9333EA', // Purple
  '#E11D48', // Rose
];

export const DeckModal: React.FC<DeckModalProps> = ({
  isOpen,
  deckToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#173B2B');
  const [error, setError] = useState('');

  useEffect(() => {
    if (deckToEdit) {
      setTitle(deckToEdit.title);
      setDescription(deckToEdit.description || '');
      setColor(deckToEdit.color || '#173B2B');
    } else {
      setTitle('');
      setDescription('');
      setColor('#173B2B');
    }
    setError('');
  }, [deckToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Đại ca vui lòng đặt tên cho bộ từ nhé!');
      return;
    }
    onSave({
      title: trimmedTitle,
      description: description.trim(),
      color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1D2420]">
                {deckToEdit ? 'Chỉnh sửa bộ từ' : 'Tạo bộ từ vựng mới'}
              </h3>
              <p className="text-xs text-[#69756D]">
                {deckToEdit
                  ? 'Sửa tên hoặc mô tả để dễ quản lý'
                  : 'Đặt tên cho tử tế, đừng lại "Đề cương final v7"'}
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Tên bộ từ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="VD: IELTS Writing Task 2, Từ vựng chuyên ngành IT..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white transition-all text-[#1D2420]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1.5">
              Mô tả ghi chú (tuỳ chọn)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả mục tiêu học tập, nguồn tài liệu hoặc ghi chú dặn dò..."
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white transition-all text-[#1D2420] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-2">
              Màu đại diện
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-110 border-[#1D2420]' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Màu ${c}`}
                />
              ))}
            </div>
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
              {deckToEdit ? 'Lưu thay đổi' : 'Tạo bộ từ ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
