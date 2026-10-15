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
  Filter
} from 'lucide-react';
import { SmartExamBuilderModal } from '../components/SmartExamBuilderModal';
import { ThemeCustomizerModal } from '../components/ThemeCustomizerModal';
import { BatchExamFileImportModal } from '../components/BatchExamFileImportModal';
import { BatchWordImportModal } from '../components/BatchWordImportModal';
import { BatchGrammarImportModal } from '../components/BatchGrammarImportModal';
import { apiService } from '../services/apiService';

interface TeacherPortalScreenProps {
  initialTab?: 'exams' | 'curriculum' | 'classes' | 'grading' | 'monitor' | 'bank' | 'settings';
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

  const [activeTab, setActiveTab] = useState<'exams' | 'curriculum' | 'classes' | 'grading' | 'monitor' | 'bank' | 'settings'>(initialTab);

  // Modals state
  const [showExamBuilder, setShowExamBuilder] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [showBatchExamFileModal, setShowBatchExamFileModal] = useState<boolean>(false);

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

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<number>(0); // 0 = all

  // Notification message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowThemeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#CBD5E1] hover:text-white hover:bg-[#27384E] transition"
          >
            <Palette size={16} className="text-[#FFD166]" />
            <span>Giao Diện</span>
          </button>

          <button
            onClick={() => {
              setEditingAssignment(null);
              setShowExamBuilder(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 transition shadow-lg shadow-[#00E5FF]/20"
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
          { id: 'curriculum', label: 'Unit & Bài Học', icon: BookOpen, count: curriculumUnits.length },
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
