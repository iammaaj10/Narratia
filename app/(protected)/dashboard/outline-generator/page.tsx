"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateStoryOutline } from "@/lib/ai/geminiClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  ArrowLeft,
  BookOpen,
  Wand2,
  Lightbulb,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function OutlineGeneratorPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [outline, setOutline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!idea.trim()) {
      alert("Please enter your story idea");
      return;
    }

    setLoading(true);
    setError("");
    setOutline("");
    setCopied(false);

    try {
      const result = await generateStoryOutline(idea);
      setOutline(result);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to generate outline");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outline);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([outline], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story-outline.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateProject = async () => {
    // Extract title from outline (first heading)
    const titleMatch = outline.match(/^#\s+(.+)$/m);
    const projectTitle = titleMatch ? titleMatch[1] : "New Story";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: projectTitle,
          description: idea.substring(0, 200),
          owner_id: user.id,
          is_team: false,
        })
        .select()
        .single();

      if (projectError || !project) {
        alert("Failed to create project");
        return;
      }

      // Parse outline and create modules/phases
      const chapters = outline.split(/##\s+/).filter((c) => c.trim());

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const lines = chapter.split("\n").filter((l) => l.trim());
        const chapterTitle = lines[0]?.replace(/^Chapter\s+\d+:\s*/, "") || `Chapter ${i + 1}`;

        // Create module for each chapter
        const { data: module } = await supabase
          .from("modules")
          .insert({
            project_id: project.id,
            title: chapterTitle,
            description: lines.slice(1, 3).join(" ").substring(0, 200),
          })
          .select()
          .single();

        if (module) {
          // Create a phase in the module with the outline content
          await supabase.from("phases").insert({
            module_id: module.id,
            title: "Scene 1",
            description: lines.slice(1).join("\n").substring(0, 200),
            content: "",
          });
        }
      }

      router.push(`/dashboard/${project.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Failed to create project");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-12"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors mb-4 group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10 shadow-inner">
                <Wand2 className="w-7 h-7 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  AI Outline Generator
                </h1>
                <p className="text-gray-400 mt-1 max-w-lg">
                  Transform a rough idea into a structured, chapter-by-chapter outline in seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/40 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
                The Spark
              </h2>

              <div className="space-y-4">
                <div className="relative group">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="A sci-fi epic where humanity discovers they aren't alone, but the aliens are actually..."
                    className="w-full h-64 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none transition-all shadow-inner leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading || !idea.trim()}
                  className="group relative w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-[0_0_30px_-5px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Summoning Muse...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Outline
                      </>
                    )}
                  </span>
                </button>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                >
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </motion.div>

            {/* Tips Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6"
            >
              <h3 className="text-base font-bold text-blue-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Pro Tips
              </h3>
              <ul className="space-y-3">
                {[
                  "Detail main character motives",
                  "Establish the central conflict",
                  "Mention the setting/world-building",
                  "Include key plot twists",
                  "More detail = richer outlines"
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-blue-200/80">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 space-y-6 h-full flex flex-col">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-md flex flex-col relative min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-purple-400" />
                  The Blueprint
                </h2>

                <AnimatePresence>
                  {outline && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 transition-all"
                        title="Copy to Clipboard"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-gray-300 transition-all"
                        title="Download Markdown"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/5 bg-black/50">
                {loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-6" />
                    <h3 className="text-xl font-bold text-white mb-2">Architecting your story...</h3>
                    <p className="text-cyan-400/80 text-sm animate-pulse">This typically takes 10-20 seconds</p>
                  </div>
                ) : outline ? (
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                    <div className="prose prose-invert prose-purple max-w-none">
                      <div className="whitespace-pre-wrap text-gray-300 text-sm md:text-base leading-relaxed font-medium">
                        {outline}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Sparkles className="w-10 h-10 text-gray-600" />
                    </div>
                    <p className="text-lg text-gray-400 font-medium">Your outline will materialize here.</p>
                    <p className="text-sm text-gray-600 mt-2">Enter an idea to begin.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <AnimatePresence>
              {outline && !loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    onClick={handleCreateProject}
                    className="w-full group relative flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-3xl font-bold text-lg shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 flex items-center gap-3">
                      <BookOpen className="w-6 h-6" />
                      Create Story Project from Outline
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}