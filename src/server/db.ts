import { Pool } from 'pg';

// Support DATABASE_URL for Neon PostgreSQL (e.g. postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require)
let rawConnectionString = (process.env.DATABASE_URL || '').trim();

let pool: Pool | null = null;
let isNeonConnected = false;
let connectionErrorMessage: string | null = null;
let isPlaceholder = false;

// Check if user set the example placeholder from .env.example
if (
  rawConnectionString &&
  (rawConnectionString.includes('endpoint.neon.tech') ||
   rawConnectionString.includes('user:password@') ||
   rawConnectionString.includes('ep-example'))
) {
  isPlaceholder = true;
  connectionErrorMessage = 'DATABASE_URL đang sử dụng tên miền ví dụ ("endpoint.neon.tech"). Vui lòng vào console.neon.tech, copy chuỗi kết nối thực tế của dự án bạn và cập nhật vào biến môi trường trên Render.';
  console.warn('⚠️ [Neon DB] CẢNH BÁO CẤU HÌNH:');
  console.warn('   DATABASE_URL trên máy chủ đang chứa hostname mẫu ("endpoint.neon.tech").');
  console.warn('   -> Hãy vào https://console.neon.tech -> Copy Connection String thật (ví dụ: postgresql://neondb_owner:***@ep-xyz.aws.neon.tech/neondb?sslmode=require)');
  console.warn('   -> Cập nhật vào mục Environment của Render Web Service.');
  console.warn('   -> Ứng dụng hiện đang chạy an toàn bằng bộ lưu trữ bộ nhớ (in-memory) để đảm bảo không bị gián đoạn!');
} else if (rawConnectionString) {
  try {
    // Format connection string with uselibpqcompat to suppress node-pg warning:
    // "SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'"
    let cleanUrl = rawConnectionString;
    if (cleanUrl.includes('sslmode=require') && !cleanUrl.includes('uselibpqcompat')) {
      cleanUrl += cleanUrl.includes('?') ? '&uselibpqcompat=true' : '?uselibpqcompat=true';
    }

    pool = new Pool({
      connectionString: cleanUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 7000
    });
  } catch (err: any) {
    console.error('Failed to initialize Neon PostgreSQL pool:', err);
    connectionErrorMessage = err.message || 'Database initialization error';
  }
} else {
  connectionErrorMessage = 'DATABASE_URL chưa được thiết lập. Ứng dụng đang hoạt động bằng bộ nhớ cục bộ. Thêm DATABASE_URL để kết nối Neon PostgreSQL.';
}

