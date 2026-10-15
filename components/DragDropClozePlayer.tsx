import React, { useState, useMemo } from 'react';
import { CustomQuestion, DragDropClozeBlank } from '../types';
import {
  GripVertical,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface DragDropClozePlayerProps {
  question: CustomQuestion;
  value?: Record<string, string>; // { [blankId]: placedWord }
  onChange?: (val: Record<string, string>) => void;
  isReadOnly?: boolean;
  showCorrectAnswers?: boolean;
}

export const DragDropClozePlayer: React.FC<DragDropClozePlayerProps> = ({
  question,
  value = {},
  onChange,
  isReadOnly = false,
  showCorrectAnswers = false
}) => {
  const blanks = question.clozeBlanks || [];
  const [draggedChip, setDraggedChip] = useState<string | null>(null);
  const [selectedChipForTap, setSelectedChipForTap] = useState<string | null>(null);
  const [dragOverBlankId, setDragOverBlankId] = useState<string | null>(null);

  // Compute full bank chips list
  const bankChips = useMemo(() => {
    if (question.bankOptions && question.bankOptions.length > 0) {
      return question.bankOptions;
    }
    const correctItems = blanks.map((b) => b.correctAnswer).filter(Boolean);
    const extraDistractors = question.distractors || [];
    const combined = Array.from(new Set([...correctItems, ...extraDistractors]));
    return combined;
  }, [question.bankOptions, blanks, question.distractors]);

  // Which chips are placed in which blank
  const placedWords = useMemo(() => {
    return Object.values(value).filter(Boolean);
  }, [value]);

  const handlePlaceWord = (blankId: string, word: string) => {
    if (isReadOnly || !onChange) return;

    const next = { ...value };

    // If reuse is not allowed, remove this word from any other blank where it was already placed
    if (!question.allowReuseOptions) {
      Object.keys(next).forEach((key) => {
        if (next[key] === word) {
          delete next[key];
        }
      });
    }

    next[blankId] = word;
    onChange(next);
    setSelectedChipForTap(null);
  };

  const handleRemoveWord = (blankId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isReadOnly || !onChange) return;
    const next = { ...value };
    delete next[blankId];
    onChange(next);
  };

  const handleResetAll = () => {
    if (isReadOnly || !onChange) return;
    onChange({});
    setSelectedChipForTap(null);
  };

  // Parse text segments and [blank1], [blank2] placeholders
  const passageText = question.clozeContent || question.question || '';
  const parsedSegments = useMemo(() => {
    const regex = /\[([a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF\s-]+)\]/g;
    const segments: { type: 'text' | 'blank'; content: string; blankId?: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(passageText)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: passageText.substring(lastIndex, match.index)
        });
      }

      const rawKey = match[1].trim();
      // Match with known blank id or order index
      let targetBlank = blanks.find((b) => b.id.toLowerCase() === rawKey.toLowerCase());
      if (!targetBlank) {
        // Match by label (e.g. "Ô trống 1")
        targetBlank = blanks.find((b) => b.label?.toLowerCase() === rawKey.toLowerCase());
      }
      if (!targetBlank) {
        const numMatch = rawKey.match(/\d+/);
        if (numMatch) {
          const idx = parseInt(numMatch[0], 10) - 1;
          if (idx >= 0 && idx < blanks.length) {
            targetBlank = blanks[idx];
          }
        }
      }

      const resolvedBlankId = targetBlank ? targetBlank.id : rawKey;
      segments.push({
        type: 'blank',
        content: match[0],
        blankId: resolvedBlankId
      });

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < passageText.length) {
      segments.push({
        type: 'text',
        content: passageText.substring(lastIndex)
      });
    }

    return segments;
  }, [passageText, blanks]);

  return (
    <div className="space-y-5 select-none">
      {/* Passage / Content Container with Inline Blanks */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131F2E]/90 border border-[#27384E] shadow-inner text-sm sm:text-base leading-loose text-white space-y-2">
        <div className="flex flex-wrap items-baseline gap-y-3 gap-x-1.5">
          {parsedSegments.map((seg, sIdx) => {
            if (seg.type === 'text') {
              return <span key={sIdx} className="font-medium whitespace-pre-wrap">{seg.content}</span>;
            }

            const blankId = seg.blankId || `blank_${sIdx}`;
            const blankConfig = blanks.find((b) => b.id === blankId);
            const placedWord = value[blankId];
            const isHovered = dragOverBlankId === blankId;
            const isTargetTap = selectedChipForTap !== null;

            // Verification check when review mode is on
            let isCorrect = false;
            if (showCorrectAnswers && blankConfig) {
              const uVal = (placedWord || '').trim();
              const cVal = (blankConfig.correctAnswer || '').trim();
              const alts = (blankConfig.acceptableAlternatives || []).map((x) => x.trim());
              isCorrect = question.caseSensitive
                ? uVal === cVal || alts.includes(uVal)
                : uVal.toLowerCase() === cVal.toLowerCase() ||
                  alts.some((x) => x.toLowerCase() === uVal.toLowerCase());
            }

            return (
              <span
                key={sIdx}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isReadOnly) setDragOverBlankId(blankId);
                }}
                onDragLeave={() => {
                  if (dragOverBlankId === blankId) setDragOverBlankId(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverBlankId(null);
                  const word = e.dataTransfer.getData('text/plain') || draggedChip;
                  if (word) handlePlaceWord(blankId, word);
                }}
                onClick={() => {
                  if (isReadOnly) return;
                  if (selectedChipForTap) {
                    handlePlaceWord(blankId, selectedChipForTap);
                  } else if (placedWord) {
                    handleRemoveWord(blankId);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 mx-1 rounded-2xl border transition-all cursor-pointer align-middle text-xs sm:text-sm font-bold shadow-sm ${
                  showCorrectAnswers
                    ? isCorrect
                      ? 'bg-[#06D6A0]/25 border-[#06D6A0] text-[#06D6A0]'
                      : 'bg-[#EF476F]/25 border-[#EF476F] text-[#EF476F]'
                    : placedWord
                    ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] shadow-[#00E5FF]/20'
                    : isHovered || isTargetTap
                    ? 'bg-[#00E5FF]/30 border-[#00E5FF] border-dashed ring-2 ring-[#00E5FF] text-white animate-pulse'
                    : 'bg-[#0D1B2A] border-[#415A77] border-dashed text-[#778DA9] hover:border-[#00E5FF] hover:text-[#CBD5E1]'
                }`}
                title={placedWord ? `Nhấn để gỡ bỏ "${placedWord}"` : 'Kéo thả hoặc chạm từ bên dưới vào đây'}
              >
                {placedWord ? (
                  <>
                    <span className="font-extrabold text-white">{placedWord}</span>
                    {showCorrectAnswers ? (
                      isCorrect ? (
                        <Check size={14} className="text-[#06D6A0] shrink-0" />
                      ) : (
                        <span className="text-[10px] text-[#EF476F] shrink-0 flex items-center gap-0.5">
                          <X size={13} />
                          <span className="underline font-bold">({blankConfig?.correctAnswer})</span>
                        </span>
                      )
                    ) : (
                      !isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveWord(blankId, e)}
                          className="w-4 h-4 rounded-full bg-white/20 hover:bg-[#EF476F] hover:text-white flex items-center justify-center transition-colors shrink-0 ml-1"
                        >
                          <X size={10} />
                        </button>
                      )
                    )}
                  </>
                ) : (
                  <span className="italic text-xs opacity-80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                    {blankConfig?.label || blankId}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Word Bank Area */}
      {!isReadOnly && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#00E5FF] flex items-center gap-1.5">
                <Sparkles size={14} />
                Ngân Hàng Từ & Cụm Từ
              </span>
              <span className="text-[11px] text-[#778DA9]">
                (Kéo thả hoặc chạm vào thẻ từ rồi chạm vào ô trống)
              </span>
            </div>

            {placedWords.length > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#EF476F] hover:bg-[#EF476F]/20 text-xs font-bold transition cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Làm lại câu này</span>
              </button>
            )}
          </div>

          {/* Cards pool */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            {bankChips.map((chip, cIdx) => {
              const countPlaced = placedWords.filter((w) => w === chip).length;
              const isExhausted = !question.allowReuseOptions && countPlaced > 0;
              const isSelected = selectedChipForTap === chip;

              return (
                <button
                  key={cIdx}
                  type="button"
                  draggable={!isExhausted && !isReadOnly}
                  onDragStart={(e) => {
                    if (isExhausted) return;
                    setDraggedChip(chip);
                    e.dataTransfer.setData('text/plain', chip);
                  }}
                  onDragEnd={() => setDraggedChip(null)}
                  onClick={() => {
                    if (isExhausted || isReadOnly) return;
                    setSelectedChipForTap(isSelected ? null : chip);
                  }}
                  className={`px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                    isExhausted
                      ? 'bg-[#131F2E]/60 border-[#27384E] text-[#778DA9] opacity-40 cursor-not-allowed scale-95'
                      : isSelected
                      ? 'bg-[#00E5FF] text-[#0D1B2A] border-[#00E5FF] ring-2 ring-white scale-105 shadow-[#00E5FF]/40'
                      : 'bg-[#131F2E] border-[#27384E] text-white hover:border-[#00E5FF] hover:bg-[#1E2D40] hover:scale-102 active:scale-95'
                  }`}
                >
                  <GripVertical size={13} className={isExhausted ? 'text-transparent' : 'text-[#778DA9]'} />
                  <span>{chip}</span>
                  {isExhausted && <Check size={13} className="text-[#06D6A0] ml-1" />}
                </button>
              );
            })}
          </div>

          {selectedChipForTap && (
            <div className="p-2.5 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold flex items-center justify-between">
              <span>Đang chọn thẻ: <strong className="underline text-white font-extrabold">{selectedChipForTap}</strong>. Hãy chạm vào ô trống phía trên để thả vào.</span>
              <button
                type="button"
                onClick={() => setSelectedChipForTap(null)}
                className="text-xs hover:underline text-[#CBD5E1]"
              >
                Hủy chọn
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
