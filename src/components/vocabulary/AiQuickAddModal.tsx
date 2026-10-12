import React, { useState, useMemo } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Loader2, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { Deck, VocabularyItem } from '../../types';

interface AiQuickAddModalProps {
  isOpen: boolean;
  decks: Deck[];
  defaultDeckId?: string;
  existingItemsInDeck?: VocabularyItem[];
  onClose: () => void;
  onImport: (items: Array<Omit<VocabularyItem, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'masteryLevel'>>) => void;
}

interface EnrichedItem {
  inputId: string;
  englishWord: string;
  vietnameseDefinition: string;
  partOfSpeech: string;
  exampleSentence: string;
  alternativeMeanings?: Array<{
    definition: string;
    partOfSpeech: string;
  }>;
  status: 'ready' | 'needs_review' | 'invalid';
  reviewNote?: string;
  isDuplicate?: boolean;
  isSelected?: boolean;
}

const SAMPLE_WORDS = `mitigate
enhance
inevitable
take into account
look forward to
bank`;

export const AiQuickAddModal: React.FC<AiQuickAddModalProps> = ({
  isOpen,
  decks,
  defaultDeckId,
  existingItemsInDeck = [],
  onClose,
  onImport,
}) => {
  const [deckId, setDeckId] = useState(defaultDeckId || (decks[0]?.id ?? ''));
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedItem[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  // Synchronize defaultDeckId
  React.useEffect(() => {
    if (defaultDeckId) {
      setDeckId(defaultDeckId);
    } else if (decks[0]?.id && !deckId) {
      setDeckId(decks[0].id);
    }
  }, [defaultDeckId, decks]);

  // Real-time word count estimation from raw input
  const rawLineCount = useMemo(() => {
    return rawInput.split('\n').filter((l) => l.trim().length > 0).length;
  }, [rawInput]);

  if (!isOpen) return null;

  const handleInsertSample = () => {
    setRawInput((prev) => (prev ? `${prev}\n${SAMPLE_WORDS}` : SAMPLE_WORDS));
  };

  const handleStartEnriching = async () => {
    if (!deckId) {
      setErrorMessage('Vui lòng chọn bộ từ đích để lưu.');
      return;
    }
    const lines = rawInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrorMessage('Đại ca chưa nhập từ nào cả.');
      return;
    }

    if (lines.length > 50) {
      setErrorMessage('Tối đa 50 từ mỗi lần tra cứu AI để đảm bảo chất lượng.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    // Parse input lines: Format A (word) or Format B (word | meaning)
    const requestItems = lines.map((line, idx) => {
      const inputId = `item-${Date.now()}-${idx}`;
      const delimIdx = line.indexOf('|');
      if (delimIdx !== -1) {
        const englishWord = line.slice(0, delimIdx).trim();
        const userProvidedMeaning = line.slice(delimIdx + 1).trim();
        return { inputId, englishWord, userProvidedMeaning };
      }
      return { inputId, englishWord: line };
    });

    try {
      const res = await fetch('/api/ai/enrich-vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: requestItems }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể tra cứu từ vựng từ AI.');
      }

      const results: EnrichedItem[] = (data.results || []).map((item: any) => {
        const cleanWord = (item.englishWord || '').trim().toLowerCase();
        const isDup = existingItemsInDeck.some(
          (ex) => ex.englishWord.trim().toLowerCase() === cleanWord
        );
        return {
          ...item,
          isDuplicate: isDup,
          isSelected: item.status !== 'invalid' && !isDup,
        };
      });

      setEnrichedItems(results);
      setStep('review');
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối đến máy chủ AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (inputId: string) => {
    setEnrichedItems((prev) =>
      prev.map((item) => (item.inputId === inputId ? { ...item, isSelected: !item.isSelected } : item))
    );
  };

  const handleUpdateField = (inputId: string, field: 'vietnameseDefinition' | 'exampleSentence' | 'partOfSpeech', val: string) => {
    setEnrichedItems((prev) =>
      prev.map((item) => (item.inputId === inputId ? { ...item, [field]: val } : item))
    );
  };

  const handleSelectAlternative = (inputId: string, altDef: string, altPos: string) => {
    setEnrichedItems((prev) =>
      prev.map((item) =>
        item.inputId === inputId
          ? {
              ...item,
              vietnameseDefinition: altDef,
              partOfSpeech: altPos || item.partOfSpeech,
            }
          : item
      )
    );
  };

  const handleSaveSelected = () => {
    const selected = enrichedItems.filter((item) => item.isSelected && item.status !== 'invalid');
    if (selected.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất một từ hợp lệ để lưu.');
      return;
    }

    const payload = selected.map((item) => ({
      deckId,
      englishWord: item.englishWord.trim(),
      vietnameseDefinition: item.vietnameseDefinition.trim(),
      partOfSpeech: item.partOfSpeech || 'other',
      exampleSentence: item.exampleSentence ? item.exampleSentence.trim() : '',
      notes: item.reviewNote ? `AI Note: ${item.reviewNote}` : '',
    }));

    onImport(payload);
    // Reset state & close
    setRawInput('');
    setEnrichedItems([]);
    setStep('input');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E6EBE6] rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E6EBE6] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E5F3E9] text-[#173B2B] rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#173B2B]">
                AI Quick Add — Cạp Tổng Tra Từ Hộ Đại Ca
              </h3>
              <p className="text-xs text-[#69756D]">
                Nhập từ đi, nghĩa để Cạp Tổng lo. Đại ca cứ quăng từ vào đây.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#69756D] hover:text-[#1D2420] p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {step === 'input' ? (
            <div className="space-y-5">
              {/* Target Deck selector */}
              <div>
                <label className="block text-xs font-bold text-[#1D2420] uppercase tracking-wider mb-2">
                  Chọn bộ từ vựng đích
                </label>
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl text-sm font-medium text-[#1D2420] focus:outline-none focus:ring-2 focus:ring-[#268A59]"
                >
                  {decks.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Multiline input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#1D2420] uppercase tracking-wider">
                    Danh sách từ tiếng Anh (mỗi dòng 1 từ hoặc cụm từ)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleInsertSample}
                      className="text-xs font-semibold text-[#268A59] hover:underline"
                    >
                      + Chèn mẫu thử
                    </button>
                    <span className="text-xs text-[#69756D] font-mono">
                      {rawLineCount} dòng / từ
                    </span>
                  </div>
                </div>
                <textarea
                  rows={8}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder={`mitigate\nenhance\ninevitable\ntake into account\nbank | ngân hàng`}
                  className="w-full p-4 font-mono text-sm bg-[#FAFBF8] border border-[#E6EBE6] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#268A59] leading-relaxed"
                />
                <p className="mt-2 text-xs text-[#69756D] flex items-center gap-1.5">
                  <span>💡 Hỗ trợ: Từ đơn, cụm động từ, thành ngữ, cụm từ có dấu gạch ngang hoặc định nghĩa kèm theo dấu |</span>
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#FAFBF8] p-4 rounded-2xl border border-[#E6EBE6]">
                <div>
                  <h4 className="text-sm font-bold text-[#173B2B]">
                    Kết quả AI tra cứu ({enrichedItems.length} từ)
                  </h4>
                  <p className="text-xs text-[#69756D]">
                    Đại ca kiểm tra, chỉnh sửa hoặc chọn nghĩa thay thế trước khi lưu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E6EBE6] text-[#1D2420] rounded-lg hover:bg-gray-50"
                >
                  ← Nhập lại danh sách
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Enriched items review list */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {enrichedItems.map((item) => (
                  <div
                    key={item.inputId}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.status === 'invalid'
                        ? 'bg-red-50/50 border-red-200 opacity-60'
                        : item.isDuplicate
                        ? 'bg-amber-50/40 border-amber-200'
                        : item.isSelected
                        ? 'bg-white border-[#268A59] shadow-xs'
                        : 'bg-white border-[#E6EBE6]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          disabled={item.status === 'invalid'}
                          onChange={() => handleToggleSelect(item.inputId)}
                          className="mt-1 w-4 h-4 text-[#268A59] rounded border-gray-300 focus:ring-[#268A59] cursor-pointer"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-[#173B2B] text-base">
                              {item.englishWord}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-semibold bg-[#E5F3E9] text-[#173B2B] rounded-md font-mono">
                              {item.partOfSpeech}
                            </span>
                            {item.isDuplicate && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 rounded-md">
                                Đã có trong bộ
                              </span>
                            )}
                            {item.status === 'needs_review' && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-md">
                                Cần xem lại
                              </span>
                            )}
                            {item.status === 'invalid' && (
                              <span className="px-2 py-0.5 text-[11px] font-semibold bg-red-100 text-red-700 rounded-md">
                                Không hợp lệ
                              </span>
                            )}
                          </div>

                          {/* Editable definition */}
                          <div>
                            <label className="block text-[10px] font-bold text-[#69756D] uppercase mb-1">
                              Định nghĩa tiếng Việt:
                            </label>
                            <input
                              type="text"
                              value={item.vietnameseDefinition}
                              onChange={(e) =>
                                handleUpdateField(item.inputId, 'vietnameseDefinition', e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg text-[#1D2420] font-medium focus:ring-1 focus:ring-[#268A59]"
                            />
                          </div>

                          {/* Editable example sentence */}
                          <div>
                            <label className="block text-[10px] font-bold text-[#69756D] uppercase mb-1">
                              Câu ví dụ:
                            </label>
                            <input
                              type="text"
                              value={item.exampleSentence}
                              onChange={(e) =>
                                handleUpdateField(item.inputId, 'exampleSentence', e.target.value)
                              }
                              className="w-full px-3 py-1.5 text-xs bg-[#FAFBF8] border border-[#E6EBE6] rounded-lg text-[#69756D] italic focus:ring-1 focus:ring-[#268A59]"
                            />
                          </div>

                          {/* Alternative meanings for polysemous words */}
                          {item.alternativeMeanings && item.alternativeMeanings.length > 0 && (
                            <div className="pt-1">
                              <span className="text-[10px] font-bold text-[#69756D] uppercase block mb-1">
                                Nghĩa thay thế (từ đa nghĩa):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {item.alternativeMeanings.map((alt, altIdx) => (
                                  <button
                                    key={altIdx}
                                    type="button"
                                    onClick={() =>
                                      handleSelectAlternative(item.inputId, alt.definition, alt.partOfSpeech)
                                    }
                                    className="px-2.5 py-1 text-[11px] bg-[#FAFBF8] hover:bg-[#E5F3E9] border border-[#E6EBE6] text-[#173B2B] rounded-lg transition-colors text-left"
                                  >
                                    <strong>{alt.definition}</strong> <span className="text-[#69756D]">({alt.partOfSpeech})</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.reviewNote && (
                            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1">
                              ⚠️ {item.reviewNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E6EBE6] pt-4 mt-2 flex items-center justify-between shrink-0">
          <p className="text-xs text-[#69756D]">
            <span>💡 AI có thể nhầm nghĩa. Đại ca nhớ kiểm tra trước khi lưu.</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-[#69756D] hover:bg-gray-100 rounded-xl transition-colors"
            >
              Hủy
            </button>

            {step === 'input' ? (
              <button
                type="button"
                disabled={isLoading || !rawInput.trim()}
                onClick={handleStartEnriching}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#173B2B] hover:bg-[#268A59] disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cạp Tổng đang tra từ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Cạp Tổng, tra từ hộ bố!</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveSelected}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#268A59] hover:bg-[#1f734a] rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Lưu các từ đã chọn vào bộ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
