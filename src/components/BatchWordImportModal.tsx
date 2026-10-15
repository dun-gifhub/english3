import React, { useState, useMemo, useRef } from 'react';
import { WordItem } from '../types';
import { BASE_DICTIONARY } from '../services/dictionaryDatabase';
import {
  Upload,
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Download,
  Copy,
  X,
  Layers,
  Check,
  HelpCircle,
  Table,
  Code
} from 'lucide-react';

interface BatchWordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWords: (words: Omit<WordItem, 'id'>[]) => Promise<number>;
  defaultGrade?: number;
  defaultUnit?: number;
}

interface ParsedWordDraft {
  id: string;
  word: string;
  phonetic: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  grade: number;
  unitNumber: number;
  distractorsVi: string[];
  partOfSpeech?: string;
  originalLine: string;
  error?: string;
}

// Sample templates
const SAMPLE_BASIC = `# Danh sách từ vựng Unit 1 - Family Life (Lớp 10)
breadwinner : người trụ cột gia đình
homemaker : người nội trợ
gratitude : lòng biết ơn
routine : thói quen hằng ngày
strengthen : củng cố, làm cho mạnh mẽ
bond : sự gắn kết, mối quan hệ
heavy lifting : công việc nặng nhọc
household chores : công việc nhà

# Unit 2 - Humans and the Environment
eco-friendly : thân thiện với môi trường
carbon footprint : dấu chân carbon
lifestyle : lối sống
emission : sự phát thải khí
sustainable : phát triển bền vững`;

const SAMPLE_ADVANCED = `# Định dạng kèm phiên âm IPA & ví dụ minh họa
perseverance /ˌpɜː.sɪˈvɪə.rəns/ : lòng kiên trì, bền chí | Success requires perseverance. | Thành công đòi hỏi sự kiên trì.
resilience /rɪˈzɪl.jəns/ : khả năng phục hồi nhanh | She showed remarkable resilience. | Cô ấy thể hiện sự kiên cường đáng nể.
biodiversity /ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/ : đa dạng sinh học | Protect forest biodiversity. | Bảo vệ sự đa dạng sinh học của rừng.
catastrophic /ˌkæt.əˈstrɒf.ɪk/ : mang tính thảm họa | A catastrophic earthquake struck. | Một trận động đất thảm họa đã xảy ra.
ubiquitous /juːˈbɪk.wə.təs/ : có mặt ở khắp mọi nơi | Smartphones are ubiquitous nowadays. | Điện thoại thông minh hiện diện khắp mọi nơi.`;

const SAMPLE_EXCEL = `English	IPA	Tiếng Việt	Ví dụ
community	/kəˈmjuː.nə.ti/	cộng đồng	We live in a supportive community.
volunteer	/ˌvɒl.ənˈtɪər/	tình nguyện viên	She works as a hospital volunteer.
donate	/dəʊˈneɪt/	quyên góp, ủng hộ	Many people donate money to charity.
contribution	/ˌkɒn.trɪˈbjuː.ʃən/	sự đóng góp	Thank you for your generous contribution.`;

