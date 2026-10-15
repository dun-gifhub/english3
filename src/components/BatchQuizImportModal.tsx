import React, { useState, useMemo } from 'react';
import { CustomQuestion } from '../types';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Trash2,
  Copy,
  X,
  Check,
  HelpCircle,
  Table
} from 'lucide-react';

interface BatchQuizImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (questions: CustomQuestion[]) => void;
}

const SAMPLE_QUIZ = `Câu 1: If we continue to use plastic bags, we _____ our living environment.
A. will damage
B. damage
C. damaged
D. would damage
Đáp án: A
Giải thích: Câu điều kiện loại 1 (If + hiện tại đơn, tương lai đơn S + will + V).

Câu 2: Many volunteers joined the campaign to clean _____ the local beach.
A. on
B. in
C. up
D. with
Đáp án: C
Giải thích: Cụm động từ "clean up" nghĩa là dọn dẹp sạch sẽ.

Câu 3: The school organized a charity event to _____ money for flood victims.
A. raise
B. rise
C. lift
D. take
Đáp án: A
Giải thích: Cụm từ "raise money" nghĩa là quyên góp, gây quỹ từ thiện.

Câu 4: Luong Phu High School encourages students to develop their _____ thinking skills.
A. criticize
B. critical
C. critically
D. criticism
Đáp án: B
Giải thích: Cần một tính từ (critical) đứng trước danh từ "thinking skills".`;

