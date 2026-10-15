import React, { useState, useMemo } from 'react';
import { UnitTopic, WordItem } from '../types';
import { audioService } from '../services/audioService';
import {
  BookOpen,
  Volume2,
  Play,
  X,
  Search,
  CheckCircle,
  Sparkles,
  Trophy,
  HelpCircle,
  Eye,
  GraduationCap
} from 'lucide-react';

interface UnitWordPreviewModalProps {
  unit: UnitTopic | null;
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (unit: UnitTopic) => void;
}

export const UnitWordPreviewModal: React.FC<UnitWordPreviewModalProps> = ({
  unit,
  isOpen,
  onClose,
  onStartGame
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const filteredWords = useMemo(() => {
    if (!unit) return [];
    if (!searchTerm.trim()) return unit.words;
    const term = searchTerm.toLowerCase().trim();
    return unit.words.filter(
      (w) =>
        w.word.toLowerCase().includes(term) ||
        w.meaningVi.toLowerCase().includes(term) ||
        (w.phonetic && w.phonetic.toLowerCase().includes(term))
    );
  }, [unit, searchTerm]);

  const handleSpeak = (word: WordItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeakingWordId(word.id);
    audioService.speakEnglish(word.word);
    setTimeout(() => {
      setSpeakingWordId(null);
    }, 1200);
  };

  if (!isOpen || !unit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#131F2E] border border-[#00E5FF]/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#27384E] bg-linear-to-r from-[#1B263B] via-[#1E2D40] to-[#131F2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30 shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
                  {unit.difficulty}
                </span>
                <span className="text-xs text-[#FFD166] font-bold flex items-center gap-1">
                  <Trophy size={13} />
                  <span>Kỷ lục: {unit.bestScore > 0 ? `${unit.bestScore} pts` : 'Chưa đấu'}</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {unit.title}
              </h2>
              <p className="text-xs text-[#778DA9]">
                Xem trước và ôn tập toàn bộ {unit.words.length} từ mới trước khi bước vào đấu trường săn từ!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1E2D40] text-[#778DA9] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Search & Word count */}
        <div className="p-3.5 bg-[#1B263B]/60 border-b border-[#27384E] flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778DA9]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm từ tiếng Anh hoặc nghĩa tiếng Việt..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs placeholder-[#778DA9] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#ADB5BD]">
              Hiển thị <strong className="text-white font-bold">{filteredWords.length}</strong> / {unit.words.length} từ
            </span>
            <span className="text-[#06D6A0] font-bold text-[11px] bg-[#06D6A0]/10 px-2.5 py-1 rounded-lg border border-[#06D6A0]/20 flex items-center gap-1">
              <Sparkles size={12} />
              <span>Bấm nút loa để nghe giọng đọc chuẩn bản xứ</span>
            </span>
          </div>
        </div>

        {/* Word Grid / Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredWords.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <BookOpen size={40} className="mx-auto text-[#778DA9] opacity-40" />
              <p className="text-sm font-semibold text-white">Không tìm thấy từ vựng phù hợp</p>
              <p className="text-xs text-[#778DA9]">Hãy thử từ khóa tìm kiếm khác.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredWords.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] hover:border-[#00E5FF]/40 transition-all flex flex-col justify-between group space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#778DA9]">
                          #{idx + 1}
                        </span>
                        <h3 className="text-base font-black text-white group-hover:text-[#00E5FF] transition-colors">
                          {w.word}
                        </h3>
                        {w.partOfSpeech && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00E5FF]/20 text-[#00E5FF]">
                            ({w.partOfSpeech})
                          </span>
                        )}
                      </div>
                      {w.phonetic && (
                        <p className="text-xs font-mono text-[#FFD166] mt-0.5">
                          {w.phonetic}
                        </p>
                      )}
                    </div>

                    {/* Audio pronounce button */}
                    <button
                      onClick={(e) => handleSpeak(w, e)}
                      title="Nghe phát âm chuẩn"
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        speakingWordId === w.id
                          ? 'bg-[#00E5FF] text-[#0D1B2A] scale-110 shadow-md shadow-[#00E5FF]/40'
                          : 'bg-[#131F2E] hover:bg-[#00E5FF]/20 text-[#00E5FF]'
                      }`}
                    >
                      <Volume2 size={16} className={speakingWordId === w.id ? 'animate-bounce' : ''} />
                    </button>
                  </div>

                  {/* Vietnamese Meaning */}
                  <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E]/70">
                    <p className="text-xs font-bold text-[#06D6A0]">
                      ➔ {w.meaningVi}
                    </p>
                    {w.exampleEn && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#27384E]/50 text-[11px] space-y-0.5">
                        <p className="text-white font-medium italic">
                          "{w.exampleEn}"
                        </p>
                        {w.exampleVi && (
                          <p className="text-[#778DA9]">
                            {w.exampleVi}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Distractors hint */}
                  {w.distractorsVi && w.distractorsVi.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-[#778DA9]">
                      <span className="text-[#ADB5BD]">Nhiễu trắc nghiệm:</span>
                      {w.distractorsVi.slice(0, 3).map((d, dIdx) => (
                        <span key={dIdx} className="px-1.5 py-0.2 rounded bg-[#131F2E] text-[#94A3B8]">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#27384E] bg-[#1B263B] flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[#778DA9]">
            💡 <strong className="text-white">Mẹo:</strong> Thuộc nghĩa và phát âm của {unit.words.length} từ này sẽ giúp bạn phản xạ nhanh và đạt Combo x5 dễ dàng!
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#778DA9] hover:text-white bg-[#131F2E] hover:bg-[#1E2D40] transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onStartGame(unit);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-[#0D1B2A] bg-linear-to-r from-[#00E5FF] to-[#06D6A0] hover:brightness-110 transition-all shadow-lg shadow-[#00E5FF]/25 flex items-center gap-2 cursor-pointer"
            >
              <Play size={15} className="fill-current" />
              <span>Tôi Đã Thuộc, Bắt Đầu Săn Từ Ngay!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
