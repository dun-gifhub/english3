import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { lookupDictionary } from '../services/dictionaryDatabase';
import { audioService } from '../services/audioService';
import { WordItem } from '../types';
import {
  Plus,
  X,
  Volume2,
  Sparkles,
  BookOpen,
  Search,
  Check,
  HelpCircle,
  BookmarkCheck
} from 'lucide-react';

interface StudentAddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGrade?: number;
}

export const StudentAddWordModal: React.FC<StudentAddWordModalProps> = ({
  isOpen,
  onClose,
  defaultGrade = 10
}) => {
  const { addCustomWord, selectedGrade } = useApp();

  const [word, setWord] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('noun');
  const [grade, setGrade] = useState<number>(defaultGrade || selectedGrade || 10);
  const [unitNumber, setUnitNumber] = useState<number>(0); // 0 = Unit Bổ Sung / Tự do
  const [exampleEn, setExampleEn] = useState('');
  const [exampleVi, setExampleVi] = useState('');
  const [distractor1, setDistractor1] = useState('');
  const [distractor2, setDistractor2] = useState('');
  const [distractor3, setDistractor3] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSpeak = (textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    setIsSpeaking(true);
    audioService.speakEnglish(textToSpeak.trim());
    setTimeout(() => setIsSpeaking(false), 1200);
  };

  const handleAutoLookup = (searchWord?: string) => {
    const target = (searchWord || word).trim().toLowerCase();
    if (!target) {
      showToast('Vui lòng nhập từ tiếng Anh trước khi tra cứu tự động!');
      return;
    }
    const found = lookupDictionary(target, true);
    if (found && found.length > 0) {
      const top = found[0];
      if (top.phonetic) setPhonetic(top.phonetic);
      if (top.meaningVi) setMeaningVi(top.meaningVi);
      if (top.partOfSpeech) setPartOfSpeech(top.partOfSpeech.toLowerCase());
      if (top.exampleEn) setExampleEn(top.exampleEn);
      if (top.exampleVi) setExampleVi(top.exampleVi);
      if (top.synonyms && top.synonyms.length >= 2) {
        setDistractor1(top.synonyms[0] || 'phương án sai 1');
        setDistractor2(top.synonyms[1] || 'phương án sai 2');
        setDistractor3(top.synonyms[2] || 'phương án sai 3');
      }
      showToast(`Đã tự động điền phát âm IPA và dịch nghĩa cho "${target}"!`);
      audioService.speakEnglish(target);
    } else {
      showToast(`Không tìm thấy trong từ điển offline, bạn hãy tự nhập phiên âm và dịch nghĩa nhé!`);
    }
  };

  const handleSave = () => {
    const cleanWord = word.trim();
    const cleanMeaning = meaningVi.trim();
    if (!cleanWord || !cleanMeaning) {
      showToast('Vui lòng nhập từ tiếng Anh và nghĩa tiếng Việt!');
      return;
    }

    const distractors = [distractor1.trim(), distractor2.trim(), distractor3.trim()].filter(Boolean);
    if (distractors.length === 0) {
      distractors.push('nghĩa sai 1', 'nghĩa đối lập', 'phương án bẫy');
    }

    const newWordData: Omit<WordItem, 'id'> = {
      word: cleanWord,
      phonetic: phonetic.trim() || `/${cleanWord.toLowerCase()}/`,
      meaningVi: cleanMeaning,
      partOfSpeech,
      grade,
      unitNumber,
      exampleEn: exampleEn.trim(),
      exampleVi: exampleVi.trim(),
      distractorsVi: distractors
    };

    addCustomWord(newWordData);
    showToast(`Đã thêm từ "${cleanWord}" vào kho từ vựng học tập & thi đấu!`);

    setTimeout(() => {
      // Reset form
      setWord('');
      setPhonetic('');
      setMeaningVi('');
      setExampleEn('');
      setExampleVi('');
      setDistractor1('');
      setDistractor2('');
      setDistractor3('');
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1B263B] border border-[#06D6A0]/40 shadow-2xl p-5 sm:p-6 space-y-4 text-xs my-auto max-h-[92vh] overflow-y-auto text-[#F8F9FA]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#27384E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30 flex items-center justify-center font-black shadow-md shadow-[#06D6A0]/10 shrink-0">
              <Plus size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base sm:text-lg">Thêm Từ Mới Vào Kho Kiến Thức</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                  Học Sinh & GV
                </span>
              </div>
              <p className="text-[11px] text-[#778DA9]">
                Từ mới sẽ lập tức xuất hiện trong game Săn Từ (Tap Hunter) & bài tập ôn luyện
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#778DA9] hover:text-white hover:bg-[#27384E] cursor-pointer transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-3.5">
          {/* Word English Input & Auto Lookup */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#CBD5E1] font-bold">Từ tiếng Anh (English Word): *</label>
              <button
                type="button"
                onClick={() => handleAutoLookup()}
                className="text-[11px] font-bold text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Tra nghĩa & phát âm tự động</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                onBlur={() => {
                  if (word.trim() && !meaningVi.trim()) {
                    handleAutoLookup(word);
                  }
                }}
                placeholder="Ví dụ: sustainable, entrepreneur, biodiversity, resilient..."
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-extrabold text-sm focus:border-[#00E5FF] focus:outline-hidden"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {word.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSpeak(word)}
                    disabled={isSpeaking}
                    className="p-1.5 rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#0D1B2A] transition cursor-pointer"
                    title="Nghe phát âm"
                  >
                    <Volume2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Meaning & Phonetic Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#CBD5E1] font-bold block mb-1">Dịch nghĩa tiếng Việt: *</label>
              <input
                type="text"
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                placeholder="Ví dụ: bền vững, có thể duy trì lâu dài"
                className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#06D6A0] font-bold focus:border-[#06D6A0] focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#CBD5E1] font-bold">Phiên âm IPA chuẩn:</label>
                {phonetic && (
                  <span className="text-[10px] text-[#FFD166] font-mono">{phonetic}</span>
                )}
              </div>
              <input
                type="text"
                value={phonetic}
                onChange={(e) => setPhonetic(e.target.value)}
                placeholder="/səˈsteɪ.nə.bəl/"
                className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-mono focus:border-[#00E5FF] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Part of Speech, Grade & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[#CBD5E1] font-bold block mb-1">Từ loại:</label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-medium cursor-pointer"
              >
                <option value="noun">Danh từ (n)</option>
                <option value="verb">Động từ (v)</option>
                <option value="adjective">Tính từ (adj)</option>
                <option value="adverb">Trạng từ (adv)</option>
                <option value="preposition">Giới từ (prep)</option>
                <option value="phrase">Cụm từ / Thành ngữ</option>
              </select>
            </div>

            <div>
              <label className="text-[#CBD5E1] font-bold block mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold cursor-pointer"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[#CBD5E1] font-bold block mb-1">Unit bài học:</label>
              <select
                value={unitNumber}
                onChange={(e) => setUnitNumber(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-medium cursor-pointer"
              >
                <option value={0}>Unit Bổ Sung (Chung)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bilingual Examples */}
          <div className="space-y-2">
            <label className="text-[#CBD5E1] font-bold block">Câu ví dụ minh họa ngữ cảnh:</label>
            <input
              type="text"
              value={exampleEn}
              onChange={(e) => setExampleEn(e.target.value)}
              placeholder="🇬🇧 Ví dụ tiếng Anh: Solar energy is a clean and sustainable source."
              className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-hidden"
            />
            <input
              type="text"
              value={exampleVi}
              onChange={(e) => setExampleVi(e.target.value)}
              placeholder="🇻🇳 Dịch câu ví dụ: Năng lượng mặt trời là một nguồn sạch và bền vững."
              className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#ADB5BD] focus:outline-hidden"
            />
          </div>

          {/* Distractors for Game Quiz */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[#CBD5E1] font-bold">Phương án sai (Distractors cho Game Săn Từ):</label>
              <span className="text-[10px] text-[#778DA9]">(Hệ thống tự động điền nếu để trống)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={distractor1}
                onChange={(e) => setDistractor1(e.target.value)}
                placeholder="Nghĩa gây nhiễu 1"
                className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
              />
              <input
                type="text"
                value={distractor2}
                onChange={(e) => setDistractor2(e.target.value)}
                placeholder="Nghĩa gây nhiễu 2"
                className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
              />
              <input
                type="text"
                value={distractor3}
                onChange={(e) => setDistractor3(e.target.value)}
                placeholder="Nghĩa gây nhiễu 3"
                className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27384E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E] transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs hover:bg-[#06D6A0]/90 transition shadow-lg shadow-[#06D6A0]/20 cursor-pointer flex items-center gap-1.5"
          >
            <Check size={16} />
            <span>Lưu & Thêm Vào Màn Học</span>
          </button>
        </div>

        {/* Toast inside modal */}
        {toastMessage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-bold text-xs shadow-xl animate-fade-in flex items-center gap-1.5 whitespace-nowrap">
            <Check size={14} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
