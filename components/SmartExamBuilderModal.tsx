import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TeacherAssignment,
  CustomQuestion,
  QuestionType,
  QuestionDifficulty,
  MatchingPair,
  BlankItem,
  DragDropClozeBlank
} from '../types';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save,
  Check,
  X,
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Eye,
  Settings,
  Shuffle,
  Users,
  Printer,
  BookOpen,
  ArrowRight,
  Split,
  MoveVertical,
  GripHorizontal,
  PlusCircle
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { DragDropClozePlayer } from './DragDropClozePlayer';

interface SmartExamBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssignment?: TeacherAssignment | null;
  onSaved: (assignment: TeacherAssignment) => void;
}

const QUESTION_TYPES_CONFIG: { type: QuestionType; label: string; desc: string; color: string }[] = [
  { type: 'SINGLE_CHOICE', label: 'Trắc nghiệm 1 đáp án', desc: 'Chọn 1 đáp án đúng trong 4 lựa chọn', color: '#00E5FF' },
  { type: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm nhiều đáp án', desc: 'Chọn 1 hoặc nhiều đáp án đúng', color: '#9D4EDD' },
  { type: 'TRUE_FALSE', label: 'Đúng / Sai', desc: 'Học sinh đánh giá nhận định Đúng hoặc Sai', color: '#06D6A0' },
  { type: 'FILL_IN_BLANK', label: 'Điền vào chỗ trống', desc: 'Điền từ/cụm từ hoặc số vào chỗ khuyết', color: '#FFD166' },
  { type: 'DRAG_DROP_CLOZE', label: 'Kéo thả điền vào ô trống', desc: 'Kéo từ/cụm từ từ ngân hàng từ thả vào các ô trống trong câu', color: '#06D6A0' },
  { type: 'DRAG_DROP', label: 'Kéo thả sắp xếp thứ tự', desc: 'Kéo các thẻ từ vào đúng vị trí hoặc thứ tự', color: '#F77F00' },
  { type: 'MATCHING', label: 'Nối cặp tương ứng', desc: 'Nối thuật ngữ, sự kiện với định nghĩa/kết quả', color: '#E0AAFF' },
  { type: 'SHORT_ANSWER', label: 'Trả lời ngắn', desc: 'Học sinh gõ câu trả lời ngắn theo từ khóa', color: '#48CAE4' },
  { type: 'ESSAY', label: 'Tự luận / Đoạn văn', desc: 'Viết bài luận tự do, giáo viên chấm thủ công', color: '#EF476F' },
  { type: 'READING_COMPREHENSION', label: 'Đọc hiểu kèm đoạn văn', desc: 'Đoạn văn đọc hiểu kèm các câu hỏi thành phần', color: '#7209B7' }
];

export const SmartExamBuilderModal: React.FC<SmartExamBuilderModalProps> = ({
  isOpen,
  onClose,
  initialAssignment,
  onSaved
}) => {
  const { currentUser, classes, curriculumUnits, questionBank, addTeacherAssignment, updateTeacherAssignment } = useApp();

  // Assignment metadata
  const [title, setTitle] = useState(initialAssignment?.title || 'Đề kiểm tra tiếng Anh');
  const [description, setDescription] = useState(initialAssignment?.description || '');
  const [grade, setGrade] = useState<number>(initialAssignment?.grade || 10);
  const [subject, setSubject] = useState<string>(initialAssignment?.subject || 'Tiếng Anh');
  const [unitId, setUnitId] = useState<string>(initialAssignment?.unitId || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(initialAssignment?.timeLimitMinutes ?? 45);
  const [maxAttempts, setMaxAttempts] = useState<number>(initialAssignment?.maxAttempts ?? 1);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(initialAssignment?.shuffleQuestions ?? true);
  const [shuffleOptions, setShuffleOptions] = useState<boolean>(initialAssignment?.shuffleOptions ?? true);
  const [showResultsImmediately, setShowResultsImmediately] = useState<boolean>(initialAssignment?.showResultsImmediately ?? true);
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(initialAssignment?.allowLateSubmission ?? false);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(initialAssignment?.assignedClassIds || []);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'CLOSED'>(initialAssignment?.status || 'PUBLISHED');

  // Questions state
  const [questions, setQuestions] = useState<CustomQuestion[]>(() => {
    if (initialAssignment && initialAssignment.questions.length > 0) {
      return initialAssignment.questions.map((q) => ({
        ...q,
        type: q.type || 'SINGLE_CHOICE',
        points: q.points || 1.0,
        options: q.options || ['', '', '', '']
      }));
    }
    return [
      {
        id: 'q_1',
        type: 'SINGLE_CHOICE',
        question: 'In my family, both parents work together to ______ the household chores.',
        options: ['share', 'divide', 'separate', 'make'],
        correctIndex: 0,
        explanation: '"Share household chores" là kết hợp từ cố định (collocation) mang nghĩa chia sẻ công việc nhà.',
        points: 1.0,
        difficulty: 'MEDIUM',
        topic: 'Family Life',
        grade: 10
      }
    ];
  });

  const [activeQIndex, setActiveQIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState('Thì Hiện Tại & Quá Khứ');
  const [aiCount, setAiCount] = useState(3);
  const [aiType, setAiType] = useState('ALL');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentQ = questions[activeQIndex] || questions[0];

  // Helper to update current question
  const updateCurrentQuestion = (updates: Partial<CustomQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === activeQIndex ? { ...q, ...updates } : q))
    );
  };

  // Add question
  const handleAddQuestion = (type: QuestionType) => {
    const newId = `q_${Date.now()}_${questions.length + 1}`;
    let newQ: CustomQuestion = {
      id: newId,
      type,
      question: '',
      points: 1.0,
      difficulty: 'MEDIUM',
      topic: 'Ngữ pháp chung',
      grade
    };

    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
      newQ.options = ['', '', '', ''];
      newQ.correctIndex = 0;
      newQ.correctIndices = [0];
    } else if (type === 'TRUE_FALSE') {
      newQ.isTrue = true;
    } else if (type === 'FILL_IN_BLANK') {
      newQ.question = 'He usually [blank1] to school by bike.';
      newQ.blanks = [{ id: 'blank1', correctAnswers: ['goes'], placeholder: 'dạng đúng của go' }];
    } else if (type === 'DRAG_DROP_CLOZE') {
      newQ.question = 'Quá trình quang hợp sử dụng [blank1] và [blank2] để tạo ra chất hữu cơ và giải phóng oxy.';
      newQ.clozeContent = 'Quá trình quang hợp sử dụng [blank1] và [blank2] để tạo ra chất hữu cơ và giải phóng oxy.';
      newQ.clozeBlanks = [
        { id: 'blank1', label: 'Ô trống 1', correctAnswer: 'Carbon dioxide', acceptableAlternatives: ['CO2', 'khí cacbonic'], points: 1.0 },
        { id: 'blank2', label: 'Ô trống 2', correctAnswer: 'Nước', acceptableAlternatives: ['H2O'], points: 1.0 }
      ];
      newQ.distractors = ['Ánh sáng', 'Oxy', 'Nitơ'];
      newQ.allowReuseOptions = false;
      newQ.shuffleBankOptions = true;
      newQ.caseSensitive = false;
      newQ.points = 2.0;
    } else if (type === 'DRAG_DROP') {
      newQ.dragItems = ['She', 'speaks', 'English', 'fluently'];
      newQ.correctOrder = ['She', 'speaks', 'English', 'fluently'];
    } else if (type === 'MATCHING') {
      newQ.pairs = [
        { id: 'p1', left: 'Take responsibility', right: 'Chịu trách nhiệm' },
        { id: 'p2', left: 'Household chore', right: 'Việc nhà thường nhật' }
      ];
    } else if (type === 'SHORT_ANSWER') {
      newQ.sampleAnswer = 'Mẫu câu trả lời ngắn chuẩn';
    } else if (type === 'ESSAY') {
      newQ.rubricNotes = 'Tiêu chí: Đúng ngữ pháp, bố cục rõ ràng, từ vựng phong phú.';
    } else if (type === 'READING_COMPREHENSION') {
      newQ.passage = 'Đoạn văn đọc hiểu tiếng Anh ở đây...';
      newQ.subQuestions = [];
    }

    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  // Delete question
  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const nextList = questions.filter((_, i) => i !== idx);
    setQuestions(nextList);
    setActiveQIndex(Math.max(0, idx - 1));
  };

  // Duplicate question
  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const clone: CustomQuestion = {
      ...JSON.parse(JSON.stringify(target)),
      id: `q_copy_${Date.now()}`
    };
    const nextList = [...questions];
    nextList.splice(idx + 1, 0, clone);
    setQuestions(nextList);
    setActiveQIndex(idx + 1);
  };

  // Move question
  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const nextList = [...questions];
    const [moved] = nextList.splice(fromIdx, 1);
    nextList.splice(toIdx, 0, moved);
    setQuestions(nextList);
    setActiveQIndex(toIdx);
  };

  // AI Generation trigger
  const handleGenerateAi = async () => {
    setIsAiLoading(true);
    try {
      const generated = await apiService.generateAiQuestions({
        topic: aiTopic,
        grade,
        count: aiCount,
        questionType: aiType,
        difficulty: 'MEDIUM'
      });
      if (generated && generated.length > 0) {
        setQuestions((prev) => [...prev, ...generated]);
        setActiveQIndex(questions.length);
        setShowAiModal(false);
      }
    } catch (err: any) {
      alert('Không thể tạo câu hỏi AI: ' + err.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Total points calculation
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0);

  // Save Assignment
  const handleSaveExam = async (targetStatus?: 'DRAFT' | 'PUBLISHED' | 'CLOSED') => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề thi!');
      return;
    }

    const payload: TeacherAssignment = {
      id: initialAssignment?.id || `assign_${Date.now()}`,
      teacherUid: currentUser?.uid || 'teacher_01',
      teacherName: currentUser?.displayName || 'Giáo viên THPT Lương Phú',
      grade,
      subject,
      title: title.trim(),
      description: description.trim(),
      questions,
      timeLimitMinutes,
      maxAttempts,
      shuffleQuestions,
      shuffleOptions,
      showResultsImmediately,
      allowLateSubmission,
      assignedClassIds,
      status: targetStatus || status,
      unitId,
      totalPoints,
      createdAt: initialAssignment?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    if (initialAssignment) {
      updateTeacherAssignment(payload);
    } else {
      addTeacherAssignment(payload);
    }

    onSaved(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-7xl h-[95vh] rounded-3xl bg-[#0D1B2A] border border-[#27384E] shadow-2xl flex flex-col overflow-hidden text-[#F8F9FA]">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-[#27384E] bg-[#1B263B]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] shrink-0">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề đề kiểm tra..."
                  className="text-base sm:text-lg font-black text-white bg-transparent border-b border-transparent hover:border-[#27384E] focus:border-[#00E5FF] focus:outline-none transition w-64 sm:w-96"
                />
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    status === 'PUBLISHED'
                      ? 'bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/40'
                      : status === 'DRAFT'
                      ? 'bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/40'
                      : 'bg-[#EF476F]/20 text-[#EF476F] border border-[#EF476F]/40'
                  }`}
                >
                  {status === 'PUBLISHED' ? 'Đã công bố' : status === 'DRAFT' ? 'Bản nháp' : 'Đã đóng'}
                </span>
              </div>
              <p className="text-xs text-[#778DA9]">
                {questions.length} câu hỏi • Tổng điểm: {totalPoints.toFixed(1)} đ • Thời gian: {timeLimitMinutes > 0 ? `${timeLimitMinutes} phút` : 'Tự do'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#9D4EDD]/20 border border-[#9D4EDD]/40 text-[#D8B4FE] hover:bg-[#9D4EDD]/30 transition text-xs font-bold"
            >
              <Sparkles size={15} />
              <span>Tạo câu hỏi AI</span>
            </button>

            <button
              onClick={() => setShowBankPicker(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFD166]/20 border border-[#FFD166]/40 text-[#FFD166] hover:bg-[#FFD166]/30 transition text-xs font-bold"
            >
              <BookOpen size={15} />
              <span>Ngân hàng câu hỏi</span>
            </button>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition ${
                previewMode
                  ? 'bg-[#00E5FF] text-[#0D1B2A] border-[#00E5FF]'
                  : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
              }`}
            >
              <Eye size={15} />
              <span>{previewMode ? 'Sửa đề' : 'Xem trước'}</span>
            </button>

            <button
              onClick={() => handleSaveExam('DRAFT')}
              className="px-3.5 py-2 rounded-xl border border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E] transition text-xs font-bold"
            >
              Lưu Nháp
            </button>

            <button
              onClick={() => handleSaveExam('PUBLISHED')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06D6A0] text-[#0D1B2A] hover:bg-[#06D6A0]/90 transition text-xs font-black shadow-lg shadow-[#06D6A0]/20"
            >
              <Save size={15} />
              <span>Công Bố Đề Thi</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#778DA9] hover:text-white hover:bg-[#27384E] transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 3-Column Studio Body */}
        <div className="flex-1 grid grid-cols-12 overflow-hidden">
          {/* Column 1: Question Outline & Palette (Left, 3 cols) */}
          <div className="col-span-12 md:col-span-3 border-r border-[#27384E] bg-[#131F2E]/80 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#27384E] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#778DA9]">
                Cấu Trúc Đề ({questions.length} câu)
              </span>
              {/* Add Type Menu Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 transition">
                  <Plus size={14} />
                  <span>Thêm câu</span>
                </button>
                <div className="absolute left-0 mt-1 w-64 rounded-2xl bg-[#1B263B] border border-[#27384E] shadow-2xl p-2 hidden group-hover:block z-30 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase text-[#778DA9]">Chọn dạng câu hỏi:</div>
                  {QUESTION_TYPES_CONFIG.map((cfg) => (
                    <button
                      key={cfg.type}
                      onClick={() => handleAddQuestion(cfg.type)}
                      className="w-full text-left p-2 rounded-xl hover:bg-[#27384E] transition flex items-center justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{cfg.label}</span>
                        <span className="text-[10px] text-[#778DA9] block line-clamp-1">{cfg.desc}</span>
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Questions list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {questions.map((q, idx) => {
                const isSelected = idx === activeQIndex;
                const typeCfg = QUESTION_TYPES_CONFIG.find((c) => c.type === (q.type || 'SINGLE_CHOICE'));
                return (
                  <div
                    key={q.id || idx}
                    onClick={() => setActiveQIndex(idx)}
                    className={`p-3 rounded-2xl border transition cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-[#1B263B] border-[#00E5FF] shadow-lg shadow-[#00E5FF]/10'
                        : 'bg-[#131F2E] border-[#27384E]/70 hover:bg-[#1B263B]/60 text-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white flex items-center gap-1.5">
                        <span className="text-[#00E5FF]">Câu {idx + 1}</span>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-[9px] font-bold"
                          style={{ backgroundColor: `${typeCfg?.color || '#00E5FF'}25`, color: typeCfg?.color }}
                        >
                          {typeCfg?.label.split(' ')[0]}
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-[#FFD166] mr-1">{q.points || 1.0}đ</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, idx - 1);
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded text-[#778DA9] hover:text-white disabled:opacity-30"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveQuestion(idx, idx + 1);
                          }}
                          disabled={idx === questions.length - 1}
                          className="p-1 rounded text-[#778DA9] hover:text-white disabled:opacity-30"
                        >
                          <ChevronDown size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateQuestion(idx);
                          }}
                          className="p-1 rounded text-[#778DA9] hover:text-[#00E5FF]"
                        >
                          <Copy size={13} />
                        </button>
                        {questions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuestion(idx);
                            }}
                            className="p-1 rounded text-[#778DA9] hover:text-[#EF476F]"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="line-clamp-2 text-[#CBD5E1] text-[11px] font-medium">
                      {q.question || '<Chưa nhập nội dung câu hỏi>'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Question Editor Canvas (Center, 6 cols) */}
          <div className="col-span-12 md:col-span-6 overflow-y-auto p-4 sm:p-6 bg-[#0D1B2A] flex flex-col space-y-4">
            {previewMode ? (
              /* Student Preview Screen */
              <div className="p-6 rounded-3xl bg-[#1B263B] border border-[#00E5FF]/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#27384E]">
                  <span className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">
                    Chế Độ Xem Trước Của Học Sinh — Câu {activeQIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-[#FFD166]">{currentQ.points || 1.0} Điểm</span>
                </div>

                <div className="text-base font-bold text-white leading-relaxed">{currentQ.question}</div>

                {/* Question Type Interactive Previews */}
                {(currentQ.type === 'SINGLE_CHOICE' || !currentQ.type) && (
                  <div className="space-y-2 pt-2">
                    {(currentQ.options || []).map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-2xl border flex items-center gap-3 ${
                          oIdx === currentQ.correctIndex
                            ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0] font-bold'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                        }`}
                      >
                        <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-sm">{opt || `Lựa chọn ${String.fromCharCode(65 + oIdx)}`}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentQ.type === 'TRUE_FALSE' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div
                      className={`p-3 rounded-2xl border text-center font-bold text-sm ${
                        currentQ.isTrue
                          ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0]'
                          : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                      }`}
                    >
                      ĐÚNG (True)
                    </div>
                    <div
                      className={`p-3 rounded-2xl border text-center font-bold text-sm ${
                        !currentQ.isTrue
                          ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0]'
                          : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                      }`}
                    >
                      SAI (False)
                    </div>
                  </div>
                )}

                {currentQ.type === 'FILL_IN_BLANK' && (
                  <div className="p-4 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-2">
                    <span className="text-xs text-[#778DA9] block">Đáp án chấp nhận:</span>
                    {(currentQ.blanks || []).map((b) => (
                      <div key={b.id} className="text-xs font-bold text-[#FFD166]">
                        {b.id}: {(b.correctAnswers || []).join(' / ')}
                      </div>
                    ))}
                  </div>
                )}

                {currentQ.type === 'DRAG_DROP_CLOZE' && (
                  <div className="pt-2">
                    <DragDropClozePlayer question={currentQ} showCorrectAnswers={true} />
                  </div>
                )}

                {currentQ.type === 'MATCHING' && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs text-[#778DA9] block">Các cặp nối chính xác:</span>
                    {(currentQ.pairs || []).map((p) => (
                      <div key={p.id} className="p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{p.left}</span>
                        <ArrowRight size={14} className="text-[#00E5FF]" />
                        <span className="font-medium text-[#00E5FF]">{p.right}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentQ.explanation && (
                  <div className="p-3 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs text-[#00E5FF] space-y-1">
                    <span className="font-bold block">Giải thích đáp án:</span>
                    <p>{currentQ.explanation}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Question Editor Form */
              <div className="space-y-4">
                {/* Question Type Banner */}
                <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-[#778DA9]">Dạng câu hỏi:</span>
                    <select
                      value={currentQ.type || 'SINGLE_CHOICE'}
                      onChange={(e) => updateCurrentQuestion({ type: e.target.value as QuestionType })}
                      className="px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#00E5FF] focus:outline-none"
                    >
                      {QUESTION_TYPES_CONFIG.map((cfg) => (
                        <option key={cfg.type} value={cfg.type}>
                          {cfg.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#778DA9]">Điểm:</span>
                      <input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="10"
                        value={currentQ.points || 1.0}
                        onChange={(e) => updateCurrentQuestion({ points: parseFloat(e.target.value) || 1.0 })}
                        className="w-16 px-2 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] text-xs font-bold text-center text-[#FFD166] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#778DA9]">Độ khó:</span>
                      <select
                        value={currentQ.difficulty || 'MEDIUM'}
                        onChange={(e) => updateCurrentQuestion({ difficulty: e.target.value as QuestionDifficulty })}
                        className="px-2 py-1 rounded-lg bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#CBD5E1] focus:outline-none"
                      >
                        <option value="EASY">Dễ</option>
                        <option value="MEDIUM">Trung bình</option>
                        <option value="HARD">Khó</option>
                        <option value="VERY_HARD">Rất khó</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Prompt textarea */}
                <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block">
                    Nội Dung Câu Hỏi (Prompt)
                  </label>
                  <textarea
                    rows={3}
                    value={currentQ.question}
                    onChange={(e) => updateCurrentQuestion({ question: e.target.value })}
                    placeholder="Nhập nội dung đề bài (hỗ trợ [blank1] cho câu điền khuyết)..."
                    className="w-full p-3 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-sm focus:border-[#00E5FF] focus:outline-none transition leading-relaxed resize-y"
                  />
                </div>

                {/* Type-Specific Editors */}
                {(currentQ.type === 'SINGLE_CHOICE' || !currentQ.type) && (
                  <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block">
                      Các Lựa Chọn Đáp Án (Tích chọn 1 đáp án đúng)
                    </label>
                    <div className="space-y-2">
                      {(currentQ.options || ['', '', '', '']).map((opt, oIdx) => {
                        const isCorrect = currentQ.correctIndex === oIdx;
                        return (
                          <div key={oIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateCurrentQuestion({ correctIndex: oIdx })}
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition ${
                                isCorrect
                                  ? 'bg-[#06D6A0] text-[#0D1B2A] shadow-md shadow-[#06D6A0]/20'
                                  : 'bg-[#131F2E] text-[#778DA9] border border-[#27384E] hover:text-white'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...(currentQ.options || ['', '', '', ''])];
                                nextOpts[oIdx] = e.target.value;
                                updateCurrentQuestion({ options: nextOpts });
                              }}
                              placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                              className={`flex-1 p-2.5 rounded-xl bg-[#131F2E] border text-xs focus:outline-none transition ${
                                isCorrect ? 'border-[#06D6A0] text-white' : 'border-[#27384E] text-[#CBD5E1]'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentQ.type === 'MULTIPLE_CHOICE' && (
                  <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block">
                      Chọn Nhiều Đáp Án Đúng (Học sinh phải chọn đúng toàn bộ)
                    </label>
                    <div className="space-y-2">
                      {(currentQ.options || ['', '', '', '']).map((opt, oIdx) => {
                        const isSelected = (currentQ.correctIndices || []).includes(oIdx);
                        return (
                          <div key={oIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = currentQ.correctIndices || [];
                                const next = isSelected ? cur.filter((i) => i !== oIdx) : [...cur, oIdx];
                                updateCurrentQuestion({ correctIndices: next });
                              }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${
                                isSelected
                                  ? 'bg-[#9D4EDD] text-white shadow-md'
                                  : 'bg-[#131F2E] text-[#778DA9] border border-[#27384E]'
                              }`}
                            >
                              {isSelected ? <Check size={14} /> : String.fromCharCode(65 + oIdx)}
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const nextOpts = [...(currentQ.options || ['', '', '', ''])];
                                nextOpts[oIdx] = e.target.value;
                                updateCurrentQuestion({ options: nextOpts });
                              }}
                              placeholder={`Lựa chọn ${String.fromCharCode(65 + oIdx)}...`}
                              className="flex-1 p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs text-white focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentQ.type === 'TRUE_FALSE' && (
                  <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block">
                      Đáp Án Đúng Cho Nhận Định Trên
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateCurrentQuestion({ isTrue: true })}
                        className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                          currentQ.isTrue
                            ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0]'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                        }`}
                      >
                        <Check size={16} />
                        <span>ĐÚNG (True)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCurrentQuestion({ isTrue: false })}
                        className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                          !currentQ.isTrue
                            ? 'bg-[#EF476F]/20 border-[#EF476F] text-[#EF476F]'
                            : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1]'
                        }`}
                      >
                        <X size={16} />
                        <span>SAI (False)</span>
                      </button>
                    </div>
                  </div>
                )}

                {currentQ.type === 'FILL_IN_BLANK' && (
                  <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9]">
                        Cấu hình các ô trống ([blank1], [blank2]...)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const blanks = currentQ.blanks || [];
                          const nextId = `blank${blanks.length + 1}`;
                          updateCurrentQuestion({
                            blanks: [...blanks, { id: nextId, correctAnswers: [''], placeholder: 'nhập từ' }]
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#FFD166]/20 text-[#FFD166] text-xs font-bold hover:bg-[#FFD166]/30"
                      >
                        + Thêm ô trống
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(currentQ.blanks || []).map((blank, bIdx) => (
                        <div key={blank.id} className="p-3 rounded-xl bg-[#131F2E] border border-[#27384E] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#FFD166]">Mã ô: [{blank.id}]</span>
                            <button
                              type="button"
                              onClick={() => {
                                const nextBlanks = (currentQ.blanks || []).filter((_, i) => i !== bIdx);
                                updateCurrentQuestion({ blanks: nextBlanks });
                              }}
                              className="text-[#EF476F] hover:underline text-xs"
                            >
                              Xóa ô
                            </button>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#778DA9] block mb-1">
                              Đáp án chấp nhận (các biến thể cách nhau bằng dấu phẩy ví dụ: went, has gone):
                            </span>
                            <input
                              type="text"
                              value={(blank.correctAnswers || []).join(', ')}
                              onChange={(e) => {
                                const arr = e.target.value.split(',').map((x) => x.trim()).filter(Boolean);
                                const nextBlanks = [...(currentQ.blanks || [])];
                                nextBlanks[bIdx] = { ...blank, correctAnswers: arr.length > 0 ? arr : [e.target.value] };
                                updateCurrentQuestion({ blanks: nextBlanks });
                              }}
                              placeholder="ví dụ: studied, had studied"
                              className="w-full p-2 rounded-lg bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQ.type === 'DRAG_DROP_CLOZE' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#27384E]">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#06D6A0] block">
                          Cấu Hình Ô Trống Kéo Thả ([blank1], [blank2]...)
                        </span>
                        <p className="text-[11px] text-[#778DA9]">
                          Học sinh sẽ kéo các thẻ từ từ ngân hàng đáp án vào đúng vị trí ô trống trong câu hỏi.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const curBlanks = currentQ.clozeBlanks || [];
                          const nextIdx = curBlanks.length + 1;
                          const nextId = `blank${nextIdx}`;
                          const newBlank: DragDropClozeBlank = {
                            id: nextId,
                            label: `Ô trống ${nextIdx}`,
                            correctAnswer: '',
                            acceptableAlternatives: [],
                            points: 1.0
                          };
                          const updatedQuestion = `${currentQ.question} [${nextId}]`;
                          updateCurrentQuestion({
                            question: updatedQuestion,
                            clozeContent: updatedQuestion,
                            clozeBlanks: [...curBlanks, newBlank]
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] text-xs font-black hover:bg-[#06D6A0]/90 transition cursor-pointer shadow-md"
                      >
                        <PlusCircle size={14} />
                        <span>+ Thêm ô trống vào câu</span>
                      </button>
                    </div>

                    {/* Blanks List */}
                    <div className="space-y-3">
                      {(currentQ.clozeBlanks || []).length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#131F2E] border border-dashed border-[#27384E] text-center text-xs text-[#778DA9]">
                          Chưa có ô trống nào. Nhấn nút <strong>"+ Thêm ô trống vào câu"</strong> ở trên để chèn mã [blank1] vào nội dung đề bài.
                        </div>
                      ) : (
                        (currentQ.clozeBlanks || []).map((blank, bIdx) => (
                          <div
                            key={blank.id}
                            className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-lg bg-[#06D6A0]/20 text-[#06D6A0] font-black text-xs">
                                  [{blank.id}]
                                </span>
                                <input
                                  type="text"
                                  value={blank.label || `Ô trống ${bIdx + 1}`}
                                  onChange={(e) => {
                                    const next = [...(currentQ.clozeBlanks || [])];
                                    next[bIdx] = { ...blank, label: e.target.value };
                                    updateCurrentQuestion({ clozeBlanks: next });
                                  }}
                                  placeholder="Tên ô (ví dụ: Ô trống 1)"
                                  className="px-2 py-1 rounded-lg bg-[#0D1B2A] border border-[#27384E] text-xs font-bold text-white focus:outline-none w-32"
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-[#778DA9]">Điểm ô:</span>
                                  <input
                                    type="number"
                                    step="0.25"
                                    min="0.25"
                                    max="10"
                                    value={blank.points ?? 1.0}
                                    onChange={(e) => {
                                      const next = [...(currentQ.clozeBlanks || [])];
                                      next[bIdx] = { ...blank, points: parseFloat(e.target.value) || 1.0 };
                                      updateCurrentQuestion({ clozeBlanks: next });
                                    }}
                                    className="w-14 px-1.5 py-0.5 rounded-lg bg-[#0D1B2A] border border-[#27384E] text-xs font-bold text-[#FFD166] text-center focus:outline-none"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (currentQ.clozeBlanks || []).filter((_, i) => i !== bIdx);
                                    // Also remove [blank.id] token from question text if present
                                    const cleanedQuestion = currentQ.question.replace(`[${blank.id}]`, '').replace(/\s{2,}/g, ' ').trim();
                                    updateCurrentQuestion({
                                      question: cleanedQuestion,
                                      clozeContent: cleanedQuestion,
                                      clozeBlanks: next
                                    });
                                  }}
                                  className="text-[#EF476F] hover:bg-[#EF476F]/20 p-1.5 rounded-lg text-xs transition"
                                  title="Xóa ô trống này"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[11px] font-bold text-[#CBD5E1] block mb-1">
                                  Đáp án đúng (Từ / Cụm từ thẻ kéo): <span className="text-[#EF476F]">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={blank.correctAnswer}
                                  onChange={(e) => {
                                    const next = [...(currentQ.clozeBlanks || [])];
                                    next[bIdx] = { ...blank, correctAnswer: e.target.value };
                                    updateCurrentQuestion({ clozeBlanks: next });
                                  }}
                                  placeholder="Ví dụ: Carbon dioxide / was made"
                                  className="w-full p-2.5 rounded-xl bg-[#0D1B2A] border border-[#27384E] text-xs text-[#06D6A0] font-black focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="text-[11px] font-bold text-[#CBD5E1] block mb-1">
                                  Đáp án tương đương (phân cách bằng dấu phẩy):
                                </label>
                                <input
                                  type="text"
                                  value={(blank.acceptableAlternatives || []).join(', ')}
                                  onChange={(e) => {
                                    const arr = e.target.value.split(',').map((x) => x.trim()).filter(Boolean);
                                    const next = [...(currentQ.clozeBlanks || [])];
                                    next[bIdx] = { ...blank, acceptableAlternatives: arr };
                                    updateCurrentQuestion({ clozeBlanks: next });
                                  }}
                                  placeholder="Ví dụ: CO2, khí cacbonic"
                                  className="w-full p-2.5 rounded-xl bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Distractors (Phương án nhiễu) */}
                    <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <HelpCircle size={14} className="text-[#FFD166]" />
                          Phương Án Nhiễu Không Có Ô Trống (Distractors)
                        </span>
                        <span className="text-[11px] text-[#778DA9]">
                          Thêm từ giả để tăng tính phân loại học sinh
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          id="new-distractor-input"
                          type="text"
                          placeholder="Nhập từ hoặc cụm từ nhiễu (ví dụ: Ánh sáng, Oxy, Nitơ)..."
                          className="flex-1 p-2 rounded-xl bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const val = input.value.trim();
                              if (val) {
                                const currentDistractors = currentQ.distractors || [];
                                if (!currentDistractors.includes(val)) {
                                  updateCurrentQuestion({ distractors: [...currentDistractors, val] });
                                }
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('new-distractor-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const val = input.value.trim();
                              const currentDistractors = currentQ.distractors || [];
                              if (!currentDistractors.includes(val)) {
                                updateCurrentQuestion({ distractors: [...currentDistractors, val] });
                              }
                              input.value = '';
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#FFD166] text-[#0D1B2A] text-xs font-black hover:bg-[#FFD166]/90 transition"
                        >
                          + Thêm từ nhiễu
                        </button>
                      </div>

                      {/* Distractor tags */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(currentQ.distractors || []).map((dis, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#0D1B2A] border border-[#FFD166]/30 text-xs font-medium text-white"
                          >
                            <span className="text-[#FFD166] font-bold">Nhiễu:</span> {dis}
                            <button
                              type="button"
                              onClick={() => {
                                const next = (currentQ.distractors || []).filter((_, i) => i !== dIdx);
                                updateCurrentQuestion({ distractors: next });
                              }}
                              className="text-[#EF476F] hover:bg-white/10 rounded-full p-0.5 ml-1"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Cloze Rules & Options */}
                    <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.allowReuseOptions || false}
                          onChange={(e) => updateCurrentQuestion({ allowReuseOptions: e.target.checked })}
                          className="rounded accent-[#06D6A0]"
                        />
                        <span className="text-[#CBD5E1] font-medium">Dùng lại đáp án cho nhiều ô</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.shuffleBankOptions ?? true}
                          onChange={(e) => updateCurrentQuestion({ shuffleBankOptions: e.target.checked })}
                          className="rounded accent-[#06D6A0]"
                        />
                        <span className="text-[#CBD5E1] font-medium">Xáo trộn ngẫu nhiên thẻ từ</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.caseSensitive || false}
                          onChange={(e) => updateCurrentQuestion({ caseSensitive: e.target.checked })}
                          className="rounded accent-[#06D6A0]"
                        />
                        <span className="text-[#CBD5E1] font-medium">Phân biệt chữ hoa / thường</span>
                      </label>
                    </div>

                    {/* Interactive Preview in Editor */}
                    <div className="pt-2 border-t border-[#27384E] space-y-2">
                      <span className="text-xs font-bold text-[#00E5FF] block">
                        Xem trước tương tác thực tế (Thử kéo hoặc chạm thẻ từ):
                      </span>
                      <DragDropClozePlayer question={currentQ} />
                    </div>
                  </div>
                )}

                {currentQ.type === 'MATCHING' && (
                  <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9]">
                        Danh Sách Cặp Nối Tương Ứng (Left ↔ Right)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const pairs = currentQ.pairs || [];
                          updateCurrentQuestion({
                            pairs: [...pairs, { id: `p_${Date.now()}`, left: '', right: '' }]
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#E0AAFF]/20 text-[#E0AAFF] text-xs font-bold hover:bg-[#E0AAFF]/30"
                      >
                        + Thêm cặp
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(currentQ.pairs || []).map((pair, pIdx) => (
                        <div key={pair.id} className="p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] flex items-center gap-2">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => {
                              const nextPairs = [...(currentQ.pairs || [])];
                              nextPairs[pIdx] = { ...pair, left: e.target.value };
                              updateCurrentQuestion({ pairs: nextPairs });
                            }}
                            placeholder="Vế trái (Thuật ngữ / Câu hỏi)..."
                            className="flex-1 p-2 rounded-lg bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                          />
                          <ArrowRight size={14} className="text-[#00E5FF] shrink-0" />
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => {
                              const nextPairs = [...(currentQ.pairs || [])];
                              nextPairs[pIdx] = { ...pair, right: e.target.value };
                              updateCurrentQuestion({ pairs: nextPairs });
                            }}
                            placeholder="Vế phải (Định nghĩa / Đáp án)..."
                            className="flex-1 p-2 rounded-lg bg-[#0D1B2A] border border-[#27384E] text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextPairs = (currentQ.pairs || []).filter((_, i) => i !== pIdx);
                              updateCurrentQuestion({ pairs: nextPairs });
                            }}
                            className="p-1.5 text-[#EF476F] hover:bg-[#27384E] rounded-lg"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explanation textarea */}
                <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#778DA9] block">
                    Lời Giải Thích & Hướng Dẫn Chi Tiết
                  </label>
                  <textarea
                    rows={2}
                    value={currentQ.explanation || ''}
                    onChange={(e) => updateCurrentQuestion({ explanation: e.target.value })}
                    placeholder="Giải thích vì sao đáp án đúng, trích dẫn quy tắc ngữ pháp hoặc từ vựng..."
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs text-[#CBD5E1] focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Exam Settings & Administration (Right, 3 cols) */}
          <div className="col-span-12 md:col-span-3 border-l border-[#27384E] bg-[#131F2E]/80 overflow-y-auto p-4 space-y-5 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-[#778DA9] block mb-3">
                Cài Đặt Đề & Quản Trị Thi
              </span>

              <div className="space-y-3">
                {/* Subject & Grade */}
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">Môn học & Khối lớp</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="p-2 rounded-xl bg-[#1B263B] border border-[#27384E] text-white font-medium focus:outline-none"
                    />
                    <select
                      value={grade}
                      onChange={(e) => setGrade(Number(e.target.value))}
                      className="p-2 rounded-xl bg-[#1B263B] border border-[#27384E] text-white font-medium focus:outline-none"
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={g}>
                          Lớp {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Unit linkage */}
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">Gắn với Unit Bài Học</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[#1B263B] border border-[#27384E] text-white focus:outline-none"
                  >
                    <option value="">-- Không gắn Unit (Đề tổng hợp) --</option>
                    {curriculumUnits
                      .filter((u) => u.grade === grade)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          Unit {u.unitNumber}: {u.title}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">
                    Thời lượng làm bài (Phút)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 0)}
                    placeholder="0 = Không giới hạn thời gian"
                    className="w-full p-2 rounded-xl bg-[#1B263B] border border-[#27384E] text-white font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-[#778DA9] block mt-0.5">Đặt 0 cho chế độ luyện tập tự do.</span>
                </div>

                {/* Max Attempts */}
                <div>
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-1">Số lần làm tối đa</label>
                  <input
                    type="number"
                    min="0"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value, 10) || 1)}
                    placeholder="1"
                    className="w-full p-2 rounded-xl bg-[#1B263B] border border-[#27384E] text-white font-bold focus:outline-none"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-[#27384E] space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#CBD5E1]">Xáo trộn thứ tự câu hỏi</span>
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="rounded accent-[#00E5FF]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#CBD5E1]">Xáo trộn các đáp án</span>
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="rounded accent-[#00E5FF]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#CBD5E1]">Xem điểm & giải ngay sau khi nộp</span>
                    <input
                      type="checkbox"
                      checked={showResultsImmediately}
                      onChange={(e) => setShowResultsImmediately(e.target.checked)}
                      className="rounded accent-[#06D6A0]"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#CBD5E1]">Cho phép nộp bài muộn</span>
                    <input
                      type="checkbox"
                      checked={allowLateSubmission}
                      onChange={(e) => setAllowLateSubmission(e.target.checked)}
                      className="rounded accent-[#FFD166]"
                    />
                  </label>
                </div>

                {/* Assigned Classes */}
                <div className="pt-2 border-t border-[#27384E]">
                  <label className="text-[11px] font-semibold text-[#CBD5E1] block mb-2">Giao đề cho Lớp Học:</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {classes.map((cls) => {
                      const isAssigned = assignedClassIds.includes(cls.id);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#1B263B] border border-[#27384E] cursor-pointer hover:bg-[#27384E]"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignedClassIds([...assignedClassIds, cls.id]);
                              } else {
                                setAssignedClassIds(assignedClassIds.filter((id) => id !== cls.id));
                              }
                            }}
                            className="rounded accent-[#00E5FF]"
                          />
                          <span className="text-xs text-white font-medium truncate">{cls.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#1B263B] border border-[#9D4EDD] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#9D4EDD]" size={20} />
                <h3 className="font-black text-white text-base">Trợ Lý AI Tạo Câu Hỏi Thông Minh</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-[#778DA9] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Chủ điểm kiến thức / Ngữ pháp:</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ví dụ: Câu điều kiện loại 2, Từ vựng môi trường, Collocations..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Số lượng câu:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={aiCount}
                    onChange={(e) => setAiCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Dạng câu hỏi:</label>
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold"
                  >
                    <option value="ALL">Đa dạng các dạng</option>
                    <option value="SINGLE_CHOICE">Trắc nghiệm</option>
                    <option value="TRUE_FALSE">Đúng / Sai</option>
                    <option value="FILL_IN_BLANK">Điền từ</option>
                    <option value="DRAG_DROP">Kéo thả</option>
                    <option value="MATCHING">Nối cặp</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E]"
              >
                Hủy
              </button>
              <button
                onClick={handleGenerateAi}
                disabled={isAiLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#9D4EDD] text-white font-black text-xs hover:bg-[#9D4EDD]/90 disabled:opacity-50 shadow-lg shadow-[#9D4EDD]/20"
              >
                {isAiLoading ? 'Đang tạo câu hỏi...' : 'Tạo Câu Hỏi Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Bank Picker Modal */}
      {showBankPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-2xl max-h-[80vh] rounded-3xl bg-[#1B263B] border border-[#27384E] p-6 space-y-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-[#27384E]">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <BookOpen size={18} className="text-[#FFD166]" />
                Chọn Câu Hỏi Từ Ngân Hàng Đề ({questionBank.length} câu có sẵn)
              </h3>
              <button onClick={() => setShowBankPicker(false)} className="text-[#778DA9] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {questionBank.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-[#FFD166] block">
                      [{item.topic}] {item.question.question}
                    </span>
                    <span className="text-[10px] text-[#778DA9] block">
                      Lớp {item.grade} • Độ khó: {item.difficulty} • Dạng: {item.question.type || 'SINGLE_CHOICE'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const clone: CustomQuestion = {
                        ...JSON.parse(JSON.stringify(item.question)),
                        id: `q_from_bank_${Date.now()}`
                      };
                      setQuestions([...questions, clone]);
                      setActiveQIndex(questions.length);
                      setShowBankPicker(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black shrink-0 hover:bg-[#00E5FF]/90"
                  >
                    + Lấy vào đề
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
