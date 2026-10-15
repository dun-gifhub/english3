import React, { useState, useEffect } from 'react';
import { TeacherAssignment, CustomQuestion, ExamSubmission } from '../types';
import { useApp } from '../context/AppContext';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
  Trophy,
  Flame,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Send,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Eye
} from 'lucide-react';
import { DragDropClozePlayer } from '../components/DragDropClozePlayer';

interface AssignmentQuizScreenProps {
  assignment: TeacherAssignment;
  onFinish: (xpEarned: number) => void;
  onBack: () => void;
}

export const AssignmentQuizScreen: React.FC<AssignmentQuizScreenProps> = ({
  assignment,
  onFinish,
  onBack
}) => {
  const { currentUser, submitStudentExam, themeConfig } = useApp();

  const questions = assignment.questions || [];
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  // Answers map: { [questionId or index]: value }
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem(`exam_draft_${assignment.id}_${currentUser?.uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(() => {
    return (assignment.timeLimitMinutes || 45) * 60;
  });
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Active question
  const currentQ = questions[currentQIndex] || questions[0];
  const qKey = currentQ?.id || `q_${currentQIndex}`;

  // Auto-save local draft
  useEffect(() => {
    if (!isSubmitted && currentUser) {
      try {
        localStorage.setItem(`exam_draft_${assignment.id}_${currentUser.uid}`, JSON.stringify(userAnswers));
      } catch {}
    }
  }, [userAnswers, isSubmitted, assignment.id, currentUser]);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted || !assignment.timeLimitMinutes || assignment.timeLimitMinutes === 0) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, assignment.timeLimitMinutes]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Answer handler
  const setAnswer = (val: any) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qKey]: val
    }));
  };

  // Toggle flag for review
  const toggleFlag = (idx: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Final submit handler with automatic grading
  const handleSubmitQuiz = async () => {
    let earnedPoints = 0;
    const totalMax = assignment.totalPoints || 10.0;
    const defaultPointsPerQ = questions.length > 0 ? totalMax / questions.length : 1.0;
    let hasEssay = false;

    questions.forEach((q, idx) => {
      const key = q.id || `q_${idx}`;
      const ans = userAnswers[key];
      const qPoints = Number(q.points) || defaultPointsPerQ;

      if (q.type === 'SINGLE_CHOICE' || !q.type) {
        if (ans === q.correctIndex) earnedPoints += qPoints;
      } else if (q.type === 'TRUE_FALSE') {
        if (ans === q.isTrue) earnedPoints += qPoints;
      } else if (q.type === 'MULTIPLE_CHOICE') {
        const uArr = Array.isArray(ans) ? [...ans].sort() : [];
        const cArr = Array.isArray(q.correctIndices) ? [...q.correctIndices].sort() : [];
        if (JSON.stringify(uArr) === JSON.stringify(cArr)) earnedPoints += qPoints;
      } else if (q.type === 'FILL_IN_BLANK' && q.blanks && typeof ans === 'object') {
        let correctBlanks = 0;
        q.blanks.forEach((b) => {
          const uVal = String(ans[b.id] || '').trim().toLowerCase();
          const accepted = (b.correctAnswers || []).map((x) => String(x).trim().toLowerCase());
          if (accepted.includes(uVal)) correctBlanks++;
        });
        if (q.blanks.length > 0) {
          earnedPoints += (correctBlanks / q.blanks.length) * qPoints;
        }
      } else if (q.type === 'MATCHING' && q.pairs && typeof ans === 'object') {
        let correctPairs = 0;
        q.pairs.forEach((p) => {
          if (ans[p.id] === p.right) correctPairs++;
        });
        if (q.pairs.length > 0) {
          earnedPoints += (correctPairs / q.pairs.length) * qPoints;
        }
      } else if (q.type === 'DRAG_DROP_CLOZE') {
        const clozeBlanks = q.clozeBlanks || [];
        if (clozeBlanks.length > 0 && typeof ans === 'object' && ans !== null) {
          let clozeScore = 0;
          const defaultPerBlank = qPoints / clozeBlanks.length;
          clozeBlanks.forEach((b) => {
            const bPoints = Number(b.points) || defaultPerBlank;
            const uVal = String(ans[b.id] || '').trim();
            const cVal = String(b.correctAnswer || '').trim();
            const alts = (b.acceptableAlternatives || []).map((x) => String(x).trim());
            const isMatch = q.caseSensitive
              ? uVal === cVal || alts.includes(uVal)
              : uVal.toLowerCase() === cVal.toLowerCase() ||
                alts.some((x) => x.toLowerCase() === uVal.toLowerCase());
            if (isMatch && uVal !== '') {
              clozeScore += bPoints;
            }
          });
          earnedPoints += Math.min(qPoints, clozeScore);
        }
      } else if (q.type === 'DRAG_DROP' && q.correctOrder && Array.isArray(ans)) {
        if (JSON.stringify(ans) === JSON.stringify(q.correctOrder)) earnedPoints += qPoints;
      } else if (q.type === 'ESSAY' || q.type === 'SHORT_ANSWER') {
        hasEssay = true;
      }
    });

    const finalScore = Math.min(totalMax, Number(earnedPoints.toFixed(2)));
    const xpReward = Math.round((finalScore / totalMax) * 150) + 50;

    const sub: ExamSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      studentUid: currentUser?.uid || 'guest_student',
      studentName: currentUser?.displayName || 'Học sinh',
      studentClassName: currentUser?.customClassName || '10A1',
      answers: userAnswers,
      score: finalScore,
      maxScore: totalMax,
      status: hasEssay ? 'NEEDS_GRADING' : 'GRADED',
      timeSpentSeconds: (assignment.timeLimitMinutes || 45) * 60 - timeRemainingSeconds,
      submittedAt: new Date().toISOString()
    };

    setSubmissionResult(sub);
    setIsSubmitted(true);
    setShowConfirmModal(false);

    try {
      localStorage.removeItem(`exam_draft_${assignment.id}_${currentUser?.uid}`);
    } catch {}

    await submitStudentExam(sub);
    onFinish(xpReward);

    if (finalScore >= totalMax * 0.5) {
      audioService.playVictoryFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  };

  // Matching helper state
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // Drag Drop sequencing tokens
  const currentAnswerList: string[] = Array.isArray(userAnswers[qKey]) ? userAnswers[qKey] : [];

  // Check how many questions are answered
  const answeredCount = questions.filter((q, idx) => {
    const key = q.id || `q_${idx}`;
    const ans = userAnswers[key];
    if (ans === undefined || ans === null || ans === '') return false;
    if (typeof ans === 'object' && Object.keys(ans).length === 0) return false;
    if (Array.isArray(ans) && ans.length === 0) return false;
    return true;
  }).length;

  // Render Post-Submission Screen
  if (isSubmitted && submissionResult) {
    const percent = Math.round((submissionResult.score / submissionResult.maxScore) * 100);
    const allowReview = assignment.showResultsImmediately ?? true;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 pt-2 text-[#F8F9FA]">
        {/* Result Summary Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#1B263B] border border-[#FFD166]/40 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFD166]/20 flex items-center justify-center text-[#FFD166]">
            <Trophy size={36} />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD166] block">
              BÁO CÁO KẾT QUẢ BÀI THI
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">{assignment.title}</h2>
            <p className="text-xs text-[#778DA9]">
              Lớp {assignment.grade} • Giáo viên: {assignment.teacherName}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 py-2">
            <div className="px-6 py-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E]">
              <span className="text-xs text-[#778DA9] block">Điểm Đạt Được</span>
              <span className={`text-3xl font-black ${percent >= 50 ? 'text-[#06D6A0]' : 'text-[#EF476F]'}`}>
                {submissionResult.score} / {submissionResult.maxScore} ({percent}%)
              </span>
            </div>

            <div className="px-6 py-3.5 rounded-2xl bg-[#131F2E] border border-[#27384E]">
              <span className="text-xs text-[#778DA9] block">Trạng Thái Chấm</span>
              <span
                className={`text-sm font-black block mt-1 ${
                  submissionResult.status === 'GRADED' ? 'text-[#06D6A0]' : 'text-[#FFD166]'
                }`}
              >
                {submissionResult.status === 'GRADED' ? 'Đã Chấm Điểm' : 'Chờ GV Chấm Tự Luận'}
              </span>
            </div>
          </div>

          {submissionResult.teacherFeedback && (
            <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-left max-w-xl mx-auto space-y-1">
              <span className="text-xs font-bold text-[#00E5FF] flex items-center gap-1.5">
                <Sparkles size={15} /> Nhận xét từ Giáo viên:
              </span>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{submissionResult.teacherFeedback}</p>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onBack}
              className="px-8 py-3 rounded-2xl bg-[#00E5FF] text-[#0D1B2A] font-black text-xs hover:bg-[#00E5FF]/90 transition shadow-lg shadow-[#00E5FF]/20"
            >
              Hoàn Tất & Trở Về Trang Chủ
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        {allowReview ? (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Eye size={18} className="text-[#00E5FF]" />
              Chi Tiết Bài Làm & Đáp Án Giải Thích
            </h3>

            {questions.map((q, idx) => {
              const key = q.id || `q_${idx}`;
              const userAns = userAnswers[key];

              return (
                <div key={key} className="p-5 rounded-2xl bg-[#1B263B] border border-[#27384E] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#27384E]">
                    <span className="font-bold text-xs text-[#00E5FF]">
                      Câu {idx + 1} ({q.points || 1.0} điểm)
                    </span>
                    <span className="text-[10px] text-[#778DA9] uppercase">{q.topic || 'Kiến thức chung'}</span>
                  </div>

                  <p className="text-sm font-bold text-white leading-relaxed">{q.question}</p>

                  {/* Options review */}
                  {(q.type === 'SINGLE_CHOICE' || !q.type) && (
                    <div className="space-y-1.5 pt-1">
                      {(q.options || []).map((opt, oIdx) => {
                        const isChosen = userAns === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              isCorrect
                                ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0] font-bold'
                                : isChosen
                                ? 'bg-[#EF476F]/20 border-[#EF476F] text-[#EF476F] font-bold'
                                : 'bg-[#131F2E] border-[#27384E] text-[#778DA9]'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              {opt}
                            </span>
                            {isCorrect && <Check size={14} className="text-[#06D6A0]" />}
                            {isChosen && !isCorrect && <X size={14} className="text-[#EF476F]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'TRUE_FALSE' && (
                    <div className="p-3 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs flex items-center justify-between">
                      <span className="text-[#778DA9]">
                        Bạn chọn: <strong className="text-white">{userAns ? 'ĐÚNG' : 'SAI'}</strong>
                      </span>
                      <span className="text-[#06D6A0] font-bold">
                        Đáp án đúng: {q.isTrue ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>
                  )}

                  {q.type === 'DRAG_DROP_CLOZE' && (
                    <div className="pt-1">
                      <DragDropClozePlayer
                        question={q}
                        value={typeof userAns === 'object' && userAns !== null ? userAns : {}}
                        isReadOnly={true}
                        showCorrectAnswers={true}
                      />
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs text-[#00E5FF] space-y-1">
                      <span className="font-bold block">Giải thích:</span>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-[#131F2E] border border-[#27384E] text-center text-xs text-[#778DA9]">
            Giáo viên đã cấu hình giữ bí mật đáp án và lời giải chi tiết cho đến khi toàn bộ lớp hoàn thành bài thi.
          </div>
        )}
      </div>
    );
  }

  // Active Exam Taking Screen
  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 pt-2 text-[#F8F9FA]">
      {/* Exam Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="p-2 rounded-xl bg-[#131F2E] border border-[#27384E] text-[#778DA9] hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">{assignment.title}</h2>
            <p className="text-xs text-[#778DA9]">
              Câu {currentQIndex + 1} / {questions.length} • Lớp {assignment.grade}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          {assignment.timeLimitMinutes && assignment.timeLimitMinutes > 0 ? (
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-black ${
                timeRemainingSeconds < 300
                  ? 'bg-[#EF476F]/20 border-[#EF476F] text-[#EF476F] animate-pulse'
                  : 'bg-[#131F2E] border-[#27384E] text-[#00E5FF]'
              }`}
            >
              <Clock size={15} />
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-[#131F2E] border border-[#27384E] text-xs font-bold text-[#06D6A0]">
              Luyện tập tự do
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06D6A0] text-[#0D1B2A] font-black text-xs hover:bg-[#06D6A0]/90 transition shadow-lg shadow-[#06D6A0]/20"
          >
            <Send size={15} />
            <span>Nộp Bài</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Question Content & Navigation Palette */}
      <div className="grid grid-cols-12 gap-5">
        {/* Left: Active Question Area (8 cols on lg) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-xl space-y-5">
            {/* Question Sub-header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#27384E]">
              <span className="text-xs font-black text-[#00E5FF] uppercase tracking-wider">
                CÂU HỎI {currentQIndex + 1}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#FFD166]">{currentQ.points || 1.0} Điểm</span>
                <button
                  onClick={() => toggleFlag(currentQIndex)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                    flaggedQuestions.has(currentQIndex)
                      ? 'bg-[#FFD166]/20 border-[#FFD166] text-[#FFD166]'
                      : 'bg-[#131F2E] border-[#27384E] text-[#778DA9] hover:text-white'
                  }`}
                >
                  <Bookmark size={13} />
                  <span>{flaggedQuestions.has(currentQIndex) ? 'Đã xem lại' : 'Cần xem lại'}</span>
                </button>
              </div>
            </div>

            {/* Reading passage context if applicable */}
            {currentQ.passage && (
              <div className="p-4 rounded-2xl bg-[#131F2E] border border-[#27384E] text-xs text-[#CBD5E1] leading-relaxed max-h-56 overflow-y-auto">
                <span className="text-[10px] font-bold text-[#00E5FF] uppercase block mb-1">Đoạn văn đọc hiểu:</span>
                {currentQ.passage}
              </div>
            )}

            {/* Question prompt */}
            <div className="text-base sm:text-lg font-bold text-white leading-relaxed">{currentQ.question}</div>

            {/* Interactive Question Types */}

            {/* Type A: Single Choice */}
            {(currentQ.type === 'SINGLE_CHOICE' || !currentQ.type) && (
              <div className="space-y-2.5 pt-2">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const isSelected = userAnswers[qKey] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => setAnswer(oIdx)}
                      className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                        isSelected
                          ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-white shadow-lg shadow-[#00E5FF]/10'
                          : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-[#00E5FF] text-[#0D1B2A]' : 'border border-[#778DA9] text-[#778DA9]'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Type B: Multiple Choice */}
            {currentQ.type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2.5 pt-2">
                <span className="text-xs text-[#9D4EDD] block font-bold">
                  (Chọn một hoặc nhiều đáp án bạn cho là đúng)
                </span>
                {(currentQ.options || []).map((opt, oIdx) => {
                  const currentArr: number[] = Array.isArray(userAnswers[qKey]) ? userAnswers[qKey] : [];
                  const isSelected = currentArr.includes(oIdx);
                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        const next = isSelected ? currentArr.filter((i) => i !== oIdx) : [...currentArr, oIdx];
                        setAnswer(next);
                      }}
                      className={`w-full p-3.5 rounded-2xl border flex items-center gap-3 text-left transition ${
                        isSelected
                          ? 'bg-[#9D4EDD]/20 border-[#9D4EDD] text-white shadow-lg shadow-[#9D4EDD]/10'
                          : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          isSelected ? 'bg-[#9D4EDD] text-white' : 'border border-[#778DA9] text-[#778DA9]'
                        }`}
                      >
                        {isSelected ? <Check size={14} /> : String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="text-sm font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Type C: True / False */}
            {currentQ.type === 'TRUE_FALSE' && (
              <div className="grid grid-cols-2 gap-4 pt-3">
                <button
                  onClick={() => setAnswer(true)}
                  className={`p-4 rounded-2xl border text-center font-black text-sm flex items-center justify-center gap-2 transition ${
                    userAnswers[qKey] === true
                      ? 'bg-[#06D6A0]/25 border-[#06D6A0] text-[#06D6A0] shadow-lg shadow-[#06D6A0]/10'
                      : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                  }`}
                >
                  <Check size={18} />
                  <span>ĐÚNG (True)</span>
                </button>
                <button
                  onClick={() => setAnswer(false)}
                  className={`p-4 rounded-2xl border text-center font-black text-sm flex items-center justify-center gap-2 transition ${
                    userAnswers[qKey] === false
                      ? 'bg-[#EF476F]/25 border-[#EF476F] text-[#EF476F] shadow-lg shadow-[#EF476F]/10'
                      : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                  }`}
                >
                  <X size={18} />
                  <span>SAI (False)</span>
                </button>
              </div>
            )}

            {/* Type D: Fill in the blank */}
            {currentQ.type === 'FILL_IN_BLANK' && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-[#FFD166] block font-bold">
                  Nhập câu trả lời chính xác vào các ô trống dưới đây:
                </span>
                <div className="space-y-2">
                  {(currentQ.blanks || []).map((blank) => {
                    const currentObj = typeof userAnswers[qKey] === 'object' ? userAnswers[qKey] : {};
                    return (
                      <div key={blank.id} className="flex items-center gap-3">
                        <span className="w-20 font-bold text-xs text-[#FFD166] shrink-0">[{blank.id}]:</span>
                        <input
                          type="text"
                          value={currentObj[blank.id] || ''}
                          onChange={(e) => {
                            setAnswer({
                              ...currentObj,
                              [blank.id]: e.target.value
                            });
                          }}
                          placeholder={blank.placeholder || 'Nhập từ thích hợp...'}
                          className="flex-1 p-3 rounded-xl bg-[#131F2E] border border-[#27384E] text-white text-sm focus:border-[#00E5FF] focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Type: Drag Drop Cloze (Kéo thả điền vào ô trống) */}
            {currentQ.type === 'DRAG_DROP_CLOZE' && (
              <div className="pt-2">
                <DragDropClozePlayer
                  question={currentQ}
                  value={typeof userAnswers[qKey] === 'object' && userAnswers[qKey] !== null ? userAnswers[qKey] : {}}
                  onChange={(val) => setAnswer(val)}
                />
              </div>
            )}

            {/* Type E: Matching Pairs */}
            {currentQ.type === 'MATCHING' && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-[#E0AAFF] block font-bold">
                  (Chạm 1 mục ở cột TRÁI rồi chạm mục tương ứng ở cột PHẢI để nối cặp)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[#778DA9] block">Cột Trái (Đề mục)</span>
                    {(currentQ.pairs || []).map((pair) => {
                      const currentMatches = typeof userAnswers[qKey] === 'object' ? userAnswers[qKey] : {};
                      const isLinked = !!currentMatches[pair.id];
                      const isSelected = selectedLeftId === pair.id;
                      return (
                        <button
                          key={pair.id}
                          onClick={() => setSelectedLeftId(pair.id)}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF] font-bold'
                              : isLinked
                              ? 'bg-[#06D6A0]/15 border-[#06D6A0]/50 text-white'
                              : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                          }`}
                        >
                          <span>{pair.left}</span>
                          {isLinked && <Check size={14} className="text-[#06D6A0]" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-[#778DA9] block">Cột Phải (Khái niệm)</span>
                    {(currentQ.pairs || []).map((pair) => {
                      const currentMatches = typeof userAnswers[qKey] === 'object' ? userAnswers[qKey] : {};
                      const isTargetOfSelected = selectedLeftId && currentMatches[selectedLeftId] === pair.right;
                      return (
                        <button
                          key={pair.id}
                          onClick={() => {
                            if (selectedLeftId) {
                              setAnswer({
                                ...currentMatches,
                                [selectedLeftId]: pair.right
                              });
                              setSelectedLeftId(null);
                            }
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition ${
                            isTargetOfSelected
                              ? 'bg-[#06D6A0]/20 border-[#06D6A0] text-[#06D6A0] font-bold'
                              : 'bg-[#131F2E] border-[#27384E] text-[#CBD5E1] hover:bg-[#27384E]'
                          }`}
                        >
                          <span>{pair.right}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Type F: Drag Drop Sequencing */}
            {currentQ.type === 'DRAG_DROP' && (
              <div className="space-y-3 pt-2">
                <span className="text-xs text-[#F77F00] block font-bold">
                  Chạm các thẻ từ bên dưới để đưa vào thứ tự chính xác:
                </span>

                {/* Ordered slot view */}
                <div className="min-h-16 p-3 rounded-2xl bg-[#131F2E] border border-[#27384E] flex flex-wrap gap-2 items-center">
                  {currentAnswerList.length === 0 ? (
                    <span className="text-xs text-[#778DA9]">Chạm từ ở bên dưới để xếp vào đây...</span>
                  ) : (
                    currentAnswerList.map((token, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => {
                          const next = currentAnswerList.filter((_, i) => i !== tIdx);
                          setAnswer(next);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/80 flex items-center gap-1.5"
                      >
                        <span>{token}</span>
                        <X size={12} />
                      </button>
                    ))
                  )}
                </div>

                {/* Available tokens pool */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(currentQ.dragItems || []).map((item, iIdx) => {
                    const isUsed = currentAnswerList.includes(item);
                    return (
                      <button
                        key={iIdx}
                        disabled={isUsed}
                        onClick={() => {
                          setAnswer([...currentAnswerList, item]);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                          isUsed
                            ? 'bg-[#131F2E] border-[#27384E] text-[#778DA9] opacity-40 cursor-not-allowed'
                            : 'bg-[#1B263B] border-[#00E5FF]/40 text-white hover:bg-[#00E5FF]/20'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                  {currentAnswerList.length > 0 && (
                    <button
                      onClick={() => setAnswer([])}
                      className="px-3 py-1.5 rounded-xl border border-[#EF476F]/40 text-[#EF476F] text-xs font-bold hover:bg-[#EF476F]/20"
                    >
                      Xếp lại từ đầu
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Type G: Essay & Short Answer */}
            {(currentQ.type === 'SHORT_ANSWER' || currentQ.type === 'ESSAY') && (
              <div className="space-y-2 pt-2">
                <span className="text-xs text-[#48CAE4] block font-bold">
                  Nhập bài làm tự luận hoặc câu trả lời bằng văn bản của bạn:
                </span>
                <textarea
                  rows={currentQ.type === 'ESSAY' ? 6 : 3}
                  value={userAnswers[qKey] || ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Gõ bài làm của bạn tại đây..."
                  className="w-full p-4 rounded-2xl bg-[#131F2E] border border-[#27384E] text-white text-sm focus:border-[#00E5FF] focus:outline-none leading-relaxed"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls Bottom Bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1B263B] border border-[#27384E] text-xs font-bold text-[#CBD5E1] hover:text-white disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
              <span>Câu Trước</span>
            </button>

            <span className="text-xs text-[#778DA9]">
              Đã làm: <strong className="text-[#00E5FF]">{answeredCount}</strong> / {questions.length} câu
            </span>

            <button
              onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQIndex === questions.length - 1}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#00E5FF] text-[#0D1B2A] text-xs font-black hover:bg-[#00E5FF]/90 disabled:opacity-40 transition shadow-lg shadow-[#00E5FF]/10"
            >
              <span>Câu Tiếp</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right: Question Palette Navigator (4 cols on lg) */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#1B263B] border border-[#27384E] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#778DA9]">
                Bảng Điều Hướng Câu Hỏi
              </span>
              <span className="text-xs font-bold text-[#06D6A0]">{Math.round((answeredCount / questions.length) * 100)}%</span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const key = q.id || `q_${idx}`;
                const ans = userAnswers[key];
                const isAnswered = ans !== undefined && ans !== null && ans !== '' && (!Array.isArray(ans) || ans.length > 0);
                const isFlagged = flaggedQuestions.has(idx);
                const isCurrent = idx === currentQIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-xl border flex flex-col items-center justify-center font-black text-xs transition relative ${
                      isCurrent
                        ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/30 text-white'
                        : isAnswered
                        ? 'bg-[#06D6A0]/20 border-[#06D6A0]/50 text-[#06D6A0]'
                        : 'bg-[#131F2E] border-[#27384E] text-[#778DA9] hover:bg-[#27384E]'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD166] absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-[#27384E] grid grid-cols-2 gap-2 text-[11px] text-[#778DA9]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#06D6A0]/20 border border-[#06D6A0]" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#131F2E] border border-[#27384E]" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD166]" />
                <span>Cần xem lại</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md border border-[#00E5FF]" />
                <span>Đang xem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-3xl bg-[#1B263B] border border-[#27384E] p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FFD166]/20 flex items-center justify-center text-[#FFD166]">
              <AlertTriangle size={26} />
            </div>

            <h3 className="text-lg font-black text-white">Xác Nhận Nộp Bài Thi</h3>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Bạn đã hoàn thành <strong className="text-[#00E5FF]">{answeredCount}</strong> / {questions.length} câu hỏi.
              {answeredCount < questions.length && (
                <span className="block text-[#EF476F] font-bold mt-1">
                  ⚠️ Còn {questions.length - answeredCount} câu chưa trả lời!
                </span>
              )}
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[#27384E] text-xs font-bold text-[#CBD5E1] hover:bg-[#27384E]"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 rounded-xl bg-[#06D6A0] text-[#0D1B2A] text-xs font-black hover:bg-[#06D6A0]/90 shadow-lg shadow-[#06D6A0]/20"
              >
                Nộp Bài Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
