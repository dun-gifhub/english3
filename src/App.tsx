import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { TeacherPasscodeModal } from './components/TeacherPasscodeModal';
import { NeonRenderModal } from './components/NeonRenderModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { HomeScreen } from './screens/HomeScreen';
import { TapGameScreen } from './screens/TapGameScreen';
import { TeacherPortalScreen } from './screens/TeacherPortalScreen';
import { AssignmentQuizScreen } from './screens/AssignmentQuizScreen';
import { DictionaryScreen } from './screens/DictionaryScreen';
import { FriendsScreen } from './screens/FriendsScreen';
import { CallRoomScreen } from './screens/CallRoomScreen';
import { LeaderboardScreen } from './screens/LeaderboardScreen';
import { AuthScreen } from './screens/AuthScreen';
import { UnitTopic, TeacherAssignment } from './types';
import { getEffectiveTheme } from './services/themeService';

function MainApp() {
  const { currentUser, setRole, addXpAndScore, setCurrentActivity, themeConfig } = useApp();

  const isTeacherOrAdmin = currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<string>(() => (isTeacherOrAdmin ? 'teacher' : 'home'));
  const [activeUnitToPlay, setActiveUnitToPlay] = useState<UnitTopic | null>(null);
  const [activeAssignmentToTake, setActiveAssignmentToTake] = useState<TeacherAssignment | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState<boolean>(false);
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  const effectiveTheme = getEffectiveTheme(themeConfig);
  const showCustomBg = Boolean(
    themeConfig?.customBgImage && !(activeAssignmentToTake && themeConfig?.examFocusMode)
  );

  // If role changes or is teacher/admin, ensure they are on teacher portal rather than student home
  React.useEffect(() => {
    if (isTeacherOrAdmin && activeTab === 'home') {
      setActiveTab('teacher');
    }
  }, [isTeacherOrAdmin, activeTab]);

  // Sync activity with tab changes
  React.useEffect(() => {
    if (!currentUser) return;
    if (activeUnitToPlay) {
      setCurrentActivity(`Đang đấu từ: ${activeUnitToPlay.title} (Lớp ${activeUnitToPlay.grade})`);
    } else if (activeAssignmentToTake) {
      setCurrentActivity(`Đang làm bài: ${activeAssignmentToTake.title} (K${activeAssignmentToTake.grade})`);
    } else if (activeTab === 'dict') {
      setCurrentActivity('Đang tra cứu từ điển Anh - Việt');
    } else if (activeTab === 'friends') {
      setCurrentActivity('Đang kết nối danh sách bạn bè');
    } else if (activeTab === 'callRoom') {
      setCurrentActivity('Đang ở phòng học nhóm trực tuyến');
    } else if (activeTab === 'leaderboard') {
      setCurrentActivity('Đang xem Bảng Vàng vinh danh');
    } else if (activeTab === 'teacher') {
      setCurrentActivity(
        currentUser.role === 'ADMIN'
          ? 'Quản trị hệ thống & Giám sát online'
          : 'Góc Giáo viên (Soạn đề & Quản lý)'
      );
    } else {
      setCurrentActivity('Đang ôn luyện tiếng Anh');
    }
  }, [activeTab, activeUnitToPlay, activeAssignmentToTake, currentUser]);

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div
      className="min-h-screen flex flex-col app-theme-root relative selection:bg-[#00E5FF]/20 selection:text-[#00E5FF] transition-colors duration-300"
      style={{
        backgroundColor: effectiveTheme.colors.bgBase,
        color: effectiveTheme.colors.textMain
      }}
    >
      {/* Background Image Layer with Blur & Opacity */}
      {showCustomBg && (
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-500"
          style={{
            backgroundImage: `url("${themeConfig?.customBgImage}")`,
            opacity: (themeConfig?.bgOpacity ?? 100) / 100,
            filter: `blur(${themeConfig?.bgBlur ?? 0}px)`
          }}
        />
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Active game subscreen */}
        {activeUnitToPlay ? (
          <TapGameScreen
            unit={activeUnitToPlay}
            onGameOver={(_score, xpEarned) => {
              addXpAndScore(xpEarned);
            }}
            onBack={() => {
              setActiveUnitToPlay(null);
              setCurrentActivity('Đang ôn luyện tiếng Anh');
            }}
          />
        ) : activeAssignmentToTake ? (
          /* Active quiz subscreen */
          <AssignmentQuizScreen
            assignment={activeAssignmentToTake}
            onFinish={(xpEarned) => {
              addXpAndScore(xpEarned);
            }}
            onBack={() => {
              setActiveAssignmentToTake(null);
              setCurrentActivity('Đang ôn luyện tiếng Anh');
            }}
          />
        ) : (
          <>
            <Navbar
              currentTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
              }}
              onRequestTeacherModal={() => setShowTeacherModal(true)}
              onRequestThemeModal={() => setShowThemeModal(true)}
            />

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-4 sm:pt-6">
              {activeTab === 'home' && !isTeacherOrAdmin && (
                <HomeScreen
                  onPlayUnit={(unit) => {
                    setActiveUnitToPlay(unit);
                    setCurrentActivity(`Đang đấu từ: ${unit.title} (Lớp ${unit.grade})`);
                  }}
                  onTakeAssignment={(assign) => {
                    setActiveAssignmentToTake(assign);
                    setCurrentActivity(`Đang làm bài: ${assign.title} (K${assign.grade})`);
                  }}
                  onOpenTeacherPortal={() => setActiveTab('teacher')}
                  onRequestThemeModal={() => setShowThemeModal(true)}
                />
              )}

              {activeTab === 'home' && isTeacherOrAdmin && <TeacherPortalScreen />}

              {activeTab === 'dict' && <DictionaryScreen />}

              {activeTab === 'teacher' && (currentUser.role === 'TEACHER' || currentUser.role === 'ADMIN') && (
                <TeacherPortalScreen />
              )}

              {activeTab === 'friends' && (
                <FriendsScreen
                  onOpenCallRoom={() => setActiveTab('callRoom')}
                />
              )}

              {activeTab === 'callRoom' && (
                <CallRoomScreen
                  onLeave={() => setActiveTab('friends')}
                />
              )}

              {activeTab === 'leaderboard' && <LeaderboardScreen />}
            </main>
          </>
        )}

        {/* Teacher Passcode Modal */}
        <TeacherPasscodeModal
          isOpen={showTeacherModal}
          onClose={() => setShowTeacherModal(false)}
          onSuccess={() => {
            setRole('TEACHER');
            setShowTeacherModal(false);
            setActiveTab('teacher');
          }}
        />

        {/* Theme & Wallpaper Customizer Modal for Students & Teachers */}
        <ThemeCustomizerModal
          isOpen={showThemeModal}
          onClose={() => setShowThemeModal(false)}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