export async function initDatabase() {
  if (isPlaceholder) {
    console.log('[Neon DB] Bỏ qua kết nối Neon vì hostname là placeholder ví dụ. Đang chạy fallback an toàn.');
    return false;
  }

  if (!pool) {
    console.log('[Neon DB] No DATABASE_URL provided. App running with local fallback.');
    return false;
  }

  try {
    const client = await pool.connect();
    try {
      console.log('[Neon DB] Successfully connected to Neon PostgreSQL. Initializing tables...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(128) PRIMARY KEY,
          email VARCHAR(255),
          display_name VARCHAR(255) NOT NULL,
          custom_class_name VARCHAR(50),
          base_grade INT DEFAULT 10,
          registered_academic_year INT DEFAULT 2026,
          friend_code VARCHAR(50) UNIQUE,
          role VARCHAR(20) DEFAULT 'STUDENT',
          selected_grade INT DEFAULT 10,
          level INT DEFAULT 1,
          xp INT DEFAULT 0,
          highest_score INT DEFAULT 0,
          monthly_score INT DEFAULT 0,
          last_score_month_key VARCHAR(20),
          streak_days INT DEFAULT 1,
          avatar_color VARCHAR(30),
          status VARCHAR(255),
          pin VARCHAR(100),
          approval_status VARCHAR(30) DEFAULT 'APPROVED',
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Safe migrations for existing users table
        ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'APPROVED';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

        CREATE TABLE IF NOT EXISTS assignments (
          id VARCHAR(128) PRIMARY KEY,
          teacher_uid VARCHAR(128),
          teacher_name VARCHAR(255),
          grade INT,
          subject VARCHAR(100) DEFAULT 'Tiếng Anh',
          title VARCHAR(255),
          description TEXT,
          questions JSONB,
          time_limit_minutes INT DEFAULT 45,
          max_attempts INT DEFAULT 1,
          shuffle_questions BOOLEAN DEFAULT true,
          shuffle_options BOOLEAN DEFAULT true,
          show_results_immediately BOOLEAN DEFAULT true,
          allow_late_submission BOOLEAN DEFAULT false,
          assigned_class_ids JSONB DEFAULT '[]'::jsonb,
          status VARCHAR(30) DEFAULT 'PUBLISHED',
          unit_id VARCHAR(128),
          total_points NUMERIC(5,2) DEFAULT 10.0,
          pass_score NUMERIC(5,2) DEFAULT 5.0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Safe column migrations for assignments
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS subject VARCHAR(100) DEFAULT 'Tiếng Anh';
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time_limit_minutes INT DEFAULT 45;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_attempts INT DEFAULT 1;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT true;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT true;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_late_submission BOOLEAN DEFAULT false;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assigned_class_ids JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'PUBLISHED';
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS unit_id VARCHAR(128);
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_points NUMERIC(5,2) DEFAULT 10.0;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS pass_score NUMERIC(5,2) DEFAULT 5.0;
        ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

        -- Classrooms
        CREATE TABLE IF NOT EXISTS classes (
          id VARCHAR(128) PRIMARY KEY,
          teacher_uid VARCHAR(128) NOT NULL,
          teacher_name VARCHAR(255) NOT NULL,
          name VARCHAR(150) NOT NULL,
          grade INT DEFAULT 10,
          subject VARCHAR(100) DEFAULT 'Tiếng Anh',
          room VARCHAR(50),
          join_code VARCHAR(30) UNIQUE NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Class Members
        CREATE TABLE IF NOT EXISTS class_members (
          id VARCHAR(128) PRIMARY KEY,
          class_id VARCHAR(128) NOT NULL,
          student_uid VARCHAR(128) NOT NULL,
          student_name VARCHAR(255) NOT NULL,
          student_email VARCHAR(255),
          custom_class_name VARCHAR(50),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(class_id, student_uid)
        );

        -- Curriculum Units
        CREATE TABLE IF NOT EXISTS curriculum_units (
          id VARCHAR(128) PRIMARY KEY,
          grade INT DEFAULT 10,
          subject VARCHAR(100) DEFAULT 'Tiếng Anh',
          semester INT DEFAULT 1,
          chapter_name VARCHAR(255),
          unit_number INT DEFAULT 1,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          learning_objectives JSONB,
          duration_minutes INT DEFAULT 90,
          status VARCHAR(30) DEFAULT 'PUBLISHED',
          teacher_uid VARCHAR(128),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Curriculum Lessons
        CREATE TABLE IF NOT EXISTS curriculum_lessons (
          id VARCHAR(128) PRIMARY KEY,
          unit_id VARCHAR(128) NOT NULL,
          title VARCHAR(255) NOT NULL,
          order_index INT DEFAULT 1,
          content_type VARCHAR(30) DEFAULT 'TEXT',
          content_body TEXT,
          video_url VARCHAR(500),
          doc_url VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Exam Submissions & Results
        CREATE TABLE IF NOT EXISTS exam_submissions (
          id VARCHAR(128) PRIMARY KEY,
          assignment_id VARCHAR(128) NOT NULL,
          assignment_title VARCHAR(255),
          student_uid VARCHAR(128) NOT NULL,
          student_name VARCHAR(255) NOT NULL,
          student_class_name VARCHAR(50),
          answers JSONB NOT NULL,
          score NUMERIC(5,2) DEFAULT 0,
          max_score NUMERIC(5,2) DEFAULT 10.0,
          status VARCHAR(30) DEFAULT 'GRADED',
          time_spent_seconds INT DEFAULT 0,
          teacher_feedback TEXT,
          manual_scores JSONB,
          question_feedbacks JSONB,
          submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Question Bank
        CREATE TABLE IF NOT EXISTS question_bank (
          id VARCHAR(128) PRIMARY KEY,
          teacher_uid VARCHAR(128) NOT NULL,
          subject VARCHAR(100) DEFAULT 'Tiếng Anh',
          grade INT DEFAULT 10,
          topic VARCHAR(150),
          difficulty VARCHAR(30) DEFAULT 'MEDIUM',
          question JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- User Themes
        CREATE TABLE IF NOT EXISTS user_themes (
          uid VARCHAR(128) PRIMARY KEY,
          theme_config JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS custom_words (
          id VARCHAR(128) PRIMARY KEY,
          word VARCHAR(100) NOT NULL,
          ipa VARCHAR(100),
          meaning TEXT NOT NULL,
          example TEXT,
          grade INT,
          unit_id VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS custom_grammar (
          id VARCHAR(128) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          grade INT,
          structure TEXT,
          usage TEXT,
          example TEXT,
          exercise JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS friends (
          id SERIAL PRIMARY KEY,
          user_uid VARCHAR(128) NOT NULL,
          friend_uid VARCHAR(128) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_uid, friend_uid)
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      isNeonConnected = true;
      connectionErrorMessage = null;
      console.log('[Neon DB] Tables verified/created successfully.');
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[Neon DB] Error connecting or initializing tables:', err);
    isNeonConnected = false;
    connectionErrorMessage = err.message || 'Neon connection error';
    return false;
  }
}

export function getDatabaseStatus() {
  return {
    isNeonConfigured: !!rawConnectionString && !isPlaceholder,
    isConnected: isNeonConnected,
    isNeonUrl: rawConnectionString ? rawConnectionString.includes('neon.tech') : false,
    isPlaceholder,
    message: isNeonConnected
      ? 'Đã kết nối cơ sở dữ liệu Neon PostgreSQL đám mây thành công!'
      : connectionErrorMessage || 'Chưa kết nối Neon database.'
  };
}

export { pool };