export const BatchWordImportModal: React.FC<BatchWordImportModalProps> = ({
  isOpen,
  onClose,
  onImportWords,
  defaultGrade = 10,
  defaultUnit = 1
}) => {
  const [inputText, setInputText] = useState(SAMPLE_BASIC);
  const [selectedGrade, setSelectedGrade] = useState<number>(defaultGrade);
  const [selectedUnit, setSelectedUnit] = useState<number>(defaultUnit);
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'json'>('text');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick lookup dictionary map for phonetics & distractor fallback
  const dictMap = useMemo(() => {
    const map = new Map<string, { phonetic: string; meaningVi: string }>();
    BASE_DICTIONARY.forEach((entry) => {
      map.set(entry.wordEn.toLowerCase().trim(), {
        phonetic: entry.phonetic,
        meaningVi: entry.meaningVi
      });
    });
    return map;
  }, []);

  const allFallbackMeanings = useMemo(() => {
    return BASE_DICTIONARY.map((e) => e.meaningVi).filter(Boolean);
  }, []);

  // Parser function that parses arbitrary pasted text or CSV / TSV / JSON
  const parsedDrafts: ParsedWordDraft[] = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText.split(/\r?\n/);
    const drafts: ParsedWordDraft[] = [];
    let currentUnit = selectedUnit;
    let currentGrade = selectedGrade;

    // Check if input is full JSON array
    const trimmed = inputText.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          return json.map((item, idx) => {
            const word = String(item.word || item.wordEn || item.term || '').trim();
            const meaningVi = String(item.meaningVi || item.meaning || item.definition || '').trim();
            const phonetic = String(item.phonetic || item.ipa || dictMap.get(word.toLowerCase())?.phonetic || '').trim();
            const exampleEn = String(item.exampleEn || item.example || '').trim();
            const exampleVi = String(item.exampleVi || '').trim();
            const grade = Number(item.grade) || currentGrade;
            const unitNumber = Number(item.unitNumber || item.unit) || currentUnit;
            const distractors = Array.isArray(item.distractorsVi) && item.distractorsVi.length >= 3
              ? item.distractorsVi
              : [];

            return {
              id: `draft_json_${idx}`,
              word,
              phonetic,
              meaningVi,
              exampleEn,
              exampleVi,
              grade,
              unitNumber,
              distractorsVi: distractors,
              originalLine: JSON.stringify(item),
              error: (!word || !meaningVi) ? 'Thiếu từ tiếng Anh hoặc nghĩa tiếng Việt' : undefined
            };
          });
        }
      } catch {
        // Fall back to line-by-line parsing
      }
    }

    // Line-by-line parser
    lines.forEach((rawLine, idx) => {
      const line = rawLine.trim();
      if (!line) return;

      // Check comments or unit markers
      // e.g. "Unit 1: Family Life", "Unit 2", "# Unit 3", "Lớp 11 - Unit 4"
      const gradeMatch = line.match(/(?:Lớp|Khối|Grade)\s*(\d{1,2})/i);
      if (gradeMatch) {
        const g = parseInt(gradeMatch[1], 10);
        if (g >= 6 && g <= 12) currentGrade = g;
      }

      const unitMatch = line.match(/(?:Unit|Bài|Chủ đề|U)\s*(\d{1,2})/i);
      if (unitMatch && (line.startsWith('#') || line.startsWith('//') || line.length < 40)) {
        currentUnit = parseInt(unitMatch[1], 10);
        return;
      }

      if (line.startsWith('#') || line.startsWith('//') || line.startsWith('/*')) {
        return; // Comment line
      }

      // Skip header row if copied from Excel / TSV
      if (line.toLowerCase().startsWith('english\t') || line.toLowerCase().startsWith('từ\t')) {
        return;
      }

      let word = '';
      let phonetic = '';
      let meaningVi = '';
      let exampleEn = '';
      let exampleVi = '';
      let partOfSpeech = '';

      // Pattern 1: Tab-separated (Excel / Google Sheets / Quizlet)
      if (line.includes('\t')) {
        const cols = line.split('\t').map((c) => c.trim());
        if (cols.length >= 2) {
          word = cols[0];
          // Check if col 1 is phonetic
          if (cols[1].startsWith('/') || cols[1].startsWith('[')) {
            phonetic = cols[1];
            meaningVi = cols[2] || '';
            exampleEn = cols[3] || '';
            exampleVi = cols[4] || '';
          } else {
            meaningVi = cols[1];
            phonetic = cols[2] && cols[2].startsWith('/') ? cols[2] : '';
            exampleEn = cols[2] && !cols[2].startsWith('/') ? cols[2] : (cols[3] || '');
          }
        }
      } else {
        // Remove leading numbering like "1. ", "2) ", "- ", "• "
        const cleanedLine = line.replace(/^\d+[\.\)\-]\s*/, '').replace(/^[\-\*\•]\s*/, '');

        // Pattern 2: Separation with colon, dash, arrow, or equals
        // e.g. "word /ipa/ : meaning | example | exampleVi"
        // or "word (n) - meaning"
        const sepMatch = cleanedLine.match(/^(.*?)(?:\s*[:\-=–—→]\s*)(.*)$/);
        if (sepMatch) {
          const leftPart = sepMatch[1].trim();
          const rightPart = sepMatch[2].trim();

          // Extract phonetic /.../ from leftPart or rightPart
          const ipaMatch = leftPart.match(/\/(.*?)\//) || rightPart.match(/\/(.*?)\//);
          if (ipaMatch) {
            phonetic = `/${ipaMatch[1].trim()}/`;
          }

          // Extract part of speech (n), (v), (adj), (adv)
          const posMatch = leftPart.match(/\((n|v|adj|adv|prep|conj|pron|phr)\)/i);
          if (posMatch) {
            partOfSpeech = posMatch[1].toLowerCase();
          }

          // Clean word: remove /.../ and (...)
          word = leftPart
            .replace(/\/.*?\//g, '')
            .replace(/\(.*?\)/g, '')
            .trim();

          // Split rightPart by '|' or ';' for examples
          if (rightPart.includes('|')) {
            const subParts = rightPart.split('|').map((s) => s.trim());
            meaningVi = subParts[0].replace(/\/.*?\//g, '').trim();
            exampleEn = subParts[1] || '';
            exampleVi = subParts[2] || '';
          } else if (rightPart.includes(';')) {
            const subParts = rightPart.split(';').map((s) => s.trim());
            meaningVi = subParts[0].replace(/\/.*?\//g, '').trim();
            exampleEn = subParts[1] || '';
          } else {
            meaningVi = rightPart.replace(/\/.*?\//g, '').trim();
          }
        } else {
          // If no separator, check if comma separated: word, meaning
          const commaIdx = cleanedLine.indexOf(',');
          if (commaIdx > 0) {
            word = cleanedLine.substring(0, commaIdx).trim();
            meaningVi = cleanedLine.substring(commaIdx + 1).trim();
          }
        }
      }

      // If phonetic missing, auto-fill from built-in dictionary
      if (!phonetic && word) {
        const found = dictMap.get(word.toLowerCase().trim());
        if (found?.phonetic) {
          phonetic = found.phonetic;
        }
      }

      const isValid = word.length > 0 && meaningVi.length > 0;

      drafts.push({
        id: `draft_${idx}_${word}`,
        word,
        phonetic,
        meaningVi,
        exampleEn,
        exampleVi,
        grade: currentGrade,
        unitNumber: currentUnit,
        distractorsVi: [],
        partOfSpeech,
        originalLine: line,
        error: !isValid ? 'Không thể nhận diện từ và nghĩa (hãy dùng dạng: từ : nghĩa)' : undefined
      });
    });

    return drafts;
  }, [inputText, selectedGrade, selectedUnit, dictMap]);

  // Generate 3 smart distractors for each draft item
  const finalizedDrafts: ParsedWordDraft[] = useMemo(() => {
    const validDrafts = parsedDrafts.filter((d) => !d.error && d.word && d.meaningVi);
    const validMeanings = validDrafts.map((d) => d.meaningVi);

    return parsedDrafts.map((draft) => {
      if (draft.error) return draft;
      if (draft.distractorsVi.length >= 3) return draft;

      // Pick 3 distractors from other drafts
      const otherMeanings = validMeanings.filter(
        (m) => m.toLowerCase().trim() !== draft.meaningVi.toLowerCase().trim()
      );

      const chosenDistractors: string[] = [];
      const shuffled = [...otherMeanings].sort(() => 0.5 - Math.random());

      for (const m of shuffled) {
        if (!chosenDistractors.includes(m)) {
          chosenDistractors.push(m);
        }
        if (chosenDistractors.length === 3) break;
      }

      // If still fewer than 3, pick from BASE_DICTIONARY
      if (chosenDistractors.length < 3) {
        const fallbackShuffled = [...allFallbackMeanings].sort(() => 0.5 - Math.random());
        for (const fm of fallbackShuffled) {
          if (
            fm.toLowerCase().trim() !== draft.meaningVi.toLowerCase().trim() &&
            !chosenDistractors.includes(fm)
          ) {
            chosenDistractors.push(fm);
          }
          if (chosenDistractors.length === 3) break;
        }
      }

      // Fallback defaults if dictionary is somehow tiny
      const safeFallbacks = ['lòng kiên trì', 'sự phát thải', 'trụ cột gia đình', 'thảm họa'];
      for (const sf of safeFallbacks) {
        if (chosenDistractors.length < 3 && !chosenDistractors.includes(sf)) {
          chosenDistractors.push(sf);
        }
      }

      return {
        ...draft,
        distractorsVi: chosenDistractors.slice(0, 3)
      };
    });
  }, [parsedDrafts, allFallbackMeanings]);

  const validCount = finalizedDrafts.filter((d) => !d.error).length;
  const invalidCount = finalizedDrafts.filter((d) => d.error).length;

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setActiveTab('text');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template file (.txt)
  const handleDownloadTxtTemplate = () => {
    const blob = new Blob([SAMPLE_ADVANCED], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mau_tu_vung_lop_${selectedGrade}_unit_${selectedUnit}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download template Excel (.csv)
  const handleDownloadCsvTemplate = () => {
    const csvContent = "\uFEFF" + `English,IPA,Meaning,Example\nperseverance,/ˌpɜː.sɪˈvɪə.rəns/,lòng kiên trì,Success requires perseverance.\nresilience,/rɪˈzɪl.jəns/,sự kiên cường,She showed remarkable resilience.\nbiodiversity,/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/,đa dạng sinh học,Protect forest biodiversity.\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mau_tu_vung_lop_${selectedGrade}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Execute batch import
  const handleConfirmImport = async () => {
    const validItems = finalizedDrafts.filter((d) => !d.error);
    if (validItems.length === 0) return;

    setIsImporting(true);
    try {
      const payload: Omit<WordItem, 'id'>[] = validItems.map((v) => ({
        word: v.word,
        phonetic: v.phonetic,
        meaningVi: v.meaningVi,
        exampleEn: v.exampleEn,
        exampleVi: v.exampleVi,
        grade: v.grade,
        unitNumber: v.unitNumber,
        distractorsVi: v.distractorsVi,
        partOfSpeech: v.partOfSpeech
      }));

      const count = await onImportWords(payload);
      setImportSuccessCount(count);
      setTimeout(() => {
        setImportSuccessCount(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Có lỗi xảy ra khi lưu từ: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#131F2E] border border-[#27384E] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#27384E] bg-linear-to-r from-[#1B263B] to-[#131F2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/20 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Soạn Từ Vựng Siêu Tốc (Dán Tệp & Batch Import)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                  Tự động sinh đáp án nhiễu & tra IPA
                </span>
              </h2>
              <p className="text-xs text-[#778DA9]">
                Dán danh sách từ từ Word, Excel, Quizlet, tệp Text hoặc tải file để nạp hàng chục từ chỉ trong vài giây!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1E2D40] text-[#778DA9] hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Top Control Bar: Grade & Unit Defaults & Sample Buttons */}
        <div className="p-4 bg-[#1B263B]/60 border-b border-[#27384E] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#778DA9] font-semibold">Khối Mặc Định:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold text-xs"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[#778DA9] font-semibold">Unit Mặc Định:</span>
              <input
                type="number"
                min={1}
                max={15}
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(Number(e.target.value))}
                className="w-16 px-2.5 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold text-xs"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#778DA9]">
              <HelpCircle size={13} className="text-[#00E5FF]" />
              <span>(Có thể viết "Unit 1", "Unit 2" trong văn bản để tự đổi Unit)</span>
            </div>
          </div>

          {/* Quick Sample Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#778DA9] text-[11px]">Chèn Mẫu Nhanh:</span>
            <button
              onClick={() => setInputText(SAMPLE_BASIC)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#00E5FF] text-white text-[11px] font-bold cursor-pointer transition-all"
            >
              Cơ Bản (từ : nghĩa)
            </button>
            <button
              onClick={() => setInputText(SAMPLE_ADVANCED)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#00E5FF] text-white text-[11px] font-bold cursor-pointer transition-all"
            >
              Đầy Đủ (IPA + Ví dụ)
            </button>
            <button
              onClick={() => setInputText(SAMPLE_EXCEL)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#00E5FF] text-white text-[11px] font-bold cursor-pointer transition-all"
            >
              Excel / TSV
            </button>
          </div>
        </div>

        {/* Main Body: Two Columns (Left Input, Right Live Preview) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Input Box & Tabs (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#131F2E] p-1 rounded-xl border border-[#27384E]">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-[#00E5FF] text-[#0D1B2A]'
                      : 'text-[#778DA9] hover:text-white'
                  }`}
                >
                  <FileText size={14} />
                  <span>Dán Văn Bản</span>
                </button>
                <button
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-[#00E5FF] text-[#0D1B2A]'
                      : 'text-[#778DA9] hover:text-white'
                  }`}
                >
                  <Upload size={14} />
                  <span>Tải Tệp Lên</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inputText);
                    setCopiedFeedback(true);
                    setTimeout(() => setCopiedFeedback(false), 2000);
                  }}
                  className="p-1.5 rounded-lg bg-[#1B263B] hover:bg-[#27384E] text-[#778DA9] hover:text-white transition-all text-xs flex items-center gap-1"
                  title="Sao chép toàn bộ"
                >
                  {copiedFeedback ? <Check size={14} className="text-[#06D6A0]" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => setInputText('')}
                  className="p-1.5 rounded-lg bg-[#1B263B] hover:bg-[#EF476F]/20 text-[#778DA9] hover:text-[#EF476F] transition-all text-xs"
                  title="Xóa trắng ô nhập"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* If Tab Text: Textarea */}
            {activeTab === 'text' && (
              <div className="flex-1 flex flex-col">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Dán danh sách từ vựng vào đây...\nVí dụ:\napple : quả táo\nbanana : quả chuối\nperseverance /ˌpɜː.sɪˈvɪə.rəns/ : lòng kiên trì\nenvironment (n) - môi trường`}
                  rows={16}
                  className="w-full flex-1 p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#27384E] text-white font-mono text-xs leading-relaxed focus:border-[#00E5FF] focus:outline-none resize-none shadow-inner"
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#778DA9]">
                  <span>Hỗ trợ: Dấu hai chấm (:), gạch ngang (-), dấu bằng (=), Tab từ Excel</span>
                  <span>{inputText.split('\n').filter(Boolean).length} dòng</span>
                </div>
              </div>
            )}

            {/* If Tab File: Drag and drop or upload */}
            {activeTab === 'file' && (
              <div className="p-6 rounded-2xl bg-[#0D1B2A] border-2 border-dashed border-[#27384E] hover:border-[#00E5FF]/60 transition-all flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-3xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center border border-[#00E5FF]/30">
                  <Upload size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Chọn tệp danh sách từ vựng từ máy tính
                  </h4>
                  <p className="text-xs text-[#778DA9] max-w-sm">
                    Hỗ trợ tệp <span className="text-[#00E5FF] font-semibold">.txt</span>, <span className="text-[#00E5FF] font-semibold">.csv</span> (Excel), <span className="text-[#00E5FF] font-semibold">.tsv</span> hoặc <span className="text-[#00E5FF] font-semibold">.json</span>.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.tsv,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="batch-file-input"
                />

                <label
                  htmlFor="batch-file-input"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#00E5FF] to-[#0077B6] hover:brightness-110 text-[#0D1B2A] font-bold text-xs cursor-pointer shadow-lg shadow-[#00E5FF]/20 flex items-center gap-2"
                >
                  <Upload size={15} />
                  <span>Chọn Tệp Từ Máy Tính</span>
                </label>

                {/* Download sample templates */}
                <div className="pt-4 border-t border-[#27384E] w-full flex items-center justify-center gap-3">
                  <button
                    onClick={handleDownloadTxtTemplate}
                    className="px-3 py-1.5 rounded-xl bg-[#1B263B] hover:bg-[#27384E] text-[#778DA9] hover:text-white text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Tải mẫu .TXT</span>
                  </button>
                  <button
                    onClick={handleDownloadCsvTemplate}
                    className="px-3 py-1.5 rounded-xl bg-[#1B263B] hover:bg-[#27384E] text-[#778DA9] hover:text-white text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Tải mẫu .CSV (Excel)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Parsed Preview (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table size={16} className="text-[#06D6A0]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Xem Trước Kết Quả Phân Tích
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#06D6A0]/20 text-[#06D6A0] font-bold text-[11px]">
                  ✓ {validCount} từ hợp lệ
                </span>
                {invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF476F]/20 text-[#EF476F] font-bold text-[11px]">
                    ⚠ {invalidCount} dòng lỗi
                  </span>
                )}
              </div>
            </div>

            {/* Preview Box */}
            <div className="flex-1 rounded-2xl bg-[#0D1B2A] border border-[#27384E] overflow-hidden flex flex-col max-h-[500px]">
              {finalizedDrafts.length === 0 ? (
                <div className="p-8 text-center flex-1 flex flex-col items-center justify-center space-y-2 text-[#778DA9]">
                  <Layers size={32} className="opacity-40" />
                  <p className="text-xs">Chưa có nội dung. Hãy dán từ vựng ở ô bên trái hoặc bấm "Chèn Mẫu Nhanh".</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-[#27384E]/50">
                  {finalizedDrafts.map((draft, idx) => (
                    <div
                      key={draft.id || idx}
                      className={`p-3 text-xs transition-colors ${
                        draft.error
                          ? 'bg-[#EF476F]/10 border-l-4 border-[#EF476F]'
                          : 'hover:bg-[#1B263B]/60'
                      }`}
                    >
                      {draft.error ? (
                        <div className="flex items-start justify-between gap-2 text-[#EF476F]">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle size={14} className="shrink-0" />
                            <div>
                              <p className="font-bold">{draft.error}</p>
                              <p className="font-mono text-[11px] opacity-80 mt-0.5">Dòng: "{draft.originalLine}"</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1E2D40] text-[#778DA9]">
                                #{idx + 1}
                              </span>
                              <span className="text-sm font-black text-white">
                                {draft.word}
                              </span>
                              {draft.phonetic && (
                                <span className="text-[11px] font-mono text-[#FFD166]">
                                  {draft.phonetic}
                                </span>
                              )}
                              {draft.partOfSpeech && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00E5FF]/20 text-[#00E5FF]">
                                  ({draft.partOfSpeech})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#9D4EDD]/20 text-[#9D4EDD]">
                              K{draft.grade} • U{draft.unitNumber}
                            </span>
                          </div>

                          <div className="text-xs text-[#06D6A0] font-medium">
                            ➔ {draft.meaningVi}
                          </div>

                          {draft.exampleEn && (
                            <div className="text-[11px] text-[#778DA9] italic line-clamp-1">
                              Ví dụ: "{draft.exampleEn}"
                            </div>
                          )}

                          {/* 3 Distractors Preview */}
                          <div className="pt-1 flex items-center gap-1 flex-wrap text-[10px] text-[#778DA9]">
                            <span className="text-[#FFD166] font-semibold">3 Nhiễu Game:</span>
                            {draft.distractorsVi.map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className="px-1.5 py-0.5 rounded bg-[#1B263B] border border-[#27384E] text-[#CBD5E1]"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart notice */}
            <div className="p-3 rounded-xl bg-[#1B263B] border border-[#27384E] text-[11px] text-[#778DA9] space-y-1">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <Sparkles size={13} className="text-[#00E5FF]" />
                <span>Tính Năng Tự Động Thông Minh:</span>
              </div>
              <p>
                • Tự động tra cứu <strong className="text-[#FFD166]">phiên âm IPA</strong> từ từ điển 600+ từ chuẩn nếu dòng chưa có.
              </p>
              <p>
                • Tự động tạo <strong className="text-[#06D6A0]">3 đáp án nhiễu trắc nghiệm</strong> cho game Tap Hunter từ các từ khác trong bài.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#27384E] bg-[#1B263B] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {importSuccessCount !== null ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[#06D6A0] bg-[#06D6A0]/10 px-3 py-2 rounded-xl border border-[#06D6A0]/30 animate-pulse">
                <CheckCircle size={16} />
                <span>Đã nạp thành công {importSuccessCount} từ vựng vào hệ thống!</span>
              </div>
            ) : (
              <span className="text-xs text-[#778DA9]">
                Sẵn sàng lưu <strong className="text-white font-bold">{validCount}</strong> từ vựng vào giáo trình
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#778DA9] hover:text-white bg-[#131F2E] hover:bg-[#1E2D40] transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={validCount === 0 || isImporting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#0D1B2A] bg-linear-to-r from-[#00E5FF] to-[#06D6A0] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#00E5FF]/20 flex items-center gap-2 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Lưu Tất Cả {validCount} Từ Vào Giáo Trình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
