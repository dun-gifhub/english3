import React, { useState, useMemo, useRef } from 'react';
import { TeacherAssignment, CustomQuestion } from '../types';
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
  GraduationCap,
  Clock
} from 'lucide-react';

interface BatchExamFileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportExam: (assignment: TeacherAssignment) => void;
  defaultGrade?: number;
}

const SAMPLE_EXAM_TEXT = `Tiêu đề: Đề Ôn Tập Trọng Tâm Unit 1 & Unit 2 (Lớp 10)
Thời gian: 15
Mô tả: Đề kiểm tra đánh giá kiến thức từ vựng và ngữ pháp trọng tâm.

Câu 1: In my family, both of my parents share the household _____ together.
A. chores
B. works
C. jobs
D. tasks
Đáp án: A
Giải thích: Cụm từ cố định "household chores" nghĩa là các công việc vặt trong nhà.

Câu 2: My father is the main _____ who earns money to support our whole family.
A. homemaker
B. breadwinner
C. servant
D. helper
Đáp án: B
Giải thích: "Breadwinner" nghĩa là người trụ cột kiếm sống cho gia đình.

Câu 3: If everyone _____ energy, we will help reduce global warming.
A. save
B. saves
C. will save
D. saved
Đáp án: B
Giải thích: Câu điều kiện loại 1 trong mệnh đề If chủ ngữ "everyone" đi với động từ số ít "saves".

Câu 4: Luong Phu High School is dedicated to providing students with high-_____ education.
A. quality
B. qualify
C. qualified
D. qualification
Đáp án: A
Giải thích: Cụm từ "high-quality education" nghĩa là nền giáo dục chất lượng cao.`;

