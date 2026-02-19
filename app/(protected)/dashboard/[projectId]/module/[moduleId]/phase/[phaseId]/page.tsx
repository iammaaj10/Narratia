"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Save, 
  Clock, 
  Check, 
  AlertCircle,
  Type,
  Bold,
  Italic,
  List,
  ListOrdered
} from "lucide-react";

type Phase = {
  id: string;
  title: string;
  description: string | null;
  content: string;
  assigned_to: string | null;
  module_id: string;
  updated_at: string;
};

type Module = {
  title: string;
  project_id: string;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function WritingEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const moduleId = params.moduleId as string;
  const phaseId = params.phaseId as string;

  const [phase, setPhase] = useState<Phase | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [canEdit, setCanEdit] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load phase data
  useEffect(() => {
    loadPhaseData();
  }, [phaseId]);

  const loadPhaseData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load phase
      const { data: phaseData, error: phaseError } = await supabase
        .from("phases")
        .select("*")
        .eq("id", phaseId)
        .single();

      if (phaseError || !phaseData) {
        console.error("❌ Phase error:", phaseError);
        alert("Failed to load phase");
        router.push(`/dashboard/${projectId}/module/${moduleId}`);
        return;
      }

      setPhase(phaseData);
      setContent(phaseData.content || "");
      lastSavedContentRef.current = phaseData.content || "";
      updateCounts(phaseData.content || "");

      // Load module
      const { data: moduleData } = await supabase
        .from("modules")
        .select("title, project_id")
        .eq("id", moduleId)
        .single();

      setModule(moduleData);

      // Check if user can edit
      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      const isOwner = projectData?.owner_id === user.id;
      const isAssigned = phaseData.assigned_to === user.id;

      setCanEdit(isOwner || isAssigned);

      if (!isOwner && !isAssigned) {
        alert("You don't have permission to edit this phase");
      }
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update word and character counts
  const updateCounts = (text: string) => {
    setCharCount(text.length);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    setWordCount(words.length);
  };

  // Handle content change
  const handleContentChange = (value: string) => {
    setContent(value);
    updateCounts(value);

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new auto-save timeout (3 seconds)
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveContent(value);
    }, 3000);
  };

  // Save content to database
  const saveContent = async (contentToSave?: string) => {
    const finalContent = contentToSave || content;

    // Don't save if content hasn't changed
    if (finalContent === lastSavedContentRef.current) {
      return;
    }

    setSaveStatus("saving");

    const { error } = await supabase
      .from("phases")
      .update({
        content: finalContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", phaseId);

    if (error) {
      console.error("❌ Save error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }

    lastSavedContentRef.current = finalContent;
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  // Manual save
  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    saveContent();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleManualSave();
    }
  };

  // Save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      // Save any unsaved changes
      if (content !== lastSavedContentRef.current) {
        saveContent(content);
      }
    };
  }, [content]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    );
  }

  if (!phase || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-400 mb-6">
            You don't have permission to edit this phase
          </p>
          <button
            onClick={() => router.push(`/dashboard/${projectId}/module/${moduleId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/dashboard/${projectId}/module/${moduleId}`)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>

              <div className="border-l border-white/10 pl-4">
                <h1 className="text-lg font-semibold text-white">
                  {phase.title}
                </h1>
                <p className="text-xs text-gray-400">{module?.title}</p>
              </div>
            </div>

            {/* Right: Stats and save button */}
            <div className="flex items-center gap-6">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{wordCount.toLocaleString()} words</span>
                <span className="text-gray-600">•</span>
                <span>{charCount.toLocaleString()} characters</span>
              </div>

              {/* Save status */}
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-sm text-yellow-400">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Saved</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Error saving</span>
                  </>
                )}
              </div>

              {/* Manual save button */}
              <button
                onClick={handleManualSave}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {phase.description && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <strong>Phase Description:</strong> {phase.description}
            </p>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your story here... (Ctrl/Cmd + S to save)"
            className="w-full min-h-[600px] p-8 bg-transparent text-gray-100 placeholder-gray-600 resize-none focus:outline-none text-lg leading-relaxed font-serif"
            style={{
              lineHeight: "1.8",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          />
        </div>

        {/* Tips */}
        <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
          <p>💡 Tip: Press Ctrl/Cmd + S to save manually</p>
          <p>Auto-saves every 3 seconds after you stop typing</p>
        </div>
      </div>
    </div>
  );
}