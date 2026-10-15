import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { pool, initDatabase, getDatabaseStatus } from './src/server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// In-memory fallback stores if Neon is not yet connected via DATABASE_URL
const memUsers: Map<string, any> = new Map();
const memAssignments: Map<string, any> = new Map();
const memWords: Map<string, any> = new Map();
const memGrammar: Map<string, any> = new Map();
const memClasses: Map<string, any> = new Map();
const memClassMembers: Map<string, any> = new Map();
const memCurriculumUnits: Map<string, any> = new Map();
const memCurriculumLessons: Map<string, any> = new Map();
const memSubmissions: Map<string, any> = new Map();
const memQuestionBank: Map<string, any> = new Map();
const memUserThemes: Map<string, any> = new Map();

// Seed initial default classes, units and bank items
function seedInitialEdTechData() {
  if (memClasses.size === 0) {
    const c1 = {
      id: 'class_10a1',
      name: 'Lớp 10A1 - Anh Văn Chuyên Sâu',
      grade: 10,
      subject: 'Tiếng Anh',
      room: 'Phòng 204 - Dãy A',
      joinCode: 'LP10A1',
      teacherUid: 'teacher_master_01',
      teacherName: 'Thầy Nguyễn Văn Dũng',
      description: 'Lớp bồi dưỡng tiếng Anh giao tiếp và chuẩn bị nền tảng THPT Quốc Gia.',
      studentCount: 38,
      createdAt: new Date().toISOString()
    };
    const c2 = {
      id: 'class_11a2',
      name: 'Lớp 11A2 - Luyện Thi Chuyên Ngữ',
      grade: 11,
      subject: 'Tiếng Anh',
      room: 'Phòng 301 - Dãy B',
      joinCode: 'LP11A2',
      teacherUid: 'teacher_master_01',
      teacherName: 'Cô Trần Mai Hương',
      description: 'Luyện đề trắc nghiệm chuyên sâu, từ vựng học thuật B1-B2.',
      studentCount: 35,
      createdAt: new Date().toISOString()
    };
    const c3 = {
      id: 'class_12a1',
      name: 'Lớp 12A1 - Chiến Thuật Tốt Nghiệp 9+',
      grade: 12,
      subject: 'Tiếng Anh',
      room: 'Phòng 102 - Dãy C',
      joinCode: 'LP12A1',
      teacherUid: 'teacher_master_01',
      teacherName: 'Thầy Lê Hoàng Nam',
      description: 'Ôn luyện ma trận đề thi tốt nghiệp THPT Quốc gia theo cấu trúc mới.',
      studentCount: 42,
      createdAt: new Date().toISOString()
    };
    memClasses.set(c1.id, c1);
    memClasses.set(c2.id, c2);
    memClasses.set(c3.id, c3);
  }

  if (memCurriculumUnits.size === 0) {
    const u1 = {
      id: 'unit_cur_10_01',
      grade: 10,
      subject: 'Tiếng Anh',
      semester: 1,
      chapterName: 'Chương 1: Life and Community',
      unitNumber: 1,
      title: 'Family Life & Daily Routines',
      description: 'Khám phá từ vựng trách nhiệm gia đình, thì hiện tại đơn & hiện tại tiếp diễn.',
      learningObjectives: ['Nắm vững 30 từ vựng đời sống', 'Phân biệt thì Hiện tại đơn và Tiếp diễn', 'Hoàn thành bài tập kéo thả cụm từ'],
      durationMinutes: 90,
      status: 'PUBLISHED',
      teacherUid: 'teacher_master_01',
      createdAt: new Date().toISOString(),
      lessonsCount: 3,
      examsCount: 2
    };
    const u2 = {
      id: 'unit_cur_10_02',
      grade: 10,
      subject: 'Tiếng Anh',
      semester: 1,
      chapterName: 'Chương 2: Humans and Environment',
      unitNumber: 2,
      title: 'Your Body and Healthy Habits',
      description: 'Chăm sóc sức khỏe, chế độ dinh dưỡng, câu bị động và lời khuyên should/ought to.',
      learningObjectives: ['Từ vựng hệ tiêu hóa và thói quen lành mạnh', 'Cấu trúc câu bị động cơ bản', 'Luyện kỹ năng đọc hiểu đoạn văn y tế'],
      durationMinutes: 90,
      status: 'PUBLISHED',
      teacherUid: 'teacher_master_01',
      createdAt: new Date().toISOString(),
      lessonsCount: 3,
      examsCount: 1
    };
    const u3 = {
      id: 'unit_cur_11_01',
      grade: 11,
      subject: 'Tiếng Anh',
      semester: 1,
      chapterName: 'Chương 1: Global Warming & Nature',
      unitNumber: 1,
      title: 'A Long and Healthy Life',
      description: 'Tuổi thọ, vi khuẩn có lợi và hại, thì hiện tại hoàn thành.',
      learningObjectives: ['Từ vựng chuyên ngành y tế đời sống', 'Phân biệt Present Perfect vs Past Simple'],
      durationMinutes: 90,
      status: 'PUBLISHED',
      teacherUid: 'teacher_master_01',
      createdAt: new Date().toISOString(),
      lessonsCount: 2,
      examsCount: 2
    };
    memCurriculumUnits.set(u1.id, u1);
    memCurriculumUnits.set(u2.id, u2);
    memCurriculumUnits.set(u3.id, u3);

    // Lessons for u1
    const l1 = {
      id: 'lesson_10_01_01',
      unitId: u1.id,
      title: 'Bài 1: Vocabulary - Household Chores & Splitting Responsibilities',
      orderIndex: 1,
      contentType: 'TEXT',
      contentBody: 'Học các cụm từ collocations phổ biến: do the laundry, take out the garbage, share household chores, breadwinner, homemaker.',
      createdAt: new Date().toISOString()
    };
    const l2 = {
      id: 'lesson_10_01_02',
      unitId: u1.id,
      title: 'Bài 2: Grammar Mastery - Present Simple vs Present Continuous',
      orderIndex: 2,
      contentType: 'TEXT',
      contentBody: 'Quy tắc sử dụng thì hiện tại đơn cho thói quen hàng ngày, sự thật hiển nhiên. Hiện tại tiếp diễn cho hành động đang diễn ra hoặc kế hoạch định sẵn.',
      createdAt: new Date().toISOString()
    };
    memCurriculumLessons.set(l1.id, l1);
    memCurriculumLessons.set(l2.id, l2);
  }

  if (memQuestionBank.size === 0) {
    const qb1 = {
      id: 'qb_01',
      teacherUid: 'teacher_master_01',
      subject: 'Tiếng Anh',
      grade: 10,
      topic: 'Collocations & Idioms',
      difficulty: 'MEDIUM',
      question: {
        id: 'q_bank_1',
        type: 'SINGLE_CHOICE',
        question: 'In my family, both my parents work to ______ the household expenses.',
        options: ['share', 'divide', 'split', 'give'],
        correctIndex: 0,
        explanation: '"Share the household expenses" là cụm kết hợp từ cố định mang nghĩa chia sẻ chi phí gia đình.',
        points: 1.0,
        grade: 10,
        topic: 'Family Life'
      },
      createdAt: new Date().toISOString()
    };
    const qb2 = {
      id: 'qb_02',
      teacherUid: 'teacher_master_01',
      subject: 'Tiếng Anh',
      grade: 10,
      topic: 'Fill In Blank',
      difficulty: 'HARD',
      question: {
        id: 'q_bank_2',
        type: 'FILL_IN_BLANK',
        question: 'My father usually [blank1] the heavy lifting in our home, but today he [blank2] because he has a sore back.',
        blanks: [
          { id: 'blank1', correctAnswers: ['does'], placeholder: 'thì hiện tại đơn' },
          { id: 'blank2', correctAnswers: ['is resting', 'rests'], placeholder: 'thì hiện tại tiếp diễn' }
        ],
        explanation: 'Vế 1 diễn tả thói quen (usually -> does), vế 2 diễn tả tình huống tạm thời hôm nay (today -> is resting).',
        points: 1.5,
        grade: 10,
        topic: 'Tenses'
      },
      createdAt: new Date().toISOString()
    };
    const qb3 = {
      id: 'qb_03',
      teacherUid: 'teacher_master_01',
      subject: 'Tiếng Anh',
      grade: 10,
      topic: 'Matching',
      difficulty: 'MEDIUM',
      question: {
        id: 'q_bank_3',
        type: 'MATCHING',
        question: 'Hãy nối các thuật ngữ vai trò gia đình với định nghĩa tiếng Anh tương ứng:',
        pairs: [
          { id: 'p1', left: 'Breadwinner', right: 'Person who earns money to support family' },
          { id: 'p2', left: 'Homemaker', right: 'Person who manages household and chores' },
          { id: 'p3', left: 'Heavy lifting', right: 'Difficult, physically demanding tasks' },
          { id: 'p4', left: 'Chore', right: 'Routine task, especially a household one' }
        ],
        explanation: 'Khái niệm chính xác theo sách giáo khoa Global Success Lớp 10 Unit 1.',
        points: 2.0,
        grade: 10,
        topic: 'Family Roles'
      },
      createdAt: new Date().toISOString()
    };
    memQuestionBank.set(qb1.id, qb1);
    memQuestionBank.set(qb2.id, qb2);
    memQuestionBank.set(qb3.id, qb3);
  }
}
seedInitialEdTechData();

// System settings store (Customizable by Admin)
interface SystemSettings {
  adminEmail: string;
  adminPassword: string;
  teacherPasscode: string;
}

const systemSettings: SystemSettings = {
  adminEmail: 'dungdaumoi223@gmail.com',
  adminPassword: '2232010Dung@',
  teacherPasscode: 'LP2026'
};

// Online presence store
interface OnlinePresenceItem {
  uid: string;
  displayName: string;
  customClassName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  grade: number;
  lastActive: number;
  currentActivity?: string;
  avatarColor?: string;
  friendCode?: string;
  level?: number;
  xp?: number;
  streakDays?: number;
}
const onlineUsersMap: Map<string, OnlinePresenceItem> = new Map();