export const BatchQuizImportModal: React.FC<BatchQuizImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions
}) => {
  const [inputText, setInputText] = useState(SAMPLE_QUIZ);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  // Parse questions from pasted text
  const parsedQuestions: {
    question: CustomQuestion;
    error?: string;
  }[] = useMemo(() => {
    if (!inputText.trim()) return [];

    // Split text into question blocks by "Câu X:" or "Question X:" or empty lines with numbers
    const blocks = inputText.split(/(?:^|\n)(?=(?:Câu\s*\d+|Question\s*\d+|\d+\.)[:\.\s])/i);
    const results: { question: CustomQuestion; error?: string }[] = [];

    blocks.forEach((rawBlock, idx) => {
      const block = rawBlock.trim();
      if (!block) return;

      const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      // First line: Question text (remove "Câu 1:", "Question 1:", "1.")
      let questionLine = lines[0];
      questionLine = questionLine.replace(/^(?:Câu\s*\d+|Question\s*\d+|\d+)[:\.\s\-]+\s*/i, '').trim();

      const options: string[] = [];
      let correctIndex = 0;
      let explanation = '';
      let foundAnswer = false;

      // Loop through lines looking for options (A., B., C., D.) and answer/explanation
      lines.slice(1).forEach((line) => {
        // Option pattern: A. option text, B) option text, etc.
        const optMatch = line.match(/^([A-D])[\.\)\:\-]\s*(.*)$/i);
        if (optMatch) {
          const optText = optMatch[2].trim();
          options.push(optText);
          // If option is marked with an asterisk or (đúng)
          if (line.includes('*') || line.toLowerCase().includes('(đúng)') || line.toLowerCase().includes('(key)')) {
            const letter = optMatch[1].toUpperCase();
            correctIndex = letter.charCodeAt(0) - 65; // A->0, B->1, C->2, D->3
            foundAnswer = true;
          }
          return;
        }

        // Answer pattern: "Đáp án: A", "Key: B", "Ans: C"
        const ansMatch = line.match(/(?:Đáp án|Key|Ans|Answer|ĐA)[:\s]+([A-D])/i);
        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          correctIndex = letter.charCodeAt(0) - 65;
          foundAnswer = true;
          return;
        }

        // Explanation pattern: "Giải thích: ...", "Explain: ..."
        const explMatch = line.match(/(?:Giải thích|Explain|Explanation)[:\s]+(.*)$/i);
        if (explMatch) {
          explanation = explMatch[1].trim();
          return;
        }
      });

      // If options are fewer than 4, fill remaining with empty string
      while (options.length < 4) {
        options.push('');
      }

      const isValid = questionLine.length > 0 && options[0].length > 0 && options[1].length > 0;

      results.push({
        question: {
          id: `batch_q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          question: questionLine,
          options: options.slice(0, 4),
          correctIndex: Math.max(0, Math.min(3, correctIndex)),
          explanation: explanation || 'Ôn tập kiến thức trọng tâm.',
          topic: 'Kiểm tra trắc nghiệm'
        },
        error: !isValid ? 'Thiếu câu hỏi hoặc các lựa chọn A, B, C, D' : undefined
      });
    });

    return results;
  }, [inputText]);

  const validQuestions = parsedQuestions.filter((p) => !p.error).map((p) => p.question);

  const handleConfirm = () => {
    if (validQuestions.length === 0) return;
    onImportQuestions(validQuestions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#131F2E] border border-[#9D4EDD]/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#27384E] bg-linear-to-r from-[#1B263B] to-[#131F2E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9D4EDD]/20 text-[#9D4EDD] flex items-center justify-center border border-[#9D4EDD]/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Dán Nhanh Đề Thi Trắc Nghiệm Từ File Word / Văn Bản</span>
              </h2>
              <p className="text-xs text-[#778DA9]">
                Tự động nhận diện Câu 1, Câu 2, các lựa chọn A/B/C/D, đáp án đúng và lời giải chi tiết.
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

        {/* Quick Toolbar */}
        <div className="p-3 bg-[#1B263B]/60 border-b border-[#27384E] flex items-center justify-between gap-2 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[#778DA9]">Mẫu có sẵn:</span>
            <button
              onClick={() => setInputText(SAMPLE_QUIZ)}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] hover:border-[#9D4EDD] text-white text-[11px] font-bold cursor-pointer"
            >
              Chèn 4 Câu Mẫu
            </button>
            <button
              onClick={() => setInputText('')}
              className="px-2.5 py-1 rounded-lg bg-[#131F2E] text-[#EF476F] hover:bg-[#EF476F]/20 text-[11px] font-bold cursor-pointer"
            >
              Xóa Trắng
            </button>
          </div>

          <span className="text-[11px] text-[#06D6A0] font-bold">
            ✓ Đã phân tích: {validQuestions.length} câu hỏi hợp lệ
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Textarea */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <label className="text-xs font-semibold text-[#778DA9] flex items-center justify-between">
              <span>Nội dung đề thi:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inputText);
                  setCopiedFeedback(true);
                  setTimeout(() => setCopiedFeedback(false), 2000);
                }}
                className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
              >
                {copiedFeedback ? <Check size={12} /> : <Copy size={12} />}
                <span>Sao chép</span>
              </button>
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Dán đề thi dạng:&#10;Câu 1: Question text...&#10;A. Option 1&#10;B. Option 2&#10;C. Option 3&#10;D. Option 4&#10;Đáp án: A&#10;Giải thích: ..."
              rows={16}
              className="w-full flex-1 p-3.5 rounded-2xl bg-[#0D1B2A] border border-[#27384E] text-white font-mono text-xs leading-relaxed focus:border-[#9D4EDD] focus:outline-none resize-none shadow-inner"
            />
          </div>

          {/* Right Preview */}
          <div className="lg:col-span-6 flex flex-col space-y-2">
            <label className="text-xs font-semibold text-[#778DA9]">
              Xem trước câu hỏi nhận diện được ({validQuestions.length}):
            </label>
            <div className="flex-1 rounded-2xl bg-[#0D1B2A] border border-[#27384E] overflow-y-auto p-3 space-y-3 max-h-[450px]">
              {validQuestions.length === 0 ? (
                <div className="text-center py-12 text-[#778DA9] text-xs">
                  Chưa nhận diện được câu hỏi. Hãy dán đề thi theo định dạng: Câu 1 / A. B. C. D. / Đáp án: A
                </div>
              ) : (
                validQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#1B263B] border border-[#27384E] text-xs space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-white">
                        <span className="text-[#9D4EDD] mr-1.5">Câu {idx + 1}:</span>
                        {q.question}
                      </span>
                    </div>

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
        <div className="p-4 border-t border-[#27384E] bg-[#1B263B] flex items-center justify-between">
          <span className="text-xs text-[#778DA9]">
            Nhập <strong className="text-white font-bold">{validQuestions.length}</strong> câu hỏi vào đề thi hiện tại
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#778DA9] hover:text-white bg-[#131F2E]"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={validQuestions.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-[#9D4EDD] to-[#7B2CBF] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#9D4EDD]/20 cursor-pointer"
            >
              Thêm {validQuestions.length} Câu Vào Đề
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
