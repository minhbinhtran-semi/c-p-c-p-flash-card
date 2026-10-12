import React, { useState } from 'react';
import { RefreshCw, Volume2 } from 'lucide-react';
import { CapTongMascot } from './CapTongMascot';
import { DialogueCategory, MascotExpression, MascotTone } from '../../types';
import { getRandomDialogue, MASCOT_TONE_LABELS } from '../../data/dialogues';

interface CapTongBubbleProps {
  category?: DialogueCategory;
  customText?: string;
  customExpression?: MascotExpression;
  tone: MascotTone;
  compact?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const CapTongBubble: React.FC<CapTongBubbleProps> = ({
  category = 'WELCOME',
  customText,
  customExpression,
  tone,
  compact = false,
  className = '',
}) => {
  const [internalDialogue, setInternalDialogue] = useState(() =>
    getRandomDialogue(category, tone)
  );

  const currentText = customText || internalDialogue.text;
  const currentExpression = customExpression || internalDialogue.expression;

  const handleShuffle = () => {
    const next = getRandomDialogue(category, tone, internalDialogue.id);
    setInternalDialogue(next);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 bg-[#FFFFFF] border border-[#E6EBE6] rounded-xl px-4 py-2.5 shadow-xs ${className}`}
      >
        <CapTongMascot
          expression={currentExpression}
          size="sm"
          interactive
          onClick={handleShuffle}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1D2420] truncate">
            {currentText}
          </p>
        </div>
        <button
          onClick={handleShuffle}
          className="p-1 text-[#69756D] hover:text-[#173B2B] transition-colors"
          title="Đổi câu thoại khác"
          aria-label="Đổi câu thoại"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-[#FFFFFF] border border-[#E6EBE6] rounded-2xl p-5 md:p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-5 ${className}`}
    >
      {/* Mascot Avatar with subtle bounce */}
      <div className="shrink-0 flex flex-col items-center">
        <CapTongMascot
          expression={currentExpression}
          size="md"
          interactive
          onClick={handleShuffle}
        />
        <span className="text-[11px] font-semibold text-[#173B2B] mt-1 tracking-tight">
          Cạp Tổng
        </span>
      </div>

      {/* Speech bubble */}
      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
        <div className="relative bg-[#FAFBF8] border border-[#E6EBE6] rounded-xl p-4 text-[#1D2420]">
          {/* Triangular arrow pointing to mascot */}
          <div
            className="hidden sm:block absolute -left-2 top-5 w-3.5 h-3.5 bg-[#FAFBF8] border-l border-b border-[#E6EBE6] transform rotate-45"
            aria-hidden="true"
          />

          <p className="text-base font-medium leading-relaxed text-[#1D2420]">
            "{currentText}"
          </p>
        </div>

        {/* Action bar under speech */}
        <div className="mt-3 flex items-center justify-between text-xs text-[#69756D]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#173B2B]">
              Tông giọng: {MASCOT_TONE_LABELS[tone]?.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#69756D] hover:text-[#173B2B] hover:bg-[#E5F3E9] rounded-md transition-colors"
              title="Đọc câu thoại bằng giọng máy"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Đọc</span>
            </button>
            <button
              onClick={handleShuffle}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-[#69756D] hover:text-[#173B2B] hover:bg-[#E5F3E9] rounded-md transition-colors"
              title="Cạp Tổng đổi câu khịa khác"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đổi câu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
