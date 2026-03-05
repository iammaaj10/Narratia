"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { generateStoryOutline } from "@/lib/ai/geminiClient";
import {
  Sparkles,
  Loader2,
  Copy,
  Download,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export default function OutlineGeneratorPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [outline, setOutline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!idea.trim()) {
      alert("Please enter your story idea");
      return;
    }

    setLoading(true);
    setError("");
    setOutline("");

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
    alert("Outline copied to clipboard!");
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
      // This is a simple parser - you can make it more sophisticated
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

      alert("Project created successfully!");
      router.push(`/dashboard/${project.id}`);
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              AI Story Outline Generator
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Describe your story idea and let AI create a detailed chapter outline for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Your Story Idea
              </h2>

              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Describe your story idea in detail...

Example: A detective story set in a small coastal town. The main character is Sarah Chen, a young detective who just moved from the city. She investigates a series of mysterious disappearances. The mayor is secretly involved in illegal smuggling operations."
                className="w-full h-64 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !idea.trim()}
                className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Outline...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Outline
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-3">
                💡 Tips for Better Outlines
              </h3>
              <ul className="text-sm text-blue-200 space-y-2">
                <li>• Include main character details (name, traits)</li>
                <li>• Describe the central conflict or problem</li>
                <li>• Mention the setting (time and place)</li>
                <li>• Add any unique elements or twists</li>
                <li>• The more detail you provide, the better!</li>
              </ul>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Generated Outline
                </h2>

                {outline && (
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
                      title="Download as Markdown"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">Creating your story outline...</p>
                  <p className="text-gray-500 text-sm mt-2">This may take 10-20 seconds</p>
                </div>
              ) : outline ? (
                <div className="prose prose-invert max-w-none">
                  <div className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-gray-300 text-sm max-h-[600px] overflow-y-auto">
                    {outline}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20 text-gray-500">
                  <p>Your outline will appear here...</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {outline && !loading && (
              <button
                onClick={handleCreateProject}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all"
              >
                Create Project from Outline
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}