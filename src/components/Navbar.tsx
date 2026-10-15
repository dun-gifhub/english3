import React from 'react';
import { useApp, getDisplayClassName } from '../context/AppContext';
import {
  Flame,
  LogOut,
  Volume2,
  VolumeX,
  BookOpen,
  Languages,
  GraduationCap,
  Users,
  Trophy,
  Sparkles,
  Database,
  Shield,
  Palette
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onRequestTeacherModal: () => void;
  onRequestNeonModal?: () => void;
  onRequestThemeModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onRequestTeacherModal,
  onRequestNeonModal,
  onRequestThemeModal
}) => {
  const {
    currentUser,
    selectedGrade,
    setRole,
    signOut,
    soundEnabled,
    setSoundEnabled,
    onlineStudentsCount,
    onlineCount
  } = useApp();

  const isTeacher = currentUser?.role === 'TEACHER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const handleRoleToggle = () => {
    if (isAdmin || isTeacher) {
      onTabChange('teacher');
    } else {
      onRequestTeacherModal();
    }
  };

  const navItems = (isTeacher || isAdmin)
    ? [
        { id: 'teacher', label: isAdmin ? 'Cổng Quản Trị' : 'Trung Tâm Giáo Viên', icon: isAdmin ? Shield : GraduationCap },
        { id: 'dict', label: 'Từ Điển & Ngữ Liệu', icon: Languages },
        { id: 'callRoom', label: 'Phòng Trực Tuyến', icon: Users },
        { id: 'leaderboard', label: 'Bảng Vàng Học Sinh', icon: Trophy }
      ]
    : [
        { id: 'home', label: 'Học Tập', icon: BookOpen },
        { id: 'dict', label: 'Tra Từ', icon: Languages },
        { id: 'friends', label: 'Bạn Bè', icon: Users },
        { id: 'leaderboard', label: 'Bảng Vàng', icon: Trophy }
      ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#0D1B2A]/90 backdrop-blur-md border-b border-[#27384E]/70">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Logo & School Name */}
          <div
            onClick={() => onTabChange(isTeacher || isAdmin ? 'teacher' : 'home')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-full bg-white p-0.5 border border-[#FFD166]/60 shadow-sm shadow-[#00E5FF]/20 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/favicon.png"
                alt="THPT Lương Phú"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/ic_app_logo.jpg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white tracking-tight">THPT Lương Phú</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                    isAdmin
                      ? 'bg-[#EF476F]/20 text-[#EF476F]'
                      : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                  }`}
                >
                  {isAdmin ? 'ADMIN' : 'Hunter'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#778DA9] truncate max-w-[150px] sm:max-w-xs">
                {isAdmin ? (
                  <span className="text-[#EF476F] font-bold">Ban Quản Trị Hệ Thống</span>
                ) : isTeacher ? (
                  <span className="text-[#9D4EDD] font-bold">Giao diện Giáo Viên</span>
                ) : (
                  <span>
                    {currentUser?.displayName || 'Học Sinh'} •{' '}
                    <span className="text-[#00E5FF] font-semibold">
                      {currentUser ? getDisplayClassName(currentUser) : `Lớp ${selectedGrade}`}
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-[#131F2E] p-1 rounded-2xl border border-[#27384E]/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'teacher' && !isTeacher && !isAdmin) {
                      onRequestTeacherModal();
                    } else {
                      onTabChange(item.id);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? isAdmin && item.id === 'teacher'
                        ? 'bg-[#EF476F] text-white shadow-md shadow-[#EF476F]/25 font-black'
                        : 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
                      : 'text-[#ADB5BD] hover:text-white hover:bg-[#1E2D40]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions on Top Right */}
          <div className="flex items-center gap-2">
            {/* Live Online Presence Pill for Teacher & Admin */}
            {(isTeacher || isAdmin) && (
              <button
                onClick={() => onTabChange('teacher')}
                className="px-2.5 py-1 rounded-xl bg-[#06D6A0]/15 hover:bg-[#06D6A0]/25 border border-[#06D6A0]/40 text-[#06D6A0] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#06D6A0]/10"
                title="Học sinh & thầy cô đang trực tuyến"
              >
                <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
                <span className="hidden sm:inline font-extrabold">{onlineStudentsCount} HS Online</span>
                <span className="sm:hidden font-extrabold">{onlineStudentsCount} HS</span>
              </button>
            )}

            {/* Admin Portal Button */}
            {isAdmin ? (
              <button
                onClick={() => onTabChange('teacher')}
                className="px-2.5 py-1 rounded-xl bg-[#EF476F] hover:bg-[#f05a7e] text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#EF476F]/20"
                title="Cổng Cấu Hình Admin & Khóa GV"
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
            ) : isTeacher ? (
              /* Role switch chip only for teachers */
              <button
                onClick={handleRoleToggle}
                className="px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border bg-[#9D4EDD] text-white border-[#9D4EDD] shadow-md shadow-[#9D4EDD]/30"
                title="Góc làm việc Giáo Viên"
              >
                <Sparkles size={13} />
                <span>Góc GV</span>
              </button>
            ) : null}

            {/* Streak badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1E2D40] border border-[#2D3F56] text-[#FFD166] text-xs font-bold">
              <Flame size={14} className="animate-pulse" />
              <span>{currentUser?.streakDays || 1}d</span>
            </div>

            {/* Theme Customizer Toggle */}
            {onRequestThemeModal && (
              <button
                onClick={onRequestThemeModal}
                className="px-2.5 py-1 rounded-xl bg-[#1E2D40] hover:bg-[#27384E] text-[#FFD166] hover:text-white border border-[#FFD166]/40 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:border-[#FFD166]/80"
                title="Đổi giao diện & hình nền học tập"
              >
                <Palette size={15} className="text-[#FFD166]" />
                <span className="text-[11px] sm:text-xs font-extrabold">Giao Diện</span>
              </button>
            )}

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-[#1E2D40] hover:bg-[#27384E] text-[#778DA9] hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Logout button */}
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-xl bg-[#1E2D40] hover:bg-[#EF476F]/20 text-[#778DA9] hover:text-[#EF476F] transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1B263B]/95 backdrop-blur-lg border-t border-[#27384E] px-2 py-1.5 shadow-2xl">
        <div className={`grid ${navItems.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} gap-1`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#00E5FF] font-bold scale-105'
                    : 'text-[#778DA9] hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
