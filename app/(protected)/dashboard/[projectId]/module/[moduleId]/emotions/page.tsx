"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { analyzeEmotions } from "@/lib/ai/geminiClient";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BarChart3,
  Heart,
  RefreshCw,
} from "lucide-react";

type EmotionData = {
  phaseTitle: string;
  primaryEmotion: string;
  emotionIcon: string;
  intensity: number;
  secondaryEmotions: string[];
  keyMoments: string[];
  analysis: string;
};

type AnalysisResult = {
  overall: string;
  emotions: EmotionData[];
  pacingInsights: string[];
  recommendations: string[];
};

export default function EmotionHeatmapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const moduleId = params.moduleId as string;

  const [moduleTitle, setModuleTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAndAnalyze();
  }, [moduleId]);

  const loadAndAnalyze = async () => {
    setLoading(true);
    setError("");

    try {
      // Load module
      const { data: moduleData } = await supabase
        .from("modules")
        .select("title")
        .eq("id", moduleId)
        .single();

      if (!moduleData) {
        alert("Module not found");
        router.push(`/dashboard/${projectId}`);
        return;
      }

      setModuleTitle(moduleData.title);

      // Load phases with content
      const { data: phasesData } = await supabase
        .from("phases")
        .select("title, content")
        .eq("module_id", moduleId)
        .order("created_at", { ascending: true });

      if (!phasesData || phasesData.length === 0) {
        setError("No phases found in this module");
        setLoading(false);
        return;
      }

      // Check if phases have content
      const hasContent = phasesData.some((p) => p.content?.trim());
      if (!hasContent) {
        setError(
          "No content found. Please write some content in the phases first."
        );
        setLoading(false);
        return;
      }

      // Strip HTML from content
      const phasesWithPlainText = phasesData.map((p) => ({
        title: p.title,
        content: stripHTML(p.content),
      }));

      setLoading(false);
      setAnalyzing(true);

      // Analyze emotions
      const result = await analyzeEmotions(phasesWithPlainText);
      setAnalysis(result);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to analyze emotions");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  const stripHTML = (html: string): string => {
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
  };

  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: "from-yellow-400 to-orange-500",
      sadness: "from-blue-400 to-indigo-600",
      fear: "from-purple-500 to-pink-600",
      anger: "from-red-500 to-orange-600",
      surprise: "from-cyan-400 to-blue-500",
      anticipation: "from-green-400 to-teal-500",
      trust: "from-blue-400 to-cyan-500",
      disgust: "from-green-600 to-lime-600",
      neutral: "from-gray-400 to-gray-600",
    };
    return colors[emotion] || "from-gray-500 to-gray-600";
  };

  const getEmotionBgColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      joy: "bg-yellow-500/10 border-yellow-500/30",
      sadness: "bg-blue-500/10 border-blue-500/30",
      fear: "bg-purple-500/10 border-purple-500/30",
      anger: "bg-red-500/10 border-red-500/30",
      surprise: "bg-cyan-500/10 border-cyan-500/30",
      anticipation: "bg-green-500/10 border-green-500/30",
      trust: "bg-blue-400/10 border-blue-400/30",
      disgust: "bg-green-600/10 border-green-600/30",
      neutral: "bg-gray-500/10 border-gray-500/30",
    };
    return colors[emotion] || "bg-gray-500/10 border-gray-500/30";
  };

  if (loading || analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <Heart className="w-20 h-20 text-pink-400 mx-auto mb-6 opacity-20" />
            <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-2">
            {loading ? "Loading Module..." : "Analyzing Emotions..."}
          </h2>
          <p className="text-gray-400">
            {analyzing && "Reading your story and detecting emotional patterns"}
          </p>
          {analyzing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">
            Analysis Failed
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() =>
              router.push(`/dashboard/${projectId}/module/${moduleId}`)
            }
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() =>
              router.push(`/dashboard/${projectId}/module/${moduleId}`)
            }
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Module</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                  <Heart className="w-7 h-7 text-pink-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 bg-clip-text text-transparent">
                  Emotion Heatmap
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Emotional analysis for{" "}
                <span className="text-white font-medium">"{moduleTitle}"</span>
              </p>
            </div>

            <button
              onClick={loadAndAnalyze}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${analyzing ? "animate-spin" : ""}`}
              />
              Re-analyze
            </button>
          </div>
        </div>

        {analysis && (
          <div className="space-y-8">
            {/* Overall Summary */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">
                  Overall Emotional Arc
                </h2>
              </div>
              <p className="text-gray-200 text-lg leading-relaxed">
                {analysis.overall}
              </p>
            </div>

            {/* Emotion Timeline */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 lg:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Emotional Journey Through Your Story
              </h2>

              <div className="space-y-6">
                {analysis.emotions.map((emotion, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-6 border ${getEmotionBgColor(emotion.primaryEmotion)} hover:scale-[1.02] transition-transform`}
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                      <div className="flex items-center gap-4">
                        <div className="text-5xl">{emotion.emotionIcon}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {emotion.phaseTitle}
                          </h3>
                          <p className="text-sm text-gray-400 capitalize">
                            Primary Emotion: {emotion.primaryEmotion}
                          </p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end gap-2">
                        <div className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                          {emotion.intensity}%
                        </div>
                        <div className="text-xs text-gray-400">Intensity</div>
                      </div>
                    </div>

                    {/* Intensity Bar */}
                    <div className="mb-5">
                      <div className="h-4 bg-black/30 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full bg-gradient-to-r ${getEmotionColor(emotion.primaryEmotion)} shadow-lg transition-all duration-700 ease-out`}
                          style={{ width: `${emotion.intensity}%` }}
                        />
                      </div>
                    </div>

                    {/* Analysis */}
                    <p className="text-gray-200 leading-relaxed mb-5">
                      {emotion.analysis}
                    </p>

                    {/* Secondary Emotions */}
                    {emotion.secondaryEmotions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Secondary Emotions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {emotion.secondaryEmotions.map((se, i) => (
                            <span
                              key={i}
                              className="px-4 py-1.5 bg-white/10 backdrop-blur-sm text-gray-200 rounded-full text-sm font-medium border border-white/10"
                            >
                              {se}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Moments */}
                    {emotion.keyMoments.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                          Key Emotional Moments
                        </p>
                        <ul className="space-y-2">
                          {emotion.keyMoments.map((moment, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-gray-200"
                            >
                              <span className="text-pink-400 font-bold mt-0.5">
                                →
                              </span>
                              <span className="flex-1">{moment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pacing Insights */}
            {analysis.pacingInsights.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Pacing Insights
                  </h2>
                </div>
                <ul className="space-y-4">
                  {analysis.pacingInsights.map((insight, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 bg-blue-500/5 rounded-xl p-4 border border-blue-500/10"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-1 text-blue-400" />
                      <span className="text-blue-100 leading-relaxed">
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Lightbulb className="w-6 h-6 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Recommendations
                  </h2>
                </div>
                <ul className="space-y-4">
                  {analysis.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-4 bg-green-500/5 rounded-xl p-4 border border-green-500/10"
                    >
                      <Lightbulb className="w-5 h-5 flex-shrink-0 mt-1 text-green-400" />
                      <span className="text-green-100 leading-relaxed">
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}