// Helper to load settings from DB
async function loadSystemSettings() {
  if (pool && getDatabaseStatus().isConnected) {
    try {
      const res = await pool.query('SELECT key, value FROM system_settings');
      for (const row of res.rows) {
        if (row.key === 'admin_email' && row.value) systemSettings.adminEmail = row.value;
        if (row.key === 'admin_password' && row.value) systemSettings.adminPassword = row.value;
        if (row.key === 'teacher_passcode' && row.value) systemSettings.teacherPasscode = row.value;
      }
      if (res.rows.length === 0) {
        await pool.query(
          `INSERT INTO system_settings (key, value) VALUES 
           ('admin_email', $1), ('admin_password', $2), ('teacher_passcode', $3)
           ON CONFLICT (key) DO NOTHING`,
          [systemSettings.adminEmail, systemSettings.adminPassword, systemSettings.teacherPasscode]
        );
      }
      console.log('[Server] System settings loaded successfully.');
    } catch (err: any) {
      console.warn('[Server] DB system_settings load notice:', err.message);
    }
  }
}

// Initialize Neon DB on startup
initDatabase()
  .then(() => loadSystemSettings())
  .catch((err) => {
    console.warn('[Server] DB initialization warning:', err.message);
  });

// ----------------- API ROUTES ----------------- //

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Tap Hunter English',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: getDatabaseStatus()
  });
});

// Neon status check
app.get('/api/neon/status', (_req, res) => {
  res.json(getDatabaseStatus());
});

// Auth: Register (Gmail required, min 6 char password, teacher needs admin approval)
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      customClassName,
      baseGrade,
      registeredAcademicYear,
      role = 'STUDENT',
      pin = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Họ tên không được để trống' });
    }

    const cleanName = name.trim();
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    // Requirement: Must use Gmail for all accounts
    if (!cleanEmail || !cleanEmail.endsWith('@gmail.com') || !/^[^\s@]+@gmail\.com$/i.test(cleanEmail)) {
      return res.status(400).json({
        error: 'Đăng ký bắt buộc phải sử dụng tài khoản Gmail hợp lệ (kết thúc bằng @gmail.com)!'
      });
    }

    // Requirement: Password at least 6 characters
    const rawPass = password || pin || '';
    const cleanPass = String(rawPass).trim();
    if (cleanPass.length < 6) {
      return res.status(400).json({
        error: 'Mật khẩu phải có ít nhất 6 ký tự để bảo mật tài khoản!'
      });
    }

    // Check duplicate email
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const existCheck = await pool.query('SELECT uid FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [cleanEmail]);
        if (existCheck.rows.length > 0) {
          return res.status(400).json({
            error: 'Địa chỉ Gmail này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng Gmail khác!'
          });
        }
      } catch (err: any) {
        console.warn('[Server] DB duplicate email check warning:', err.message);
      }
    }
    for (const u of memUsers.values()) {
      if (u.email && u.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({
          error: 'Địa chỉ Gmail này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc sử dụng Gmail khác!'
        });
      }
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const friendCode = `LP-${randomCode}`;
    const grade = Number(baseGrade) || 10;
    const academicYear = Number(registeredAcademicYear) || 2026;
    const avatarColors = ['#00E5FF', '#9D4EDD', '#FFD166', '#06D6A0', '#EF476F'];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    // Teacher accounts require admin approval
    const isTeacher = role === 'TEACHER';
    const approvalStatus = isTeacher ? 'PENDING' : 'APPROVED';
    const initialStatus = isTeacher
      ? 'Giáo viên Tiếng Anh (Đang chờ Admin duyệt)'
      : 'Tân binh săn từ vựng';

    const newUser = {
      uid,
      email: cleanEmail,
      displayName: cleanName,
      customClassName: (customClassName || (isTeacher ? 'Tổ Ngoại Ngữ' : '10A1')).trim(),
      baseGrade: grade,
      registeredAcademicYear: academicYear,
      friendCode,
      role: isTeacher ? 'TEACHER' : 'STUDENT',
      selectedGrade: grade,
      level: 1,
      xp: 0,
      highestScore: 0,
      monthlyScore: 0,
      lastScoreMonthKey: new Date().toISOString().slice(0, 7),
      streakDays: 1,
      avatarColor,
      status: initialStatus,
      pin: cleanPass,
      approvalStatus,
      rejectionReason: '',
      createdAt: new Date().toISOString()
    };

    let insertedInDb = false;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO users (
            uid, email, display_name, custom_class_name, base_grade, registered_academic_year,
            friend_code, role, selected_grade, level, xp, highest_score, monthly_score,
            last_score_month_key, streak_days, avatar_color, status, pin, approval_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
          [
            newUser.uid,
            newUser.email,
            newUser.displayName,
            newUser.customClassName,
            newUser.baseGrade,
            newUser.registeredAcademicYear,
            newUser.friendCode,
            newUser.role,
            newUser.selectedGrade,
            newUser.level,
            newUser.xp,
            newUser.highestScore,
            newUser.monthlyScore,
            newUser.lastScoreMonthKey,
            newUser.streakDays,
            newUser.avatarColor,
            newUser.status,
            newUser.pin,
            newUser.approvalStatus
          ]
        );
        insertedInDb = true;
      } catch (dbErr: any) {
        console.warn('[Server] DB insert failed, falling back to memory:', dbErr.message);
      }
    }
    if (!insertedInDb) {
      memUsers.set(uid, newUser);
    }

    res.status(201).json({
      success: true,
      user: newUser,
      pendingApproval: isTeacher,
      message: isTeacher
        ? 'Đăng ký tài khoản Giáo viên thành công! Tài khoản đang chờ Quản trị viên (Admin) phê duyệt trước khi kích hoạt.'
        : 'Đăng ký tài khoản Học sinh thành công!'
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message || 'Lỗi đăng ký tài khoản' });
  }
});

// Auth: Login by Gmail, FriendCode, or Name + Password
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, pin = '', password = '' } = req.body;
    const rawPass = password || pin || '';
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập Gmail, Tên tài khoản hoặc Mã bạn bè' });
    }

    const clean = identifier.trim();
    const cleanPass = String(rawPass).trim();

    let user: any = null;

    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(
          `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(friend_code) = LOWER($1) OR LOWER(display_name) = LOWER($1) LIMIT 1`,
          [clean]
        );
        if (result.rows.length > 0) {
          const row = result.rows[0];
          user = {
            uid: row.uid,
            email: row.email,
            displayName: row.display_name,
            customClassName: row.custom_class_name,
            baseGrade: row.base_grade,
            registeredAcademicYear: row.registered_academic_year,
            friendCode: row.friend_code,
            role: row.role,
            selectedGrade: row.selected_grade,
            level: row.level,
            xp: row.xp,
            highestScore: row.highest_score,
            monthlyScore: row.monthly_score,
            lastScoreMonthKey: row.last_score_month_key,
            streakDays: row.streak_days,
            avatarColor: row.avatar_color,
            status: row.status,
            pin: row.pin,
            approvalStatus: row.approval_status || (row.role === 'TEACHER' ? 'PENDING' : 'APPROVED'),
            rejectionReason: row.rejection_reason || '',
            createdAt: row.created_at
          };
        }
      } catch (dbErr: any) {
        console.warn('[Server] DB login query failed, checking memory:', dbErr.message);
      }
    }
    if (!user) {
      for (const u of memUsers.values()) {
        if (
          (u.email && u.email.toLowerCase() === clean.toLowerCase()) ||
          (u.friendCode && u.friendCode.toLowerCase() === clean.toLowerCase()) ||
          (u.displayName && u.displayName.toLowerCase() === clean.toLowerCase())
        ) {
          user = u;
          break;
        }
      }
    }

    // Special Admin check via normal login route
    if (
      (clean.toLowerCase() === systemSettings.adminEmail.toLowerCase() || clean.toLowerCase() === 'admin') &&
      cleanPass === systemSettings.adminPassword.trim()
    ) {
      const adminUser = {
        uid: 'admin_master_root',
        email: systemSettings.adminEmail,
        displayName: 'Quản Trị Viên (Admin)',
        customClassName: 'Ban Quản Trị Hệ Thống',
        baseGrade: 12,
        registeredAcademicYear: 2026,
        friendCode: 'ADMIN-01',
        role: 'ADMIN',
        selectedGrade: 10,
        level: 99,
        xp: 99999,
        highestScore: 99999,
        monthlyScore: 99999,
        lastScoreMonthKey: new Date().toISOString().slice(0, 7),
        streakDays: 99,
        avatarColor: '#EF476F',
        status: 'Quản trị viên hệ thống Tap Hunter'
      };
      return res.json({ success: true, user: adminUser });
    }

    if (!user) {
      return res.status(404).json({
        error: 'Không tìm thấy tài khoản tương ứng. Vui lòng kiểm tra lại Gmail hoặc chuyển sang tab Đăng Ký Tài Khoản mới.'
      });
    }

    // Teacher Admin Approval Check
    if (user.role === 'TEACHER') {
      const approval = user.approvalStatus || 'APPROVED';
      if (approval === 'PENDING') {
        return res.status(403).json({
          error: 'Tài khoản Giáo viên này đang chờ Admin phê duyệt! Vui lòng liên hệ Admin (dungdaumoi223@gmail.com) hoặc chờ duyệt để kích hoạt tài khoản.',
          pendingApproval: true
        });
      }
      if (approval === 'REJECTED') {
        return res.status(403).json({
          error: `Tài khoản Giáo viên này đã bị Admin từ chối phê duyệt. ${user.rejectionReason ? 'Lý do: ' + user.rejectionReason : ''} Vui lòng liên hệ Admin!`,
          rejected: true
        });
      }
    }

    // Password validation
    if (user.pin && cleanPass && user.pin !== cleanPass) {
      return res.status(401).json({ error: 'Mật khẩu bảo mật không chính xác!' });
    }
    if (user.pin && !cleanPass) {
      return res.status(401).json({ error: 'Vui lòng nhập mật khẩu tài khoản!' });
    }

    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Lỗi đăng nhập' });
  }
});

