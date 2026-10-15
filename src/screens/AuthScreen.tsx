import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { loginWithGoogle } from '../services/firebase';
import { apiService } from '../services/apiService';
import {
  User,
  School,
  CheckCircle,
  LogIn,
  AlertCircle,
  KeyRound,
  GraduationCap,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Clock,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '../types';

export const AuthScreen: React.FC = () => {
  const { registerOrUpdateAccount, setCurrentUser, adminSettings } = useApp();

  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN' | 'ADMIN'>('REGISTER');
  const [role, setRole] = useState<UserRole>('STUDENT');
  
  // Registration form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [className, setClassName] = useState('');
  const [baseGrade, setBaseGrade] = useState(10);
  const [academicYear, setAcademicYear] = useState(2026);
  const [department, setDepartment] = useState('');

  // Teacher pending approval modal state
  const [teacherPendingInfo, setTeacherPendingInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  // Login form state (Always empty by default)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Admin login form state (Always empty by default)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // 1. Validate Full Name
    if (!regName.trim()) {
      setError('Vui lòng nhập Họ và tên thật của bạn!');
      return;
    }

    // 2. Validate Gmail requirement
    const cleanEmail = regEmail.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!cleanEmail || !gmailRegex.test(cleanEmail)) {
      setError('Đăng ký bắt buộc phải sử dụng tài khoản Gmail hợp lệ (kết thúc bằng @gmail.com, ví dụ: tenban@gmail.com)!');
      return;
    }

    // 3. Validate Password requirement: min 6 chars
    if (!regPassword || regPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự để bảo vệ tài khoản của bạn!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Register via server/database
      const result = await apiService.registerUser({
        name: regName.trim(),
        email: cleanEmail,
        password: regPassword.trim(),
        customClassName: role === 'TEACHER' ? department.trim() : className.trim(),
        baseGrade,
        registeredAcademicYear: academicYear,
        role,
        pin: regPassword.trim()
      });

      if (result && result.pendingApproval) {
        // Teacher registration completed - awaiting Admin approval
        setTeacherPendingInfo({
          name: regName.trim(),
          email: cleanEmail
        });
        setSuccessMsg(result.message || 'Đăng ký tài khoản Giáo viên thành công! Tài khoản đang chờ Admin phê duyệt.');
      } else if (result && result.user) {
        // Student registration - immediately log in
        setCurrentUser(result.user);
      } else {
        // Local fallback creation if backend is offline
        if (role === 'TEACHER') {
          setTeacherPendingInfo({
            name: regName.trim(),
            email: cleanEmail
          });
          setSuccessMsg('Đăng ký tài khoản Giáo viên thành công! Đang chờ Admin phê duyệt.');
        } else {
          registerOrUpdateAccount(
            regName.trim(),
            className.trim(),
            baseGrade,
            academicYear,
            role
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo tài khoản. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      setError('Vui lòng nhập Gmail, Tên tài khoản hoặc Mã bạn bè!');
      return;
    }
    if (!loginPassword.trim()) {
      setError('Vui lòng nhập Mật khẩu tài khoản!');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const cleanId = loginIdentifier.trim();
      const cleanPass = loginPassword.trim();

      // Check admin credentials if entered in normal login
      if (
        (cleanId.toLowerCase() === (adminSettings?.adminEmail || 'dungdaumoi223@gmail.com').toLowerCase() ||
          cleanId.toLowerCase() === 'admin') &&
        cleanPass === (adminSettings?.adminPassword || '2232010Dung@')
      ) {
        const adminUser = await apiService.adminLogin(cleanId, cleanPass);
        if (adminUser) {
          setCurrentUser(adminUser);
          return;
        }
      }

      // Attempt login via API / Neon
      const loggedIn = await apiService.loginUser(cleanId, cleanPass);
      if (loggedIn) {
        setCurrentUser(loggedIn);
        return;
      }

      // Check local storage accounts
      const savedUserStr = localStorage.getItem('tap_hunter_user_profile_v2');
      if (savedUserStr) {
        const saved = JSON.parse(savedUserStr);
        if (
          saved.email?.toLowerCase() === cleanId.toLowerCase() ||
          saved.displayName?.toLowerCase() === cleanId.toLowerCase() ||
          saved.friendCode?.toLowerCase() === cleanId.toLowerCase()
        ) {
          if (saved.role === 'TEACHER' && saved.approvalStatus === 'PENDING') {
            setError('Tài khoản Giáo viên đang chờ Admin phê duyệt! Vui lòng liên hệ Admin (dungdaumoi223@gmail.com).');
            return;
          }
          setCurrentUser(saved);
          return;
        }
      }

      setError('Không tìm thấy tài khoản tương ứng hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại Gmail/mật khẩu hoặc chuyển sang tab Đăng Ký.');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setError('Vui lòng nhập đầy đủ Gmail và Mật khẩu Admin!');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const adminUser = await apiService.adminLogin(adminEmail.trim(), adminPassword.trim());
      if (adminUser) {
        setCurrentUser(adminUser);
      } else {
        setError('Gmail hoặc Mật khẩu Quản trị viên không chính xác!');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập Quản trị viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await loginWithGoogle();
      if (res) {
        registerOrUpdateAccount(res.displayName, '10A1', 10, 2026, 'STUDENT');
      }
    } catch (err: unknown) {
      console.warn('Google Sign-In failed:', err);
      setError('Đăng nhập Google thất bại hoặc cửa sổ bị đóng. Bạn hãy sử dụng biểu mẫu Đăng Ký bằng Gmail bên trên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-b from-[#0D1B2A] via-[#0F2B1D]/40 to-[#0D1B2A]">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#1E2D40] border border-[#2E7D32]/50 shadow-2xl shadow-[#2E7D32]/10 space-y-6">
        {/* School Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-full bg-white p-1 border-2 border-[#FFD166] shadow-xl flex items-center justify-center overflow-hidden">
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
            <span className="text-xs font-black uppercase tracking-widest text-[#FFD166] block">
              TRƯỜNG THPT LƯƠNG PHÚ
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Tap Hunter English
            </h1>
            <p className="text-xs text-[#778DA9]">
              Cơ sở dữ liệu đám mây Neon PostgreSQL & Render Cloud
            </p>
          </div>
        </div>

        {/* Tab Switcher: Đăng Ký vs Đăng Nhập vs Admin */}
        <div className="flex p-1 rounded-2xl bg-[#131F2E] border border-[#27384E] gap-1">
          <button
            onClick={() => {
              setAuthMode('REGISTER');
              setError(null);
              setSuccessMsg(null);
              setTeacherPendingInfo(null);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === 'REGISTER'
                ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
                : 'text-[#ADB5BD] hover:text-white'
            }`}
          >
            Đăng Ký
          </button>
          <button
            onClick={() => {
              setAuthMode('LOGIN');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              authMode === 'LOGIN'
                ? 'bg-[#00E5FF] text-[#0D1B2A] shadow-md shadow-[#00E5FF]/20'
                : 'text-[#ADB5BD] hover:text-white'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => {
              setAuthMode('ADMIN');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              authMode === 'ADMIN'
                ? 'bg-[#EF476F] text-white shadow-md shadow-[#EF476F]/25'
                : 'text-[#EF476F] hover:bg-[#EF476F]/10'
            }`}
          >
            <Shield size={13} />
            <span>Admin</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#EF476F]/15 border border-[#EF476F]/40 text-xs text-[#EF476F] flex items-center gap-2.5 leading-relaxed">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && !teacherPendingInfo && (
          <div className="p-3.5 rounded-2xl bg-[#06D6A0]/15 border border-[#06D6A0]/40 text-xs text-[#06D6A0] flex items-center gap-2.5">
            <CheckCircle size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TEACHER PENDING APPROVAL MODAL / NOTICE */}
        {teacherPendingInfo && (
          <div className="p-5 rounded-3xl bg-linear-to-b from-[#24132B] to-[#1B263B] border border-[#9D4EDD]/60 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#9D4EDD]/20 text-[#9D4EDD] border border-[#9D4EDD]/40 flex items-center justify-center shrink-0 shadow-lg shadow-[#9D4EDD]/20">
                <Clock size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD166] block">
                  ĐĂNG KÝ THÀNH CÔNG
                </span>
                <h3 className="text-base font-extrabold text-white">
                  Đang Chờ Admin Phê Duyệt
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E] space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#ADB5BD]">
                <span>Giáo viên:</span>
                <span className="font-bold text-white">{teacherPendingInfo.name}</span>
              </div>
              <div className="flex justify-between items-center text-[#ADB5BD]">
                <span>Gmail đăng ký:</span>
                <span className="font-mono text-[#00E5FF] font-semibold">{teacherPendingInfo.email}</span>
              </div>
              <div className="flex justify-between items-center text-[#ADB5BD]">
                <span>Trạng thái:</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FFD166]/20 text-[#FFD166] font-bold text-[11px]">
                  Chờ Admin Duyệt
                </span>
              </div>
            </div>

            <p className="text-xs text-[#ADB5BD] leading-relaxed">
              Theo quy định, tài khoản Giáo viên cần được Quản trị viên hệ thống (<span className="text-[#EF476F] font-semibold">dungdaumoi223@gmail.com</span>) xác minh và phê duyệt. Sau khi Admin duyệt, bạn có thể đăng nhập để truy cập Cổng Giáo Viên.
            </p>

            <button
              type="button"
              onClick={() => {
                setLoginIdentifier(teacherPendingInfo.email);
                setTeacherPendingInfo(null);
                setAuthMode('LOGIN');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#9D4EDD] hover:bg-[#a855f7] text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#9D4EDD]/25"
            >
              <span>Chuyển Sang Màn Hình Đăng Nhập</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {authMode === 'REGISTER' && !teacherPendingInfo && (
          /* REGISTRATION FORM WITH GMAIL & MIN 6 CHAR PASSWORD */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1.5">
                Chọn vai trò đăng ký *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'STUDENT'
                      ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                      : 'bg-[#131F2E] border-[#27384E] text-[#778DA9] hover:text-white'
                  }`}
                >
                  <User size={14} />
                  <span>Học Sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    role === 'TEACHER'
                      ? 'bg-[#9D4EDD]/20 border-[#9D4EDD] text-[#9D4EDD]'
                      : 'bg-[#131F2E] border-[#27384E] text-[#778DA9] hover:text-white'
                  }`}
                >
                  <GraduationCap size={14} />
                  <span>Giáo Viên</span>
                </button>
              </div>
            </div>

            {/* Teacher approval notice banner */}
            {role === 'TEACHER' && (
              <div className="p-3 rounded-2xl bg-[#9D4EDD]/15 border border-[#9D4EDD]/40 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#9D4EDD]">
                  <Clock size={14} />
                  <span>Yêu cầu phê duyệt từ Admin</span>
                </div>
                <p className="text-[11px] text-[#ADB5BD]">
                  Tài khoản Giáo viên sẽ ở trạng thái chờ duyệt. Quản trị viên (Admin) sẽ kích hoạt tài khoản của thầy/cô trước khi có thể đăng nhập.
                </p>
              </div>
            )}

            {/* Họ và tên */}
            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                {role === 'TEACHER' ? 'Họ và tên Giáo viên *' : 'Họ và tên Học sinh *'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00E5FF]" size={16} />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => {
                    setRegName(e.target.value);
                    setError(null);
                  }}
                  placeholder={role === 'TEACHER' ? 'Thầy/Cô Nguyễn Văn A' : 'Ví dụ: Nguyễn Minh Đức'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>
            </div>

            {/* Gmail (Mandatory for all) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#778DA9]">
                  Địa chỉ Gmail * (Bắt buộc đuôi @gmail.com)
                </label>
                <span className="text-[10px] text-[#00E5FF] font-semibold">Tất cả tài khoản</span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00E5FF]" size={16} />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => {
                    setRegEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="tenban@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>
              <p className="text-[10px] text-[#778DA9] mt-1">
                Hệ thống yêu cầu xác thực bằng địa chỉ Gmail hợp lệ (VD: ducthptlp@gmail.com).
              </p>
            </div>

            {/* Mật khẩu (Ít nhất 6 ký tự) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#778DA9]">
                  Mật khẩu bảo vệ * (Ít nhất 6 ký tự)
                </label>
                <span className={`text-[10px] font-bold ${regPassword.length >= 6 ? 'text-[#06D6A0]' : 'text-[#EF476F]'}`}>
                  {regPassword.length}/6 ký tự
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#06D6A0]" size={16} />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Nhập ít nhất 6 ký tự"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#06D6A0]"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778DA9] hover:text-white"
                >
                  {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Student specific: Class and Grade */}
            {role === 'STUDENT' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                    Tên Lớp (VD: 10A1)
                  </label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FFD166]" size={16} />
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="10A1"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#FFD166]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                    Khối Lớp
                  </label>
                  <select
                    value={baseGrade}
                    onChange={(e) => setBaseGrade(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#00E5FF]"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Teacher specific: Department */}
            {role === 'TEACHER' && (
              <div>
                <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                  Tổ chuyên môn / Bộ môn
                </label>
                <div className="relative">
                  <School className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9D4EDD]" size={16} />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Tổ Ngoại Ngữ"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#9D4EDD]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 ${
                role === 'TEACHER'
                  ? 'bg-[#9D4EDD] hover:bg-[#a855f7] shadow-[#9D4EDD]/25'
                  : 'bg-[#2E7D32] hover:bg-[#388e3c] shadow-[#2E7D32]/25'
              }`}
            >
              <CheckCircle size={18} />
              <span>
                {isSubmitting
                  ? 'Đang gửi đăng ký...'
                  : role === 'TEACHER'
                  ? 'Đăng Ký Tài Khoản Giáo Viên (Chờ Duyệt)'
                  : 'Tạo Tài Khoản Học Sinh & Bắt Đầu'}
              </span>
            </button>
          </form>
        )}

        {authMode === 'LOGIN' && (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                Gmail hoặc Mã Bạn Bè / Tên tài khoản *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00E5FF]" size={16} />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Nhập Gmail (VD: tenban@gmail.com)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#00E5FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                Mật khẩu tài khoản *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#06D6A0]" size={16} />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#06D6A0]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778DA9] hover:text-white"
                >
                  {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#00E5FF] hover:bg-[#38bdf8] text-[#0D1B2A] font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00E5FF]/20 disabled:opacity-50"
            >
              <LogIn size={18} />
              <span>{isSubmitting ? 'Đang kiểm tra...' : 'Đăng Nhập'}</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27384E]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1E2D40] px-3 text-[#778DA9]">hoặc</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#131F2E] hover:bg-[#27384E] text-white font-bold text-xs transition-all border border-[#27384E] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>Đăng Nhập Nhanh Bằng Google</span>
            </button>
          </form>
        )}

        {authMode === 'ADMIN' && (
          /* ADMIN LOGIN FORM */
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#EF476F]/10 border border-[#EF476F]/30 space-y-1">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#EF476F]">
                <Shield size={16} />
                <span>Cổng Quản Trị Hệ Thống (Admin Portal)</span>
              </div>
              <p className="text-[11px] text-[#ADB5BD]">
                Dành cho Quản trị viên duyệt tài khoản giáo viên, tùy chỉnh mã GV, và theo dõi học sinh đang online.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                Gmail Quản Trị Viên *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EF476F]" size={16} />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Nhập Gmail Quản trị viên..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#EF476F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#778DA9] mb-1">
                Mật Khẩu Quản Trị Viên *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EF476F]" size={16} />
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Nhập mật khẩu Quản trị viên..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-xs sm:text-sm focus:outline-hidden focus:border-[#EF476F]"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778DA9] hover:text-white"
                >
                  {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-[#EF476F] to-[#E63946] hover:from-[#f05a7e] hover:to-[#eb4d5a] text-white font-extrabold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#EF476F]/25 disabled:opacity-50"
            >
              <Shield size={18} />
              <span>{isSubmitting ? 'Đang xác thực Admin...' : 'Đăng Nhập Quản Trị Viên'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
