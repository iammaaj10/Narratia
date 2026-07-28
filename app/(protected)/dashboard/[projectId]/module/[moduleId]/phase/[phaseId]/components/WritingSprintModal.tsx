"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Flame,
  Zap,
  Target,
  X,
  Award,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type WritingSprintModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentWordCount: number;
  onSprintStateChange?: (active: boolean, timeLeftFormatted: string, wordsWritten: number) => void;
};

export default function WritingSprintModal({
  isOpen,
  onClose,
  currentWordCount,
  onSprintStateChange,
}: WritingSprintModalProps) {
  // Config
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [targetWords, setTargetWords] = useState<number>(500);

  // Sprint Execution State
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [startWordCount, setStartWordCount] = useState<number>(0);
  const [wordsWritten, setWordsWritten] = useState<number>(0);
  const [savingStats, setSavingStats] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync live word count difference during active sprint
  useEffect(() => {
    if (status === "running" || status === "paused" || status === "finished") {
      const diff = Math.max(0, currentWordCount - startWordCount);
      setWordsWritten(diff);
    }
  }, [currentWordCount, startWordCount, status]);

  // Update parent for header mini-indicator
  useEffect(() => {
    if (onSprintStateChange) {
      const minutes = Math.floor(secondsRemaining / 60);
      const seconds = secondsRemaining % 60;
      const formatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
      onSprintStateChange(status === "running" || status === "paused", formatted, wordsWritten);
    }
  }, [secondsRemaining, wordsWritten, status, onSprintStateChange]);

  // Timer Countdown Logic
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStatus("finished");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleStartSprint = () => {
    setStartWordCount(currentWordCount);
    setWordsWritten(0);
    setSecondsRemaining(durationMinutes * 60);
    setSavedSuccess(false);
    setStatus("running");
  };

  const handlePause = () => {
    setStatus("paused");
  };

  const handleResume = () => {
    setStatus("running");
  };

  const handleFinishEarly = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("finished");
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("idle");
    setSecondsRemaining(durationMinutes * 60);
    setWordsWritten(0);
    setSavedSuccess(false);
  };

  const handleSaveToStats = async () => {
    try {
      setSavingStats(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const todayStr = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("writing_sessions").insert({
        user_id: user.id,
        words_written: wordsWritten,
        session_date: todayStr,
      });

      if (error) {
        console.error("❌ Error saving writing session:", error);
        alert(`Failed to log session: ${error.message}`);
        return;
      }

      setSavedSuccess(true);
    } catch (err) {
      console.error("❌ Unexpected error saving stats:", err);
    } finally {
      setSavingStats(false);
    }
  };

  // Calculations
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const elapsedTimeMinutes = Math.max(
    0.1,
    (durationMinutes * 60 - secondsRemaining) / 60
  );
  const currentWpm = Math.round(wordsWritten / elapsedTimeMinutes);
  const progressPercent = Math.min(100, Math.round((wordsWritten / targetWords) * 100));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[#161522] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Writing Sprint
                </h3>
                <p className="text-xs text-gray-400">
                  Pomodoro Companion & WPM Tracker
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center"
              title="Close Sprint"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
            {/* 1️⃣ IDLE CONFIG VIEW */}
            {status === "idle" && (
              <div className="space-y-6">
                {/* Duration Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-400" />
                    Sprint Duration
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { mins: 15, label: "15 min", desc: "Quick Burst" },
                      { mins: 25, label: "25 min", desc: "Pomodoro" },
                      { mins: 45, label: "45 min", desc: "Deep Work" },
                    ].map((item) => (
                      <button
                        key={item.mins}
                        onClick={() => {
                          setDurationMinutes(item.mins);
                          setSecondsRemaining(item.mins * 60);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          durationMinutes === item.mins
                            ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10"
                            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-gray-300"
                        }`}
                      >
                        <div className="text-base font-bold">{item.label}</div>
                        <div className="text-[11px] opacity-70">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Words Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-orange-400" />
                    Target Word Goal
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[250, 500, 1000].map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setTargetWords(goal)}
                        className={`p-3 rounded-xl border text-center transition-all font-bold text-sm ${
                          targetWords === goal
                            ? "bg-orange-500/15 border-orange-500/50 text-orange-300"
                            : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] text-gray-300"
                        }`}
                      >
                        {goal} words
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Base Count Info */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-gray-400">
                  <span>Current Starting Word Count:</span>
                  <span className="font-bold text-white">{currentWordCount.toLocaleString()} words</span>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartSprint}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all group text-base"
                >
                  <Play className="w-5 h-5 fill-white group-hover:scale-110 transition-transform" />
                  Start Writing Sprint
                </button>
              </div>
            )}

            {/* 2️⃣ ACTIVE / PAUSED VIEW */}
            {(status === "running" || status === "paused") && (
              <div className="space-y-6 text-center">
                {/* Big Timer Gauge */}
                <div className="relative py-4 flex flex-col items-center justify-center">
                  <div className="text-6xl font-black tracking-tight text-white font-mono drop-shadow-md">
                    {formatTime(secondsRemaining)}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        status === "running"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse"
                          : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {status === "running" ? "Sprint Active" : "Paused"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-gray-400 px-1">
                    <span>Sprint Progress</span>
                    <span className="text-white font-bold">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Live Telemetry Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-2xl font-black text-amber-400">
                      +{wordsWritten}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 uppercase mt-0.5">
                      Words Written
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-2xl font-black text-orange-400">
                      {currentWpm}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 uppercase mt-0.5">
                      Speed (WPM)
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-2xl font-black text-white">
                      {targetWords}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 uppercase mt-0.5">
                      Goal Target
                    </div>
                  </div>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {status === "running" ? (
                    <button
                      onClick={handlePause}
                      className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <Pause className="w-4 h-4 fill-white" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={handleResume}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Resume
                    </button>
                  )}

                  <button
                    onClick={handleFinishEarly}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete
                  </button>

                  <button
                    onClick={handleReset}
                    title="Reset Sprint"
                    className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3️⃣ FINISHED SUMMARY & SAVE VIEW */}
            {status === "finished" && (
              <div className="space-y-6 text-center py-2">
                {/* Celebration Icon */}
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-orange-500/30">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <Sparkles className="w-6 h-6 text-yellow-300 absolute -top-2 -right-2 animate-bounce" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Sprint Completed! 🎉
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Great focus! Here is what you achieved in this session:
                  </p>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div>
                    <div className="text-2xl font-black text-amber-400">
                      +{wordsWritten}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase mt-0.5">
                      Words Added
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-orange-400">
                      {currentWpm}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase mt-0.5">
                      Avg WPM
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-black text-emerald-400">
                      {progressPercent}%
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400 uppercase mt-0.5">
                      Goal Met
                    </div>
                  </div>
                </div>

                {/* Save to Daily Stats Button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSaveToStats}
                    disabled={savingStats || savedSuccess || wordsWritten === 0}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      savedSuccess
                        ? "bg-emerald-600 text-white shadow-emerald-600/20"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/25 disabled:opacity-50"
                    }`}
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Logged to Writing Stats!
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {savingStats ? "Saving Stats..." : "Save to My Daily Streak"}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-semibold text-sm transition-all"
                  >
                    Start Another Sprint
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
