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
} from "lucide-react";
import {
  LineChart,
  Line,
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
    <div className="p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent mb-2">
            Writing Statistics
          </h1>
          <p className="text-gray-400">Track your progress and stay motivated</p>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Progress */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-purple-400" />
              <button
                onClick={() => setShowGoalEdit(true)}
                className="p-1 text-purple-400 hover:text-purple-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Today's Goal</p>
              <p className="text-3xl font-bold text-white">
                {stats.todayWords}/{stats.dailyGoal}
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{goalProgress}% complete</p>
            </div>
          </div>

          {/* Writing Streak */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <Flame className="w-8 h-8 text-orange-400 mb-4" />
            <p className="text-sm text-gray-400 mb-2">Writing Streak</p>
            <p className="text-3xl font-bold text-white">{stats.streak}</p>
            <p className="text-xs text-gray-500">consecutive days</p>
          </div>

          {/* Total Words */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <FileText className="w-8 h-8 text-blue-400 mb-4" />
            <p className="text-sm text-gray-400 mb-2">Total Words</p>
            <p className="text-3xl font-bold text-white">
              {stats.totalWords.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">across all projects</p>
          </div>

          {/* Average Per Day */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
            <p className="text-sm text-gray-400 mb-2">Daily Average</p>
            <p className="text-3xl font-bold text-white">
              {stats.avgWordsPerDay}
            </p>
            <p className="text-xs text-gray-500">words per day</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Word Count Chart */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              Last 14 Days
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="words" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Progress Stats */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Progress Overview
            </h3>
            <div className="space-y-6">
              {/* Phases Completed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Phases Completed</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.completedPhases}/{stats.totalPhases}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
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
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-300">Milestones</p>
                <div className="space-y-2">
                  {[
                    { words: 1000, label: "First 1K" },
                    { words: 5000, label: "5K Words" },
                    { words: 10000, label: "10K Words" },
                    { words: 50000, label: "50K Words (Novel)" },
                  ].map((milestone) => (
                    <div
                      key={milestone.words}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        stats.totalWords >= milestone.words
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-white/5 border border-white/10"
                      }`}
                    >
                      {stats.totalWords >= milestone.words ? (
                        <Award className="w-5 h-5 text-green-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                      )}
                      <span
                        className={`text-sm ${
                          stats.totalWords >= milestone.words
                            ? "text-green-300 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {milestone.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {stats.todayWords >= stats.dailyGoal && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              🎉 Goal Achieved!
            </h3>
            <p className="text-green-300">
              Great work! You've hit your daily goal. Keep the momentum going!
            </p>
          </div>
        )}
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
    </div>
  );
}