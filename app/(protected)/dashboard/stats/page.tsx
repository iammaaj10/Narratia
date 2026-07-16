"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Clock,
  Award,
  FileText,
  Edit,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Stats = {
  totalWords: number;
  todayWords: number;
  streak: number;
  dailyGoal: number;
  avgWordsPerDay: number;
  totalPhases: number;
  completedPhases: number;
};

type DailyData = {
  date: string;
  words: number;
};

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    totalWords: 0,
    todayWords: 0,
    streak: 0,
    dailyGoal: 500,
    avgWordsPerDay: 0,
    totalPhases: 0,
    completedPhases: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [newGoal, setNewGoal] = useState(500);

  useEffect(() => {
    loadStats();
  }, []);

 const loadStats = async () => {
  try {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Get user's daily goal
    const { data: goalData } = await supabase
      .from("writing_goals")
      .select("daily_word_goal")
      .eq("user_id", user.id)
      .single();

    const dailyGoal = goalData?.daily_word_goal || 500;
    setNewGoal(dailyGoal);

    // Get all phases user has access to
    const { data: phases } = await supabase
      .from("phases")
      .select("id, content, assigned_to")
      .or(`assigned_to.eq.${user.id}`);

    // Helper function to count words
    const countWords = (text: string | null | undefined): number => {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Calculate total words from all phases
    const totalWords =
      phases?.reduce((sum, phase) => sum + countWords(phase.content), 0) || 0;

    const totalPhases = phases?.length || 0;
    const completedPhases =
      phases?.filter((p) => (p.content?.length || 0) > 100).length || 0;

    // Get today's writing sessions
    const { data: todaySessions } = await supabase
      .from("writing_sessions")
      .select("words_written")
      .eq("user_id", user.id)
      .eq("session_date", new Date().toISOString().split("T")[0]);

    const todayWords =
      todaySessions?.reduce((sum, s) => sum + s.words_written, 0) || 0;

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: sessions } = await supabase
      .from("writing_sessions")
      .select("session_date, words_written")
      .eq("user_id", user.id)
      .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    // Group by date
    const dailyMap = new Map<string, number>();
    sessions?.forEach((s) => {
      const current = dailyMap.get(s.session_date) || 0;
      dailyMap.set(s.session_date, current + s.words_written);
    });

    const dailyDataArray = Array.from(dailyMap.entries())
      .map(([date, words]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        words,
      }))
      .slice(-14); // Last 14 days

    setDailyData(dailyDataArray);

    // Calculate average words per day (last 30 days)
    const totalSessionWords =
      sessions?.reduce((sum, s) => sum + s.words_written, 0) || 0;
    const daysWithActivity = new Set(sessions?.map((s) => s.session_date))
      .size;
    const avgWordsPerDay =
      daysWithActivity > 0 ? Math.round(totalSessionWords / daysWithActivity) : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    const sessionDates = new Set(sessions?.map((s) => s.session_date) || []);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (!sessionDates.has(dateStr)) break;
      streak++;
    }

    setStats({
      totalWords,
      todayWords,
      streak,
      dailyGoal,
      avgWordsPerDay,
      totalPhases,
      completedPhases,
    });
  } catch (err) {
    console.error("❌ Error loading stats:", err);
  } finally {
    setLoading(false);
  }
};

  const updateGoal = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("writing_goals")
      .upsert({
        user_id: user.id,
        daily_word_goal: newGoal,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error("❌ Error updating goal:", error);
      alert("Failed to update goal");
      return;
    }

    setStats({ ...stats, dailyGoal: newGoal });
    setShowGoalEdit(false);
    alert("Goal updated successfully!");
  };

  const goalProgress = Math.min(
    Math.round((stats.todayWords / stats.dailyGoal) * 100),
    100
  );

  if (loading) {
    return (
      <div className="p-12">
        <div className="text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-10"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Writing Statistics
            </h1>
            <p className="text-sm text-gray-400">Track your progress and stay motivated</p>
          </div>
        </div>

        {/* Key Stats Cards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Today's Progress */}
          <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Today's Goal</span>
              </div>
              <button
                onClick={() => setShowGoalEdit(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all z-10"
                title="Edit Goal"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3 z-10">
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold text-white tracking-tight">
                  {stats.todayWords}
                </p>
                <p className="text-sm text-gray-500 font-medium">/ {stats.dailyGoal}</p>
              </div>
              <div>
                <div className="w-full bg-black/40 rounded-full h-1.5 mb-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{goalProgress}% complete</p>
              </div>
            </div>
          </div>

          {/* Writing Streak */}
          <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-orange-500/10 transition-colors" />
            <div className="flex items-center gap-2 text-orange-400 mb-3">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-medium">Writing Streak</span>
            </div>
            <div className="z-10 mt-auto">
              <p className="text-2xl font-bold text-white tracking-tight mb-1">{stats.streak}</p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">consecutive days</p>
            </div>
          </div>

          {/* Total Words */}
          <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            <div className="flex items-center gap-2 text-blue-400 mb-3">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">Total Words</span>
            </div>
            <div className="z-10 mt-auto">
              <p className="text-2xl font-bold text-white tracking-tight mb-1">
                {stats.totalWords.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">across all projects</p>
            </div>
          </div>

          {/* Average Per Day */}
          <div className="group relative p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[30px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Daily Average</span>
            </div>
            <div className="z-10 mt-auto">
              <p className="text-2xl font-bold text-white tracking-tight mb-1">
                {stats.avgWordsPerDay}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">words per day</p>
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {/* Daily Word Count Chart */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-purple-500/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Calendar className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Last 14 Days</h3>
            </div>
            <div className="relative z-10 -ml-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyData} margin={{ left: -15, right: 10, bottom: 0, top: 10 }}>
                  <defs>
                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#ffffff05' }}
                    contentStyle={{
                      backgroundColor: "rgba(15, 15, 25, 0.9)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 500 }}
                  />
                  <Bar 
                    dataKey="words" 
                    fill="url(#colorWords)" 
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Progress Overview</h3>
            </div>
            
            <div className="space-y-6 relative z-10">
              {/* Phases Completed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Phases Completed</span>
                  <span className="text-xs font-bold text-white">
                    {stats.completedPhases} / {stats.totalPhases}
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${
                        stats.totalPhases > 0
                          ? (stats.completedPhases / stats.totalPhases) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Milestones</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { words: 1000, label: "First 1K" },
                    { words: 5000, label: "5K Words" },
                    { words: 10000, label: "10K Words" },
                    { words: 50000, label: "50K (Novel)" },
                  ].map((milestone) => {
                    const achieved = stats.totalWords >= milestone.words;
                    return (
                      <div
                        key={milestone.words}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                          achieved
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                            : "bg-white/[0.02] border-white/5 text-gray-500"
                        }`}
                      >
                        {achieved ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-gray-700 bg-black/20 flex-shrink-0" />
                        )}
                        <span className={`text-xs font-medium truncate ${achieved ? "text-emerald-300" : "text-gray-400"}`}>
                          {milestone.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Motivational Message */}
        <AnimatePresence>
          {stats.todayWords >= stats.dailyGoal && stats.dailyGoal > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Daily Goal Achieved!</h3>
                  <p className="text-xs text-emerald-200/70">Great work hitting your target today. Keep the momentum going!</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Goal Modal */}
      {showGoalEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Set Daily Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Words per day
                </label>
                <input
                  type="number"
                  value={newGoal}
                  onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
                  min="0"
                  step="50"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 250-1000 words/day
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGoalEdit(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={updateGoal}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}