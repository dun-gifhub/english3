export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type QuestionType =
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_IN_BLANK'
  | 'DRAG_DROP_CLOZE' // Kéo thả điền vào ô trống từ ngân hàng từ
  | 'DRAG_DROP'
  | 'MATCHING'
  | 'SHORT_ANSWER'
  | 'ESSAY'
  | 'READING_COMPREHENSION';

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface BlankItem {
  id: string;
  correctAnswers: string[]; // Variations accepted (e.g. ["went", "has gone"])
  placeholder?: string;
  caseSensitive?: boolean;
}

export interface DragDropClozeBlank {
  id: string; // e.g. "blank1", "blank2"
  label?: string; // e.g. "Ô trống 1"
  correctAnswer: string;
  acceptableAlternatives?: string[]; // Đáp án tương đương
  points?: number; // Điểm riêng cho từng ô trống
}

export interface DragTargetItem {
  id: string;
  label: string;
  correctItem: string;
}

export interface CustomQuestion {
  id: string;
  type?: QuestionType;
  question: string;
  points?: number; // Default 1.0 or custom
  difficulty?: QuestionDifficulty;
  topic?: string;
  sourceName?: string;
  grade?: number;
  explanation?: string;

  // Multiple Choice / True-False
  options?: string[];
  correctIndex?: number; // Single choice
  correctIndices?: number[]; // Multiple choice
  isTrue?: boolean; // True / False

  // Fill in blank
  blanks?: BlankItem[];

  // Drag and Drop Cloze (Kéo thả điền vào ô trống)
  clozeContent?: string;
  clozeBlanks?: DragDropClozeBlank[];
  bankOptions?: string[]; // Ngân hàng từ: đáp án đúng + từ nhiễu
  distractors?: string[]; // Phương án nhiễu
  allowReuseOptions?: boolean; // Cho phép dùng lại đáp án
  shuffleBankOptions?: boolean; // Đảo thứ tự hiển thị ngẫu nhiên
  caseSensitive?: boolean; // Phân biệt hoa thường

  // Drag and Drop (Sequencing)
  dragItems?: string[];
  dragTargets?: DragTargetItem[];
  correctOrder?: string[]; // For sequencing

  // Matching
  pairs?: MatchingPair[];

  // Reading & Grouped
  passage?: string;
  subQuestions?: CustomQuestion[];

  // Essay / Short Answer
  sampleAnswer?: string;
  rubricNotes?: string;

  // Media
  imageUrl?: string;
  audioUrl?: string;
  formula?: string;
}

export type ExamSourceType =
  | 'THPT_QUOC_GIA'
  | 'HOC_SINH_GIOI'
  | 'CHUYEN_CAP_3'
  | 'CAMBRIDGE_DGNL'
  | 'SGK_GLOBAL_SUCCESS'
  | 'IELTS_FOUNDATION';

export interface ExamSourceMeta {
  type: ExamSourceType;
  sourceName: string;
  badge: string;
  description: string;
  yearCitation?: string;
}

export interface TeacherAssignment {
  id: string;
  teacherUid: string;
  teacherName: string;
  grade: number;
  subject?: string;
  title: string;
  description: string;
  questions: CustomQuestion[];
  createdAt: number;
  updatedAt?: number;
  sourceType?: ExamSourceType;

  // Exam Administration Controls
  timeLimitMinutes?: number; // 0 = unlimited practice
  maxAttempts?: number; // 0 = unlimited
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showResultsImmediately?: boolean;
  allowLateSubmission?: boolean;
  assignedClassIds?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  unitId?: string;
  totalPoints?: number;
  passScore?: number;
}

export interface Classroom {
  id: string;
  name: string;
  grade: number;
  subject: string;
  room: string;
  joinCode: string;
  teacherUid: string;
  teacherName: string;
  description?: string;
  studentCount?: number;
  createdAt: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  studentUid: string;
  studentName: string;
  studentEmail?: string;
  customClassName?: string;
  joinedAt: string;
  avgScore?: number;
  submissionsCount?: number;
}

export interface CurriculumUnit {
  id: string;
  grade: number;
  subject: string;
  semester: number; // 1 or 2
  chapterName: string;
  unitNumber: number;
  title: string;
  description: string;
  learningObjectives?: string[];
  durationMinutes?: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  teacherUid?: string;
  createdAt: string;
  lessonsCount?: number;
  examsCount?: number;
}

