import React, { useState, useMemo, useRef } from 'react';
import { GrammarLesson } from '../types';
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
  BookOpen
} from 'lucide-react';

interface BatchGrammarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportGrammar: (lessons: Omit<GrammarLesson, 'id'>[]) => Promise<number>;
  defaultGrade?: number;
}

interface ParsedGrammarDraft {
  id: string;
  grade: number;
  title: string;
  formula: string;
  explanationVi: string;
  exampleEn: string;
  exampleVi: string;
  usageNotes: string;
  originalText: string;
  error?: string;
}

const SAMPLE_GRAMMAR_STRUCTURED = `# Bài 1: Present Simple Tense (Thì Hiện Tại Đơn)
Cấu trúc: S + V(s/es) + O
Giải thích: Diễn tả thói quen hằng ngày, hành động lặp đi lặp lại hoặc chân lý, sự thật hiển nhiên.
Ví dụ: The sun rises in the east. | Mặt trời mọc ở hướng đông.
Lưu ý: Thêm -es với các động từ có tận cùng là o, s, ch, x, sh, z (watches, goes, fixes).

# Bài 2: First Conditional (Câu Điều Kiện Loại 1)
Cấu trúc: If + S + V(hiện tại đơn), S + will / can + V(nguyên thể)
Giải thích: Diễn tả điều kiện có thật hoặc có thể xảy ra ở hiện tại hoặc tương lai.
Ví dụ: If we protect the environment, we will have a greener planet. | Nếu chúng ta bảo vệ môi trường, chúng ta sẽ có một hành tinh xanh hơn.
Lưu ý: Mệnh đề If không dùng "will". Có thể đảo vế chính lên trước không cần dấu phẩy.

# Bài 3: Relative Clauses with Which/Who (Mệnh Đề Quan Hệ)
Cấu trúc: S + Who / Which + V + O
Giải thích: "Who" dùng thay thế cho danh từ chỉ người, "Which" dùng thay thế cho danh từ chỉ vật làm chủ ngữ hoặc tân ngữ.
Ví dụ: The student who won first prize studies at Luong Phu High School. | Người học sinh đạt giải nhất học tại THPT Lương Phú.
Lưu ý: Không dùng "which" cho người. Trong mệnh đề quan hệ xác định có thể dùng "that" thay cho who/which.`;

