"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { convertToScreenplay } from "@/lib/ai/geminiClient";
import {
  Film,
  Loader2,
  Download,
  Copy,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

type Phase = {
  id: string;
  title: string;
  content: string;
};

export default function ScreenplayConverterPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const moduleId = params.moduleId as string;

  const [moduleTitle, setModuleTitle] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [screenplay, setScreenplay] = useState("");
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  const loadModuleData = async () => {
    setLoading(true);

    try {
      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("title")
        .eq("id", moduleId)
        .single();

      if (moduleError || !moduleData) {
        alert("Failed to load module");
        router.push(`/dashboard/${projectId}`);
        return;
      }

      setModuleTitle(moduleData.title);

      // Load phases
      const { data: phasesData, error: phasesError } = await supabase
        .from("phases")
        .select("id, title, content")
        .eq("module_id", moduleId)
        .order("created_at", { ascending: true });

      if (phasesError) {
        alert("Failed to load phases");
        return;
      }

      setPhases(phasesData || []);

      // Check if any phases have content
      const hasContent = phasesData?.some((p) => p.content?.trim());
      if (!hasContent) {
        setError("No content found in this module. Please write some content first.");
      }
    } catch (err) {
      console.error("Error loading module:", err);
      setError("Failed to load module data");
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (phases.length === 0) {
      alert("No phases found in this module");
      return;
    }

    const hasContent = phases.some((p) => p.content?.trim());
    if (!hasContent) {
      alert("Please write some content in the phases first");
      return;
    }

    setConverting(true);
    setError("");
    setScreenplay("");

    try {
      // Convert HTML to plain text for better screenplay conversion
      const phasesWithPlainText = phases.map((phase) => ({
        title: phase.title,
        content: stripHTML(phase.content),
      }));

      const result = await convertToScreenplay(moduleTitle, phasesWithPlainText);
      setScreenplay(result);
    } catch (err: any) {
      console.error("Conversion error:", err);
      setError(err.message || "Failed to convert to screenplay");
    } finally {
      setConverting(false);
    }
  };

  const stripHTML = (html: string): string => {
    return html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n\n\n+/g, "\n\n")
      .trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(screenplay);
    alert("Screenplay copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([screenplay], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleTitle}-screenplay.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-gray-400">Loading module...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/${projectId}/module/${moduleId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Module
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Film className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              Screenplay Converter
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Convert "{moduleTitle}" into professional screenplay format
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Module Info */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Module Content
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Module Title:</p>
                  <p className="text-white font-medium">{moduleTitle}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Phases:</p>
                  <div className="space-y-2">
                    {phases.map((phase, index) => (
                      <div
                        key={phase.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <p className="text-white text-sm font-medium">
                          {index + 1}. {phase.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {phase.content
                            ? `${stripHTML(phase.content).split(" ").length} words`
                            : "No content"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleConvert}
                    disabled={converting || !!error}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Converting to Screenplay...
                      </>
                    ) : (
                      <>
                        <Film className="w-5 h-5" />
                        Convert to Screenplay
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">
                📝 Screenplay Format
              </h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>• Scene headings (INT./EXT.)</li>
                <li>• Character names in CAPS</li>
                <li>• Action descriptions</li>
                <li>• Dialogue formatting</li>
                <li>• Parentheticals for direction</li>
                <li>• Industry-standard layout</li>
              </ul>
            </div>
          </div>

          {/* Right: Screenplay Output */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 min-h-[600px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Screenplay Preview
                </h2>

                {screenplay && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {converting ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">Converting to screenplay format...</p>
                  <p className="text-gray-500 text-sm mt-2">
                    This may take 20-30 seconds
                  </p>
                </div>
              ) : screenplay ? (
                <div className="bg-white/5 rounded-lg p-6 font-mono text-sm max-h-[700px] overflow-y-auto screenplay-format">
                  <pre className="whitespace-pre-wrap text-gray-300">
                    {screenplay}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Film className="w-16 h-16 mb-4 opacity-50" />
                  <p>Your screenplay will appear here...</p>
                  <p className="text-sm mt-2">Click "Convert to Screenplay" to start</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screenplay Formatting CSS */}
      <style jsx global>{`
        .screenplay-format {
          font-family: 'Courier New', Courier, monospace;
          line-height: 1.8;
        }
        
        .screenplay-format pre {
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}