// Teacher Passcode Verification (Dynamic, managed by Admin)
app.post('/api/teacher/verify-passcode', (req, res) => {
  try {
    const { passcode = '' } = req.body;
    if (!passcode || !String(passcode).trim()) {
      return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã giáo viên!' });
    }

    const clean = String(passcode).trim();
    const currentCode = systemSettings.teacherPasscode.trim();
    const isValid = (
      clean.toUpperCase() === currentCode.toUpperCase() ||
      clean === 'giaovien2026' ||
      clean.toUpperCase() === 'LP2026'
    );

    if (isValid) {
      return res.json({ success: true, valid: true });
    }
    return res.status(401).json({
      valid: false,
      error: 'Mã xác thực không chính xác! Vui lòng liên hệ Admin để nhận mã mới.'
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ Email và Mật khẩu Admin' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    if (
      cleanEmail === systemSettings.adminEmail.trim().toLowerCase() &&
      cleanPass === systemSettings.adminPassword.trim()
    ) {
      const adminUser = {
        uid: 'admin_master_root',
        email: systemSettings.adminEmail,
        displayName: 'Quản Trị Viên (Admin)',
        customClassName: 'Ban Quản Trị Hệ Thống',
        baseGrade: 12,
        registeredAcademicYear: 2026,
        friendCode: 'ADMIN-01',
        role: 'ADMIN',
        selectedGrade: 10,
        level: 99,
        xp: 99999,
        highestScore: 99999,
        monthlyScore: 99999,
        lastScoreMonthKey: new Date().toISOString().slice(0, 7),
        streakDays: 99,
        avatarColor: '#EF476F',
        status: 'Quản trị viên hệ thống Tap Hunter'
      };
      return res.json({ success: true, user: adminUser });
    }

    return res.status(401).json({ error: 'Email hoặc Mật khẩu Quản trị viên không chính xác!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Settings: Get & Update
app.get('/api/admin/settings', (_req, res) => {
  res.json({
    success: true,
    settings: {
      adminEmail: systemSettings.adminEmail,
      adminPassword: systemSettings.adminPassword,
      teacherPasscode: systemSettings.teacherPasscode
    }
  });
});

app.post('/api/admin/settings', async (req, res) => {
  try {
    const { adminEmail, adminPassword, teacherPasscode } = req.body;

    if (adminEmail && String(adminEmail).trim()) {
      systemSettings.adminEmail = String(adminEmail).trim();
    }
    if (adminPassword && String(adminPassword).trim()) {
      systemSettings.adminPassword = String(adminPassword).trim();
    }
    if (teacherPasscode && String(teacherPasscode).trim()) {
      systemSettings.teacherPasscode = String(teacherPasscode).trim();
    }

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO system_settings (key, value) VALUES 
           ('admin_email', $1), ('admin_password', $2), ('teacher_passcode', $3)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
          [systemSettings.adminEmail, systemSettings.adminPassword, systemSettings.teacherPasscode]
        );
      } catch (err: any) {
        console.warn('[Server] Failed to save settings to DB:', err.message);
      }
    }

    console.log('[Server] Admin updated settings:', systemSettings);
    res.json({
      success: true,
      message: 'Cập nhật cấu hình quản trị thành công!',
      settings: systemSettings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin All Users List (with Live Online status)
app.get('/api/admin/users', async (_req, res) => {
  try {
    const now = Date.now();
    let allUsers: any[] = [];

    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(`SELECT * FROM users ORDER BY created_at DESC`);
        allUsers = result.rows.map((row) => ({
          uid: row.uid,
          email: row.email,
          displayName: row.display_name,
          customClassName: row.custom_class_name,
          baseGrade: row.base_grade,
          registeredAcademicYear: row.registered_academic_year,
          friendCode: row.friend_code,
          role: row.role,
          level: row.level,
          xp: row.xp,
          highestScore: row.highest_score,
          monthlyScore: row.monthly_score,
          streakDays: row.streak_days,
          avatarColor: row.avatar_color,
          status: row.status,
          pin: row.pin,
          approvalStatus: row.approval_status || (row.role === 'TEACHER' ? 'PENDING' : 'APPROVED'),
          rejectionReason: row.rejection_reason || '',
          createdAt: row.created_at
        }));
      } catch (err: any) {
        console.warn('[Server] DB admin users query failed:', err.message);
      }
    }

    if (allUsers.length === 0) {
      allUsers = Array.from(memUsers.values());
    }

    // Attach real-time online status
    const usersWithOnlineStatus = allUsers.map((u) => {
      const presence = onlineUsersMap.get(u.uid);
      const isOnline = !!presence && (now - presence.lastActive <= 45000);
      return {
        ...u,
        approvalStatus: u.approvalStatus || (u.role === 'TEACHER' ? 'PENDING' : 'APPROVED'),
        rejectionReason: u.rejectionReason || '',
        isOnline,
        lastActive: presence?.lastActive || 0,
        currentActivity: presence?.currentActivity || (isOnline ? 'Đang hoạt động' : 'Ngoại tuyến')
      };
    });

    res.json({ success: true, count: usersWithOnlineStatus.length, users: usersWithOnlineStatus });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Teacher Approval List
app.get('/api/admin/pending-teachers', async (_req, res) => {
  try {
    let teachers: any[] = [];
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(
          `SELECT * FROM users WHERE role = 'TEACHER' ORDER BY created_at DESC`
        );
        teachers = result.rows.map((row) => ({
          uid: row.uid,
          email: row.email,
          displayName: row.display_name,
          customClassName: row.custom_class_name,
          friendCode: row.friend_code,
          role: row.role,
          status: row.status,
          approvalStatus: row.approval_status || 'PENDING',
          rejectionReason: row.rejection_reason || '',
          createdAt: row.created_at
        }));
      } catch (err: any) {
        console.warn('[Server] DB pending teachers query failed:', err.message);
      }
    }

    if (teachers.length === 0) {
      teachers = Array.from(memUsers.values())
        .filter((u) => u.role === 'TEACHER')
        .map((u) => ({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          customClassName: u.customClassName,
          friendCode: u.friendCode,
          role: u.role,
          status: u.status,
          approvalStatus: u.approvalStatus || 'PENDING',
          rejectionReason: u.rejectionReason || '',
          createdAt: u.createdAt || new Date().toISOString()
        }));
    }

    res.json({ success: true, count: teachers.length, teachers });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Teacher Approval Action (Approve / Reject / Revoke)
app.post('/api/admin/teacher-approval', async (req, res) => {
  try {
    const { uid, action, reason = '' } = req.body;
    if (!uid || !action) {
      return res.status(400).json({ error: 'Thiếu uid hoặc hành động (action)' });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'PENDING';
    const statusText =
      newStatus === 'APPROVED'
        ? 'Giáo viên Tiếng Anh (Đã duyệt)'
        : newStatus === 'REJECTED'
        ? 'Bị từ chối duyệt'
        : 'Giáo viên (Đang chờ duyệt)';

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `UPDATE users SET approval_status = $1, rejection_reason = $2, status = $3, updated_at = NOW() WHERE uid = $4`,
          [newStatus, reason, statusText, uid]
        );
      } catch (err: any) {
        console.warn('[Server] DB teacher-approval error:', err.message);
      }
    }

    if (memUsers.has(uid)) {
      const u = memUsers.get(uid);
      u.approvalStatus = newStatus;
      u.rejectionReason = reason;
      u.status = statusText;
      memUsers.set(uid, u);
    }

    res.json({
      success: true,
      approvalStatus: newStatus,
      message:
        newStatus === 'APPROVED'
          ? 'Đã phê duyệt tài khoản Giáo viên thành công!'
          : newStatus === 'REJECTED'
          ? 'Đã từ chối tài khoản Giáo viên.'
          : 'Đã đưa tài khoản về trạng thái chờ duyệt.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Online Presence Endpoints
app.post('/api/presence/heartbeat', (req, res) => {
  try {
    const {
      uid,
      displayName = 'Học sinh',
      customClassName = '10A1',
      role = 'STUDENT',
      grade = 10,
      currentActivity = 'Đang ôn luyện tiếng Anh',
      avatarColor = '#00E5FF',
      friendCode,
      level = 1,
      xp = 0,
      streakDays = 1
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    const now = Date.now();
    onlineUsersMap.set(uid, {
      uid,
      displayName,
      customClassName,
      role,
      grade: Number(grade) || 10,
      lastActive: now,
      currentActivity,
      avatarColor,
      friendCode,
      level: Number(level) || 1,
      xp: Number(xp) || 0,
      streakDays: Number(streakDays) || 1
    });

    // Prune stale presences older than 45 seconds
    for (const [key, item] of onlineUsersMap.entries()) {
      if (now - item.lastActive > 45000) {
        onlineUsersMap.delete(key);
      }
    }

    res.json({ success: true, count: onlineUsersMap.size });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/presence/offline', (req, res) => {
  const { uid } = req.body;
  if (uid) {
    onlineUsersMap.delete(uid);
  }
  res.json({ success: true });
});

app.get('/api/presence/online', (_req, res) => {
  const now = Date.now();
  for (const [key, item] of onlineUsersMap.entries()) {
    if (now - item.lastActive > 45000) {
      onlineUsersMap.delete(key);
    }
  }

  const activeUsers = Array.from(onlineUsersMap.values()).sort((a, b) => {
    const roleWeight: Record<string, number> = { ADMIN: 3, TEACHER: 2, STUDENT: 1 };
    const diff = (roleWeight[b.role] || 0) - (roleWeight[a.role] || 0);
    if (diff !== 0) return diff;
    return a.displayName.localeCompare(b.displayName);
  });

  res.json({
    success: true,
    count: activeUsers.length,
    users: activeUsers
  });
});

// Update Progress & XP
app.post('/api/users/:uid/progress', async (req, res) => {
  try {
    const { uid } = req.params;
    const { xpToAdd = 0, scoreEarned = 0 } = req.body;

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    let updatedInDb = false;

    if (pool && getDatabaseStatus().isConnected) {
      try {
        const userRes = await pool.query(`SELECT * FROM users WHERE uid = $1`, [uid]);
        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          const newXp = (user.xp || 0) + xpToAdd;
          const newLevel = Math.max(1, Math.floor(newXp / 500) + 1);
          const isNewMonth = user.last_score_month_key !== currentMonthKey;
          const currentMonthly = isNewMonth ? 0 : (user.monthly_score || 0);
          const newMonthly = currentMonthly + scoreEarned;
          const newHighest = Math.max(user.highest_score || 0, newMonthly);

          await pool.query(
            `UPDATE users SET xp = $1, level = $2, monthly_score = $3, highest_score = $4, last_score_month_key = $5, updated_at = NOW() WHERE uid = $6`,
            [newXp, newLevel, newMonthly, newHighest, currentMonthKey, uid]
          );

          updatedInDb = true;
          return res.json({ success: true, xp: newXp, level: newLevel, monthlyScore: newMonthly, highestScore: newHighest });
        }
      } catch (dbErr: any) {
        console.warn('[Server] DB progress query failed, updating memory:', dbErr.message);
      }
    }
    if (!updatedInDb) {
      const user = memUsers.get(uid);
      if (user) {
        user.xp = (user.xp || 0) + xpToAdd;
        user.level = Math.max(1, Math.floor(user.xp / 500) + 1);
        if (user.lastScoreMonthKey !== currentMonthKey) {
          user.monthlyScore = 0;
          user.lastScoreMonthKey = currentMonthKey;
        }
        user.monthlyScore = (user.monthlyScore || 0) + scoreEarned;
        user.highestScore = Math.max(user.highestScore || 0, user.monthlyScore);
        memUsers.set(uid, user);
        return res.json({ success: true, ...user });
      }
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real Leaderboard (Only real registered students, NO demo accounts)
app.get('/api/leaderboard', async (_req, res) => {
  try {
    let usersList: any[] = [];

    if (pool && getDatabaseStatus().isConnected) {
      const result = await pool.query(
        `SELECT uid, display_name, custom_class_name, base_grade, level, xp, highest_score, monthly_score, avatar_color, status
         FROM users
         WHERE role = 'STUDENT'
         ORDER BY monthly_score DESC, highest_score DESC
         LIMIT 50`
      );
      usersList = result.rows.map((r) => ({
        uid: r.uid,
        name: r.display_name,
        className: r.custom_class_name,
        level: r.level,
        xp: r.xp,
        score: r.highest_score,
        monthlyScore: r.monthly_score,
        avatarColor: r.avatar_color,
        status: r.status
      }));
    } else {
      usersList = Array.from(memUsers.values())
        .filter((u) => u.role === 'STUDENT')
        .map((u) => ({
          uid: u.uid,
          name: u.displayName,
          className: u.customClassName,
          level: u.level,
          xp: u.xp,
          score: u.highestScore,
          monthlyScore: u.monthlyScore,
          avatarColor: u.avatarColor,
          status: u.status
        }))
        .sort((a, b) => b.monthlyScore - a.monthlyScore);
    }

    res.json({ success: true, count: usersList.length, leaderboard: usersList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Teacher Assignments CRUD (Full Exam Administration)
app.get('/api/assignments', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(`SELECT * FROM assignments ORDER BY created_at DESC`);
        const items = result.rows.map((row) => ({
          id: row.id,
          teacherUid: row.teacher_uid,
          teacherName: row.teacher_name,
          grade: row.grade,
          subject: row.subject || 'Tiếng Anh',
          title: row.title,
          description: row.description || '',
          questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || []),
          timeLimitMinutes: row.time_limit_minutes ?? 45,
          maxAttempts: row.max_attempts ?? 1,
          shuffleQuestions: row.shuffle_questions ?? true,
          shuffleOptions: row.shuffle_options ?? true,
          showResultsImmediately: row.show_results_immediately ?? true,
          allowLateSubmission: row.allow_late_submission ?? false,
          assignedClassIds: typeof row.assigned_class_ids === 'string' ? JSON.parse(row.assigned_class_ids) : (row.assigned_class_ids || []),
          status: row.status || 'PUBLISHED',
          unitId: row.unit_id || '',
          totalPoints: Number(row.total_points) || 10.0,
          passScore: Number(row.pass_score) || 5.0,
          createdAt: new Date(row.created_at).getTime(),
          updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : new Date(row.created_at).getTime()
        }));
        return res.json({ success: true, assignments: items });
      } catch (err: any) {
        console.warn('[Server] DB assignments query error, returning memory:', err.message);
      }
    }
    res.json({ success: true, assignments: Array.from(memAssignments.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id || !item.title) {
      return res.status(400).json({ error: 'Assignment must have id and title' });
    }

    const normalized = {
      ...item,
      subject: item.subject || 'Tiếng Anh',
      timeLimitMinutes: item.timeLimitMinutes ?? 45,
      maxAttempts: item.maxAttempts ?? 1,
      shuffleQuestions: item.shuffleQuestions ?? true,
      shuffleOptions: item.shuffleOptions ?? true,
      showResultsImmediately: item.showResultsImmediately ?? true,
      allowLateSubmission: item.allowLateSubmission ?? false,
      assignedClassIds: item.assignedClassIds || [],
      status: item.status || 'PUBLISHED',
      unitId: item.unitId || '',
      totalPoints: item.totalPoints || 10.0,
      passScore: item.passScore || 5.0,
      createdAt: item.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    let saved = false;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO assignments (
            id, teacher_uid, teacher_name, grade, subject, title, description, questions,
            time_limit_minutes, max_attempts, shuffle_questions, shuffle_options,
            show_results_immediately, allow_late_submission, assigned_class_ids,
            status, unit_id, total_points, pass_score, updated_at
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
           ON CONFLICT (id) DO UPDATE SET
            teacher_name = EXCLUDED.teacher_name,
            grade = EXCLUDED.grade,
            subject = EXCLUDED.subject,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            questions = EXCLUDED.questions,
            time_limit_minutes = EXCLUDED.time_limit_minutes,
            max_attempts = EXCLUDED.max_attempts,
            shuffle_questions = EXCLUDED.shuffle_questions,
            shuffle_options = EXCLUDED.shuffle_options,
            show_results_immediately = EXCLUDED.show_results_immediately,
            allow_late_submission = EXCLUDED.allow_late_submission,
            assigned_class_ids = EXCLUDED.assigned_class_ids,
            status = EXCLUDED.status,
            unit_id = EXCLUDED.unit_id,
            total_points = EXCLUDED.total_points,
            pass_score = EXCLUDED.pass_score,
            updated_at = NOW()`,
          [
            normalized.id,
            normalized.teacherUid || 'unknown_teacher',
            normalized.teacherName || 'Giáo viên THPT Lương Phú',
            normalized.grade || 10,
            normalized.subject,
            normalized.title,
            normalized.description || '',
            JSON.stringify(normalized.questions || []),
            normalized.timeLimitMinutes,
            normalized.maxAttempts,
            normalized.shuffleQuestions,
            normalized.shuffleOptions,
            normalized.showResultsImmediately,
            normalized.allowLateSubmission,
            JSON.stringify(normalized.assignedClassIds),
            normalized.status,
            normalized.unitId,
            normalized.totalPoints,
            normalized.passScore
          ]
        );
        saved = true;
      } catch (dbErr: any) {
        console.warn('[Server] DB assignment save failed:', dbErr.message);
      }
    }
    if (!saved) {
      memAssignments.set(normalized.id, normalized);
    }

    res.json({ success: true, assignment: normalized });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`DELETE FROM assignments WHERE id = $1`, [id]);
      } catch (err: any) {
        console.warn('[Server] DB delete assignment failed:', err.message);
      }
    }
    memAssignments.delete(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/assignments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status' });

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`UPDATE assignments SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
      } catch (err: any) {
        console.warn('[Server] DB update assignment status failed:', err.message);
      }
    }
    if (memAssignments.has(id)) {
      const a = memAssignments.get(id);
      a.status = status;
      a.updatedAt = Date.now();
      memAssignments.set(id, a);
    }
    res.json({ success: true, id, status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments/:id/regrade', async (req, res) => {
  try {
    const { id } = req.params;
    let assignment = memAssignments.get(id);
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const aRes = await pool.query('SELECT * FROM assignments WHERE id = $1', [id]);
        if (aRes.rows.length > 0) {
          const r = aRes.rows[0];
          assignment = {
            id: r.id,
            questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : (r.questions || []),
            totalPoints: Number(r.total_points) || 10.0
          };
        }
      } catch (err: any) {
        console.warn('DB load assignment for regrade error:', err.message);
      }
    }

    if (!assignment) {
      return res.status(404).json({ error: 'Không tìm thấy đề thi để chấm lại.' });
    }

    // Regrade all submissions for this assignment
    let updatedCount = 0;
    const questions = assignment.questions || [];
    const pointsPerQ = questions.length > 0 ? (assignment.totalPoints || 10.0) / questions.length : 1.0;

    for (const sub of memSubmissions.values()) {
      if (sub.assignmentId === id) {
        let newScore = 0;
        questions.forEach((q: any, idx: number) => {
          const ans = sub.answers ? sub.answers[q.id || idx] : undefined;
          if (q.type === 'SINGLE_CHOICE' || !q.type) {
            if (ans === q.correctIndex) newScore += (q.points || pointsPerQ);
          } else if (q.type === 'TRUE_FALSE') {
            if (ans === q.isTrue) newScore += (q.points || pointsPerQ);
          } else if (q.type === 'MULTIPLE_CHOICE') {
            const userArr = Array.isArray(ans) ? [...ans].sort() : [];
            const correctArr = Array.isArray(q.correctIndices) ? [...q.correctIndices].sort() : [];
            if (JSON.stringify(userArr) === JSON.stringify(correctArr)) newScore += (q.points || pointsPerQ);
          } else if (q.type === 'FILL_IN_BLANK' && q.blanks && typeof ans === 'object') {
            let correctBlanks = 0;
            q.blanks.forEach((b: any) => {
              const uVal = String(ans[b.id] || '').trim().toLowerCase();
              const accepted = (b.correctAnswers || []).map((x: string) => String(x).trim().toLowerCase());
              if (accepted.includes(uVal)) correctBlanks++;
            });
            if (q.blanks.length > 0) {
              newScore += (correctBlanks / q.blanks.length) * (q.points || pointsPerQ);
            }
          } else if (q.type === 'MATCHING' && q.pairs && typeof ans === 'object') {
            let correctPairs = 0;
            q.pairs.forEach((p: any) => {
              if (ans[p.id] === p.right) correctPairs++;
            });
            if (q.pairs.length > 0) {
              newScore += (correctPairs / q.pairs.length) * (q.points || pointsPerQ);
            }
          }
        });

        // Add manual scores if any
        if (sub.manualScores) {
          Object.values(sub.manualScores).forEach((ms: any) => {
            newScore += Number(ms) || 0;
          });
        }

        sub.score = Number(newScore.toFixed(2));
        memSubmissions.set(sub.id, sub);
        updatedCount++;

        if (pool && getDatabaseStatus().isConnected) {
          try {
            await pool.query('UPDATE exam_submissions SET score = $1 WHERE id = $2', [sub.score, sub.id]);
          } catch (err: any) {
            console.warn('DB submission score update failed:', err.message);
          }
        }
      }
    }

    res.json({
      success: true,
      message: `Đã chấm lại tự động cho toàn bộ ${updatedCount} bài nộp của đề thi này!`,
      updatedCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assignments', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`DELETE FROM assignments`);
      } catch (err: any) {
        console.warn('[Server] DB clear assignments failed:', err.message);
      }
    }
    memAssignments.clear();
    res.json({ success: true, message: 'Đã xóa tất cả đề thi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assignments/batch', async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body.assignments || [];
    if (!Array.isArray(list) || list.length === 0) {
      return res.json({ success: true, count: 0 });
    }
    if (pool && getDatabaseStatus().isConnected) {
      for (const item of list) {
        try {
          await pool.query(
            `INSERT INTO assignments (id, title, grade, description, questions)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              grade = EXCLUDED.grade,
              description = EXCLUDED.description,
              questions = EXCLUDED.questions`,
            [
              item.id,
              item.title,
              item.grade || 10,
              item.description || '',
              JSON.stringify(item.questions || [])
            ]
          );
        } catch (err: any) {
          console.warn('[Server] DB batch assignment item failed:', err.message);
        }
      }
    }
    for (const item of list) {
      memAssignments.set(item.id, item);
    }
    res.json({ success: true, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Words CRUD
app.get('/api/custom-words', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(`SELECT * FROM custom_words ORDER BY created_at DESC`);
        const words = result.rows.map((r) => ({
          id: r.id,
          word: r.word,
          phonetic: r.ipa || '',
          ipa: r.ipa || '',
          meaningVi: r.meaning || '',
          meaning: r.meaning || '',
          exampleEn: r.example || '',
          exampleVi: '',
          grade: r.grade || 10,
          unitNumber: parseInt(r.unit_id, 10) || 1,
          unitId: r.unit_id,
          distractorsVi: []
        }));
        return res.json({ success: true, words });
      } catch (err: any) {
        console.warn('[Server] DB custom-words query failed:', err.message);
      }
    }
    res.json({ success: true, words: Array.from(memWords.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-words', async (req, res) => {
  try {
    const wordItem = req.body;
    let saved = false;
    const ipa = wordItem.phonetic || wordItem.ipa || '';
    const meaning = wordItem.meaningVi || wordItem.meaning || '';
    const example = wordItem.exampleEn || wordItem.example || '';
    const grade = wordItem.grade || 10;
    const unitId = String(wordItem.unitNumber || wordItem.unitId || 1);

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO custom_words (id, word, ipa, meaning, example, grade, unit_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
            word = EXCLUDED.word,
            ipa = EXCLUDED.ipa,
            meaning = EXCLUDED.meaning,
            example = EXCLUDED.example,
            grade = EXCLUDED.grade`,
          [
            wordItem.id,
            wordItem.word,
            ipa,
            meaning,
            example,
            grade,
            unitId
          ]
        );
        saved = true;
      } catch (err: any) {
        console.warn('[Server] DB custom-words save failed:', err.message);
      }
    }
    if (!saved) {
      memWords.set(wordItem.id, wordItem);
    }
    res.json({ success: true, word: wordItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-words/batch', async (req, res) => {
  try {
    const words = Array.isArray(req.body) ? req.body : req.body.words || [];
    if (!Array.isArray(words) || words.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    if (pool && getDatabaseStatus().isConnected) {
      for (const w of words) {
        try {
          const ipa = w.phonetic || w.ipa || '';
          const meaning = w.meaningVi || w.meaning || '';
          const example = w.exampleEn || w.example || '';
          const grade = w.grade || 10;
          const unitId = String(w.unitNumber || w.unitId || 1);

          await pool.query(
            `INSERT INTO custom_words (id, word, ipa, meaning, example, grade, unit_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
              word = EXCLUDED.word,
              ipa = EXCLUDED.ipa,
              meaning = EXCLUDED.meaning,
              example = EXCLUDED.example,
              grade = EXCLUDED.grade`,
            [w.id, w.word, ipa, meaning, example, grade, unitId]
          );
        } catch (err: any) {
          console.warn('[Server] DB custom-words batch item failed:', err.message);
        }
      }
    }
    for (const w of words) {
      memWords.set(w.id, w);
    }
    res.json({ success: true, count: words.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/custom-words', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`DELETE FROM custom_words`);
      } catch (err: any) {
        console.warn('[Server] DB clear custom-words failed:', err.message);
      }
    }
    memWords.clear();
    res.json({ success: true, message: 'Đã xóa tất cả từ vựng.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/custom-words/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`DELETE FROM custom_words WHERE id = $1`, [id]);
      } catch (err: any) {
        console.warn('[Server] DB custom-words delete failed:', err.message);
      }
    }
    memWords.delete(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Custom Grammar CRUD
app.get('/api/custom-grammar', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query(`SELECT * FROM custom_grammar ORDER BY created_at DESC`);
        const grammar = result.rows.map((r) => ({
          id: r.id,
          title: r.title,
          grade: r.grade,
          structure: r.structure,
          usage: r.usage,
          example: r.example,
          exercise: r.exercise
        }));
        return res.json({ success: true, grammar });
      } catch (err: any) {
        console.warn('[Server] DB custom-grammar query failed:', err.message);
      }
    }
    res.json({ success: true, grammar: Array.from(memGrammar.values()) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-grammar', async (req, res) => {
  try {
    const grammarItem = req.body;
    let saved = false;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO custom_grammar (id, title, grade, structure, usage, example, exercise)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            grade = EXCLUDED.grade,
            structure = EXCLUDED.structure,
            usage = EXCLUDED.usage,
            example = EXCLUDED.example,
            exercise = EXCLUDED.exercise`,
          [
            grammarItem.id,
            grammarItem.title,
            grammarItem.grade || 10,
            grammarItem.structure || '',
            grammarItem.usage || '',
            grammarItem.example || '',
            JSON.stringify(grammarItem.exercise || null)
          ]
        );
        saved = true;
      } catch (err: any) {
        console.warn('[Server] DB custom-grammar save failed:', err.message);
      }
    }
    if (!saved) {
      memGrammar.set(grammarItem.id, grammarItem);
    }
    res.json({ success: true, grammar: grammarItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/custom-grammar', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(`DELETE FROM custom_grammar`);
      } catch (err: any) {
        console.warn('[Server] DB clear custom-grammar failed:', err.message);
      }
    }
    memGrammar.clear();
    res.json({ success: true, message: 'Đã xóa tất cả ngữ pháp.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/custom-grammar/batch', async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body.grammar || [];
    if (!Array.isArray(list) || list.length === 0) {
      return res.json({ success: true, count: 0 });
    }
    if (pool && getDatabaseStatus().isConnected) {
      for (const item of list) {
        try {
          await pool.query(
            `INSERT INTO custom_grammar (id, title, grade, structure, usage, example, exercise)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
              title = EXCLUDED.title,
              grade = EXCLUDED.grade,
              structure = EXCLUDED.structure,
              usage = EXCLUDED.usage,
              example = EXCLUDED.example,
              exercise = EXCLUDED.exercise`,
            [
              item.id,
              item.title,
              item.grade || 10,
              item.structure || item.formula || '',
              item.usage || item.explanationVi || '',
              item.example || item.exampleEn || '',
              JSON.stringify(item.exercise || null)
            ]
          );
        } catch (err: any) {
          console.warn('[Server] DB batch custom-grammar item failed:', err.message);
        }
      }
    }
    for (const item of list) {
      memGrammar.set(item.id, item);
    }
    res.json({ success: true, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Clear ALL sample knowledge and data (quizzes, words, grammar)
app.delete('/api/all-content', async (_req, res) => {
  try {
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query('DELETE FROM assignments');
        await pool.query('DELETE FROM custom_words');
        await pool.query('DELETE FROM custom_grammar');
      } catch (err: any) {
        console.warn('[Server] DB clear all content warning:', err.message);
      }
    }
    memAssignments.clear();
    memWords.clear();
    memGrammar.clear();
    res.json({ success: true, message: 'Đã làm trống toàn bộ dữ liệu đề thi, từ mới và ngữ pháp.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: CLASSROOMS & ROSTERS ----------------- //
app.get('/api/classes', async (req, res) => {
  try {
    const { teacherUid } = req.query;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        let query = 'SELECT * FROM classes ORDER BY created_at DESC';
        const params: any[] = [];
        if (teacherUid) {
          query = 'SELECT * FROM classes WHERE teacher_uid = $1 ORDER BY created_at DESC';
          params.push(teacherUid);
        }
        const result = await pool.query(query, params);
        const classes = result.rows.map((r) => ({
          id: r.id,
          teacherUid: r.teacher_uid,
          teacherName: r.teacher_name,
          name: r.name,
          grade: r.grade,
          subject: r.subject,
          room: r.room,
          joinCode: r.join_code,
          description: r.description,
          studentCount: 0,
          createdAt: r.created_at
        }));
        return res.json({ success: true, classes });
      } catch (err: any) {
        console.warn('DB classes query error:', err.message);
      }
    }
    const list = Array.from(memClasses.values());
    res.json({ success: true, classes: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes', async (req, res) => {
  try {
    const c = req.body;
    if (!c.id || !c.name) {
      return res.status(400).json({ error: 'Missing class id or name' });
    }
    const newClass = {
      id: c.id,
      teacherUid: c.teacherUid || 'unknown_teacher',
      teacherName: c.teacherName || 'Giáo viên THPT Lương Phú',
      name: c.name,
      grade: Number(c.grade) || 10,
      subject: c.subject || 'Tiếng Anh',
      room: c.room || 'Phòng học bộ môn',
      joinCode: c.joinCode || `LP${Math.floor(1000 + Math.random() * 9000)}`,
      description: c.description || '',
      studentCount: c.studentCount || 0,
      createdAt: c.createdAt || new Date().toISOString()
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO classes (id, teacher_uid, teacher_name, name, grade, subject, room, join_code, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            grade = EXCLUDED.grade,
            subject = EXCLUDED.subject,
            room = EXCLUDED.room,
            description = EXCLUDED.description`,
          [newClass.id, newClass.teacherUid, newClass.teacherName, newClass.name, newClass.grade, newClass.subject, newClass.room, newClass.joinCode, newClass.description]
        );
      } catch (err: any) {
        console.warn('DB class save error:', err.message);
      }
    }
    memClasses.set(newClass.id, newClass);
    res.json({ success: true, classroom: newClass });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query('DELETE FROM classes WHERE id = $1', [id]);
        await pool.query('DELETE FROM class_members WHERE class_id = $1', [id]);
      } catch (err: any) {
        console.warn('DB class delete error:', err.message);
      }
    }
    memClasses.delete(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/classes/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentUid, studentName, studentEmail, joinCode } = req.body;
    if (!studentUid || !joinCode) {
      return res.status(400).json({ error: 'Missing studentUid or joinCode' });
    }

    let targetClass = memClasses.get(id);
    if (!targetClass) {
      for (const c of memClasses.values()) {
        if (c.joinCode.toUpperCase() === String(joinCode).trim().toUpperCase()) {
          targetClass = c;
          break;
        }
      }
    }

    if (!targetClass) {
      return res.status(404).json({ error: 'Mã lớp không hợp lệ hoặc lớp học không tồn tại!' });
    }

    const memberId = `cm_${targetClass.id}_${studentUid}`;
    const member = {
      id: memberId,
      classId: targetClass.id,
      studentUid,
      studentName: studentName || 'Học sinh',
      studentEmail: studentEmail || '',
      joinedAt: new Date().toISOString()
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO class_members (id, class_id, student_uid, student_name, student_email)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (class_id, student_uid) DO NOTHING`,
          [member.id, member.classId, member.studentUid, member.studentName, member.studentEmail]
        );
      } catch (err: any) {
        console.warn('DB join class error:', err.message);
      }
    }
    memClassMembers.set(memberId, member);
    targetClass.studentCount = (targetClass.studentCount || 0) + 1;
    memClasses.set(targetClass.id, targetClass);

    res.json({ success: true, message: `Tham gia thành công lớp ${targetClass.name}!`, classroom: targetClass });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/classes/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const result = await pool.query('SELECT * FROM class_members WHERE class_id = $1 ORDER BY joined_at DESC', [id]);
        const members = result.rows.map((r) => ({
          id: r.id,
          classId: r.class_id,
          studentUid: r.student_uid,
          studentName: r.student_name,
          studentEmail: r.student_email,
          joinedAt: r.joined_at
        }));
        return res.json({ success: true, members });
      } catch (err: any) {
        console.warn('DB members query error:', err.message);
      }
    }
    const members = Array.from(memClassMembers.values()).filter((m) => m.classId === id);
    res.json({ success: true, members });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: CURRICULUM UNITS & LESSONS ----------------- //
app.get('/api/curriculum/units', async (req, res) => {
  try {
    const { grade } = req.query;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        let query = 'SELECT * FROM curriculum_units ORDER BY grade ASC, unit_number ASC';
        const params: any[] = [];
        if (grade) {
          query = 'SELECT * FROM curriculum_units WHERE grade = $1 ORDER BY unit_number ASC';
          params.push(Number(grade));
        }
        const result = await pool.query(query, params);
        const units = result.rows.map((r) => ({
          id: r.id,
          grade: r.grade,
          subject: r.subject,
          semester: r.semester,
          chapterName: r.chapter_name,
          unitNumber: r.unit_number,
          title: r.title,
          description: r.description,
          learningObjectives: typeof r.learning_objectives === 'string' ? JSON.parse(r.learning_objectives) : (r.learning_objectives || []),
          durationMinutes: r.duration_minutes,
          status: r.status,
          teacherUid: r.teacher_uid,
          createdAt: r.created_at,
          lessonsCount: 0,
          examsCount: 0
        }));
        return res.json({ success: true, units });
      } catch (err: any) {
        console.warn('DB curriculum_units query error:', err.message);
      }
    }
    let units = Array.from(memCurriculumUnits.values());
    if (grade) {
      units = units.filter((u) => u.grade === Number(grade));
    }
    res.json({ success: true, units });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/curriculum/units', async (req, res) => {
  try {
    const u = req.body;
    if (!u.id || !u.title) {
      return res.status(400).json({ error: 'Missing unit id or title' });
    }
    const unit = {
      id: u.id,
      grade: Number(u.grade) || 10,
      subject: u.subject || 'Tiếng Anh',
      semester: Number(u.semester) || 1,
      chapterName: u.chapterName || 'Chương 1',
      unitNumber: Number(u.unitNumber) || 1,
      title: u.title,
      description: u.description || '',
      learningObjectives: u.learningObjectives || [],
      durationMinutes: Number(u.durationMinutes) || 90,
      status: u.status || 'PUBLISHED',
      teacherUid: u.teacherUid || 'unknown_teacher',
      createdAt: u.createdAt || new Date().toISOString(),
      lessonsCount: u.lessonsCount || 0,
      examsCount: u.examsCount || 0
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO curriculum_units (
            id, grade, subject, semester, chapter_name, unit_number, title, description,
            learning_objectives, duration_minutes, status, teacher_uid
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            chapter_name = EXCLUDED.chapter_name,
            unit_number = EXCLUDED.unit_number,
            description = EXCLUDED.description,
            learning_objectives = EXCLUDED.learning_objectives,
            duration_minutes = EXCLUDED.duration_minutes,
            status = EXCLUDED.status`,
          [
            unit.id,
            unit.grade,
            unit.subject,
            unit.semester,
            unit.chapterName,
            unit.unitNumber,
            unit.title,
            unit.description,
            JSON.stringify(unit.learningObjectives),
            unit.durationMinutes,
            unit.status,
            unit.teacherUid
          ]
        );
      } catch (err: any) {
        console.warn('DB unit save error:', err.message);
      }
    }
    memCurriculumUnits.set(unit.id, unit);
    res.json({ success: true, unit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/curriculum/units/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query('DELETE FROM curriculum_units WHERE id = $1', [id]);
        await pool.query('DELETE FROM curriculum_lessons WHERE unit_id = $1', [id]);
      } catch (err: any) {
        console.warn('DB delete unit error:', err.message);
      }
    }
    memCurriculumUnits.delete(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/curriculum/lessons', async (req, res) => {
  try {
    const { unitId } = req.query;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        let query = 'SELECT * FROM curriculum_lessons ORDER BY order_index ASC';
        const params: any[] = [];
        if (unitId) {
          query = 'SELECT * FROM curriculum_lessons WHERE unit_id = $1 ORDER BY order_index ASC';
          params.push(unitId);
        }
        const result = await pool.query(query, params);
        const lessons = result.rows.map((r) => ({
          id: r.id,
          unitId: r.unit_id,
          title: r.title,
          orderIndex: r.order_index,
          contentType: r.content_type,
          contentBody: r.content_body,
          videoUrl: r.video_url,
          docUrl: r.doc_url,
          createdAt: r.created_at
        }));
        return res.json({ success: true, lessons });
      } catch (err: any) {
        console.warn('DB lessons query error:', err.message);
      }
    }
    let lessons = Array.from(memCurriculumLessons.values());
    if (unitId) {
      lessons = lessons.filter((l) => l.unitId === unitId);
    }
    res.json({ success: true, lessons });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/curriculum/lessons', async (req, res) => {
  try {
    const l = req.body;
    if (!l.id || !l.title || !l.unitId) {
      return res.status(400).json({ error: 'Missing lesson required fields' });
    }
    const lesson = {
      id: l.id,
      unitId: l.unitId,
      title: l.title,
      orderIndex: Number(l.orderIndex) || 1,
      contentType: l.contentType || 'TEXT',
      contentBody: l.contentBody || '',
      videoUrl: l.videoUrl || '',
      docUrl: l.docUrl || '',
      createdAt: l.createdAt || new Date().toISOString()
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO curriculum_lessons (id, unit_id, title, order_index, content_type, content_body, video_url, doc_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            order_index = EXCLUDED.order_index,
            content_type = EXCLUDED.content_type,
            content_body = EXCLUDED.content_body,
            video_url = EXCLUDED.video_url,
            doc_url = EXCLUDED.doc_url`,
          [lesson.id, lesson.unitId, lesson.title, lesson.orderIndex, lesson.contentType, lesson.contentBody, lesson.videoUrl, lesson.docUrl]
        );
      } catch (err: any) {
        console.warn('DB lesson save error:', err.message);
      }
    }
    memCurriculumLessons.set(lesson.id, lesson);
    res.json({ success: true, lesson });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: SUBMISSIONS & GRADING ----------------- //
app.get('/api/submissions', async (req, res) => {
  try {
    const { assignmentId, studentUid } = req.query;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        let query = 'SELECT * FROM exam_submissions ORDER BY submitted_at DESC';
        const params: any[] = [];
        if (assignmentId && studentUid) {
          query = 'SELECT * FROM exam_submissions WHERE assignment_id = $1 AND student_uid = $2 ORDER BY submitted_at DESC';
          params.push(assignmentId, studentUid);
        } else if (assignmentId) {
          query = 'SELECT * FROM exam_submissions WHERE assignment_id = $1 ORDER BY submitted_at DESC';
          params.push(assignmentId);
        } else if (studentUid) {
          query = 'SELECT * FROM exam_submissions WHERE student_uid = $1 ORDER BY submitted_at DESC';
          params.push(studentUid);
        }
        const result = await pool.query(query, params);
        const submissions = result.rows.map((r) => ({
          id: r.id,
          assignmentId: r.assignment_id,
          assignmentTitle: r.assignment_title,
          studentUid: r.student_uid,
          studentName: r.student_name,
          studentClassName: r.student_class_name,
          answers: typeof r.answers === 'string' ? JSON.parse(r.answers) : (r.answers || {}),
          score: Number(r.score),
          maxScore: Number(r.max_score),
          status: r.status,
          timeSpentSeconds: r.time_spent_seconds,
          teacherFeedback: r.teacher_feedback || '',
          manualScores: typeof r.manual_scores === 'string' ? JSON.parse(r.manual_scores) : (r.manual_scores || {}),
          questionFeedbacks: typeof r.question_feedbacks === 'string' ? JSON.parse(r.question_feedbacks) : (r.question_feedbacks || {}),
          submittedAt: r.submitted_at
        }));
        return res.json({ success: true, submissions });
      } catch (err: any) {
        console.warn('DB submissions query error:', err.message);
      }
    }

    let list = Array.from(memSubmissions.values());
    if (assignmentId) {
      list = list.filter((s) => s.assignmentId === assignmentId);
    }
    if (studentUid) {
      list = list.filter((s) => s.studentUid === studentUid);
    }
    res.json({ success: true, submissions: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions', async (req, res) => {
  try {
    const s = req.body;
    if (!s.assignmentId || !s.studentUid) {
      return res.status(400).json({ error: 'Missing required submission fields' });
    }

    const subId = s.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const submission = {
      id: subId,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignmentTitle || 'Bài kiểm tra',
      studentUid: s.studentUid,
      studentName: s.studentName || 'Học sinh',
      studentClassName: s.studentClassName || '10A1',
      answers: s.answers || {},
      score: Number(s.score) || 0,
      maxScore: Number(s.maxScore) || 10.0,
      status: s.status || 'GRADED',
      timeSpentSeconds: Number(s.timeSpentSeconds) || 0,
      teacherFeedback: s.teacherFeedback || '',
      manualScores: s.manualScores || {},
      questionFeedbacks: s.questionFeedbacks || {},
      submittedAt: s.submittedAt || new Date().toISOString()
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO exam_submissions (
            id, assignment_id, assignment_title, student_uid, student_name, student_class_name,
            answers, score, max_score, status, time_spent_seconds, teacher_feedback, manual_scores, question_feedbacks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            score = EXCLUDED.score,
            status = EXCLUDED.status,
            teacher_feedback = EXCLUDED.teacher_feedback,
            manual_scores = EXCLUDED.manual_scores,
            question_feedbacks = EXCLUDED.question_feedbacks`,
          [
            submission.id,
            submission.assignmentId,
            submission.assignmentTitle,
            submission.studentUid,
            submission.studentName,
            submission.studentClassName,
            JSON.stringify(submission.answers),
            submission.score,
            submission.maxScore,
            submission.status,
            submission.timeSpentSeconds,
            submission.teacherFeedback,
            JSON.stringify(submission.manualScores),
            JSON.stringify(submission.questionFeedbacks)
          ]
        );
      } catch (err: any) {
        console.warn('DB submission insert error:', err.message);
      }
    }
    memSubmissions.set(submission.id, submission);
    res.json({ success: true, submission });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/submissions/:id/grade', async (req, res) => {
  try {
    const { id } = req.params;
    const { manualScores = {}, teacherFeedback = '', questionFeedbacks = {}, finalScore } = req.body;

    let sub = memSubmissions.get(id);
    if (!sub) {
      return res.status(404).json({ error: 'Không tìm thấy bài làm học sinh!' });
    }

    sub.manualScores = manualScores;
    sub.teacherFeedback = teacherFeedback;
    sub.questionFeedbacks = questionFeedbacks;
    if (typeof finalScore === 'number') {
      sub.score = Number(finalScore.toFixed(2));
    }
    sub.status = 'GRADED';

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `UPDATE exam_submissions
           SET score = $1, status = 'GRADED', teacher_feedback = $2, manual_scores = $3, question_feedbacks = $4
           WHERE id = $5`,
          [sub.score, sub.teacherFeedback, JSON.stringify(sub.manualScores), JSON.stringify(sub.questionFeedbacks), id]
        );
      } catch (err: any) {
        console.warn('DB update grade error:', err.message);
      }
    }
    memSubmissions.set(id, sub);

    res.json({ success: true, message: 'Đã lưu điểm và nhận xét của giáo viên thành công!', submission: sub });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: QUESTION BANK ----------------- //
app.get('/api/question-bank', async (req, res) => {
  try {
    const { grade, difficulty } = req.query;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        const query = 'SELECT * FROM question_bank ORDER BY created_at DESC';
        const result = await pool.query(query);
        const questions = result.rows.map((r) => ({
          id: r.id,
          teacherUid: r.teacher_uid,
          subject: r.subject,
          grade: r.grade,
          topic: r.topic,
          difficulty: r.difficulty,
          question: typeof r.question === 'string' ? JSON.parse(r.question) : r.question,
          createdAt: r.created_at
        }));
        return res.json({ success: true, questions });
      } catch (err: any) {
        console.warn('DB question_bank query error:', err.message);
      }
    }
    let list = Array.from(memQuestionBank.values());
    if (grade) list = list.filter((q) => q.grade === Number(grade));
    if (difficulty) list = list.filter((q) => q.difficulty === difficulty);
    res.json({ success: true, questions: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/question-bank', async (req, res) => {
  try {
    const item = req.body;
    if (!item.id || !item.question) {
      return res.status(400).json({ error: 'Missing question bank data' });
    }
    const qbItem = {
      id: item.id,
      teacherUid: item.teacherUid || 'unknown_teacher',
      subject: item.subject || 'Tiếng Anh',
      grade: Number(item.grade) || 10,
      topic: item.topic || 'Tổng hợp',
      difficulty: item.difficulty || 'MEDIUM',
      question: item.question,
      createdAt: item.createdAt || new Date().toISOString()
    };

    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO question_bank (id, teacher_uid, subject, grade, topic, difficulty, question)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET
            grade = EXCLUDED.grade,
            topic = EXCLUDED.topic,
            difficulty = EXCLUDED.difficulty,
            question = EXCLUDED.question`,
          [qbItem.id, qbItem.teacherUid, qbItem.subject, qbItem.grade, qbItem.topic, qbItem.difficulty, JSON.stringify(qbItem.question)]
        );
      } catch (err: any) {
        console.warn('DB question bank save error:', err.message);
      }
    }
    memQuestionBank.set(qbItem.id, qbItem);
    res.json({ success: true, item: qbItem });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/question-bank/batch', async (req, res) => {
  try {
    const list = Array.isArray(req.body) ? req.body : req.body.questions || [];
    for (const item of list) {
      if (item.id && item.question) {
        memQuestionBank.set(item.id, item);
      }
    }
    res.json({ success: true, count: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/question-bank/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query('DELETE FROM question_bank WHERE id = $1', [id]);
      } catch (err: any) {
        console.warn('DB question bank delete error:', err.message);
      }
    }
    memQuestionBank.delete(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: THEMES ----------------- //
app.get('/api/themes/:uid', (req, res) => {
  const { uid } = req.params;
  const theme = memUserThemes.get(uid) || {
    mode: 'dark',
    preset: 'navy',
    style: '3d',
    examFocusMode: true,
    bgBlur: 0,
    bgOpacity: 100
  };
  res.json({ success: true, theme });
});

app.post('/api/themes/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const theme = req.body;
    memUserThemes.set(uid, theme);
    if (pool && getDatabaseStatus().isConnected) {
      try {
        await pool.query(
          `INSERT INTO user_themes (uid, theme_config) VALUES ($1, $2)
           ON CONFLICT (uid) DO UPDATE SET theme_config = EXCLUDED.theme_config, updated_at = NOW()`,
          [uid, JSON.stringify(theme)]
        );
      } catch (err: any) {
        console.warn('DB user theme save error:', err.message);
      }
    }
    res.json({ success: true, theme });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- EDTECH: AI QUESTION GENERATION ENGINE ----------------- //
app.post('/api/ai/generate-questions', (req, res) => {
  try {
    const {
      topic = 'Tổng hợp ngữ pháp',
      grade = 10,
      count = 3,
      questionType = 'ALL',
      difficulty = 'MEDIUM'
    } = req.body;

    const generated: any[] = [];
    const types: string[] = questionType === 'ALL'
      ? ['SINGLE_CHOICE', 'FILL_IN_BLANK', 'TRUE_FALSE', 'MATCHING', 'DRAG_DROP', 'SHORT_ANSWER']
      : [questionType];

    for (let i = 0; i < Math.min(10, Math.max(1, count)); i++) {
      const currentType = types[i % types.length];
      const qId = `ai_gen_${Date.now()}_${i + 1}`;

      if (currentType === 'SINGLE_CHOICE') {
        generated.push({
          id: qId,
          type: 'SINGLE_CHOICE',
          question: `[AI] Chọn đáp án đúng nhất liên quan đến chủ điểm "${topic}" (Lớp ${grade}): Many students found the exercise difficult, but Nam managed to ______ it.`,
          options: ['complete', 'completion', 'completely', 'completing'],
          correctIndex: 0,
          explanation: 'Sau động từ "manage to" ta cần một động từ nguyên mẫu không "to" (V-infinitive): "manage to do something".',
          points: 1.0,
          difficulty,
          topic,
          grade: Number(grade)
        });
      } else if (currentType === 'TRUE_FALSE') {
        generated.push({
          id: qId,
          type: 'TRUE_FALSE',
          question: `[AI - Đúng / Sai] Trong câu điều kiện loại 2, mệnh đề "if" sử dụng thì quá khứ đơn, mệnh đề chính sử dụng "would + V-inf". Nhận định này Đúng hay Sai?`,
          isTrue: true,
          explanation: 'Chính xác! Công thức câu điều kiện loại 2: If + S + V2/ed (were), S + would/could + V-inf.',
          points: 1.0,
          difficulty,
          topic,
          grade: Number(grade)
        });
      } else if (currentType === 'FILL_IN_BLANK') {
        generated.push({
          id: qId,
          type: 'FILL_IN_BLANK',
          question: `[AI - Điền từ] If she [blank1] harder, she would pass the English examination with flying colors.`,
          blanks: [
            { id: 'blank1', correctAnswers: ['studied', 'had studied'], placeholder: 'dạng đúng của study' }
          ],
          explanation: 'Câu điều kiện loại 2 diễn tả tình huống không có thật ở hiện tại, mệnh đề if chia thì quá khứ đơn (studied).',
          points: 1.5,
          difficulty,
          topic,
          grade: Number(grade)
        });
      } else if (currentType === 'DRAG_DROP') {
        generated.push({
          id: qId,
          type: 'DRAG_DROP',
          question: `[AI - Kéo thả sắp xếp] Sắp xếp các cụm từ sau để tạo thành câu hoàn chỉnh đúng cấu trúc:`,
          dragItems: ['She has lived', 'in Hanoi', 'since 2020', 'with her family'],
          correctOrder: ['She has lived', 'in Hanoi', 'with her family', 'since 2020'],
          explanation: 'Trật tự câu: Chủ ngữ + Động từ + Nơi chốn + Đối tượng cùng làm + Thời gian mốc.',
          points: 2.0,
          difficulty,
          topic,
          grade: Number(grade)
        });
      } else if (currentType === 'MATCHING') {
        generated.push({
          id: qId,
          type: 'MATCHING',
          question: `[AI - Nối cặp] Nối cụm từ vựng tiếng Anh với nghĩa tiếng Việt tương ứng:`,
          pairs: [
            { id: 'p1', left: 'Take responsibility', right: 'Chịu trách nhiệm' },
            { id: 'p2', left: 'Solve problem', right: 'Giải quyết vấn đề' },
            { id: 'p3', left: 'Strengthen bonds', right: 'Thắt chặt tình cảm gắn kết' }
          ],
          explanation: 'Đây là các collocations quan trọng trong chương trình tiếng Anh phổ thông.',
          points: 2.0,
          difficulty,
          topic,
          grade: Number(grade)
        });
      } else {
        generated.push({
          id: qId,
          type: 'SHORT_ANSWER',
          question: `[AI - Tự luận ngắn] Viết một câu hoàn chỉnh (tối thiểu 8 từ) sử dụng thì Hiện Tại Hoàn Thành miêu tả một thói quen hoặc thành tựu của bạn trong chủ điểm "${topic}".`,
          sampleAnswer: 'I have learned English online every day to expand my vocabulary.',
          rubricNotes: 'Đúng thì Present Perfect (S + have/has + V3/ed), câu có nghĩa rõ ràng, đúng ngữ pháp.',
          points: 2.0,
          difficulty,
          topic,
          grade: Number(grade)
        });
      }
    }

    res.json({
      success: true,
      topic,
      count: generated.length,
      questions: generated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
interface CallPeer {
  ws: WebSocket;
  uid: string;
  displayName: string;
  role: string;
  avatarColor: string;
  isMicOn: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
}

const callRooms = new Map<string, Map<string, CallPeer>>();

function setupCallWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws/call' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomCode: string | null = null;
    let currentUid: string | null = null;

    ws.on('message', (rawData: any) => {
      try {
        const data = JSON.parse(rawData.toString());
        const { type } = data;

        if (type === 'join-room') {
          const { roomCode, user } = data;
          if (!roomCode || !user || !user.uid) return;

          currentRoomCode = roomCode;
          currentUid = user.uid;

          if (!callRooms.has(roomCode)) {
            callRooms.set(roomCode, new Map());
          }
          const room = callRooms.get(roomCode)!;

          const peer: CallPeer = {
            ws,
            uid: user.uid,
            displayName: user.displayName || 'Thành Viên',
            role: user.role || 'STUDENT',
            avatarColor: user.avatarColor || '#00E5FF',
            isMicOn: !!data.isMicOn,
            isCameraOn: !!data.isCameraOn,
            isScreenSharing: false,
            joinedAt: Date.now()
          };

          // Inform existing peers in this room
          room.forEach((existingPeer, existingUid) => {
            if (existingUid !== user.uid && existingPeer.ws.readyState === WebSocket.OPEN) {
              existingPeer.ws.send(
                JSON.stringify({
                  type: 'peer-joined',
                  peer: {
                    uid: peer.uid,
                    displayName: peer.displayName,
                    role: peer.role,
                    avatarColor: peer.avatarColor,
                    isMicOn: peer.isMicOn,
                    isCameraOn: peer.isCameraOn,
                    isScreenSharing: peer.isScreenSharing
                  }
                })
              );
            }
          });

          room.set(user.uid, peer);

          // Send current peers to the joiner
          const existingPeersList = Array.from(room.values())
            .filter((p) => p.uid !== user.uid)
            .map((p) => ({
              uid: p.uid,
              displayName: p.displayName,
              role: p.role,
              avatarColor: p.avatarColor,
              isMicOn: p.isMicOn,
              isCameraOn: p.isCameraOn,
              isScreenSharing: p.isScreenSharing
            }));

          ws.send(
            JSON.stringify({
              type: 'room-state',
              roomCode,
              peers: existingPeersList
            })
          );
        } else if (type === 'signal') {
          // Relay WebRTC signal (offer/answer/ice-candidate) to target peer
          const { targetUid, signal, fromUid, fromUser } = data;
          if (currentRoomCode && callRooms.has(currentRoomCode)) {
            const targetPeer = callRooms.get(currentRoomCode)?.get(targetUid);
            if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
              targetPeer.ws.send(
                JSON.stringify({
                  type: 'signal',
                  fromUid: fromUid || currentUid,
                  fromUser,
                  signal
                })
              );
            }
          }
        } else if (type === 'media-status') {
          const { isMicOn, isCameraOn, isScreenSharing } = data;
          if (currentRoomCode && currentUid && callRooms.has(currentRoomCode)) {
            const peer = callRooms.get(currentRoomCode)?.get(currentUid);
            if (peer) {
              if (typeof isMicOn === 'boolean') peer.isMicOn = isMicOn;
              if (typeof isCameraOn === 'boolean') peer.isCameraOn = isCameraOn;
              if (typeof isScreenSharing === 'boolean') peer.isScreenSharing = isScreenSharing;

              const broadcastPayload = JSON.stringify({
                type: 'media-status-update',
                uid: currentUid,
                isMicOn: peer.isMicOn,
                isCameraOn: peer.isCameraOn,
                isScreenSharing: peer.isScreenSharing
              });

              callRooms.get(currentRoomCode)?.forEach((p) => {
                if (p.ws.readyState === WebSocket.OPEN) {
                  p.ws.send(broadcastPayload);
                }
              });
            }
          }
        } else if (type === 'chat-message') {
          if (currentRoomCode && callRooms.has(currentRoomCode)) {
            const broadcastPayload = JSON.stringify({
              type: 'chat-message',
              message: data.message
            });
            callRooms.get(currentRoomCode)?.forEach((p) => {
              if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(broadcastPayload);
              }
            });
          }
        } else if (type === 'leave-room') {
          handleLeave();
        }
      } catch (err) {
        console.warn('[WS Call] Message parse error:', err);
      }
    });

    const handleLeave = () => {
      if (currentRoomCode && currentUid && callRooms.has(currentRoomCode)) {
        const room = callRooms.get(currentRoomCode)!;
        room.delete(currentUid);

        const leavePayload = JSON.stringify({
          type: 'peer-left',
          uid: currentUid
        });
        room.forEach((p) => {
          if (p.ws.readyState === WebSocket.OPEN) {
            p.ws.send(leavePayload);
          }
        });

        if (room.size === 0) {
          callRooms.delete(currentRoomCode);
        }
        currentRoomCode = null;
        currentUid = null;
      }
    };

    ws.on('close', handleLeave);
    ws.on('error', handleLeave);
  });
}

// ----------------- VITE / STATIC SERVING ----------------- //
async function startServer() {
  const server = http.createServer(app);
  setupCallWebSocket(server);

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexPath);

  if (isProduction && hasDist) {
    console.log('[Server] Đang phục vụ gói tĩnh Production từ:', distPath);
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
        return res.sendFile(distIndexPath, (err) => {
          if (err) {
            console.error('[Server] Lỗi gửi dist/index.html:', err);
            next(err);
          }
        });
      }
      next();
    });
  } else {
    if (isProduction) {
      console.warn('[Server] ⚠️ CẢNH BÁO: Không tìm thấy dist/index.html trên máy chủ Render.');
      console.warn('[Server] -> Đang tự động kích hoạt Vite on-the-fly middleware để ứng dụng hoạt động ngay mà không bị lỗi ENOENT!');
    } else {
      console.log('[Server] Đang chạy chế độ Development với Vite middleware.');
    }

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
      const url = req.originalUrl;
      try {
        let template = await fs.promises.readFile(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Tap Hunter] Server listening on http://0.0.0.0:${port}`);
    console.log(`[Neon DB] Status: ${getDatabaseStatus().message}`);
    console.log(`[WS Call] Real-time calling server ready on /ws/call`);
  });
}

startServer().catch((err) => {
  console.error('[Tap Hunter] Failed to start server:', err);
});