export interface CurriculumLesson {
  id: string;
  unitId: string;
  title: string;
  orderIndex: number;
  contentType: 'TEXT' | 'VIDEO' | 'DOC' | 'PRACTICE';
  contentBody: string;
  videoUrl?: string;
  docUrl?: string;
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentUid: string;
  studentName: string;
  studentClassName: string;
  answers: Record<string, any>;
  score: number;
  maxScore: number;
  status: 'GRADED' | 'NEEDS_GRADING';
  timeSpentSeconds?: number;
  submittedAt: string;
  teacherFeedback?: string;
  manualScores?: Record<string, number>;
  questionFeedbacks?: Record<string, string>;
}

export interface QuestionBankItem {
  id: string;
  teacherUid: string;
  subject: string;
  grade: number;
  topic: string;
  difficulty: QuestionDifficulty;
  question: CustomQuestion;
  createdAt: string;
}

export interface ThemeConfig {
  mode: 'dark' | 'light' | 'system' | 'custom';
  preset: 'navy' | 'slate' | 'minimal' | 'canvas' | 'cyberpunk' | 'warm' | 'custom';
  style: '3d' | 'minimal' | 'handdrawn';
  primaryColor?: string; // Accent color hex (e.g. #00E5FF, #38BDF8, #4ADE80, #F59E0B, #EC4899)
  backgroundColor?: string; // Custom background color
  surfaceColor?: string; // Card / surface background
  textColor?: string; // Main text color
  customBgImage?: string; // Image URL, data URL, or preset wallpaper
  bgBlur?: number; // 0..20
  bgOpacity?: number; // 10..100
  fontScale?: 'small' | 'medium' | 'large'; // 90%, 100%, 115%
  borderRadius?: 'rounded-none' | 'rounded-lg' | 'rounded-2xl' | 'rounded-3xl';
  shadowLevel?: 'none' | 'low' | 'medium' | 'high';
  examFocusMode?: boolean;
}

export interface OnlineUser {
  uid: string;
  displayName: string;
  customClassName: string;
  role: UserRole;
  grade: number;
  lastActive: number;
  currentActivity?: string;
  avatarColor?: string;
  friendCode?: string;
  level?: number;
  xp?: number;
  streakDays?: number;
}

export interface AdminSettings {
  adminEmail: string;
  adminPassword: string;
  teacherPasscode: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  customClassName: string; // e.g. "10A1", "11A2"
  baseGrade: number; // 6..12
  registeredAcademicYear: number; // e.g. 2026
  friendCode: string;
  role: UserRole;
  selectedGrade: number; // 6..12
  level: number;
  xp: number;
  highestScore: number;
  monthlyScore: number;
  lastScoreMonthKey: string; // e.g. "2026-10"
  streakDays: number;
  avatarColor: string; // Hex or CSS color, default "#00E5FF"
  status: string;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
  themeConfig?: ThemeConfig;
}

export interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  grade: number;
  unitNumber: number;
  distractorsVi: string[];
  partOfSpeech?: string;
}

export interface GrammarLesson {
  id: string;
  grade: number;
  title: string;
  formula: string;
  explanationVi: string;
  exampleEn: string;
  exampleVi: string;
  usageNotes: string;
}

export interface UnitTopic {
  id: string;
  grade: number;
  unitNumber: number;
  title: string;
  description: string;
  difficulty: string; // "Cơ bản", "Trung cấp", "Nâng cao", "Nâng cao GV"
  words: WordItem[];
  grammarLesson?: GrammarLesson | null;
  bestScore: number;
  isCompleted: boolean;
}

export interface Subject {
  id: string;
  grade: number;
  title: string;
  subtitle: string;
  iconCategory: string;
  units: UnitTopic[];
}

export interface DictionaryEntry {
  wordEn: string;
  phonetic: string;
  partOfSpeech: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  synonyms: string[];
  antonyms?: string[];
  definitionEn?: string;
}

export interface Friend {
  uid: string;
  friendCode: string;
  displayName: string;
  status: string;
  isOnline: boolean;
  currentActivity: string;
  avatarColor: string;
  isSpeaking?: boolean;
}

export interface CallRoom {
  roomId: string;
  roomCode: string;
  title: string;
  hostName: string;
  participants: Friend[];
  currentWordTopic: string;
  isMicOn: boolean;
  isScreenSharing?: boolean;
  isCameraOn?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  className: string;
  score: number;
  monthlyScore: number;
  level: number;
  grade: number;
  badge: string;
  avatarColor: string;
}

export type GameDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  key: GameDifficulty;
  label: string;
  fallDurationMs: number;
  description: string;
}
