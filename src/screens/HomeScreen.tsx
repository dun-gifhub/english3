import React, { useState } from 'react';
import { useApp, getDisplayClassName, getCurrentSchoolYearString } from '../context/AppContext';
import { GradeSelector } from '../components/GradeSelector';
import { UnitTopic, TeacherAssignment, GrammarLesson, ThemeConfig } from '../types';
import {
  Zap,
  Play,
  Copy,
  Check,
  BookOpen,
  GraduationCap,
  Sparkles,
  Trophy,
  ChevronRight,
  ShieldCheck,
  Flame,
  Award,
  Activity,
  Palette,
  Plus,
  Volume2,
  BookmarkCheck,
  Layers,
  Sun,
  Moon
} from 'lucide-react';
import { UnitWordPreviewModal } from '../components/UnitWordPreviewModal';
import { StudentAddWordModal } from '../components/StudentAddWordModal';
import { audioService } from '../services/audioService';
import { THEME_PRESETS, applyThemeToDom } from '../services/themeService';

interface HomeScreenProps {
  onPlayUnit: (unit: UnitTopic) => void;
  onTakeAssignment: (assignment: TeacherAssignment) => void;
  onOpenTeacherPortal: () => void;
  onRequestThemeModal?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPlayUnit,
  onTakeAssignment,
  onOpenTeacherPortal,
  onRequestThemeModal
}) => {
  const {
    currentUser,
    selectedGrade,
    subjects,
    grammarLessons,
    assignments,
    onlineUsers,
    onlineStudentsCount,
    customWords,
    themeConfig,
    setThemeConfig
  } = useApp();

  const [activeSection, setActiveSection] = useState<'words' | 'grammar' | 'assignments'>('words');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarLesson | null>(null);
  const [previewUnit, setPreviewUnit] = useState<UnitTopic | null>(null);
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const currentSubject = subjects[0];
  const schoolYear = getCurrentSchoolYearString();

  const handleCopyFriendCode = () => {
    if (!currentUser?.friendCode) return;
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePlayWordAudio = (wordText: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSpeakingWordId(id);
    audioService.speakEnglish(wordText);
    setTimeout(() => setSpeakingWordId(null), 1200);
  };

  const handleQuickSelectPreset = async (presetId: string, isLight: boolean) => {
    const next: ThemeConfig = {
      ...themeConfig,
      preset: presetId as any,
      mode: isLight ? 'light' : 'dark'
    };
    applyThemeToDom(next);
    await setThemeConfig(next);
  };

  const xpInCurrentLevel = (currentUser?.xp || 0) % 500;
  const xpPercent = Math.min(100, Math.floor((xpInCurrentLevel / 500) * 100));

  return (
    <div className="space-y-6 pb-20">
      {/* Hunter Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1B263B] via-[#131F2E] to-[#1B263B] border border-[#2D3F56] p-5 sm:p-6 shadow-xl shadow-black/30">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#00E5FF]/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-[#9D4EDD]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* User info & avatar */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-[#00E5FF]/20"
              style={{ backgroundColor: currentUser?.avatarColor || '#00E5FF' }}
            >
              <Zap size={32} className="text-[#0D1B2A] fill-[#0D1B2A]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {currentUser?.displayName || 'Học Sinh Lương Phú'}
                </h2>
                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#FFD166]/20 text-[#FFD166] flex items-center gap-1 border border-[#FFD166]/30">
                  <Award size={13} />
                  <span>Cấp {currentUser?.level || 1}</span>
                </span>
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#27384E] text-[#00E5FF]">
                  {currentUser ? getDisplayClassName(currentUser) : `Lớp ${selectedGrade}`}
                </span>
              </div>

              <p className="text-xs text-[#778DA9] mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Niên khóa: <strong className="text-white font-semibold">{schoolYear}</strong></span>
                <span>•</span>
                <span>{currentUser?.status || 'Sẵn sàng săn từ vựng!'}</span>
              </p>

              {/* XP Progress Bar */}
              <div className="mt-2.5 w-full max-w-xs sm:max-w-sm">
                <div className="flex justify-between text-[11px] font-semibold text-[#778DA9] mb-1">
                  <span>Tiến độ kinh nghiệm</span>
                  <span className="text-[#00E5FF]">{xpInCurrentLevel} / 500 XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#27384E] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-[#00E5FF] to-[#9D4EDD] transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Score & Friend code badges */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0D1B2A]/80 border border-[#27384E] text-center min-w-[95px]">
              <span className="text-[10px] font-bold text-[#778DA9] uppercase tracking-wider block">Điểm Tháng</span>
              <span className="text-base sm:text-lg font-black text-[#00E5FF]">
                {(currentUser?.monthlyScore || 0).toLocaleString()}
              </span>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-[#0D1B2A]/80 border border-[#27384E] text-center min-w-[95px]">
              <span className="text-[10px] font-bold text-[#778DA9] uppercase tracking-wider block">Kỷ Lục Điểm</span>
              <span className="text-base sm:text-lg font-black text-[#FFD166]">
                {(currentUser?.highestScore || 0).toLocaleString()}
              </span>
            </div>

            {/* Friend Code Button */}
            <button
              onClick={handleCopyFriendCode}
              className="px-3 py-2.5 rounded-2xl bg-[#27384E] hover:bg-[#344966] text-white border border-[#415A77]/50 flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer"
              title="Sao chép mã kết bạn"
            >
              {copiedCode ? <Check size={14} className="text-[#06D6A0]" /> : <Copy size={14} />}
              <span>{currentUser?.friendCode || 'LP-2026'}</span>
            </button>

            {/* Student Add Word Quick Button */}
            <button
              onClick={() => setShowAddWordModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#06D6A0] to-[#00E5FF] hover:from-[#05c08e] hover:to-[#00b4cc] text-[#0D1B2A] flex items-center gap-1.5 transition-all text-xs font-black cursor-pointer shadow-md shadow-[#06D6A0]/20 hover:scale-105"
              title="Thêm từ vựng mới vào kho học tập và game săn từ"
            >
              <Plus size={15} />
              <span>+ Thêm Từ Mới</span>
            </button>

            {/* Theme Customizer Button for Students */}
            {onRequestThemeModal && (
              <button
                onClick={onRequestThemeModal}
                className="px-3.5 py-2.5 rounded-2xl bg-[#1E2D40] hover:bg-[#27384E] text-[#FFD166] hover:text-white border border-[#FFD166]/40 flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-sm hover:border-[#FFD166]/80"
                title="Đổi giao diện, màu sắc & hình nền không gian học tập"
              >
                <Palette size={15} className="text-[#FFD166]" />
                <span>Đổi Giao Diện</span>
              </button>
            )}
          </div>
        </div>

        {/* Auto advancement education notice */}
        <div className="mt-4 pt-3 border-t border-[#27384E]/60 flex items-center gap-2 text-xs text-[#778DA9]">
          <ShieldCheck size={15} className="text-[#06D6A0] shrink-0" />
          <span>
            Hệ thống phân cấp chuẩn GDPT từ Lớp 6 đến Lớp 12. Khối lớp tự động nâng hạng vào tháng 9 hàng năm.
          </span>
        </div>
      </div>

      {/* Student Theme & Workspace Customizer Hub */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1B263B]/90 border border-[#27384E] shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFD166]/20 text-[#FFD166] flex items-center justify-center font-black">
              <Palette size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-white">Giao Diện Học Tập Của Bạn</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 capitalize">
                  {themeConfig?.preset || 'THPT Lương Phú'} ({themeConfig?.mode === 'light' ? 'Sáng' : 'Tối'})
                </span>
                {themeConfig?.customBgImage && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30">
                    Ảnh Nền Tùy Chỉnh
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#778DA9]">
                Tùy biến phong cách màu sắc, chế độ sáng/tối, ảnh nền và phông chữ yêu thích cho học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRequestThemeModal && (
              <button
                onClick={onRequestThemeModal}
                className="px-3.5 py-1.5 rounded-xl bg-[#131F2E] hover:bg-[#27384E] text-[#FFD166] border border-[#FFD166]/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Layers size={13} />
                <span>Tùy Biến Đầy Đủ</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Fast-Switch Student Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          {[
            { id: 'navy', label: 'THPT Lương Phú', color: '#00E5FF', isLight: false },
            { id: 'cyberpunk', label: 'Cyberpunk Neon', color: '#00FF66', isLight: false },
            { id: 'minimal', label: 'Pastel Mộng Mơ', color: '#E11D48', isLight: true },
            { id: 'warm', label: 'Giấy Vở Tự Nhiên', color: '#D97706', isLight: true },
            { id: 'slate', label: 'Đêm Huyền Ảo', color: '#60A5FA', isLight: false }
          ].map((p) => {
            const isCurrent = themeConfig?.preset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleQuickSelectPreset(p.id, p.isLight)}
                className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2 cursor-pointer text-left ${
                  isCurrent
                    ? 'border-[#00E5FF] bg-[#131F2E] shadow-md shadow-[#00E5FF]/20 ring-1 ring-[#00E5FF]'
                    : 'border-[#27384E] bg-[#131F2E]/60 hover:bg-[#1E2D40] hover:border-[#778DA9]/50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0 border border-white/20 flex items-center justify-center"
                  style={{ backgroundColor: p.color }}
                >
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div className="truncate">
                  <span className="font-bold text-white text-[11px] block truncate">{p.label}</span>
                  <span className="text-[9px] text-[#778DA9] block">{p.isLight ? 'Giao diện Sáng' : 'Giao diện Tối'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Online Monitoring Banner for Teachers & Admin */}
      {(currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN') && (
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#1E2D40] via-[#142A36] to-[#1E2D40] border border-[#06D6A0]/40 shadow-lg flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#06D6A0]/20 text-[#06D6A0] flex items-center justify-center shrink-0 border border-[#06D6A0]/30 shadow-md shadow-[#06D6A0]/10">
              <Activity size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06D6A0] animate-ping" />
                <h4 className="text-sm font-bold text-white">
                  Giám sát trực tuyến: Đang có {onlineStudentsCount} học sinh đang học
                </h4>
              </div>
              <p className="text-xs text-[#778DA9]">
                Thầy cô và Quản trị viên có thể theo dõi tiến độ và hoạt động của từng học sinh theo thời gian thực.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Show first 4 avatars of online students */}
            <div className="hidden sm:flex items-center -space-x-2">
              {onlineUsers
                .filter((u) => u.role === 'STUDENT')
                .slice(0, 4)
                .map((u) => (
                  <div
                    key={u.uid}
                    title={`${u.displayName} (${u.customClassName || 'Lớp 10'}) - ${u.currentActivity || 'Đang học'}`}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-[#0D1B2A] border-2 border-[#1E2D40] shadow-sm"
                    style={{ backgroundColor: u.avatarColor || '#00E5FF' }}
                  >
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                ))}
            </div>

            <button
              onClick={onOpenTeacherPortal}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#06D6A0] hover:bg-[#05b888] text-[#0D1B2A] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#06D6A0]/20"
            >
              <span>Xem danh sách học sinh online</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Grade Selector Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <span>{currentSubject?.title || `Tiếng Anh Lớp ${selectedGrade}`}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] font-bold border border-[#00E5FF]/20">
              {currentSubject?.units.length || 0} Chuyên đề
            </span>
          </h3>
          <p className="text-xs text-[#778DA9]">
            {currentSubject?.subtitle || 'Chương trình chuẩn Bộ GD&ĐT'}
          </p>
        </div>

        <GradeSelector />
      </div>

      {/* Section Tabs: Từ Vựng & Game / Ngữ Pháp / Bài Tập Giáo Viên */}
      <div className="flex p-1 rounded-2xl bg-[#131F2E] border border-[#27384E]/70 max-w-md">
        <button
          onClick={() => setActiveSection('words')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'words'
              ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
              : 'text-[#ADB5BD] hover:text-white'
          }`}
        >
          <Play size={14} />
          <span>Đấu Từ (Game)</span>
        </button>
        <button
          onClick={() => setActiveSection('grammar')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'grammar'
              ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
              : 'text-[#ADB5BD] hover:text-white'
          }`}
        >
          <BookOpen size={14} />
          <span>Ngữ Pháp</span>
        </button>
        <button
          onClick={() => setActiveSection('assignments')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'assignments'
              ? 'bg-[#9D4EDD] text-white shadow-md shadow-[#9D4EDD]/20'
              : 'text-[#ADB5BD] hover:text-white'
          }`}
        >
          <GraduationCap size={14} />
          <span>Đề Thi ({assignments.length})</span>
        </button>
      </div>

      {/* SECTION 1: VOCABULARY & TAP GAME UNITS */}
      {activeSection === 'words' && (
        <div className="space-y-4">
          {/* Student & Teacher Vocabulary Notebook Hub */}
          <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#1B263B] via-[#132233] to-[#1B263B] border border-[#06D6A0]/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30 flex items-center justify-center font-black shadow-md shadow-[#06D6A0]/10 shrink-0">
                  <BookmarkCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-white">Sổ Tay Từ Vựng & Thêm Từ Mới</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#06D6A0]/20 text-[#06D6A0] border border-[#06D6A0]/30">
                      {customWords.length} Từ Tự Thêm
                    </span>
                  </div>
                  <p className="text-[11px] text-[#778DA9]">
                    Tự thêm từ mới bạn gặp khi học bài hoặc tra từ điển để luyện tập và thi đấu săn từ (Tap Hunter)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowAddWordModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#06D6A0] to-[#00E5FF] hover:from-[#05c08e] hover:to-[#00b4cc] text-[#0D1B2A] text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-[#06D6A0]/20 cursor-pointer hover:scale-105"
                >
                  <Plus size={16} />
                  <span>+ Thêm Từ Mới</span>
                </button>

                {(currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN') && (
                  <button
                    onClick={onOpenTeacherPortal}
                    className="px-3 py-2.5 rounded-2xl bg-[#131F2E] border border-[#27384E] text-[#CBD5E1] hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Quản Lý Từ GV
                  </button>
                )}
              </div>
            </div>

            {/* Custom Words Preview Strip */}
            {customWords.length > 0 ? (
              <div className="pt-2 border-t border-[#27384E]/70 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#778DA9]">
                  <span>Từ mới gần đây của bạn & thầy cô:</span>
                  <span className="text-[#00E5FF] font-bold">Lớp {selectedGrade}</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {customWords.slice(0, 10).map((cw) => (
                    <div
                      key={cw.id}
                      className="px-3 py-2 rounded-2xl bg-[#131F2E] border border-[#27384E] hover:border-[#00E5FF]/40 transition shrink-0 flex items-center gap-2.5 shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={(e) => handlePlayWordAudio(cw.word, cw.id, e)}
                        className={`p-1.5 rounded-lg ${
                          speakingWordId === cw.id
                            ? 'bg-[#00E5FF] text-[#0D1B2A]'
                            : 'bg-[#27384E] text-[#00E5FF] hover:bg-[#00E5FF]/20'
                        } transition cursor-pointer`}
                        title="Nghe phát âm"
                      >
                        <Volume2 size={13} />
                      </button>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-white">{cw.word}</span>
                          <span className="text-[10px] text-[#FFD166] font-mono">{cw.phonetic}</span>
                        </div>
                        <span className="text-[11px] text-[#06D6A0] font-medium block truncate max-w-[140px]">
                          {cw.meaningVi}
                        </span>
                      </div>
                    </div>
                  ))}
                  {customWords.length > 10 && (
                    <span className="text-[11px] text-[#778DA9] px-2 whitespace-nowrap">
                      +{customWords.length - 10} từ khác...
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-[#27384E]/50 flex items-center justify-between gap-3 text-xs text-[#778DA9]">
                <span>Chưa có từ mới nào. Bấm <strong>+ Thêm Từ Mới</strong> để tạo bộ từ vựng cá nhân của bạn!</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSubject?.units.map((unit) => {
            const isTeacherAdded = unit.unitNumber === 0;
            return (
              <div
                key={unit.id}
                className={`group rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isTeacherAdded
                    ? 'bg-linear-to-br from-[#1E2D40] to-[#251838] border-[#9D4EDD]/60 hover:border-[#9D4EDD]'
                    : 'bg-[#1B263B] border-[#27384E] hover:border-[#00E5FF]/50 hover:shadow-xl hover:shadow-[#00E5FF]/5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${
                        isTeacherAdded
                          ? 'bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/40'
                          : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                      }`}
                    >
                      {unit.difficulty}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-[#FFD166] font-bold">
                      <Trophy size={13} />
                      <span>{unit.bestScore > 0 ? `${unit.bestScore} pts` : 'Chưa đấu'}</span>
                    </div>
                  </div>

                  <h4 className="text-base font-extrabold text-white group-hover:text-[#00E5FF] transition-colors">
                    {unit.title}
                  </h4>
                  <p className="text-xs text-[#778DA9] mt-1 leading-relaxed">
                    {unit.description}
                  </p>

                  {/* Vocabulary preview pills */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {unit.words.slice(0, 4).map((w) => (
                      <span
                        key={w.id}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-[#131F2E] text-[#ADB5BD] border border-[#27384E]/70"
                      >
                        <strong className="text-white font-bold">{w.word}</strong>: {w.meaningVi}
                      </span>
                    ))}
                    {unit.words.length > 4 && (
                      <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-[#131F2E] text-[#00E5FF]">
                        +{unit.words.length - 4} từ nữa
                      </span>
                    )}
                  </div>
                </div>

                {/* Play Button & Vocabulary Preview */}
                <div className="mt-5 pt-3 border-t border-[#27384E]/60 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPreviewUnit(unit)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-[#131F2E] hover:bg-[#1E2D40] text-[#00E5FF] border border-[#27384E] hover:border-[#00E5FF]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen size={13} />
                    <span>Xem Trước ({unit.words.length} Từ)</span>
                  </button>

                  <button
                    onClick={() => onPlayUnit(unit)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isTeacherAdded
                        ? 'bg-linear-to-r from-[#9D4EDD] to-[#7B2CBF] text-white hover:from-[#A855F7] hover:to-[#9333EA] shadow-[#9D4EDD]/25'
                        : 'bg-[#00E5FF] text-[#0D1B2A] hover:bg-[#38bdf8] shadow-[#00E5FF]/20 hover:scale-102'
                    }`}
                  >
                    <Play size={14} className="fill-current" />
                    <span>VÀO SĂN TỪ</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* SECTION 2: GRAMMAR LESSONS */}
      {activeSection === 'grammar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grammarLessons.map((g) => (
              <div
                key={g.id}
                onClick={() => setSelectedGrammar(g)}
                className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] hover:border-[#00E5FF]/60 cursor-pointer transition-all hover:shadow-xl hover:shadow-[#00E5FF]/5"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#9D4EDD]/20 text-[#9D4EDD]">
                    Ngữ Pháp Lớp {g.grade}
                  </span>
                  <ChevronRight size={16} className="text-[#778DA9]" />
                </div>

                <h4 className="text-base font-bold text-white mb-2">{g.title}</h4>

                {/* Formula box */}
                <div className="p-2.5 rounded-xl bg-[#131F2E] border border-[#2D3F56] text-xs font-mono text-[#00E5FF] mb-2.5 truncate">
                  {g.formula}
                </div>

                <p className="text-xs text-[#ADB5BD] line-clamp-2 leading-relaxed">
                  {g.explanationVi}
                </p>

                <div className="mt-3 text-[11px] text-[#778DA9] italic">
                  Ví dụ: <span className="text-[#FFD166]">{g.exampleEn}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Grammar Modal Details */}
          {selectedGrammar && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
              <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[#1E2D40] border border-[#00E5FF]/40 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#9D4EDD]/20 text-[#9D4EDD]">
                    Chuyên Đề Lớp {selectedGrammar.grade}
                  </span>
                  <button
                    onClick={() => setSelectedGrammar(null)}
                    className="p-1 rounded-lg text-[#778DA9] hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="text-lg font-extrabold text-white">{selectedGrammar.title}</h3>

                <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#00E5FF]/30">
                  <span className="text-[10px] font-bold text-[#778DA9] uppercase tracking-wider block mb-1">
                    Công thức & Cấu trúc
                  </span>
                  <p className="font-mono text-sm font-semibold text-[#00E5FF]">{selectedGrammar.formula}</p>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-[#778DA9] uppercase tracking-wider mb-1">Giải Thích Ngữ Nghĩa</h5>
                  <p className="text-sm text-white leading-relaxed">{selectedGrammar.explanationVi}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#131F2E] space-y-1.5 border border-[#27384E]">
                  <h5 className="text-xs font-bold text-[#FFD166] uppercase tracking-wider">Ví Dụ Minh Họa</h5>
                  <p className="text-sm font-medium text-white">🇬🇧 {selectedGrammar.exampleEn}</p>
                  <p className="text-xs text-[#ADB5BD]">🇻🇳 {selectedGrammar.exampleVi}</p>
                </div>

                {selectedGrammar.usageNotes && (
                  <div className="p-3 rounded-xl bg-[#27384E]/40 border border-[#27384E] text-xs text-[#ADB5BD]">
                    <strong className="text-[#00E5FF]">Lưu ý làm bài: </strong>
                    {selectedGrammar.usageNotes}
                  </div>
                )}

                <button
                  onClick={() => setSelectedGrammar(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-[#00E5FF] text-[#0D1B2A] hover:bg-[#38bdf8] transition-all"
                >
                  Đã Hiểu Kiến Thức
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: TEACHER ASSIGNMENTS & REPUTABLE EXAMS */}
      {activeSection === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-[#778DA9]">
              Bài kiểm tra trắc nghiệm từ vựng & ngữ pháp Lớp {selectedGrade} do giáo viên biên soạn và trích xuất từ ngân hàng đề thi.
            </p>

            {currentUser?.role === 'TEACHER' && (
              <button
                onClick={onOpenTeacherPortal}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#9D4EDD] text-white hover:bg-[#a855f7] transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} />
                <span>Mở Cổng Quản Lý Đề Thi</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments
              .filter((a) => currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN' || a.status === 'PUBLISHED' || !a.status)
              .map((assign) => (
                <div
                  key={assign.id}
                  className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] hover:border-[#9D4EDD]/60 transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-[#9D4EDD]/5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/30">
                        Lớp {assign.grade} • {assign.questions.length} Câu Hỏi • {assign.timeLimitMinutes ? `${assign.timeLimitMinutes} Phút` : 'Tự do'}
                      </span>
                      <span className="text-[11px] text-[#778DA9]">
                        {new Date(assign.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-white">{assign.title}</h4>
                    <p className="text-xs text-[#ADB5BD] mt-1 line-clamp-2 leading-relaxed">
                      {assign.description || 'Bài kiểm tra kiến thức tổng hợp.'}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#778DA9]">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={15} className="text-[#9D4EDD]" />
                        <span>{assign.teacherName}</span>
                      </div>
                      <span className="font-bold text-[#FFD166]">{assign.totalPoints || 10} Điểm</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#27384E]/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FFD166] flex items-center gap-1">
                      <Flame size={14} />
                      <span>+{assign.questions.length * 50} XP</span>
                    </span>

                    <button
                      onClick={() => onTakeAssignment(assign)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-linear-to-r from-[#9D4EDD] to-[#7B2CBF] hover:from-[#A855F7] hover:to-[#9333EA] text-white transition-all shadow-md shadow-[#9D4EDD]/20 cursor-pointer"
                    >
                      LÀM BÀI KIỂM TRA
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Unit Vocabulary Preview Modal */}
      <UnitWordPreviewModal
        unit={previewUnit}
        isOpen={!!previewUnit}
        onClose={() => setPreviewUnit(null)}
        onStartGame={(u) => {
          setPreviewUnit(null);
          onPlayUnit(u);
        }}
      />

      {/* Student Add Word Modal */}
      <StudentAddWordModal
        isOpen={showAddWordModal}
        onClose={() => setShowAddWordModal(false)}
        defaultGrade={selectedGrade}
      />
    </div>
  );
};
