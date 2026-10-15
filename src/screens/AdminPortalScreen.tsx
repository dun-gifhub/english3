import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { apiService } from '../services/apiService';
import { OnlineUser, UserProfile } from '../types';
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Users,
  Activity,
  UserCheck,
  RefreshCw,
  Search,
  GraduationCap,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminPortalScreenProps {
  onSwitchToStudentRole: () => void;
  onSwitchToTeacherRole: () => void;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({
  onSwitchToStudentRole,
  onSwitchToTeacherRole
}) => {
  const { currentUser, onlineUsers, onlineCount, refreshOnlineUsers } = useApp();

  const [activeTab, setActiveTab] = useState<'settings' | 'online' | 'users'>('settings');

  // Admin Settings State
  const [adminEmail, setAdminEmail] = useState('dungdaumoi223@gmail.com');
  const [adminPassword, setAdminPassword] = useState('2232010Dung@');
  const [teacherPasscode, setTeacherPasscode] = useState('LP2026');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // All Users State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Online filter
  const [onlineRoleFilter, setOnlineRoleFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');

  // Load Settings on Mount
  useEffect(() => {
    setIsLoadingSettings(true);
    apiService.getAdminSettings()
      .then((settings) => {
        if (settings) {
          setAdminEmail(settings.adminEmail || 'dungdaumoi223@gmail.com');
          setAdminPassword(settings.adminPassword || '2232010Dung@');
          setTeacherPasscode(settings.teacherPasscode || 'LP2026');
        }
      })
      .finally(() => setIsLoadingSettings(false));
  }, []);

  // Load All Users
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await apiService.getAdminUsers();
      setAllUsers(list);
    } catch {}
    setIsLoadingUsers(false);
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim() || !teacherPasscode.trim()) {
      setSettingsError('Vui lòng không để trống bất kỳ trường nào!');
      return;
    }

    setSettingsError(null);
    setSettingsSuccess(null);
    setIsLoadingSettings(true);

    try {
      const res = await apiService.updateAdminSettings({
        adminEmail: adminEmail.trim(),
        adminPassword: adminPassword.trim(),
        teacherPasscode: teacherPasscode.trim()
      });

      if (res.success) {
        setSettingsSuccess('Đã cập nhật cấu hình Admin & Mã Giáo Viên thành công!');
        setTimeout(() => setSettingsSuccess(null), 4000);
      } else {
        setSettingsError(res.error || 'Cập nhật thất bại. Vui lòng thử lại!');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Filtered Online Users
  const filteredOnlineUsers = onlineUsers.filter((u) => {
    if (onlineRoleFilter === 'ALL') return true;
    return u.role === onlineRoleFilter;
  });

  // Filtered All Users
  const filteredAllUsers = allUsers.filter((u) => {
    const q = userSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.friendCode?.toLowerCase().includes(q) ||
      u.customClassName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-linear-to-r from-[#1E2D40] via-[#2F1E38] to-[#1E2D40] border border-[#EF476F]/40 shadow-xl flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EF476F]/20 text-[#EF476F] flex items-center justify-center shrink-0 border border-[#EF476F]/30">
            <Shield size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#EF476F]">
                Cổng Quản Trị Hệ Thống (Master Admin)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF476F]/20 text-[#EF476F]">
                Toàn Quyền Cấu Hình & Giám Sát
              </span>
            </div>
            <h2 className="text-lg font-black text-white">
              {currentUser?.displayName || 'Ban Quản Trị Tap Hunter'}
            </h2>
            <p className="text-xs text-[#778DA9]">
              Quản lý mã giáo viên, tài khoản admin, theo dõi trực tuyến và danh sách tài khoản
            </p>
          </div>
        </div>

        {/* Quick Role switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSwitchToTeacherRole}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#9D4EDD] bg-[#131F2E] hover:bg-[#27384E] border border-[#9D4EDD]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <GraduationCap size={14} />
            <span>Góc Giáo Viên</span>
          </button>
          <button
            onClick={onSwitchToStudentRole}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#00E5FF] bg-[#131F2E] hover:bg-[#27384E] border border-[#00E5FF]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>Góc Học Sinh</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl bg-[#131F2E] border border-[#27384E] max-w-xl">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#EF476F] text-white shadow-md shadow-[#EF476F]/20'
              : 'text-[#ADB5BD] hover:text-white'
          }`}
        >
          <KeyRound size={14} />
          <span>Cấu Hình Admin & Mã GV</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('online');
            refreshOnlineUsers();
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'online'
              ? 'bg-[#06D6A0] text-[#0D1B2A] shadow-md shadow-[#06D6A0]/20 font-black'
              : 'text-[#06D6A0] hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#06D6A0] animate-pulse" />
          <span>Đang Online ({onlineCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
              : 'text-[#ADB5BD] hover:text-white'
          }`}
        >
          <Users size={14} />
          <span>Tất Cả Tài Khoản</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: CẤU HÌNH ADMIN & MÃ GIÁO VIÊN                         */}
      {/* ============================================================ */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Mã Giáo Viên */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1E2D40] border border-[#9D4EDD]/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#9D4EDD]/20 text-[#9D4EDD]">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Mã Xác Thực Giáo Viên</h3>
                <p className="text-xs text-[#778DA9]">
                  Giáo viên cần nhập mã này khi đăng ký hoặc khi vào Góc GV
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-1 text-xs">
              <div className="flex items-center justify-between text-[#778DA9]">
                <span>Mã hiện tại đang áp dụng:</span>
                <span className="font-mono font-bold text-[#FFD166] text-sm bg-[#1B263B] px-2.5 py-0.5 rounded-lg border border-[#FFD166]/30">
                  {teacherPasscode}
                </span>
              </div>
              <p className="text-[11px] text-[#778DA9]">
                Bạn có thể thay đổi bất cứ lúc nào. Hệ thống sẽ áp dụng ngay lập tức cho toàn bộ học sinh và giáo viên.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1.5">
                Nhập mã giáo viên mới
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={teacherPasscode}
                  onChange={(e) => setTeacherPasscode(e.target.value)}
                  placeholder="Ví dụ: LP2026, giaovien2026..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-[#131F2E] border border-[#9D4EDD]/50 text-white font-mono focus:outline-hidden focus:border-[#9D4EDD] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#778DA9] hover:text-white"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Tài khoản Admin */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#1E2D40] border border-[#EF476F]/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#EF476F]/20 text-[#EF476F]">
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Tài Khoản & Mật Khẩu Admin</h3>
                <p className="text-xs text-[#778DA9]">
                  Tùy chỉnh Gmail và Mật khẩu đăng nhập của Quản trị viên
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                  Gmail Quản Trị Viên (Admin)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EF476F]" size={16} />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="dungdaumoi223@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-hidden focus:border-[#EF476F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                  Mật Khẩu Quản Trị Viên (Admin)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EF476F]" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="2232010Dung@"
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-hidden focus:border-[#EF476F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#778DA9] hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button for Settings */}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#131F2E] border border-[#27384E]">
            <div>
              {settingsSuccess && (
                <div className="flex items-center gap-2 text-xs text-[#06D6A0] font-bold">
                  <CheckCircle size={16} />
                  <span>{settingsSuccess}</span>
                </div>
              )}
              {settingsError && (
                <div className="flex items-center gap-2 text-xs text-[#EF476F] font-bold">
                  <AlertCircle size={16} />
                  <span>{settingsError}</span>
                </div>
              )}
              {!settingsSuccess && !settingsError && (
                <span className="text-xs text-[#778DA9]">
                  Bấm nút bên phải để lưu lại mọi thay đổi cấu hình vào hệ thống
                </span>
              )}
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isLoadingSettings}
              className="py-2.5 px-6 rounded-xl text-xs font-extrabold text-white bg-linear-to-r from-[#EF476F] to-[#E63946] hover:from-[#f05a7e] hover:to-[#eb4d5a] shadow-lg shadow-[#EF476F]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save size={16} />
              <span>{isLoadingSettings ? 'Đang lưu...' : 'Lưu Tất Cả Cấu Hình'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: GIÁM SÁT TRỰC TUYẾN (REAL-TIME ONLINE)                */}
      {/* ============================================================ */}
      {activeTab === 'online' && (
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06D6A0] animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                Danh Sách Người Dùng Đang Hoạt Động ({filteredOnlineUsers.length}/{onlineCount})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Role Filter */}
              <div className="flex p-0.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs">
                <button
                  onClick={() => setOnlineRoleFilter('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    onlineRoleFilter === 'ALL'
                      ? 'bg-[#06D6A0] text-[#0D1B2A]'
                      : 'text-[#ADB5BD] hover:text-white'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setOnlineRoleFilter('STUDENT')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    onlineRoleFilter === 'STUDENT'
                      ? 'bg-[#00E5FF] text-[#0D1B2A]'
                      : 'text-[#ADB5BD] hover:text-white'
                  }`}
                >
                  Học Sinh
                </button>
                <button
                  onClick={() => setOnlineRoleFilter('TEACHER')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    onlineRoleFilter === 'TEACHER'
                      ? 'bg-[#9D4EDD] text-white'
                      : 'text-[#ADB5BD] hover:text-white'
                  }`}
                >
                  Giáo Viên
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => refreshOnlineUsers()}
                className="p-2 rounded-xl bg-[#1E2D40] hover:bg-[#27384E] border border-[#27384E] text-[#00E5FF] transition-all cursor-pointer"
                title="Làm mới trạng thái online"
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </div>

          {/* Online Users List */}
          {filteredOnlineUsers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#1E2D40] border border-[#27384E] text-center space-y-2">
              <Users className="mx-auto text-[#778DA9]" size={32} />
              <p className="text-sm font-bold text-white">Chưa có người dùng nào trực tuyến</p>
              <p className="text-xs text-[#778DA9]">
                Khi học sinh hoặc giáo viên mở app và thao tác, hệ thống sẽ tự động hiển thị tại đây theo thời gian thực.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredOnlineUsers.map((u) => {
                const isMe = u.uid === currentUser?.uid;
                const isTeacher = u.role === 'TEACHER';
                const isAdmin = u.role === 'ADMIN';

                return (
                  <div
                    key={u.uid}
                    className="p-4 rounded-2xl bg-[#1E2D40] border border-[#27384E] hover:border-[#06D6A0]/40 transition-all space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-[#0D1B2A] border-2 border-[#06D6A0] shrink-0"
                          style={{ backgroundColor: u.avatarColor || '#00E5FF' }}
                        >
                          {u.displayName?.charAt(0).toUpperCase() || 'H'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[120px]">
                              {u.displayName}
                            </span>
                            {isMe && (
                              <span className="text-[9px] font-extrabold px-1 rounded bg-[#00E5FF]/20 text-[#00E5FF]">
                                BẠN
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#778DA9]">
                            {isAdmin
                              ? 'Ban Quản Trị'
                              : isTeacher
                              ? 'Giáo viên THPT'
                              : `${u.customClassName || 'Lớp 10'} • Khối ${u.grade || 10}`}
                          </span>
                        </div>
                      </div>

                      {/* Online Status Pill */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06D6A0]/20 text-[#06D6A0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0] animate-ping" />
                        Online
                      </span>
                    </div>

                    <div className="pt-1 border-t border-[#27384E]/50 flex items-center justify-between text-[11px]">
                      <span className="text-[#ADB5BD] flex items-center gap-1">
                        <Activity size={12} className="text-[#00E5FF]" />
                        <span>{u.currentActivity || 'Đang hoạt động'}</span>
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#131F2E] text-[#FFD166]">
                        {isAdmin ? 'Admin' : isTeacher ? 'Giáo Viên' : 'Học Sinh'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: TẤT CẢ TÀI KHOẢN (USER DATABASE)                       */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778DA9]" size={16} />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Tìm học sinh theo tên, lớp, mã bạn bè..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#131F2E] border border-[#27384E] text-white focus:outline-hidden focus:border-[#00E5FF]"
              />
            </div>

            <button
              onClick={loadUsers}
              disabled={isLoadingUsers}
              className="py-2 px-3.5 rounded-xl bg-[#1E2D40] hover:bg-[#27384E] text-xs font-bold text-[#00E5FF] border border-[#27384E] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} className={isLoadingUsers ? 'animate-spin' : ''} />
              <span>Làm mới danh sách</span>
            </button>
          </div>

          {filteredAllUsers.length === 0 ? (
            <div className="p-8 rounded-3xl bg-[#1E2D40] border border-[#27384E] text-center space-y-2">
              <p className="text-sm font-bold text-white">Không tìm thấy tài khoản nào</p>
              <p className="text-xs text-[#778DA9]">
                {userSearchQuery ? 'Thử tìm với từ khóa khác.' : 'Chưa có tài khoản nào được đăng ký trong hệ thống.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1E2D40] border border-[#27384E] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#131F2E] text-[#778DA9] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Tài Khoản</th>
                      <th className="py-3 px-4">Vai Trò</th>
                      <th className="py-3 px-4">Lớp / Khối</th>
                      <th className="py-3 px-4">Mã Bạn Bè</th>
                      <th className="py-3 px-4">Điểm / Cấp Độ</th>
                      <th className="py-3 px-4">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27384E]">
                    {filteredAllUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-[#27384E]/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0D1B2A] shrink-0"
                              style={{ backgroundColor: u.avatarColor || '#00E5FF' }}
                            >
                              {u.displayName?.charAt(0).toUpperCase() || 'H'}
                            </div>
                            <div>
                              <span className="font-bold text-white block">{u.displayName}</span>
                              <span className="text-[10px] text-[#778DA9]">{u.email || u.uid}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-[#EF476F]/20 text-[#EF476F]'
                                : u.role === 'TEACHER'
                                ? 'bg-[#9D4EDD]/20 text-[#9D4EDD]'
                                : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                            }`}
                          >
                            {u.role === 'ADMIN' ? 'Quản Trị' : u.role === 'TEACHER' ? 'Giáo Viên' : 'Học Sinh'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#ADB5BD]">
                          {u.customClassName || `Lớp ${u.baseGrade || 10}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#FFD166]">
                          {u.friendCode}
                        </td>
                        <td className="py-3 px-4 text-white">
                          Lv.{u.level || 1} • <span className="text-[#06D6A0] font-bold">{u.highestScore || 0}đ</span>
                        </td>
                        <td className="py-3 px-4">
                          {u.isOnline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06D6A0]/20 text-[#06D6A0]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#06D6A0] animate-ping" />
                              Online
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#778DA9]">Ngoại tuyến</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
