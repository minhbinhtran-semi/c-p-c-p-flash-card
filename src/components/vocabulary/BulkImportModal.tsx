import React, { useState, useMemo } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { Deck, VocabularyItem } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  decks: Deck[];
  defaultDeckId?: string;
  existingItemsInDeck?: VocabularyItem[];
  onClose: () => void;
  onImport: (items: Array<Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>>) => void;
}

interface ParsedLine {
  lineNumber: number;
  rawText: string;
  status: 'valid' | 'duplicate' | 'invalid';
  word?: string;
  definition?: string;
  errorMessage?: string;
}

const SAMPLE_TEXT = `die | chết
enhance | cải thiện, nâng cao
mitigate | giảm thiểu rủi ro, tác hại
substantial | đáng kể, số lượng lớn
inevitable | không thể tránh khỏi`;

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  decks,
  defaultDeckId,
  existingItemsInDeck = [],
  onClose,
  onImport,
}) => {
  const [deckId, setDeckId] = useState(defaultDeckId || (decks[0]?.id ?? ''));
  const [rawInput, setRawInput] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);

  // Synchronize defaultDeckId
  React.useEffect(() => {
    if (defaultDeckId) {
      setDeckId(defaultDeckId);
    } else if (decks[0]?.id && !deckId) {
      setDeckId(decks[0].id);
    }
  }, [defaultDeckId, decks]);

  // Real-time parser
  const parsedResults = useMemo(() => {
    const lines = rawInput.split('\n');
    const existingLowerWords = new Set(
      existingItemsInDeck.map((item) => item.englishWord.trim().toLowerCase())
    );
    const seenInCurrentBatch = new Set<string>();

    const results: ParsedLine[] = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // Ignore truly empty lines
      if (!trimmed) return;

      const delimiterIndex = trimmed.indexOf('|');
      if (delimiterIndex === -1) {
        results.push({
          lineNumber: lineNum,
          rawText: trimmed,
          status: 'invalid',
          errorMessage: 'Thiếu dấu gạch đứng "|" để phân tách giữa từ và nghĩa.',
        });
        return;
      }

      const word = trimmed.slice(0, delimiterIndex).trim();
      const definition = trimmed.slice(delimiterIndex + 1).trim();

      if (!word) {
        results.push({
          lineNumber: lineNum,
          rawText: trimmed,
          status: 'invalid',
          errorMessage: 'Thiếu từ tiếng Anh trước dấu "|".',
        });
        return;
      }

      if (!definition) {
        results.push({
          lineNumber: lineNum,
          rawText: trimmed,
          status: 'invalid',
          errorMessage: 'Thiếu định nghĩa tiếng Việt sau dấu "|".',
        });
        return;
      }

      const lowerWord = word.toLowerCase();
      const isDuplicate = existingLowerWords.has(lowerWord) || seenInCurrentBatch.has(lowerWord);

      seenInCurrentBatch.add(lowerWord);

      if (isDuplicate) {
        results.push({
          lineNumber: lineNum,
          rawText: trimmed,
          status: 'duplicate',
          word,
          definition,
          errorMessage: 'Từ đã tồn tại trong bộ từ hiện tại hoặc trùng trong danh sách.',
        });
      } else {
        results.push({
          lineNumber: lineNum,
          rawText: trimmed,
          status: 'valid',
          word,
          definition,
        });
      }
    });

    return results;
  }, [rawInput, existingItemsInDeck]);

  const validEntries = parsedResults.filter((r) => r.status === 'valid');
  const duplicateEntries = parsedResults.filter((r) => r.status === 'duplicate');
  const invalidEntries = parsedResults.filter((r) => r.status === 'invalid');

  const itemsReadyToImport = skipDuplicates
    ? validEntries
    : [...validEntries, ...duplicateEntries];

  if (!isOpen) return null;

  const handleInsertSample = () => {
    setRawInput((prev) => (prev ? `${prev}\n${SAMPLE_TEXT}` : SAMPLE_TEXT));
  };

  const handleConfirmImport = () => {
    if (!deckId) return;
    if (itemsReadyToImport.length === 0) return;

    const payload = itemsReadyToImport.map((entry) => ({
      deckId,
      englishWord: entry.word!,
      vietnameseDefinition: entry.definition!,
      partOfSpeech: 'other',
      exampleSentence: '',
      notes: '',
    }));

    onImport(payload);
    setRawInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl w-full max-w-3xl p-6 shadow-xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E5F3E9] text-[#173B2B] rounded-lg">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1D2420]">
                Nhập từ hàng loạt (Bulk Import)
              </h3>
              <p className="text-xs text-[#69756D]">
                Dán danh sách từ theo định dạng <code className="bg-[#FAFBF8] px-1 py-0.5 rounded text-[#173B2B] font-mono">từ | định nghĩa</code>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Deck Selector & Sample Filler */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-sm">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-1">
                Lưu vào bộ từ:
              </label>
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] text-[#1D2420]"
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleInsertSample}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#268A59] hover:text-[#173B2B] hover:bg-[#E5F3E9] px-3 py-1.5 rounded-lg border border-[#E6EBE6] self-start sm:self-end transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dán mẫu thử</span>
            </button>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#173B2B]">
                Danh sách từ vựng (mỗi từ 1 dòng)
              </label>
              <span className="text-xs text-[#69756D]">
                Đã nhập {parsedResults.length} dòng
              </span>
            </div>
            <textarea
              rows={7}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="die | chết&#10;enhance | cải thiện, nâng cao&#10;mitigate | giảm thiểu&#10;substantial | đáng kể&#10;inevitable | không thể tránh khỏi"
              className="w-full font-mono text-sm px-3.5 py-3 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl focus:outline-none focus:border-[#268A59] focus:bg-white text-[#1D2420] resize-y"
            />
          </div>

          {/* Real-time Summary Counters */}
          {parsedResults.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#E5F3E9] border border-[#BDE5C8] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-[#173B2B] block">Hợp lệ</span>
                  <span className="text-lg font-bold text-[#173B2B] tabular-nums">
                    {validEntries.length}
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-[#268A59]" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-800 block">Đã có / Trùng</span>
                  <span className="text-lg font-bold text-amber-800 tabular-nums">
                    {duplicateEntries.length}
                  </span>
                </div>
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-red-800 block">Lỗi cú pháp</span>
                  <span className="text-lg font-bold text-red-800 tabular-nums">
                    {invalidEntries.length}
                  </span>
                </div>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          )}

          {/* Duplicate toggle */}
          {duplicateEntries.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
              <input
                type="checkbox"
                id="skipDupes"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="rounded border-amber-300 text-[#173B2B] focus:ring-0"
              />
              <label htmlFor="skipDupes" className="cursor-pointer font-medium">
                Bỏ qua {duplicateEntries.length} từ đã trùng lặp (không ghi đè)
              </label>
            </div>
          )}

          {/* Invalid lines alert */}
          {invalidEntries.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5 text-xs text-red-700">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Có {invalidEntries.length} dòng không đúng cú pháp (sẽ bị bỏ qua):</span>
              </div>
              <ul className="list-disc list-inside space-y-1 pl-1 max-h-24 overflow-y-auto">
                {invalidEntries.map((inv) => (
                  <li key={inv.lineNumber}>
                    Dòng {inv.lineNumber}: <span className="font-mono">"{inv.rawText}"</span> — {inv.errorMessage}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          {itemsReadyToImport.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#173B2B] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Xem trước từ sẽ nhập ({itemsReadyToImport.length} từ)</span>
              </h4>
              <div className="max-h-48 overflow-y-auto border border-[#E6EBE6] rounded-xl bg-[#FAFBF8] divide-y divide-[#E6EBE6]">
                {itemsReadyToImport.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2 text-xs flex items-center justify-between gap-4 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#69756D] font-mono text-[11px] w-6 shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#173B2B] truncate">
                        {item.word}
                      </span>
                    </div>
                    <span className="text-[#1D2420] text-right truncate max-w-xs">
                      {item.definition}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E6EBE6] flex items-center justify-between shrink-0">
          <p className="text-xs text-[#69756D]">
            {itemsReadyToImport.length > 0
              ? `Chuẩn bị thêm ${itemsReadyToImport.length} từ vào kho.`
              : 'Dán ít nhất một dòng từ | nghĩa để tiếp tục.'}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#1D2420] hover:bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg transition-colors"
            >
              Huỷ
            </button>
            <button
              type="button"
              disabled={itemsReadyToImport.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors shadow-xs ${
                itemsReadyToImport.length > 0
                  ? 'bg-[#173B2B] hover:bg-[#268A59] text-white cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Nhập {itemsReadyToImport.length} từ vựng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