export const BatchExamFileImportModal: React.FC<BatchExamFileImportModalProps> = ({
  isOpen,
  onClose,
  onImportExam,
  defaultGrade = 10
}) => {
  const [inputText, setInputText] = useState(SAMPLE_EXAM_TEXT);
  const [examGrade, setExamGrade] = useState<number>(defaultGrade);
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse exam header and questions
  const parsedResult = useMemo(() => {
    if (!inputText.trim()) {
      return {
        title: 'Đề Thi Mới',
        timeLimitMinutes: 15,
        description: 'Đề kiểm tra trắc nghiệm',
        grade: examGrade,
        questions: []
      };
    }

    let title = `Đề Kiểm Tra Tiếng Anh Khối ${examGrade}`;
    let timeLimitMinutes = 15;
    let description = 'Đề kiểm tra trắc nghiệm chuẩn kiến thức.';
    let grade = examGrade;

    // Check title, time, description lines at beginning
    const titleMatch = inputText.match(/(?:Tiêu đề|Title|Tên đề)[:\s]+(.*)$/im);
    if (titleMatch) title = titleMatch[1].trim();

    const timeMatch = inputText.match(/(?:Thời gian|Time|Thời lượng)[:\s]+(\d+)/im);
    if (timeMatch) timeLimitMinutes = parseInt(timeMatch[1], 10) || 15;

    const descMatch = inputText.match(/(?:Mô tả|Description|Hướng dẫn)[:\s]+(.*)$/im);
    if (descMatch) description = descMatch[1].trim();

    const gradeMatch = inputText.match(/(?:Lớp|Khối|Grade)\s*(\d{1,2})/im);
    if (gradeMatch) {
      const g = parseInt(gradeMatch[1], 10);
      if (g >= 6 && g <= 12) grade = g;
    }

    // Split questions by "Câu X:" or "Question X:"
    const blocks = inputText.split(/(?:^|\n)(?=(?:Câu\s*\d+|Question\s*\d+|\d+\.)[:\.\s])/i);
    const questions: CustomQuestion[] = [];

    blocks.forEach((rawBlock, idx) => {
      const block = rawBlock.trim();
      if (!block) return;

      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      // First line: question
      let qText = lines[0].replace(/^(?:Câu\s*\d+|Question\s*\d+|\d+)[:\.\s\-]+\s*/i, '').trim();
      // Skip if line was actually title or time header
      if (qText.toLowerCase().startsWith('tiêu đề:') || qText.toLowerCase().startsWith('thời gian:')) return;

      const options: string[] = [];
      let correctIndex = 0;
      let explanation = '';

      lines.slice(1).forEach((line) => {
        const optMatch = line.match(/^([A-D])[\.\)\:\-]\s*(.*)$/i);
        if (optMatch) {
          options.push(optMatch[2].trim());
          if (line.includes('*') || line.toLowerCase().includes('(đúng)')) {
            const letter = optMatch[1].toUpperCase();
            correctIndex = letter.charCodeAt(0) - 65;
          }
          return;
        }

        const ansMatch = line.match(/(?:Đáp án|Key|Ans|Answer)[:\s]+([A-D])/i);
        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          correctIndex = letter.charCodeAt(0) - 65;
          return;
        }

        const explMatch = line.match(/(?:Giải thích|Explain|Explanation)[:\s]+(.*)$/i);
        if (explMatch) {
          explanation = explMatch[1].trim();
          return;
        }
      });

      while (options.length < 4) {
        options.push('');
      }

      if (qText.length > 0 && options[0].length > 0) {
        questions.push({
          id: `exam_q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          question: qText,
          options: options.slice(0, 4),
          correctIndex: Math.max(0, Math.min(3, correctIndex)),
          explanation: explanation || 'Củng cố kiến thức trọng tâm.',
          topic: 'Trắc nghiệm tổng hợp'
        });
      }
    });

    return {
      title,
      timeLimitMinutes,
      description,
      grade,
      questions
    };
  }, [inputText, examGrade]);

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

  const handleDownloadTxtTemplate = () => {
    const blob = new Blob([SAMPLE_EXAM_TEXT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mau_de_thi_lop_${examGrade}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = () => {
    if (parsedResult.questions.length === 0) return;

    const newAssignment: TeacherAssignment = {
      id: `assign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teacherUid: 'teacher_custom',
      teacherName: 'Tổ Ngoại Ngữ THPT Lương Phú',
      title: parsedResult.title,
      description: parsedResult.description,
      grade: parsedResult.grade,
      createdAt: Date.now(),
      questions: parsedResult.questions
    };

    onImportExam(newAssignment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#131F2E] border border-[#FFD166]/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#27384E] bg-linear-to-r from-[#1B263B] to-[#131F2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFD166]/20 text-[#FFD166] flex items-center justify-center border border-[#FFD166]/30 shrink-0">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Nhập Toàn Bộ Đề Thi Từ Tệp / Văn Bản (Batch Import Đề)</span>
              </h2>
              <p className="text-xs text-[#778DA9]">
                Tự động nhận diện Tiêu đề, Thời gian, Khối lớp và từng câu hỏi A/B/C/D từ file Word/Text.
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

        {/* Toolbar */}
        <div className="p-3.5 bg-[#1B263B]/60 border-b border-[#27384E] flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[#778DA9] font-semibold">Khối Mặc Định:</span>
              <select
                value={examGrade}
                onChange={(e) => setExamGrade(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold text-xs"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputText(SAMPLE_EXAM_TEXT)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#FFD166] text-white text-[11px] font-bold cursor-pointer"
            >
              Chèn Đề Mẫu 4 Câu
            </button>
            <button
              onClick={() => setInputText('')}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] text-[#EF476F] hover:bg-[#EF476F]/20 text-[11px] font-bold cursor-pointer"
            >
              Xóa Trắng
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column Input */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#131F2E] p-1 rounded-xl border border-[#27384E]">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-[#FFD166] text-[#0D1B2A]'
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
                      ? 'bg-[#FFD166] text-[#0D1B2A]'
                      : 'text-[#778DA9] hover:text-white'
                  }`}
                >
                  <Upload size={14} />
                  <span>Tải Tệp Đề Thi</span>
                </button>
              </div>

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

            {activeTab === 'text' && (
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Dán toàn bộ đề thi vào đây..."
                rows={16}
                className="w-full flex-1 p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#27384E] text-white font-mono text-xs leading-relaxed focus:border-[#FFD166] focus:outline-none resize-none shadow-inner"
              />
            )}

            {activeTab === 'file' && (
              <div className="p-6 rounded-2xl bg-[#0D1B2A] border-2 border-dashed border-[#27384E] hover:border-[#FFD166]/60 transition-all flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="w-16 h-16 rounded-3xl bg-[#FFD166]/10 text-[#FFD166] flex items-center justify-center border border-[#FFD166]/30">
                  <Upload size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">
                    Chọn tệp đề thi (.txt) từ máy tính
                  </h4>
                  <p className="text-xs text-[#778DA9] max-w-sm">
                    Tải lên file đề thi đã lưu dạng text để hệ thống phân tích.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="batch-exam-file-input"
                />

                <label
                  htmlFor="batch-exam-file-input"
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#FFD166] to-[#F77F00] hover:brightness-110 text-[#0D1B2A] font-bold text-xs cursor-pointer shadow-lg shadow-[#FFD166]/20 flex items-center gap-2"
                >
                  <Upload size={15} />
                  <span>Chọn Tệp Đề Thi</span>
                </label>

                <div className="pt-4 border-t border-[#27384E] w-full flex items-center justify-center gap-3">
                  <button
                    onClick={handleDownloadTxtTemplate}
                    className="px-3 py-1.5 rounded-xl bg-[#1B263B] text-[#778DA9] hover:text-white text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <Download size={13} />
                    <span>Tải mẫu đề thi .TXT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column Preview */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FFD166] flex items-center gap-1.5">
                  <Sparkles size={14} />
                  <span>Thông Tin Đề Thi Được Nhận Diện</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFD166]/20 text-[#FFD166]">
                  Lớp {parsedResult.grade}
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                {parsedResult.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-[#778DA9]">
                <span className="flex items-center gap-1 text-white font-medium">
                  <Clock size={13} className="text-[#00E5FF]" />
                  <span>{parsedResult.timeLimitMinutes} phút</span>
                </span>
                <span className="text-[#06D6A0] font-bold">
                  ✓ {parsedResult.questions.length} câu hỏi hợp lệ
                </span>
              </div>
            </div>

            {/* Questions preview */}
            <div className="flex-1 rounded-2xl bg-[#0D1B2A] border border-[#27384E] overflow-y-auto p-3 space-y-3 max-h-[420px]">
              {parsedResult.questions.length === 0 ? (
                <div className="text-center py-16 text-[#778DA9] text-xs">
                  Chưa nhận diện được câu hỏi. Hãy dán đề thi theo định dạng: Câu 1 / A. B. C. D. / Đáp án: A
                </div>
              ) : (
                parsedResult.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1B263B] border border-[#27384E] text-xs space-y-1.5">
                    <span className="font-bold text-white block">
                      <span className="text-[#FFD166] mr-1.5">Câu {idx + 1}:</span>
                      {q.question}
                    </span>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {(q.options || []).map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 rounded-lg text-[11px] font-medium border ${
                            oIdx === q.correctIndex
                              ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0] font-bold'
                              : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                          }`}
                        >
                          <span className="font-black mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                          {opt || '(Trống)'}
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="text-[10px] text-[#778DA9] italic pt-1">
                        Giải thích: {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#27384E] bg-[#1B263B] flex items-center justify-between gap-3">
          <span className="text-xs text-[#778DA9]">
            Sẵn sàng tạo đề thi với <strong className="text-white font-bold">{parsedResult.questions.length}</strong> câu hỏi
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#778DA9] hover:text-white bg-[#131F2E]"
            >
              Đóng
            </button>
            <button
              onClick={handleConfirm}
              disabled={parsedResult.questions.length === 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#0D1B2A] bg-linear-to-r from-[#FFD166] to-[#F77F00] hover:brightness-110 disabled:opacity-50 shadow-md shadow-[#FFD166]/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle size={15} />
              <span>Tạo & Lưu Đề Thi Này Vào Hệ Thống</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