export const BatchGrammarImportModal: React.FC<BatchGrammarImportModalProps> = ({
  isOpen,
  onClose,
  onImportGrammar,
  defaultGrade = 10
}) => {
  const [inputText, setInputText] = useState(SAMPLE_GRAMMAR_STRUCTURED);
  const [selectedGrade, setSelectedGrade] = useState<number>(defaultGrade);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parser logic
  const parsedDrafts: ParsedGrammarDraft[] = useMemo(() => {
    if (!inputText.trim()) return [];

    const trimmed = inputText.trim();

    // Check JSON format
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          return json.map((item, idx) => {
            const title = String(item.title || item.name || '').trim();
            const formula = String(item.formula || item.structure || '').trim();
            const explanationVi = String(item.explanationVi || item.explanation || item.usage || '').trim();
            const exampleEn = String(item.exampleEn || item.example || '').trim();
            const exampleVi = String(item.exampleVi || '').trim();
            const usageNotes = String(item.usageNotes || item.notes || '').trim();
            const grade = Number(item.grade) || selectedGrade;

            const isValid = title.length > 0 && formula.length > 0;
            return {
              id: `draft_gram_json_${idx}`,
              grade,
              title,
              formula,
              explanationVi,
              exampleEn,
              exampleVi,
              usageNotes,
              originalText: JSON.stringify(item),
              error: !isValid ? 'Thiếu tiêu đề hoặc công thức cấu trúc' : undefined
            };
          });
        }
      } catch {
        // Continue to text parser
      }
    }

    // Split blocks by "# Bài", "# Unit", "Bài X:" or double newline
    const blocks = inputText.split(/(?:^|\n)(?=(?:#\s*Bài|Bài\s*\d+|#\s*Chủ đề|Chuyên đề\s*\d+)[:\.\s])/i);
    const drafts: ParsedGrammarDraft[] = [];

    blocks.forEach((rawBlock, idx) => {
      const block = rawBlock.trim();
      if (!block) return;

      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;

      let title = '';
      let formula = '';
      let explanationVi = '';
      let exampleEn = '';
      let exampleVi = '';
      let usageNotes = '';
      let grade = selectedGrade;

      // Check if block contains single-line pipe separated format
      // "Title | Formula | Explanation | ExampleEn | ExampleVi | Notes"
      if (lines.length === 1 && lines[0].includes('|')) {
        const parts = lines[0].split('|').map((p) => p.trim());
        title = parts[0] || '';
        formula = parts[1] || '';
        explanationVi = parts[2] || '';
        exampleEn = parts[3] || '';
        exampleVi = parts[4] || '';
        usageNotes = parts[5] || '';
      } else {
        // Multi-line structured format
        lines.forEach((line, lIdx) => {
          // Check Grade
          const gradeMatch = line.match(/(?:Lớp|Khối|Grade)\s*(\d{1,2})/i);
          if (gradeMatch) {
            const g = parseInt(gradeMatch[1], 10);
            if (g >= 6 && g <= 12) grade = g;
          }

          if (lIdx === 0 || line.startsWith('#') || line.match(/^(?:Bài|Chuyên đề)\s*\d+[:\.]/i)) {
            // Title line
            title = line.replace(/^[#\-\*]\s*/, '').trim();
            // Remove "Bài 1:" if present
            title = title.replace(/^(?:Bài|Chuyên đề)\s*\d+[:\.]\s*/i, '').trim();
            return;
          }

          const formulaMatch = line.match(/^(?:Cấu trúc|Công thức|Structure|Formula)[:\s]+(.*)$/i);
          if (formulaMatch) {
            formula = formulaMatch[1].trim();
            return;
          }

          const explMatch = line.match(/^(?:Giải thích|Cách dùng|Định nghĩa|Explanation|Usage)[:\s]+(.*)$/i);
          if (explMatch) {
            explanationVi = explMatch[1].trim();
            return;
          }

          const exMatch = line.match(/^(?:Ví dụ|Example|Ex)[:\s]+(.*)$/i);
          if (exMatch) {
            const exContent = exMatch[1].trim();
            if (exContent.includes('|')) {
              const sub = exContent.split('|').map((s) => s.trim());
              exampleEn = sub[0] || '';
              exampleVi = sub[1] || '';
            } else {
              exampleEn = exContent;
            }
            return;
          }

          const notesMatch = line.match(/^(?:Lưu ý|Ghi chú|Chú ý|Notes|Note)[:\s]+(.*)$/i);
          if (notesMatch) {
            usageNotes = notesMatch[1].trim();
            return;
          }

          // If no keyword matched, append to explanation or formula
          if (!formula) {
            formula = line;
          } else if (!explanationVi) {
            explanationVi = line;
          } else if (!usageNotes) {
            usageNotes = line;
          }
        });
      }

      const isValid = title.length > 0 && (formula.length > 0 || explanationVi.length > 0);

      drafts.push({
        id: `draft_gram_${idx}_${Date.now()}`,
        grade,
        title,
        formula: formula || 'S + V + O',
        explanationVi: explanationVi || 'Kiến thức ngữ pháp trọng tâm.',
        exampleEn,
        exampleVi,
        usageNotes: usageNotes || 'Luyện tập làm bài tập để ghi nhớ sâu.',
        originalText: block,
        error: !isValid ? 'Không thể nhận diện tiêu đề và cấu trúc bài học' : undefined
      });
    });

    return drafts;
  }, [inputText, selectedGrade]);

  const validCount = parsedDrafts.filter((d) => !d.error).length;
  const invalidCount = parsedDrafts.filter((d) => d.error).length;

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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download template
  const handleDownloadTxtTemplate = () => {
    const blob = new Blob([SAMPLE_GRAMMAR_STRUCTURED], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mau_ngu_phap_lop_${selectedGrade}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Submit batch import
  const handleConfirmImport = async () => {
    const validItems = parsedDrafts.filter((d) => !d.error);
    if (validItems.length === 0) return;

    setIsImporting(true);
    try {
      const payload: Omit<GrammarLesson, 'id'>[] = validItems.map((v) => ({
        grade: v.grade,
        title: v.title,
        formula: v.formula,
        explanationVi: v.explanationVi,
        exampleEn: v.exampleEn,
        exampleVi: v.exampleVi,
        usageNotes: v.usageNotes
      }));

      const count = await onImportGrammar(payload);
      setImportSuccessCount(count);
      setTimeout(() => {
        setImportSuccessCount(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Có lỗi khi lưu ngữ pháp: ' + err.message);
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
            <div className="w-10 h-10 rounded-2xl bg-[#9D4EDD]/20 text-[#9D4EDD] flex items-center justify-center border border-[#9D4EDD]/30 shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Soạn Ngữ Pháp Siêu Tốc (Dán Tệp & Batch Import)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                  Tự động bóc tách cấu trúc & ví dụ
                </span>
              </h2>
              <p className="text-xs text-[#778DA9]">
                Dán toàn bộ các bài học ngữ pháp hoặc tải tệp .txt/.json từ máy tính để cập nhật giáo trình ngay lập tức.
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

        {/* Top Control Bar: Grade selector & presets */}
        <div className="p-4 bg-[#1B263B]/60 border-b border-[#27384E] flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-3">
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

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#778DA9]">
              <HelpCircle size={13} className="text-[#00E5FF]" />
              <span>Hỗ trợ từ khóa: "Cấu trúc:", "Giải thích:", "Ví dụ:", "Lưu ý:"</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputText(SAMPLE_GRAMMAR_STRUCTURED)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#9D4EDD] text-white text-[11px] font-bold cursor-pointer"
            >
              Chèn 3 Bài Mẫu
            </button>
            <button
              onClick={() => setInputText('')}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] text-[#EF476F] hover:bg-[#EF476F]/20 text-[11px] font-bold cursor-pointer"
            >
              Xóa Trắng
            </button>
          </div>
        </div>

        {/* Body: Left Input, Right Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#131F2E] p-1 rounded-xl border border-[#27384E]">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-[#9D4EDD] text-white'
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
                      ? 'bg-[#9D4EDD] text-white'
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
                  className="p-1.5 rounded-lg bg-[#1B263B] text-[#778DA9] hover:text-white text-xs flex items-center gap-1"
                >
                  {copiedFeedback ? <Check size={14} className="text-[#06D6A0]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {activeTab === 'text' && (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Dán các bài học ngữ pháp vào đây..."
                rows={16}
                className="w-full flex-1 p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#27384E] text-white font-mono text-xs leading-relaxed focus:border-[#9D4EDD] focus:outline-none resize-none shadow-inner"
              />
            )}

            {activeTab === 'file' && (
              <div className="p-6 rounded-2xl bg-[#0D1B2A] border-2 border-dashed border-[#27384E] hover:border-[#9D4EDD]/60 transition-all flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-3xl bg-[#9D4EDD]/10 text-[#9D4EDD] flex items-center justify-center border border-[#9D4EDD]/30">
                  <Upload size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Chọn tệp giáo án ngữ pháp (.txt hoặc .json)
                  </h4>
                  <p className="text-xs text-[#778DA9] max-w-sm">
                    Tải lên file văn bản chứa cấu trúc ngữ pháp để nạp tự động.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="batch-grammar-file-input"
                />

                <label
                  htmlFor="batch-grammar-file-input"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#9D4EDD] to-[#7B2CBF] hover:brightness-110 text-white font-bold text-xs cursor-pointer shadow-lg shadow-[#9D4EDD]/20 flex items-center gap-2"
                >
                  <Upload size={15} />
                  <span>Chọn Tệp Từ Máy Tính</span>
                </label>

                <div className="pt-4 border-t border-[#27384E] w-full flex items-center justify-center gap-3">
                  <button
                    onClick={handleDownloadTxtTemplate}
                    className="px-3 py-1.5 rounded-xl bg-[#1B263B] text-[#778DA9] hover:text-white text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Tải mẫu ngữ pháp .TXT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column Preview (col-span-6) */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Table size={15} className="text-[#06D6A0]" />
                <span>Xem Trước Kết Quả Phân Tích</span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#06D6A0]/20 text-[#06D6A0] font-bold text-[11px]">
                  ✓ {validCount} bài học hợp lệ
                </span>
                {invalidCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EF476F]/20 text-[#EF476F] font-bold text-[11px]">
                    ⚠ {invalidCount} lỗi
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 rounded-2xl bg-[#0D1B2A] border border-[#27384E] overflow-y-auto p-3 space-y-3 max-h-[500px]">
              {parsedDrafts.length === 0 ? (
                <div className="text-center py-16 text-[#778DA9] text-xs">
                  Chưa có dữ liệu. Dán nội dung ở ô bên trái hoặc bấm "Chèn 3 Bài Mẫu".
                </div>
              ) : (
                parsedDrafts.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    className={`p-3.5 rounded-xl text-xs space-y-2 border transition-all ${
                      d.error
                        ? 'bg-[#EF476F]/10 border-[#EF476F]'
                        : 'bg-[#1B263B] border-[#27384E]'
                    }`}
                  >
                    {d.error ? (
                      <div className="text-[#EF476F] font-bold flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        <span>{d.error}</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white text-sm">
                            <span className="text-[#9D4EDD] mr-1.5">#{idx + 1}</span>
                            {d.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#9D4EDD]/20 text-[#9D4EDD]">
                            Khối {d.grade}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-[#131F2E] border border-[#27384E]/70 font-mono text-[11px] text-[#00E5FF]">
                          {d.formula}
                        </div>

                        <p className="text-xs text-[#CBD5E1]">
                          ➔ {d.explanationVi}
                        </p>

                        {d.exampleEn && (
                          <div className="text-[11px] text-[#778DA9] italic">
                            Ví dụ: "{d.exampleEn}" {d.exampleVi && `- ${d.exampleVi}`}
                          </div>
                        )}

                        {d.usageNotes && (
                          <div className="text-[10px] text-[#FFD166] pt-1">
                            Lưu ý: {d.usageNotes}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#27384E] bg-[#1B263B] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {importSuccessCount !== null ? (
              <div className="flex items-center gap-2 text-xs font-bold text-[#06D6A0] bg-[#06D6A0]/10 px-3 py-2 rounded-xl border border-[#06D6A0]/30 animate-pulse">
                <CheckCircle size={16} />
                <span>Đã nạp thành công {importSuccessCount} bài ngữ pháp vào hệ thống!</span>
              </div>
            ) : (
              <span className="text-xs text-[#778DA9]">
                Sẵn sàng lưu <strong className="text-white font-bold">{validCount}</strong> bài học vào giáo trình
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#778DA9] hover:text-white bg-[#131F2E]"
            >
              Đóng
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={validCount === 0 || isImporting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-linear-to-r from-[#9D4EDD] to-[#7B2CBF] hover:brightness-110 disabled:opacity-50 shadow-md shadow-[#9D4EDD]/20 flex items-center gap-2 cursor-pointer"
            >
              {isImporting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  <span>Lưu Tất Cả {validCount} Bài Vào Giáo Trình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
