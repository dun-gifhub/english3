import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TeacherAssignment,
  CustomQuestion,
  Classroom,
  CurriculumUnit,
  CurriculumLesson,
  ExamSubmission,
  QuestionBankItem,
  WordItem,
  GrammarLesson
} from '../types';
import {
  GraduationCap,
  Plus,
  Sparkles,
  BookOpen,
  Trash2,
  Edit3,
  CheckCircle,
  FileText,
  AlertTriangle,
  Eye,
  Search,
  Save,
  Check,
  Users,
  Activity,
  RefreshCw,
  Shield,
  KeyRound,
  Copy,
  Clock,
  Printer,
  Sliders,
  Download,
  School,
  FolderOpen,
  ClipboardCheck,
  Radio,
  Palette,
  ExternalLink,
  ChevronRight,
  Filter,
  Volume2,
  Languages,
  BookA,
  Upload,
  X,
  FileSpreadsheet,
  HelpCircle,
  CheckSquare
} from 'lucide-react';
import { SmartExamBuilderModal } from '../components/SmartExamBuilderModal';
import { ThemeCustomizerModal } from '../components/ThemeCustomizerModal';
import { BatchExamFileImportModal } from '../components/BatchExamFileImportModal';
import { BatchWordImportModal } from '../components/BatchWordImportModal';
import { BatchGrammarImportModal } from '../components/BatchGrammarImportModal';
import { apiService } from '../services/apiService';
import { audioService } from '../services/audioService';
import { lookupDictionary } from '../services/dictionaryDatabase';

interface TeacherPortalScreenProps {
  initialTab?: 'exams' | 'vocabulary' | 'grammar' | 'curriculum' | 'classes' | 'grading' | 'monitor' | 'bank' | 'settings';
}

