import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { UnitTopic, WordItem } from '../types';
import { audioService } from '../services/audioService';
import { removeDiacritics } from '../services/dictionaryDatabase';
import confetti from 'canvas-confetti';
import {
  Heart,
  Volume2,
  Flame,
  ArrowLeft,
  RotateCcw,
  Trophy,
  AlertTriangle,
  Send,
  Timer,
  BookOpen
} from 'lucide-react';
import { UnitWordPreviewModal } from '../components/UnitWordPreviewModal';

interface TapGameScreenProps {
  unit: UnitTopic;
  onGameOver: (score: number, xpEarned: number) => void;
  onBack: () => void;
}

export const TapGameScreen: React.FC<TapGameScreenProps> = ({
  unit,
  onGameOver,
  onBack
}) => {
  // Randomize words for this round
  const words = useMemo(() => {
    return [...unit.words].sort(() => Math.random() - 0.5);
  }, [unit.words]);

  const [isEnglishFalling, setIsEnglishFalling] = useState<boolean>(true); // EN falling -> choose VI, or VI falling -> choose EN
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);

  // SPEED PREFERENCE: 'slow' (24s - rất thong thả, cho đt), 'medium' (18s - vừa phải), 'fast' (12s - thử thách)
  const [speedMode, setSpeedMode] = useState<'slow' | 'medium' | 'fast'>('slow');

  // EXACTLY 3 LIVES
  const [lives, setLives] = useState<number>(3);
  const [destroyedCount, setDestroyedCount] = useState<number>(0);
  const [missedCount, setMissedCount] = useState<number>(0);

  // Falling animation progress 0.0 (top) -> 1.0 (bottom line)
  const [fallingProgress, setFallingProgress] = useState<number>(0);
  const [isWordDestroyed, setIsWordDestroyed] = useState<boolean>(false);
  const [isWrongAnswerActive, setIsWrongAnswerActive] = useState<boolean>(false);
  const [clickedWrongOption, setClickedWrongOption] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [typedInput, setTypedInput] = useState<string>('');
  const [missedWordsList, setMissedWordsList] = useState<WordItem[]>([]);
  const [showWordListModal, setShowWordListModal] = useState<boolean>(false);

  const currentWord: WordItem | undefined = words[currentWordIndex];
  const progressIntervalRef = useRef<number | null>(null);

  // COMFORTABLE FALLING DURATION: Slower and not overwhelming for phones
  const baseDurationMs = speedMode === 'slow' ? 24000 : speedMode === 'medium' ? 18000 : 12000;
  const speedMultiplier = useMemo(() => {
    // Gentle scaling: increases by only +0.015 per word index, max capped comfortably
    const cap = speedMode === 'slow' ? 1.25 : speedMode === 'medium' ? 1.45 : 1.75;
    const calculated = 1.0 + currentWordIndex * 0.015 + destroyedCount * 0.01;
    return Math.min(cap, Math.max(1.0, calculated));
  }, [currentWordIndex, destroyedCount, speedMode]);

  const currentFallDuration = baseDurationMs / speedMultiplier;

  // Speak word when it appears
  useEffect(() => {
    if (currentWord && !isGameOver && !isWordDestroyed) {
      if (isEnglishFalling) {
        audioService.speakEnglish(currentWord.word);
      }
    }
  }, [currentWordIndex, isEnglishFalling, isGameOver]);

  // Generate 4 multiple-choice suggestions
  const currentSuggestions = useMemo(() => {
    if (!currentWord) return [];
    const targetCorrect = isEnglishFalling ? currentWord.meaningVi : currentWord.word;
    const pool = words
      .filter((w) => w.id !== currentWord.id)
      .map((w) => (isEnglishFalling ? w.meaningVi : w.word));
    const distractors = currentWord.distractorsVi.filter((d) => d && d !== targetCorrect);

    const candidates = [targetCorrect, ...distractors, ...pool];
    const unique = Array.from(new Set(candidates));
    return unique.slice(0, 4).sort(() => Math.random() - 0.5);
  }, [currentWord, words, isEnglishFalling]);

  // Execute Destroy / Correct Answer
  const executeDestroyWord = useCallback(
    (bonusFactor: number = 1.0) => {
      if (isWordDestroyed || isGameOver || !currentWord) return;

      audioService.unlockMobileAudio();
      setIsWordDestroyed(true);
      audioService.playHitSound(combo);

      const basePoints = 100;
      const comboBonus = combo * 25;
      const speedBonus = Math.floor((1 - fallingProgress) * 40);
      const earned = Math.floor((basePoints + comboBonus + speedBonus) * bonusFactor);

      setScore((prev) => prev + earned);
      setDestroyedCount((prev) => prev + 1);
      setCombo((prev) => {
        const nextCombo = prev + 1;
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);
        return nextCombo;
      });

      setFeedbackMessage(`✓ Đúng rồi! +${earned} điểm (x${combo + 1})`);
      setTypedInput('');
      setClickedWrongOption(null);

      // Advance to next word
      setTimeout(() => {
        if (currentWordIndex + 1 < words.length) {
          setCurrentWordIndex((prev) => prev + 1);
          setFallingProgress(0);
          setIsWordDestroyed(false);
          setFeedbackMessage(null);
        } else {
          // Completed all words in this unit
          setIsGameOver(true);
          audioService.playVictoryFanfare();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          onGameOver(score + earned, score + earned);
        }
      }, 400);
    },
    [
      isWordDestroyed,
      isGameOver,
      currentWord,
      combo,
      fallingProgress,
      maxCombo,
      currentWordIndex,
      words.length,
      score,
      onGameOver
    ]
  );

  // Handle Miss / Out of Time
  const handleMissWord = useCallback(() => {
    if (isWordDestroyed || isGameOver || !currentWord) return;

    audioService.unlockMobileAudio();
    audioService.playMissSound();
    setMissedCount((prev) => prev + 1);
    setCombo(1);
    setTypedInput('');
    setClickedWrongOption(null);
    setMissedWordsList((prev) => [...prev, currentWord]);

    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0) {
      setIsGameOver(true);
      setFeedbackMessage('Hết mạng! Trò chơi kết thúc');
      onGameOver(score, score);
    } else {
      setFeedbackMessage(`Rơi mất từ! Mất 1 ❤️ (Còn ${newLives}/3 mạng)`);

      setTimeout(() => {
        if (currentWordIndex + 1 < words.length) {
          setCurrentWordIndex((prev) => prev + 1);
          setFallingProgress(0);
          setFeedbackMessage(null);
        } else {
          setIsGameOver(true);
          onGameOver(score, score);
        }
      }, 600);
    }
  }, [isWordDestroyed, isGameOver, currentWord, lives, onGameOver, score, currentWordIndex, words.length]);

  // Handle Wrong Answer
  const handleWrongAnswer = useCallback(
    (wrongValue: string) => {
      if (isWordDestroyed || isGameOver || !currentWord) return;

      audioService.unlockMobileAudio();
      audioService.playMissSound();
      setCombo(1);
      setClickedWrongOption(wrongValue);
      setIsWrongAnswerActive(true);
      setMissedWordsList((prev) => [...prev, currentWord]);

      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setIsGameOver(true);
        setFeedbackMessage('Sai 3 lần! Hết mạng');
        onGameOver(score, score);
      } else {
        setFeedbackMessage(`Chưa chính xác! Mất 1 ❤️ (Còn ${newLives}/3 mạng)`);

        setTimeout(() => {
          setIsWrongAnswerActive(false);
          setClickedWrongOption(null);
          if (currentWordIndex + 1 < words.length) {
            setCurrentWordIndex((prev) => prev + 1);
            setFallingProgress(0);
            setFeedbackMessage(null);
          } else {
            setIsGameOver(true);
            onGameOver(score, score);
          }
        }, 650);
      }
    },
    [isWordDestroyed, isGameOver, currentWord, lives, onGameOver, score, currentWordIndex, words.length]
  );

  // Smooth falling animation
  useEffect(() => {
    if (isGameOver || isWordDestroyed || isWrongAnswerActive || !currentWord) return;

    const intervalTime = 40;
    const step = intervalTime / currentFallDuration;

    progressIntervalRef.current = window.setInterval(() => {
      setFallingProgress((prev) => {
        const next = prev + step;
        if (next >= 1.0) {
          clearInterval(progressIntervalRef.current!);
          handleMissWord();
          return 1.0;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentFallDuration, isGameOver, isWordDestroyed, isWrongAnswerActive, currentWord, handleMissWord]);

  // Verify answer
  const checkAnswer = (input: string, isFromCardClick: boolean = false) => {
    if (!currentWord || isWordDestroyed || isGameOver || isWrongAnswerActive) return;
    const cleanIn = removeDiacritics(input).trim();
    const target = isEnglishFalling ? currentWord.meaningVi : currentWord.word;
    const cleanTarget = removeDiacritics(target).trim();
    const cleanEn = removeDiacritics(currentWord.word).trim();
    const cleanVi = removeDiacritics(currentWord.meaningVi).trim();

    const isMatch =
      cleanIn === cleanTarget ||
      cleanIn === cleanEn ||
      cleanIn === cleanVi ||
      (!isFromCardClick && cleanIn.length >= 3 && cleanTarget.includes(cleanIn));

    if (isMatch) {
      executeDestroyWord(1.2);
    } else {
      handleWrongAnswer(input);
    }
  };

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setLives(3);
    setDestroyedCount(0);
    setMissedCount(0);
    setFallingProgress(0);
    setIsWordDestroyed(false);
    setIsWrongAnswerActive(false);
    setClickedWrongOption(null);
    setIsGameOver(false);
    setFeedbackMessage(null);
    setTypedInput('');
    setMissedWordsList([]);
  };

  return (
    <div className="relative min-h-[82vh] flex flex-col justify-between max-w-2xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* Top HUD: Compact, Clean, Mobile-First */}
      <div className="rounded-2xl bg-[#162338] border border-[#27384E] p-3 sm:p-4 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Back button & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#0D1B2A] hover:bg-[#1E2D40] text-[#778DA9] hover:text-white transition-colors cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {unit.title}
              </h3>
              <p className="text-[10px] text-[#778DA9]">
                Từ {currentWordIndex + 1}/{words.length} • Lớp {unit.grade}
              </p>
            </div>
          </div>

          {/* 3 Lives & Score */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Lives */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#0D1B2A] border border-[#EF476F]/30">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  size={16}
                  className={`transition-all ${
                    heartIndex <= lives
                      ? 'text-[#EF476F] fill-[#EF476F]'
                      : 'text-[#2D3F56] fill-none opacity-40'
                  }`}
                />
              ))}
            </div>

            {/* Combo */}
            {combo > 1 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#27384E] text-[#FFD166] text-[11px] font-bold">
                <Flame size={12} className="fill-[#FFD166]" />
                <span>x{combo}</span>
              </div>
            )}

            {/* Score */}
            <div className="text-right">
              <span className="text-sm sm:text-base font-extrabold text-[#00E5FF]">
                {score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Controls row: Speed mode, Language toggle, Word preview button */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#27384E]/60 text-[11px]">
          {/* Speed Selector (Chậm, Vừa, Nhanh) */}
          <div className="flex items-center gap-1 bg-[#0D1B2A] p-0.5 rounded-xl border border-[#27384E]">
            <span className="text-[#778DA9] px-1 text-[10px] hidden sm:inline">Tốc độ:</span>
            <button
              onClick={() => setSpeedMode('slow')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                speedMode === 'slow'
                  ? 'bg-[#00E5FF] text-[#0D1B2A]'
                  : 'text-[#778DA9] hover:text-white'
              }`}
            >
              Chậm
            </button>
            <button
              onClick={() => setSpeedMode('medium')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                speedMode === 'medium'
                  ? 'bg-[#00E5FF] text-[#0D1B2A]'
                  : 'text-[#778DA9] hover:text-white'
              }`}
            >
              Vừa
            </button>
            <button
              onClick={() => setSpeedMode('fast')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                speedMode === 'fast'
                  ? 'bg-[#00E5FF] text-[#0D1B2A]'
                  : 'text-[#778DA9] hover:text-white'
              }`}
            >
              Nhanh
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsEnglishFalling(!isEnglishFalling)}
              className="px-2 py-1 rounded-xl bg-[#0D1B2A] hover:bg-[#1E2D40] text-[#9D4EDD] border border-[#9D4EDD]/40 font-semibold transition-all cursor-pointer"
            >
              {isEnglishFalling ? '🇬🇧 Tiếng Anh' : '🇻🇳 Tiếng Việt'}
            </button>

            <button
              type="button"
              onClick={() => setShowWordListModal(true)}
              className="px-2 py-1 rounded-xl bg-[#0D1B2A] hover:bg-[#1E2D40] text-[#00E5FF] border border-[#00E5FF]/30 font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <BookOpen size={12} />
              <span className="hidden sm:inline">Xem từ ({words.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Falling Arena: Simple, Clean, Non-distracting */}
      <div className="relative flex-1 my-3 min-h-[280px] sm:min-h-[340px] rounded-2xl bg-[#0B1522] border border-[#1E2E44] overflow-hidden flex flex-col justify-between p-3">
        {/* Falling Target Word Card - Clean, Clear, High-Contrast */}
        {currentWord && !isGameOver && (
          <div
            className="absolute left-1/2 -translate-x-1/2 w-11/12 max-w-sm transition-all duration-75"
            style={{
              top: `${Math.min(76, fallingProgress * 78)}%`
            }}
          >
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                isWordDestroyed
                  ? 'scale-90 opacity-0 bg-[#06D6A0]/20 border-[#06D6A0]'
                  : isWrongAnswerActive
                  ? 'bg-[#EF476F]/20 border-[#EF476F]'
                  : 'bg-[#152336] border-[#314863] shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-[#778DA9] uppercase tracking-wider">
                  {isEnglishFalling ? 'Tiếng Anh' : 'Tiếng Việt'}
                </span>

                <button
                  type="button"
                  onClick={() => audioService.speakEnglish(currentWord.word)}
                  className="p-1 rounded-md text-[#778DA9] hover:text-[#00E5FF] transition-colors cursor-pointer"
                  title="Nghe phát âm"
                >
                  <Volume2 size={15} />
                </button>
              </div>

              {/* Word Display: Crisp, Large & Legible */}
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-wide">
                {isEnglishFalling ? currentWord.word : currentWord.meaningVi}
              </h2>

              {isEnglishFalling && currentWord.phonetic && (
                <p className="text-[11px] text-[#FFD166] font-mono mt-0.5">
                  {currentWord.phonetic}
                </p>
              )}

              {/* Minimalist Progress Line */}
              <div className="mt-2.5 w-full h-1.5 rounded-full bg-[#0D1B2A] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    fallingProgress > 0.75
                      ? 'bg-[#EF476F]'
                      : fallingProgress > 0.5
                      ? 'bg-[#FFD166]'
                      : 'bg-[#00E5FF]'
                  }`}
                  style={{ width: `${(1 - fallingProgress) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-xl bg-[#1E2D40] border border-[#00E5FF] text-white text-xs font-bold shadow-lg">
            {feedbackMessage}
          </div>
        )}

        {/* Subtle Bottom Safety Line */}
        <div className="mt-auto pt-1.5 border-t border-dashed border-[#EF476F]/40 flex items-center justify-between text-[10px] text-[#EF476F]/80">
          <span>Vạch an toàn</span>
          <span>Chạm đáy = Mất 1 ❤️</span>
        </div>
      </div>

      {/* 4 Large Finger-Friendly Choice Cards */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {currentSuggestions.map((opt, i) => {
            const isTarget =
              currentWord && (isEnglishFalling ? currentWord.meaningVi : currentWord.word) === opt;
            const isThisClickedWrong = clickedWrongOption === opt;

            return (
              <button
                key={i}
                onClick={() => checkAnswer(opt, true)}
                disabled={isGameOver || isWordDestroyed || isWrongAnswerActive}
                className={`min-h-[50px] py-2.5 px-3 rounded-xl border text-white text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between gap-1.5 cursor-pointer disabled:opacity-50 active:scale-97 ${
                  isThisClickedWrong
                    ? 'bg-[#EF476F] border-[#EF476F]'
                    : isWrongAnswerActive && isTarget
                    ? 'bg-[#06D6A0] text-[#0D1B2A] border-[#06D6A0] font-black'
                    : 'bg-[#162338] hover:bg-[#1E2E44] border-[#27384E] active:border-[#00E5FF]'
                }`}
              >
                <span className="truncate leading-tight">{opt}</span>
                <span className="w-4 h-4 rounded-full bg-[#0D1B2A] text-[9px] font-mono text-[#778DA9] flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Keyboard Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (typedInput.trim()) {
              checkAnswer(typedInput.trim(), false);
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Hoặc gõ từ rồi nhấn Gửi..."
            disabled={isGameOver || isWordDestroyed || isWrongAnswerActive}
            className="flex-1 px-3 py-2 rounded-xl bg-[#0D1B2A] border border-[#27384E] focus:outline-hidden focus:border-[#00E5FF] text-white text-xs placeholder-[#778DA9]"
          />
          <button
            type="submit"
            disabled={isGameOver || !typedInput.trim() || isWrongAnswerActive}
            className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#0D1B2A] font-bold text-xs hover:bg-[#38bdf8] transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Send size={13} />
            <span>Gửi</span>
          </button>
        </form>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-[#162338] border border-[#00E5FF]/40 shadow-2xl text-center space-y-3.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF]">
              {lives > 0 ? (
                <Trophy size={32} className="text-[#FFD166]" />
              ) : (
                <Flame size={32} className="text-[#EF476F]" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                {lives > 0 ? '🎉 Hoàn Thành Bài Đấu Từ!' : 'Hết 3 Mạng! Thua Cuộc'}
              </h3>
              <p className="text-xs text-[#778DA9] mt-0.5">
                {lives <= 0
                  ? 'Đã hết cả 3 mạng. Hãy thử lại với tốc độ Chậm nhé!'
                  : `Xuất sắc hoàn thành toàn bộ từ vựng Lớp ${unit.grade}!`}
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0D1B2A] border border-[#27384E] text-xs">
              <div className="p-2 rounded-lg bg-[#162338]">
                <span className="text-[#778DA9] block text-[10px]">Điểm số</span>
                <span className="text-base font-black text-[#00E5FF]">{score.toLocaleString()}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#162338]">
                <span className="text-[#778DA9] block text-[10px]">Combo cao nhất</span>
                <span className="text-base font-black text-[#FFD166]">x{maxCombo}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#162338]">
                <span className="text-[#778DA9] block text-[10px]">Từ đúng</span>
                <span className="text-sm font-bold text-[#06D6A0]">
                  {destroyedCount} / {words.length}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#162338]">
                <span className="text-[#778DA9] block text-[10px]">Mạng còn</span>
                <span className="text-sm font-bold text-[#EF476F]">{lives} / 3 ❤️</span>
              </div>
            </div>

            {/* Missed words review */}
            {missedWordsList.length > 0 && (
              <div className="text-left p-2.5 rounded-xl bg-[#0D1B2A] border border-[#EF476F]/30 max-h-28 overflow-y-auto">
                <span className="text-[10px] font-bold text-[#EF476F] uppercase block mb-1">
                  Từ cần ôn lại ({missedWordsList.length}):
                </span>
                <div className="space-y-1 text-xs">
                  {missedWordsList.slice(0, 5).map((mw, i) => (
                    <div key={i} className="flex justify-between text-[#ADB5BD]">
                      <span className="font-bold text-white">{mw.word}</span>
                      <span>{mw.meaningVi}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={onBack}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[#778DA9] bg-[#0D1B2A] hover:text-white hover:bg-[#1E2D40] transition-all cursor-pointer"
              >
                Về Trang Chủ
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[#0D1B2A] bg-[#00E5FF] hover:bg-[#38bdf8] transition-all flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Chơi Lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Vocabulary Preview Modal */}
      <UnitWordPreviewModal
        unit={unit}
        isOpen={showWordListModal}
        onClose={() => setShowWordListModal(false)}
        onStartGame={() => {
          setShowWordListModal(false);
        }}
      />
    </div>
  );
};