export const TeacherPortalScreen: React.FC<TeacherPortalScreenProps> = ({
  initialTab = 'exams'
}) => {
  const {
    currentUser,
    assignments,
    classes,
    curriculumUnits,
    curriculumLessons,
    submissions,
    questionBank,
    customWords,
    addCustomWord,
    addCustomWordsBatch,
    updateCustomWord,
    deleteCustomWord,
    clearAllCustomWords,
    customGrammar,
    addCustomGrammar,
    addCustomGrammarBatch,
    updateCustomGrammar,
    deleteCustomGrammar,
    clearAllCustomGrammar,
    addClass,
    removeClass,
    addCurriculumUnit,
    removeCurriculumUnit,
    addCurriculumLesson,
    gradeStudentSubmission,
    regradeExamAssignment,
    changeAssignmentStatus,
    deleteTeacherAssignment,
    clearAllTeacherAssignments,
    addQuestionToBank,
    removeQuestionFromBank,
    onlineUsers,
    onlineStudentsCount,
    adminSettings,
    updateAdminSettings,
    refreshAdminSettings,
    refreshEdTechData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'exams' | 'vocabulary' | 'grammar' | 'curriculum' | 'classes' | 'grading' | 'monitor' | 'bank' | 'settings'>(initialTab);

  // Modals state
  const [showExamBuilder, setShowExamBuilder] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showBatchExamFileModal, setShowBatchExamFileModal] = useState<boolean>(false);

  // Vocabulary (Từ Mới) States
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [showBatchWordModal, setShowBatchWordModal] = useState<boolean>(false);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  // Single Word Form inputs
  const [wordInput, setWordInput] = useState<string>('');
  const [phoneticInput, setPhoneticInput] = useState<string>('');
  const [meaningInput, setMeaningInput] = useState<string>('');
  const [partOfSpeechInput, setPartOfSpeechInput] = useState<string>('noun');
  const [wordGradeInput, setWordGradeInput] = useState<number>(10);
  const [wordUnitInput, setWordUnitInput] = useState<number>(1);
  const [exampleEnInput, setExampleEnInput] = useState<string>('');
  const [exampleViInput, setExampleViInput] = useState<string>('');
  const [distractor1Input, setDistractor1Input] = useState<string>('');
  const [distractor2Input, setDistractor2Input] = useState<string>('');
  const [distractor3Input, setDistractor3Input] = useState<string>('');

  // Vocabulary Search & Filter
  const [wordSearchTerm, setWordSearchTerm] = useState<string>('');
  const [wordGradeFilter, setWordGradeFilter] = useState<number>(0); // 0 = all
  const [wordUnitFilter, setWordUnitFilter] = useState<number>(0); // 0 = all

  // Grammar (Ngữ Pháp) States
  const [showAddGrammarModal, setShowAddGrammarModal] = useState<boolean>(false);
  const [editingGrammar, setEditingGrammar] = useState<GrammarLesson | null>(null);
  const [showBatchGrammarModal, setShowBatchGrammarModal] = useState<boolean>(false);

  // Single Grammar Form inputs
  const [grammarTitleInput, setGrammarTitleInput] = useState<string>('');
  const [grammarGradeInput, setGrammarGradeInput] = useState<number>(10);
  const [grammarFormulaInput, setGrammarFormulaInput] = useState<string>('');
  const [grammarExplanationInput, setGrammarExplanationInput] = useState<string>('');
  const [grammarExampleEnInput, setGrammarExampleEnInput] = useState<string>('');
  const [grammarExampleViInput, setGrammarExampleViInput] = useState<string>('');
  const [grammarUsageNotesInput, setGrammarUsageNotesInput] = useState<string>('');

  // Grammar Search & Filter
  const [grammarSearchTerm, setGrammarSearchTerm] = useState<string>('');
  const [grammarGradeFilter, setGrammarGradeFilter] = useState<number>(0); // 0 = all

  // New Class Form State
  const [showCreateClassModal, setShowCreateClassModal] = useState<boolean>(false);
  const [classNameInput, setClassNameInput] = useState<string>('');
  const [classGradeInput, setClassGradeInput] = useState<number>(10);
  const [classRoomInput, setClassRoomInput] = useState<string>('Phòng 204');
  const [classDescInput, setClassDescInput] = useState<string>('');

  // New Unit Form State
  const [showCreateUnitModal, setShowCreateUnitModal] = useState<boolean>(false);
  const [unitTitleInput, setUnitTitleInput] = useState<string>('');
  const [unitGradeInput, setUnitGradeInput] = useState<number>(10);
  const [unitNumberInput, setUnitNumberInput] = useState<number>(1);
  const [unitChapterInput, setUnitChapterInput] = useState<string>('Chương 1');
  const [unitDescInput, setUnitDescInput] = useState<string>('');

  // Manual Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmission | null>(null);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [gradingFinalScore, setGradingFinalScore] = useState<number>(0);

  // Search & Filter (Exams)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number>(0); // 0 = all

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Speak word handler
  const handlePlayAudio = (word: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeakingWordId(id);
    audioService.speakEnglish(word);
    setTimeout(() => setSpeakingWordId(null), 1200);
  };

  // Auto-fill from offline dictionary
  const handleAutoFillFromDictionary = (wordText: string) => {
    const clean = wordText.trim().toLowerCase();
    if (!clean) return;
    const found = lookupDictionary(clean, true);
    if (found && found.length > 0) {
      const top = found[0];
      if (top.phonetic && !phoneticInput) setPhoneticInput(top.phonetic);
      if (top.meaningVi && !meaningInput) setMeaningInput(top.meaningVi);
      if (top.partOfSpeech) setPartOfSpeechInput(top.partOfSpeech.toLowerCase());
      if (top.exampleEn && !exampleEnInput) setExampleEnInput(top.exampleEn);
      if (top.exampleVi && !exampleViInput) setExampleViInput(top.exampleVi);
      showToast(`Đã tìm thấy thông tin tự động cho từ "${wordText}"!`);
    } else {
      showToast(`Không tìm thấy trong từ điển có sẵn, bạn có thể tự nhập phiên âm.`);
    }
  };

  // Open add word modal
  const openAddWordModal = (prefillGrade?: number, prefillUnit?: number) => {
    setEditingWord(null);
    setWordInput('');
    setPhoneticInput('');
    setMeaningInput('');
    setPartOfSpeechInput('noun');
    setWordGradeInput(prefillGrade ?? (wordGradeFilter || 10));
    setWordUnitInput(prefillUnit ?? 1);
    setExampleEnInput('');
    setExampleViInput('');
    setDistractor1Input('');
    setDistractor2Input('');
    setDistractor3Input('');
    setShowAddWordModal(true);
  };

  // Open edit word modal
  const openEditWordModal = (word: WordItem) => {
    setEditingWord(word);
    setWordInput(word.word);
    setPhoneticInput(word.phonetic || '');
    setMeaningInput(word.meaningVi);
    setPartOfSpeechInput(word.partOfSpeech || 'noun');
    setWordGradeInput(word.grade);
    setWordUnitInput(word.unitNumber);
    setExampleEnInput(word.exampleEn || '');
    setExampleViInput(word.exampleVi || '');
    setDistractor1Input(word.distractorsVi?.[0] || '');
    setDistractor2Input(word.distractorsVi?.[1] || '');
    setDistractor3Input(word.distractorsVi?.[2] || '');
    setShowAddWordModal(true);
  };

  // Save single word handler
  const handleSaveWord = () => {
    if (!wordInput.trim() || !meaningInput.trim()) {
      showToast('Vui lòng nhập từ tiếng Anh và dịch nghĩa tiếng Việt!');
      return;
    }
    const distractors = [distractor1Input.trim(), distractor2Input.trim(), distractor3Input.trim()].filter(Boolean);
    if (distractors.length === 0) {
      distractors.push('phương án sai A', 'nghĩa tương tự B', 'ngược nghĩa C');
    }

    if (editingWord) {
      updateCustomWord({
        ...editingWord,
        word: wordInput.trim(),
        phonetic: phoneticInput.trim() || `/${wordInput.trim().toLowerCase()}/`,
        meaningVi: meaningInput.trim(),
        partOfSpeech: partOfSpeechInput,
        grade: wordGradeInput,
        unitNumber: wordUnitInput,
        exampleEn: exampleEnInput.trim(),
        exampleVi: exampleViInput.trim(),
        distractorsVi: distractors
      });
      showToast(`Đã cập nhật từ "${wordInput.trim()}" thành công!`);
    } else {
      addCustomWord({
        word: wordInput.trim(),
        phonetic: phoneticInput.trim() || `/${wordInput.trim().toLowerCase()}/`,
        meaningVi: meaningInput.trim(),
        partOfSpeech: partOfSpeechInput,
        grade: wordGradeInput,
        unitNumber: wordUnitInput,
        exampleEn: exampleEnInput.trim(),
        exampleVi: exampleViInput.trim(),
        distractorsVi: distractors
      });
      showToast(`Đã thêm từ mới "${wordInput.trim()}" vào Unit ${wordUnitInput} (Lớp ${wordGradeInput})!`);
    }
    setShowAddWordModal(false);
    setEditingWord(null);
  };

  // Open add grammar modal
  const openAddGrammarModal = (prefillGrade?: number) => {
    setEditingGrammar(null);
    setGrammarTitleInput('');
    setGrammarGradeInput(prefillGrade ?? 10);
    setGrammarFormulaInput('');
    setGrammarExplanationInput('');
    setGrammarExampleEnInput('');
    setGrammarExampleViInput('');
    setGrammarUsageNotesInput('');
    setShowAddGrammarModal(true);
  };

  // Open edit grammar modal
  const openEditGrammarModal = (lesson: GrammarLesson) => {
    setEditingGrammar(lesson);
    setGrammarTitleInput(lesson.title);
    setGrammarGradeInput(lesson.grade);
    setGrammarFormulaInput(lesson.formula);
    setGrammarExplanationInput(lesson.explanationVi);
    setGrammarExampleEnInput(lesson.exampleEn);
    setGrammarExampleViInput(lesson.exampleVi);
    setGrammarUsageNotesInput(lesson.usageNotes);
    setShowAddGrammarModal(true);
  };

  // Save grammar handler
  const handleSaveGrammar = () => {
    if (!grammarTitleInput.trim() || !grammarFormulaInput.trim()) {
      showToast('Vui lòng nhập tên chuyên đề và công thức ngữ pháp!');
      return;
    }
    if (editingGrammar) {
      updateCustomGrammar({
        ...editingGrammar,
        title: grammarTitleInput.trim(),
        grade: grammarGradeInput,
        formula: grammarFormulaInput.trim(),
        explanationVi: grammarExplanationInput.trim(),
        exampleEn: grammarExampleEnInput.trim(),
        exampleVi: grammarExampleViInput.trim(),
        usageNotes: grammarUsageNotesInput.trim()
      });
      showToast(`Đã cập nhật chuyên đề "${grammarTitleInput.trim()}" thành công!`);
    } else {
      addCustomGrammar({
        title: grammarTitleInput.trim(),
        grade: grammarGradeInput,
        formula: grammarFormulaInput.trim(),
        explanationVi: grammarExplanationInput.trim(),
        exampleEn: grammarExampleEnInput.trim(),
        exampleVi: grammarExampleViInput.trim(),
        usageNotes: grammarUsageNotesInput.trim()
      });
      showToast(`Đã thêm chuyên đề ngữ pháp "${grammarTitleInput.trim()}" thành công!`);
    }
    setShowAddGrammarModal(false);
    setEditingGrammar(null);
  };

  // Load sample words
  const handleLoadSampleWords = async () => {
    const sampleWords: Omit<WordItem, 'id'>[] = [
      {
        word: 'breadwinner',
        phonetic: '/ˈbredwɪn.ər/',
        meaningVi: 'người trụ cột kiếm tiền cho gia đình',
        partOfSpeech: 'noun',
        grade: 10,
        unitNumber: 1,
        exampleEn: 'In many modern families, both parents are breadwinners.',
        exampleVi: 'Trong nhiều gia đình hiện đại, cả bố và mẹ đều là những người trụ cột kiếm tiền.',
        distractorsVi: ['người nội trợ', 'con một', 'hàng xóm']
      },
      {
        word: 'homemaker',
        phonetic: '/ˈhəʊmˌmeɪ.kər/',
        meaningVi: 'người quán xuyến nội trợ gia đình',
        partOfSpeech: 'noun',
        grade: 10,
        unitNumber: 1,
        exampleEn: 'My mother is a devoted homemaker who keeps everything organized.',
        exampleVi: 'Mẹ tôi là một người nội trợ tận tụy luôn giữ mọi thứ ngăn nắp.',
        distractorsVi: ['thợ săn', 'trụ cột kinh tế', 'thầy giáo']
      },
      {
        word: 'heavy lifting',
        phonetic: '/ˌhev.i ˈlɪf.tɪŋ/',
        meaningVi: 'công việc mang vác nặng nhọc trong nhà',
        partOfSpeech: 'noun',
        grade: 10,
        unitNumber: 1,
        exampleEn: 'My elder brother always volunteers to do the heavy lifting at home.',
        exampleVi: 'Anh trai tôi luôn xung phong làm những công việc nặng nhọc trong nhà.',
        distractorsVi: ['rửa bát đĩa', 'nấu bữa sáng', 'quét nhà']
      },
      {
        word: 'carbon footprint',
        phonetic: '/ˌkɑː.bən ˈfʊt.prɪnt/',
        meaningVi: 'dấu chân carbon (lượng phát thải CO2)',
        partOfSpeech: 'noun',
        grade: 10,
        unitNumber: 2,
        exampleEn: 'Cycling to school helps cut down your personal carbon footprint.',
        exampleVi: 'Đi xe đạp đến trường giúp cắt giảm lượng phát thải carbon của bạn.',
        distractorsVi: ['năng lượng mặt trời', 'chất thải độc hại', 'rác hữu cơ']
      },
      {
        word: 'eco-friendly',
        phonetic: '/ˌiː.kəʊˈfrend.li/',
        meaningVi: 'thân thiện với môi trường tự nhiên',
        partOfSpeech: 'adjective',
        grade: 10,
        unitNumber: 2,
        exampleEn: 'Our school promotes the use of eco-friendly paper bags and cups.',
        exampleVi: 'Trường học khuyến khích dùng túi và cốc giấy thân thiện môi trường.',
        distractorsVi: ['ô nhiễm nghiêm trọng', 'đắt tiền', 'dễ cháy nổ']
      },
      {
        word: 'biodiversity',
        phonetic: '/ˌbaɪ.əʊ.daɪˈvɜː.sə.ti/',
        meaningVi: 'sự đa dạng sinh thái và sinh học',
        partOfSpeech: 'noun',
        grade: 11,
        unitNumber: 1,
        exampleEn: 'The tropical rainforest is famous for its rich biodiversity.',
        exampleVi: 'Rừng mưa nhiệt đới nổi tiếng với sự đa dạng sinh thái phong phú.',
        distractorsVi: ['biến đổi khí hậu', 'sự tuyệt chủng', 'hiện tượng xói mòn']
      },
      {
        word: 'perseverance',
        phonetic: '/ˌpɜː.sɪˈvɪə.rəns/',
        meaningVi: 'lòng kiên trì, bền chí vượt khó khăn',
        partOfSpeech: 'noun',
        grade: 12,
        unitNumber: 1,
        exampleEn: 'Hard work and perseverance will lead you to exam success.',
        exampleVi: 'Sự chăm chỉ và kiên trì sẽ đưa bạn đến thành công trong kỳ thi.',
        distractorsVi: ['sự lười biếng', 'sự nghi ngờ', 'nỗi sợ thất bại']
      }
    ];

    const count = await addCustomWordsBatch(sampleWords);
    showToast(`Đã nạp thành công ${count} từ vựng mẫu chuẩn Global Success!`);
  };

  // Filtered words
  const filteredWords = customWords.filter((w) => {
    const matchGrade = wordGradeFilter === 0 || w.grade === wordGradeFilter;
    const matchUnit = wordUnitFilter === 0 || w.unitNumber === wordUnitFilter;
    const matchSearch =
      !wordSearchTerm ||
      w.word.toLowerCase().includes(wordSearchTerm.toLowerCase()) ||
      w.meaningVi.toLowerCase().includes(wordSearchTerm.toLowerCase()) ||
      (w.phonetic && w.phonetic.toLowerCase().includes(wordSearchTerm.toLowerCase()));
    return matchGrade && matchUnit && matchSearch;
  });

  // Filtered grammar
  const filteredGrammar = customGrammar.filter((g) => {
    const matchGrade = grammarGradeFilter === 0 || g.grade === grammarGradeFilter;
    const matchSearch =
      !grammarSearchTerm ||
      g.title.toLowerCase().includes(grammarSearchTerm.toLowerCase()) ||
      g.formula.toLowerCase().includes(grammarSearchTerm.toLowerCase()) ||
      g.explanationVi.toLowerCase().includes(grammarSearchTerm.toLowerCase());
    return matchGrade && matchSearch;
  });

  // Filtered assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchGrade = selectedGradeFilter === 0 || a.grade === selectedGradeFilter;
    const matchSearch =
      !searchTerm ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchGrade && matchSearch;
  });

  return (
    <div className="space-y-6 pb-24 text-[#F8F9FA]">
      {/* Teacher Portal Header Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#1B263B] via-[#131F2E] to-[#1B263B] border border-[#27384E] shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shadow-lg shadow-[#00E5FF]/10 shrink-0">
            <GraduationCap size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5FF] bg-[#00E5FF]/15 px-2.5 py-0.5 rounded-full border border-[#00E5FF]/30">
                TEACHER CONTROL CENTER
              </span>
              <span className="text-xs text-[#778DA9]">THPT Lương Phú</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Trung Tâm Điều Khiển & Quản Trị Giảng Dạy
            </h1>
            <p className="text-xs text-[#CBD5E1]">
              Giáo viên: <strong className="text-white">{currentUser?.displayName}</strong> • {currentUser?.customClassName || 'Tổ Ngoại Ngữ'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowThemeModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#CBD5E1] hover:text-white hover:bg-[#27384E] transition"
          >
            <Palette size={16} className="text-[#FFD166]" />
            <span className="hidden sm:inline">Giao Diện</span>
          </button>

          <button
            onClick={() => openAddWordModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] text-xs font-black hover:bg-[#06D6A0]/90 transition shadow-lg shadow-[#06D6A0]/20"
          >
            <Plus size={16} />
            <span>+ Thêm Từ Mới</span>
          </button>

          <button
            onClick={() => setShowBatchWordModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#131F2E] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/15 transition"
          >
            <Upload size={15} />
            <span>Nhập File Từ Vựng</span>
          </button>

          <button
            onClick={() => {
              setEditingAssignment(null);
              setShowExamBuilder(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 transition shadow-lg shadow-[#00E5FF]/20"
          >
            <Plus size={16} />
            <span>Tạo Đề Thi Mới</span>
          </button>
        </div>
      </div>

      {/* Navigation Workspace Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#27384E]/80">
        {[
          { id: 'exams', label: 'Quản Lý Đề Thi', icon: FileText, count: assignments.length },
          { id: 'vocabulary', label: 'Kho Từ Vựng (Thêm Từ Mới)', icon: Languages, count: customWords.length },
          { id: 'grammar', label: 'Ngữ Pháp (Chuyên Đề)', icon: BookOpen, count: customGrammar.length },
          { id: 'curriculum', label: 'Unit & Bài Học', icon: BookA, count: curriculumUnits.length },
          { id: 'classes', label: 'Lớp Học & Học Sinh', icon: School, count: classes.length },
          { id: 'grading', label: 'Chấm Thi & Nhận Xét', icon: ClipboardCheck, count: submissions.length },
          { id: 'monitor', label: 'Giám Sát Trực Tiếp', icon: Radio, count: onlineStudentsCount },
          { id: 'bank', label: 'Ngân Hàng Câu Hỏi', icon: FolderOpen, count: questionBank.length },
          { id: 'settings', label: 'Cài Đặt Hệ Thống', icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20 font-black'
                  : 'bg-[#1B263B]/60 text-[#CBD5E1] hover:bg-[#1B263B] border border-[#27384E]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive ? 'bg-[#0D1B2A] text-[#00E5FF]' : 'bg-[#131F2E] text-[#778DA9]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXAM BUILDER & MANAGEMENT */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-3 text-[#778DA9]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm đề thi theo tên hoặc mô tả..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>

              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:outline-none"
              >
                <option value={0}>Tất cả khối lớp</option>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBatchExamFileModal(true)}
                className="px-3.5 py-2 rounded-xl border border-[#27384E] text-[#CBD5E1] hover:text-white hover:bg-[#27384E] transition font-bold"
              >
                Nhập file đề thi
              </button>
              <button
                onClick={() => {
                  setEditingAssignment(null);
                  setShowExamBuilder(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black hover:bg-[#00E5FF]/90 transition"
              >
                + Soạn Đề Thi Mới
              </button>
            </div>
          </div>

          {/* Exams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssignments.map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] hover:border-[#00E5FF]/50 transition flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
                      Lớp {a.grade} • {a.subject || 'Tiếng Anh'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.status === 'PUBLISHED'
                          ? 'bg-[#06D6A0]/20 text-[#06D6A0]'
                          : a.status === 'DRAFT'
                          ? 'bg-[#FFD166]/20 text-[#FFD166]'
                          : 'bg-[#EF476F]/20 text-[#EF476F]'
                      }`}
                    >
                      {a.status === 'PUBLISHED' ? 'Đã công bố' : a.status === 'DRAFT' ? 'Bản nháp' : 'Đã đóng'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{a.title}</h3>
                  <p className="text-xs text-[#778DA9] line-clamp-2">{a.description || 'Không có mô tả chi tiết.'}</p>
                </div>

                <div className="pt-3 border-t border-[#27384E] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#CBD5E1]">
                    <span>{a.questions.length} câu hỏi</span>
                    <span className="font-bold text-[#FFD166]">{a.totalPoints || 10} Điểm</span>
                    <span>{a.timeLimitMinutes ? `${a.timeLimitMinutes}p` : 'Tự do'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingAssignment(a);
                          setShowExamBuilder(true);
                        }}
                        className="p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#00E5FF] hover:bg-[#27384E]"
                        title="Chỉnh sửa đề"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        onClick={async () => {
                          const res = await regradeExamAssignment(a.id);
                          showToast(res.message || 'Đã chấm lại đề thi');
                        }}
                        className="p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#FFD166] hover:bg-[#27384E]"
                        title="Chấm lại đề thi toàn bộ bài làm"
                      >
                        <RefreshCw size={15} />
                      </button>

                      <button
                        onClick={() => {
                          const nextStatus = a.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
                          changeAssignmentStatus(a.id, nextStatus);
                        }}
                        className="p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#06D6A0] hover:bg-[#27384E]"
                        title="Bật/Tắt trạng thái làm bài"
                      >
                        <Radio size={15} />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn xóa đề thi "${a.title}"?`)) {
                          deleteTeacherAssignment(a.id);
                          showToast('Đã xóa đề thi thành công');
                        }
                      }}
                      className="p-2 rounded-xl text-[#EF476F] hover:bg-[#EF476F]/20"
                      title="Xóa đề"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: VOCABULARY MANAGEMENT & ADD NEW WORDS */}
      {activeTab === 'vocabulary' && (
        <div className="space-y-4">
          {/* Top Action Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                  KHO TỪ VỰNG TRỰC TUYẾN
                </span>
                <span className="text-xs text-[#778DA9]">• Lớp 6 đến Lớp 12</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Biên Soạn & Quản Lý Từ Vựng Học Tập
              </h3>
              <p className="text-xs text-[#CBD5E1] max-w-2xl leading-relaxed">
                Thêm từ vựng mới theo từng khối lớp và Unit. Mọi từ mới bạn thêm ở đây sẽ <strong className="text-[#00E5FF]">tự động đồng bộ ngay lập tức</strong> vào màn hình học tập và đấu trường game <strong className="text-[#06D6A0]">Săn Từ (Tap Hunter)</strong> của học sinh!
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => openAddWordModal()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#06D6A0] text-[#0D1B2A] text-xs font-black hover:bg-[#06D6A0]/90 transition shadow-lg shadow-[#06D6A0]/20 cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Thêm 1 Từ Mới</span>
              </button>

              <button
                onClick={() => setShowBatchWordModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 transition shadow-lg shadow-[#00E5FF]/20 cursor-pointer"
              >
                <Upload size={16} />
                <span>Nhập File / Excel Hàng Loạt</span>
              </button>

              {customWords.length === 0 && (
                <button
                  onClick={handleLoadSampleWords}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#FFD166] text-[#0D1B2A] text-xs font-black hover:bg-[#FFD166]/90 transition shadow-lg cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Nạp 7 Từ Mẫu Global Success</span>
                </button>
              )}

              {customWords.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xóa tất cả từ vựng tự thêm?')) {
                      clearAllCustomWords();
                      showToast('Đã xóa toàn bộ từ vựng tự thêm');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#131F2E] border border-[#EF476F]/30 text-[#EF476F] text-xs font-bold hover:bg-[#EF476F]/10 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Xóa Hết</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-3 text-[#778DA9]" />
                <input
                  type="text"
                  value={wordSearchTerm}
                  onChange={(e) => setWordSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm từ vựng (tiếng Anh, nghĩa tiếng Việt, IPA)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none placeholder:text-[#778DA9]"
                />
              </div>

              <select
                value={wordGradeFilter}
                onChange={(e) => setWordGradeFilter(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:outline-none"
              >
                <option value={0}>Tất cả khối lớp</option>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>

              <select
                value={wordUnitFilter}
                onChange={(e) => setWordUnitFilter(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:outline-none"
              >
                <option value={0}>Tất cả Unit</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#778DA9] font-medium">
              Đang hiển thị: <strong className="text-white">{filteredWords.length}</strong> / {customWords.length} từ
            </div>
          </div>

          {/* Word List Cards */}
          {filteredWords.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#1B263B] border border-[#27384E] text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center mx-auto border border-[#00E5FF]/20 shadow-inner">
                <Languages size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Chưa có từ vựng nào trong danh sách</h4>
                <p className="text-xs text-[#778DA9] max-w-md mx-auto mt-1">
                  Hãy nhấn nút <strong className="text-[#06D6A0]">"+ Thêm 1 Từ Mới"</strong> hoặc <strong className="text-[#00E5FF]">"Nhập File / Excel Hàng Loạt"</strong> để bổ sung từ mới cho học sinh ôn luyện!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                <button
                  onClick={() => openAddWordModal()}
                  className="px-5 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs hover:bg-[#06D6A0]/90 transition cursor-pointer"
                >
                  + Thêm Từ Mới Ngay
                </button>
                <button
                  onClick={handleLoadSampleWords}
                  className="px-4 py-2.5 rounded-xl bg-[#FFD166] text-[#0D1B2A] font-black text-xs hover:bg-[#FFD166]/90 transition cursor-pointer"
                >
                  Nạp 7 Từ Mẫu Global Success
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWords.map((w) => (
                <div
                  key={w.id}
                  className="p-4 rounded-3xl bg-[#1B263B] border border-[#27384E] flex flex-col justify-between space-y-3 hover:border-[#00E5FF]/50 transition shadow-lg group"
                >
                  <div className="space-y-2">
                    {/* Header line: word, pos, grade, unit */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white tracking-wide group-hover:text-[#00E5FF] transition">
                          {w.word}
                        </span>
                        {w.partOfSpeech && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#9D4EDD]/20 text-[#D8B4FE] uppercase border border-[#9D4EDD]/30">
                            {w.partOfSpeech}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30">
                          Lớp {w.grade}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#131F2E] text-[#FFD166] border border-[#FFD166]/30">
                          {w.unitNumber === 0 ? 'Bổ sung' : `Unit ${w.unitNumber}`}
                        </span>
                      </div>
                    </div>

                    {/* Pronunciation & Meaning */}
                    <div className="flex items-center justify-between gap-2 bg-[#131F2E]/80 p-2.5 rounded-2xl border border-[#27384E]/70">
                      <div>
                        {w.phonetic && (
                          <div className="text-xs font-mono text-[#FFD166] font-semibold">{w.phonetic}</div>
                        )}
                        <div className="text-xs font-bold text-[#06D6A0] mt-0.5">{w.meaningVi}</div>
                      </div>

                      <button
                        onClick={(e) => handlePlayAudio(w.word, w.id, e)}
                        className={`p-2 rounded-xl transition shrink-0 cursor-pointer ${
                          speakingWordId === w.id
                            ? 'bg-[#00E5FF] text-[#0D1B2A] animate-pulse'
                            : 'bg-[#27384E] text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#0D1B2A]'
                        }`}
                        title="Nghe phát âm chuẩn tiếng Anh"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>

                    {/* Example Sentence */}
                    {(w.exampleEn || w.exampleVi) && (
                      <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E]/50 text-[11px] space-y-1">
                        {w.exampleEn && (
                          <p className="text-[#CBD5E1] italic">
                            🇬🇧 {w.exampleEn}
                          </p>
                        )}
                        {w.exampleVi && (
                          <p className="text-[#778DA9]">
                            🇻🇳 {w.exampleVi}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Distractors for Quiz/Game */}
                    {w.distractorsVi && w.distractorsVi.length > 0 && (
                      <div className="pt-1 text-[10px] text-[#778DA9]">
                        <span className="font-semibold block mb-1">Từ gây nhiễu trò chơi:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {w.distractorsVi.map((d, di) => (
                            <span key={di} className="px-2 py-0.5 rounded-md bg-[#131F2E] text-[#ADB5BD] border border-[#27384E]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27384E]/60">
                    <button
                      onClick={() => openEditWordModal(w)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#CBD5E1] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Sửa</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Xóa từ vựng "${w.word}"?`)) {
                          deleteCustomWord(w.id);
                          showToast(`Đã xóa từ "${w.word}"`);
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#EF476F]/30 text-xs font-bold text-[#EF476F] hover:bg-[#EF476F]/20 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: GRAMMAR LESSONS */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/30">
                  CHUYÊN ĐỀ NGỮ PHÁP TRỌNG TÂM
                </span>
                <span className="text-xs text-[#778DA9]">• Chuẩn Bộ GD&ĐT</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Biên Soạn Công Thức & Chuyên Đề Ngữ Pháp
              </h3>
              <p className="text-xs text-[#CBD5E1] max-w-2xl leading-relaxed">
                Biên soạn công thức cấu trúc câu, giải thích cách dùng, ví dụ minh họa và mẹo làm bài thi. Học sinh có thể ôn tập ngữ pháp trước khi làm bài tập hoặc kiểm tra.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => openAddGrammarModal()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FFD166] text-[#0D1B2A] text-xs font-black hover:bg-[#FFD166]/90 transition shadow-lg cursor-pointer"
              >
                <Plus size={16} />
                <span>+ Thêm Chuyên Đề</span>
              </button>

              <button
                onClick={() => setShowBatchGrammarModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#131F2E] border border-[#FFD166]/40 text-[#FFD166] text-xs font-bold hover:bg-[#FFD166]/15 transition cursor-pointer"
              >
                <Upload size={16} />
                <span>Nhập File Ngữ Pháp</span>
              </button>

              {customGrammar.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xóa tất cả chuyên đề ngữ pháp tự thêm?')) {
                      clearAllCustomGrammar();
                      showToast('Đã xóa toàn bộ chuyên đề ngữ pháp tự thêm');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-[#131F2E] border border-[#EF476F]/30 text-[#EF476F] text-xs font-bold hover:bg-[#EF476F]/10 transition cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Xóa Hết</span>
                </button>
              )}
            </div>
          </div>

          {/* Grammar Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-3 text-[#778DA9]" />
                <input
                  type="text"
                  value={grammarSearchTerm}
                  onChange={(e) => setGrammarSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm chuyên đề ngữ pháp..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none placeholder:text-[#778DA9]"
                />
              </div>

              <select
                value={grammarGradeFilter}
                onChange={(e) => setGrammarGradeFilter(Number(e.target.value))}
                className="px-3 py-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:outline-none"
              >
                <option value={0}>Tất cả khối lớp</option>
                {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Khối {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#778DA9] font-medium">
              Đang hiển thị: <strong className="text-white">{filteredGrammar.length}</strong> / {customGrammar.length} bài
            </div>
          </div>

          {/* Grammar List Cards */}
          {filteredGrammar.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#1B263B] border border-[#27384E] text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#FFD166]/10 text-[#FFD166] flex items-center justify-center mx-auto border border-[#FFD166]/20 shadow-inner">
                <BookOpen size={32} />
              </div>
              <div>
                <h4 className="text-base font-black text-white">Chưa có chuyên đề ngữ pháp nào tự biên soạn</h4>
                <p className="text-xs text-[#778DA9] max-w-md mx-auto mt-1">
                  Nhấn <strong className="text-[#FFD166]">"+ Thêm Chuyên Đề"</strong> hoặc <strong>"Nhập File Ngữ Pháp"</strong> để thêm các thì, cấu trúc câu, mệnh đề quan hệ...
                </p>
              </div>
              <button
                onClick={() => openAddGrammarModal()}
                className="px-5 py-2.5 rounded-xl bg-[#FFD166] text-[#0D1B2A] font-black text-xs hover:bg-[#FFD166]/90 transition cursor-pointer"
              >
                + Thêm Chuyên Đề Mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGrammar.map((g) => (
                <div
                  key={g.id}
                  className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] flex flex-col justify-between space-y-4 shadow-xl hover:border-[#FFD166]/50 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#FFD166]/20 text-[#FFD166] border border-[#FFD166]/30">
                        Lớp {g.grade} • Chuyên Đề Trọng Tâm
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditGrammarModal(g)}
                          className="p-1.5 rounded-lg bg-[#131F2E] text-[#CBD5E1] hover:text-[#FFD166] transition text-xs cursor-pointer"
                          title="Sửa chuyên đề"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Xóa chuyên đề "${g.title}"?`)) {
                              deleteCustomGrammar(g.id);
                              showToast('Đã xóa chuyên đề ngữ pháp');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-[#131F2E] text-[#EF476F] hover:bg-[#EF476F]/20 transition text-xs cursor-pointer"
                          title="Xóa chuyên đề"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white">{g.title}</h4>

                    <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-1.5">
                      <span className="text-[10px] font-bold text-[#FFD166] uppercase block">Cấu Trúc / Công Thức:</span>
                      <code className="text-xs font-mono font-bold text-[#00E5FF] block">{g.formula}</code>
                    </div>

                    <p className="text-xs text-[#CBD5E1] leading-relaxed">{g.explanationVi}</p>

                    {(g.exampleEn || g.exampleVi) && (
                      <div className="p-3 rounded-2xl bg-[#0D1B2A] border border-[#27384E]/70 text-xs space-y-1">
                        {g.exampleEn && <p className="text-white font-medium">🇬🇧 {g.exampleEn}</p>}
                        {g.exampleVi && <p className="text-[#ADB5BD]">🇻🇳 {g.exampleVi}</p>}
                      </div>
                    )}

                    {g.usageNotes && (
                      <div className="text-[11px] text-[#FFD166] bg-[#FFD166]/10 p-2.5 rounded-xl border border-[#FFD166]/20">
                        <strong>💡 Mẹo thi & Lưu ý:</strong> {g.usageNotes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURRICULUM UNITS & LESSONS */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Cấu Trúc Chương Trình: Khối Lớp → Chương → Unit → Bài Học</h3>
              <p className="text-xs text-[#778DA9]">Quản lý bài giảng lý thuyết, video, từ vựng và bài tập gắn với từng Unit</p>
            </div>
            <button
              onClick={() => setShowCreateUnitModal(true)}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs hover:bg-[#00E5FF]/90"
            >
              + Tạo Unit Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curriculumUnits.map((unit) => {
              const unitLessons = curriculumLessons.filter((l) => l.unitId === unit.id);
              const unitExams = assignments.filter((a) => a.unitId === unit.id);
              return (
                <div key={unit.id} className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#9D4EDD]/20 text-[#D8B4FE] border border-[#9D4EDD]/30">
                      Lớp {unit.grade} • Học kỳ {unit.semester} • {unit.chapterName}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa Unit "${unit.title}"?`)) {
                          removeCurriculumUnit(unit.id);
                          showToast('Đã xóa Unit');
                        }
                      }}
                      className="text-[#EF476F] hover:underline text-xs"
                    >
                      Xóa
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      Unit {unit.unitNumber}: {unit.title}
                    </h4>
                    <p className="text-xs text-[#778DA9] mt-1">{unit.description}</p>
                  </div>

                  {/* Lessons in this unit */}
                  <div className="space-y-2 pt-2 border-t border-[#27384E]">
                    <div className="flex items-center justify-between text-xs text-[#CBD5E1]">
                      <span className="font-bold">Bài Học Thành Phần ({unitLessons.length})</span>
                      <button
                        onClick={async () => {
                          const title = prompt('Nhập tên bài học mới trong Unit này:');
                          if (title && title.trim()) {
                            await addCurriculumLesson({
                              id: `lesson_${Date.now()}`,
                              unitId: unit.id,
                              title: title.trim(),
                              orderIndex: unitLessons.length + 1,
                              contentType: 'TEXT',
                              contentBody: 'Nội dung bài học lý thuyết...',
                              createdAt: new Date().toISOString()
                            });
                            showToast('Đã thêm bài học mới');
                          }
                        }}
                        className="text-[#00E5FF] hover:underline font-bold"
                      >
                        + Thêm bài học
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {unitLessons.map((l) => (
                        <div
                          key={l.id}
                          className="p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] flex items-center justify-between text-xs"
                        >
                          <span className="text-[#CBD5E1] truncate pr-2 font-medium">{l.title}</span>
                          <span className="text-[10px] text-[#778DA9] uppercase">{l.contentType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Quizzes */}
                  <div className="pt-2 border-t border-[#27384E] flex items-center justify-between text-xs text-[#778DA9]">
                    <span>Đề kiểm tra liên kết: <strong className="text-white">{unitExams.length}</strong></span>
                    <button
                      onClick={() => {
                        setEditingAssignment(null);
                        setShowExamBuilder(true);
                      }}
                      className="text-[#FFD166] hover:underline font-bold"
                    >
                      + Gắn đề kiểm tra
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSROOMS & ROSTERS */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Danh Sách Lớp Học & Mã Tham Gia (Join Codes)</h3>
              <p className="text-xs text-[#778DA9]">Quản lý học sinh, giao đề theo lớp và theo dõi tiến độ</p>
            </div>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs hover:bg-[#00E5FF]/90"
            >
              + Tạo Lớp Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                    Khối {cls.grade} • {cls.room || 'Phòng học'}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa lớp "${cls.name}"?`)) {
                        removeClass(cls.id);
                        showToast('Đã xóa lớp học');
                      }
                    }}
                    className="text-[#EF476F] hover:underline text-xs"
                  >
                    Xóa
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">{cls.name}</h4>
                  <p className="text-xs text-[#778DA9] mt-0.5">{cls.description || 'Chưa có mô tả'}</p>
                </div>

                {/* Join code display */}
                <div className="p-3 rounded-2xl bg-[#131F2E] border border-[#27384E] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#778DA9] uppercase block font-bold">Mã Tham Gia Lớp</span>
                    <span className="text-base font-black text-[#00E5FF] tracking-wider">{cls.joinCode}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cls.joinCode);
                      showToast(`Đã sao chép mã tham gia ${cls.joinCode}`);
                    }}
                    className="p-2 rounded-xl bg-[#1B263B] text-[#CBD5E1] hover:text-white"
                    title="Sao chép mã"
                  >
                    <Copy size={15} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-[#778DA9]">
                  <span>Sĩ số: <strong className="text-white">{cls.studentCount || 35}</strong> học sinh</span>
                  <span className="text-[#00E5FF] font-bold">Đang hoạt động</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GRADING & FEEDBACK CENTER */}
      {activeTab === 'grading' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-sm">Danh Sách Bài Nộp & Chấm Tự Luận</h3>
              <p className="text-xs text-[#778DA9]">
                Tự động chấm các câu trắc nghiệm, hỗ trợ giáo viên điều chỉnh điểm và ghi nhận xét cá nhân
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#778DA9]">Tổng bài nộp: <strong className="text-[#00E5FF]">{submissions.length}</strong></span>
            </div>
          </div>

          <div className="rounded-3xl bg-[#1B263B] border border-[#27384E] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#131F2E] text-[#778DA9] font-bold uppercase text-[10px] tracking-wider border-b border-[#27384E]">
                  <tr>
                    <th className="p-4">Học Sinh</th>
                    <th className="p-4">Lớp</th>
                    <th className="p-4">Đề Kiểm Tra</th>
                    <th className="p-4">Điểm Số</th>
                    <th className="p-4">Trạng Thái</th>
                    <th className="p-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27384E]">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#778DA9]">
                        Chưa có học sinh nào nộp bài thi. Khi học sinh làm bài xong, danh sách sẽ xuất hiện tại đây.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#131F2E]/60 transition">
                        <td className="p-4 font-bold text-white">{sub.studentName}</td>
                        <td className="p-4 text-[#CBD5E1]">{sub.studentClassName}</td>
                        <td className="p-4 text-white font-medium">{sub.assignmentTitle}</td>
                        <td className="p-4">
                          <span className="font-black text-sm text-[#06D6A0]">
                            {sub.score} / {sub.maxScore}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'GRADED'
                                ? 'bg-[#06D6A0]/20 text-[#06D6A0]'
                                : 'bg-[#FFD166]/20 text-[#FFD166]'
                            }`}
                          >
                            {sub.status === 'GRADED' ? 'Đã Chấm' : 'Chờ Chấm Tự Luận'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradingFeedback(sub.teacherFeedback || '');
                              setGradingFinalScore(sub.score);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-bold text-xs hover:bg-[#00E5FF]/90 transition"
                          >
                            Sửa Điểm & Nhận Xét
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LIVE MONITOR */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Radio className="text-[#06D6A0] animate-pulse" size={18} />
                Bảng Giám Sát Thời Gian Thực (Live Exam Telemetry)
              </h3>
              <p className="text-xs text-[#778DA9]">Theo dõi trạng thái làm bài trực tiếp của học sinh trong phòng thi</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E]">
                Online: <strong className="text-[#06D6A0]">{onlineStudentsCount}</strong> học sinh
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {onlineUsers
              .filter((u) => u.role === 'STUDENT')
              .map((u) => (
                <div key={u.uid} className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{u.displayName}</span>
                    <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-ping" />
                  </div>
                  <p className="text-[#778DA9] text-[11px]">{u.customClassName || 'Lớp 10'} • Cấp độ {u.level || 1}</p>
                  <div className="p-2 rounded-xl bg-[#131F2E] text-[11px] text-[#00E5FF] font-medium truncate">
                    {u.currentActivity || 'Đang làm bài thi'}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: QUESTION BANK */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Kho Học Liệu & Ngân Hàng Câu Hỏi Tái Sử Dụng</h3>
              <p className="text-xs text-[#778DA9]">Lưu trữ câu hỏi mẫu, phân loại theo độ khó và chủ điểm ngữ pháp</p>
            </div>
            <button
              onClick={async () => {
                const promptText = prompt('Nhập nội dung câu hỏi mới vào ngân hàng:');
                if (promptText && promptText.trim()) {
                  await addQuestionToBank({
                    id: `qb_${Date.now()}`,
                    teacherUid: currentUser?.uid || 'teacher_01',
                    subject: 'Tiếng Anh',
                    grade: 10,
                    topic: 'Ngữ pháp chung',
                    difficulty: 'MEDIUM',
                    question: {
                      id: `q_${Date.now()}`,
                      type: 'SINGLE_CHOICE',
                      question: promptText.trim(),
                      options: ['A', 'B', 'C', 'D'],
                      correctIndex: 0,
                      explanation: 'Giải thích chi tiết...',
                      points: 1.0,
                      grade: 10
                    },
                    createdAt: new Date().toISOString()
                  });
                  showToast('Đã lưu câu hỏi vào ngân hàng');
                }
              }}
              className="px-4 py-2 rounded-xl bg-[#FFD166] text-[#0D1B2A] font-black text-xs hover:bg-[#FFD166]/90"
            >
              + Thêm Câu Hỏi Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {questionBank.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFD166]/20 text-[#FFD166]">
                    [{item.topic}] Lớp {item.grade} • {item.difficulty}
                  </span>
                  <button
                    onClick={() => {
                      removeQuestionFromBank(item.id);
                      showToast('Đã xóa khỏi ngân hàng');
                    }}
                    className="text-[#EF476F] hover:underline"
                  >
                    Xóa
                  </button>
                </div>
                <p className="font-bold text-white">{item.question.question}</p>
                <p className="text-[#778DA9] text-[11px]">{item.question.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: SETTINGS & DEFAULTS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="p-6 rounded-3xl bg-[#1B263B] border border-[#27384E] space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-[#00E5FF]" />
              Cấu Hình Hệ Thống Dành Cho Giáo Viên
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[#CBD5E1] block mb-1">Mã bảo mật Giáo viên hiện tại:</label>
                <input
                  type="text"
                  value={adminSettings?.teacherPasscode || 'LP2026'}
                  disabled
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#00E5FF] font-black"
                />
              </div>

              <div className="pt-2 border-t border-[#27384E] flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Tùy Biến Giao Diện Phòng Dạy</span>
                  <span className="text-[#778DA9]">Chế độ 3D, Minimalist hoặc Minh họa vẽ tay</span>
                </div>
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#FFD166] text-[#0D1B2A] font-black"
                >
                  Mở Cài Đặt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Exam Builder Modal */}
      {showExamBuilder && (
        <SmartExamBuilderModal
          isOpen={showExamBuilder}
          initialAssignment={editingAssignment}
          onClose={() => {
            setShowExamBuilder(false);
            setEditingAssignment(null);
          }}
          onSaved={(newAssign) => {
            showToast(`Đã lưu đề thi "${newAssign.title}" thành công!`);
          }}
        />
      )}

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal isOpen={showThemeModal} onClose={() => setShowThemeModal(false)} />

      {/* Batch Exam File Import Modal */}
      <BatchExamFileImportModal
        isOpen={showBatchExamFileModal}
        onClose={() => setShowBatchExamFileModal(false)}
        onImportExam={(newAssign) => {
          showToast(`Nhập đề thi "${newAssign.title}" từ file thành công!`);
        }}
      />

      {/* Batch Word Import Modal */}
      <BatchWordImportModal
        isOpen={showBatchWordModal}
        onClose={() => setShowBatchWordModal(false)}
        onImportWords={async (words) => {
          const count = await addCustomWordsBatch(words);
          showToast(`Đã nhập thành công ${count} từ mới vào kho dữ liệu!`);
          return count;
        }}
        defaultGrade={wordGradeFilter || 10}
        defaultUnit={1}
      />

      {/* Batch Grammar Import Modal */}
      <BatchGrammarImportModal
        isOpen={showBatchGrammarModal}
        onClose={() => setShowBatchGrammarModal(false)}
        onImportGrammar={async (lessons) => {
          const count = await addCustomGrammarBatch(lessons);
          showToast(`Đã nhập thành công ${count} chuyên đề ngữ pháp!`);
          return count;
        }}
        defaultGrade={grammarGradeFilter || 10}
      />

      {/* Add / Edit Single Word Modal */}
      {showAddWordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#1B263B] border border-[#06D6A0]/40 shadow-2xl p-6 space-y-4 text-xs my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#27384E]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#06D6A0]/20 text-[#06D6A0] flex items-center justify-center font-black">
                  <Languages size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    {editingWord ? 'Chỉnh Sửa Từ Vựng' : 'Thêm Từ Vựng Mới'}
                  </h3>
                  <p className="text-[11px] text-[#778DA9]">
                    Đồng bộ tự động vào Unit học tập và game Săn Từ của học sinh
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAddWordModal(false);
                  setEditingWord(null);
                }}
                className="p-1.5 rounded-xl text-[#778DA9] hover:text-white hover:bg-[#27384E] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Word & Auto-fill */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#CBD5E1] font-bold">Từ tiếng Anh (Word / Phrase): *</label>
                  <button
                    type="button"
                    onClick={() => handleAutoFillFromDictionary(wordInput)}
                    className="text-[#00E5FF] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Tra từ điển & Điền tự động</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Ví dụ: perseverance, breadwinner, eco-friendly..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:border-[#06D6A0] focus:outline-none"
                />
              </div>

              {/* Phonetic & Part of Speech */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Phiên âm IPA:</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneticInput}
                      onChange={(e) => setPhoneticInput(e.target.value)}
                      placeholder="/ˌpɜː.sɪˈvɪə.rəns/"
                      className="w-full p-2.5 pr-8 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#FFD166] font-mono focus:border-[#06D6A0] focus:outline-none"
                    />
                    {wordInput && (
                      <button
                        type="button"
                        onClick={() => audioService.speakEnglish(wordInput)}
                        className="absolute right-2 top-2.5 text-[#00E5FF] hover:text-white cursor-pointer"
                        title="Nghe thử phát âm"
                      >
                        <Volume2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Từ loại:</label>
                  <select
                    value={partOfSpeechInput}
                    onChange={(e) => setPartOfSpeechInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                  >
                    <option value="noun">Danh từ (Noun)</option>
                    <option value="verb">Động từ (Verb)</option>
                    <option value="adjective">Tính từ (Adjective)</option>
                    <option value="adverb">Trạng từ (Adverb)</option>
                    <option value="phrase">Cụm từ (Phrase)</option>
                    <option value="idiom">Thành ngữ (Idiom)</option>
                  </select>
                </div>
              </div>

              {/* Vietnamese Meaning */}
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Dịch nghĩa tiếng Việt: *</label>
                <input
                  type="text"
                  value={meaningInput}
                  onChange={(e) => setMeaningInput(e.target.value)}
                  placeholder="Ví dụ: sự kiên trì, người trụ cột, thân thiện môi trường..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#06D6A0] font-bold focus:border-[#06D6A0] focus:outline-none"
                />
              </div>

              {/* Grade and Unit Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Khối lớp:</label>
                  <select
                    value={wordGradeInput}
                    onChange={(e) => setWordGradeInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold"
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
                    value={wordUnitInput}
                    onChange={(e) => setWordUnitInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold"
                  >
                    <option value={0}>Unit Bổ sung (Chuyên đề ngoài sách)</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((u) => (
                      <option key={u} value={u}>
                        Unit {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Example Bilingual */}
              <div className="space-y-2">
                <label className="text-[#CBD5E1] font-bold block">Câu ví dụ minh họa:</label>
                <input
                  type="text"
                  value={exampleEnInput}
                  onChange={(e) => setExampleEnInput(e.target.value)}
                  placeholder="🇬🇧 Câu tiếng Anh: Success requires hard work and perseverance."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={exampleViInput}
                  onChange={(e) => setExampleViInput(e.target.value)}
                  placeholder="🇻🇳 Dịch tiếng Việt: Thành công đòi hỏi sự chăm chỉ và kiên trì."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#ADB5BD] focus:outline-none"
                />
              </div>

              {/* Distractors for Game/Quiz */}
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">
                  Từ gây nhiễu cho Game Đấu Từ / Trắc Nghiệm (3 phương án sai):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={distractor1Input}
                    onChange={(e) => setDistractor1Input(e.target.value)}
                    placeholder="Phương án sai 1"
                    className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
                  />
                  <input
                    type="text"
                    value={distractor2Input}
                    onChange={(e) => setDistractor2Input(e.target.value)}
                    placeholder="Phương án sai 2"
                    className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
                  />
                  <input
                    type="text"
                    value={distractor3Input}
                    onChange={(e) => setDistractor3Input(e.target.value)}
                    placeholder="Phương án sai 3"
                    className="w-full p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27384E]">
              <button
                type="button"
                onClick={() => {
                  setShowAddWordModal(false);
                  setEditingWord(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveWord}
                className="px-5 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs hover:bg-[#06D6A0]/90 transition shadow-lg shadow-[#06D6A0]/20 cursor-pointer"
              >
                {editingWord ? 'Lưu Thay Đổi' : 'Lưu Từ Vựng Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Single Grammar Modal */}
      {showAddGrammarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#1B263B] border border-[#FFD166]/40 shadow-2xl p-6 space-y-4 text-xs my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#27384E]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFD166]/20 text-[#FFD166] flex items-center justify-center font-black">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    {editingGrammar ? 'Chỉnh Sửa Chuyên Đề Ngữ Pháp' : 'Thêm Chuyên Đề Ngữ Pháp Mới'}
                  </h3>
                  <p className="text-[11px] text-[#778DA9]">
                    Soạn công thức, giải thích và ví dụ cho học sinh ôn luyện
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowAddGrammarModal(false);
                  setEditingGrammar(null);
                }}
                className="p-1.5 rounded-xl text-[#778DA9] hover:text-white hover:bg-[#27384E] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Tên chuyên đề ngữ pháp: *</label>
                <input
                  type="text"
                  value={grammarTitleInput}
                  onChange={(e) => setGrammarTitleInput(e.target.value)}
                  placeholder="Ví dụ: Present Perfect Tense (Thì Hiện Tại Hoàn Thành)"
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold focus:border-[#FFD166] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Khối lớp:</label>
                  <select
                    value={grammarGradeInput}
                    onChange={(e) => setGrammarGradeInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Cấu trúc / Công thức: *</label>
                  <input
                    type="text"
                    value={grammarFormulaInput}
                    onChange={(e) => setGrammarFormulaInput(e.target.value)}
                    placeholder="S + have/has + V3/ed + O"
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#00E5FF] font-mono font-bold focus:border-[#FFD166] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Giải thích cách dùng & quy tắc: *</label>
                <textarea
                  rows={3}
                  value={grammarExplanationInput}
                  onChange={(e) => setGrammarExplanationInput(e.target.value)}
                  placeholder="Diễn tả hành động xảy ra trong quá khứ kéo dài đến hiện tại hoặc vừa mới xảy ra..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[#CBD5E1] font-bold block">Ví dụ minh họa song ngữ:</label>
                <input
                  type="text"
                  value={grammarExampleEnInput}
                  onChange={(e) => setGrammarExampleEnInput(e.target.value)}
                  placeholder="🇬🇧 I have lived in Thai Nguyen for five years."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
                <input
                  type="text"
                  value={grammarExampleViInput}
                  onChange={(e) => setGrammarExampleViInput(e.target.value)}
                  placeholder="🇻🇳 Tôi đã sống ở Thái Nguyên được năm năm."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#ADB5BD] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Mẹo làm bài & Lưu ý đặc biệt:</label>
                <textarea
                  rows={2}
                  value={grammarUsageNotesInput}
                  onChange={(e) => setGrammarUsageNotesInput(e.target.value)}
                  placeholder="Dấu hiệu nhận biết: since, for, already, yet, just, ever, never..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#FFD166] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#27384E]">
              <button
                type="button"
                onClick={() => {
                  setShowAddGrammarModal(false);
                  setEditingGrammar(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveGrammar}
                className="px-5 py-2.5 rounded-xl bg-[#FFD166] text-[#0D1B2A] font-black text-xs hover:bg-[#FFD166]/90 transition shadow-lg cursor-pointer"
              >
                {editingGrammar ? 'Lưu Thay Đổi' : 'Lưu Chuyên Đề'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#1B263B] border border-[#27384E] p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-black text-white text-base">Tạo Lớp Học Mới</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Tên lớp học:</label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => setClassNameInput(e.target.value)}
                  placeholder="Ví dụ: Lớp 10A1 - Anh Văn Chuyên Sâu"
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Khối lớp:</label>
                  <select
                    value={classGradeInput}
                    onChange={(e) => setClassGradeInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Phòng học:</label>
                  <input
                    type="text"
                    value={classRoomInput}
                    onChange={(e) => setClassRoomInput(e.target.value)}
                    placeholder="Phòng 204"
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Mô tả / Mục tiêu học:</label>
                <textarea
                  rows={2}
                  value={classDescInput}
                  onChange={(e) => setClassDescInput(e.target.value)}
                  placeholder="Mô tả mục tiêu và nội dung chính của lớp..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E]"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!classNameInput.trim()) return;
                  await addClass({
                    id: `class_${Date.now()}`,
                    teacherUid: currentUser?.uid || 'teacher_01',
                    teacherName: currentUser?.displayName || 'Giáo viên THPT Lương Phú',
                    name: classNameInput.trim(),
                    grade: classGradeInput,
                    subject: 'Tiếng Anh',
                    room: classRoomInput.trim(),
                    joinCode: `LP${Math.floor(1000 + Math.random() * 9000)}`,
                    description: classDescInput.trim(),
                    studentCount: 0,
                    createdAt: new Date().toISOString()
                  });
                  setShowCreateClassModal(false);
                  setClassNameInput('');
                  showToast('Đã tạo lớp học mới thành công!');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs hover:bg-[#00E5FF]/90"
              >
                Tạo Lớp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Unit Modal */}
      {showCreateUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#1B263B] border border-[#27384E] p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-black text-white text-base">Tạo Unit Bài Học Mới</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Tên Unit:</label>
                <input
                  type="text"
                  value={unitTitleInput}
                  onChange={(e) => setUnitTitleInput(e.target.value)}
                  placeholder="Ví dụ: Family Life & Daily Routines"
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Khối lớp:</label>
                  <select
                    value={unitGradeInput}
                    onChange={(e) => setUnitGradeInput(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>
                        Khối {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[#CBD5E1] font-bold block mb-1">Số thứ tự Unit:</label>
                  <input
                    type="number"
                    min="1"
                    value={unitNumberInput}
                    onChange={(e) => setUnitNumberInput(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Tên chương:</label>
                <input
                  type="text"
                  value={unitChapterInput}
                  onChange={(e) => setUnitChapterInput(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Humans and Society"
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white"
                />
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Mô tả Unit:</label>
                <textarea
                  rows={2}
                  value={unitDescInput}
                  onChange={(e) => setUnitDescInput(e.target.value)}
                  placeholder="Tóm tắt nội dung chính và kỹ năng cần đạt..."
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateUnitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E]"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!unitTitleInput.trim()) return;
                  await addCurriculumUnit({
                    id: `unit_cur_${Date.now()}`,
                    grade: unitGradeInput,
                    subject: 'Tiếng Anh',
                    semester: 1,
                    chapterName: unitChapterInput.trim(),
                    unitNumber: unitNumberInput,
                    title: unitTitleInput.trim(),
                    description: unitDescInput.trim(),
                    status: 'PUBLISHED',
                    teacherUid: currentUser?.uid || 'teacher_01',
                    createdAt: new Date().toISOString()
                  });
                  setShowCreateUnitModal(false);
                  setUnitTitleInput('');
                  showToast('Đã thêm Unit mới thành công!');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs hover:bg-[#00E5FF]/90"
              >
                Tạo Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Grading & Feedback Dialog */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-lg rounded-3xl bg-[#1B263B] border border-[#27384E] p-6 space-y-4 shadow-2xl text-xs">
            <h3 className="font-black text-white text-base">
              Chấm Điểm & Nhận Xét: {gradingSubmission.studentName}
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[#778DA9] block">Đề thi:</span>
                <span className="font-bold text-white text-sm">{gradingSubmission.assignmentTitle}</span>
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Điểm số cuối cùng (thang 10):</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="10"
                  value={gradingFinalScore}
                  onChange={(e) => setGradingFinalScore(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#06D6A0] font-black text-base focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#CBD5E1] font-bold block mb-1">Lời nhận xét của Giáo viên:</label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Nhập nhận xét động viên, chỉ ra điểm làm tốt và kiến thức học sinh cần cải thiện..."
                  className="w-full p-3 rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E]"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  await gradeStudentSubmission(gradingSubmission.id, {
                    finalScore: gradingFinalScore,
                    teacherFeedback: gradingFeedback
                  });
                  setGradingSubmission(null);
                  showToast('Đã lưu điểm và nhận xét thành công!');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs hover:bg-[#06D6A0]/90"
              >
                Lưu Đánh Giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 px-5 py-3 rounded-2xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs shadow-2xl shadow-[#00E5FF]/30 flex items-center gap-2 animate-bounce">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
