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
  FileText
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

  // State
  const [phase, setPhase] = useState<Phase | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [canEdit, setCanEdit] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSavingRef = useRef(false);

  // Load phase data on mount
  useEffect(() => {
    loadPhaseData();
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
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

      setCurrentUserId(user.id);
      console.log("🔍 Loading phase:", phaseId);

      // Load phase with fresh data
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

      console.log("📊 Phase loaded:", {
        id: phaseData.id,
        title: phaseData.title,
        contentLength: phaseData.content?.length || 0
      });

      setPhase(phaseData);

      // Set content
      const loadedContent = phaseData.content || "";
      setContent(loadedContent);
      lastSavedContentRef.current = loadedContent;
      updateCounts(loadedContent);

      // Load module info
      const { data: moduleData } = await supabase
        .from("modules")
        .select("title, project_id")
        .eq("id", moduleId)
        .single();

      if (moduleData) {
        setModule(moduleData);
      }

      // Check permissions
      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      if (projectData) {
        const isOwner = projectData.owner_id === user.id;
        const isAssigned = phaseData.assigned_to === user.id;
        setCanEdit(isOwner || isAssigned);

        if (!isOwner && !isAssigned) {
          console.log("⚠️ User does not have edit permission");
        }
      }
    } catch (err) {
      console.error("❌ Error loading phase:", err);
      alert("An error occurred while loading the editor");
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

  // Handle content change with auto-save
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
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      console.log("⏭️ Save already in progress, skipping");
      return;
    }

    const finalContent = contentToSave !== undefined ? contentToSave : content;

    // Don't save if content hasn't changed
    if (finalContent === lastSavedContentRef.current) {
      console.log("⏭️ Content unchanged, skipping save");
      return;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    console.log("💾 Saving content...", {
      length: finalContent.length,
      phaseId
    });

    try {
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

      console.log("✅ Content saved successfully");
      lastSavedContentRef.current = finalContent;
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("❌ Unexpected save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      isSavingRef.current = false;
    }
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

  // Handle navigation away - save before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (content !== lastSavedContentRef.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        
        // Attempt to save
        saveContent();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      
      // Final save attempt on unmount
      if (content !== lastSavedContentRef.current) {
        saveContent();
      }
    };
  }, [content]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-center">
          <FileText className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <div className="text-gray-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!phase || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Access Denied
          </h2>
          <p className="text-gray-400 mb-6">
            You don't have permission to edit this phase. Only the project owner or assigned writer can edit.
          </p>
          <button
            onClick={() => router.push(`/dashboard/${projectId}/module/${moduleId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Go Back to Module
          </button>
        </div>
      </div>
    );
  }

  // Main editor interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Navigation and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Save before navigating away
                  if (content !== lastSavedContentRef.current) {
                    saveContent();
                  }
                  router.push(`/dashboard/${projectId}/module/${moduleId}`);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Module</span>
              </button>

              <div className="border-l border-white/10 pl-4">
                <h1 className="text-lg font-semibold text-white">
                  {phase.title}
                </h1>
                {module && (
                  <p className="text-xs text-gray-400">{module.title}</p>
                )}
              </div>
            </div>

            {/* Right: Stats and controls */}
            <div className="flex items-center gap-6">
              {/* Word and character count */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="font-medium">{wordCount.toLocaleString()} words</span>
                <span className="text-gray-600">•</span>
                <span>{charCount.toLocaleString()} characters</span>
              </div>

              {/* Save status indicator */}
              <div className="flex items-center gap-2 min-w-[100px]">
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-sm text-yellow-400 font-medium">Saving...</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Saved</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400 font-medium">Error</span>
                  </>
                )}
              </div>

              {/* Manual save button */}
              <button
                onClick={handleManualSave}
                disabled={saveStatus === "saving" || content === lastSavedContentRef.current}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save now (Ctrl/Cmd + S)"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main editor area */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Phase description */}
        {phase.description && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <strong className="font-semibold">Phase Description:</strong>{" "}
              {phase.description}
            </p>
          </div>
        )}

        {/* Writing area */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your story here...

Your words will be automatically saved every 3 seconds as you write.

Press Ctrl/Cmd + S to save manually at any time."
            className="w-full min-h-[600px] p-10 bg-transparent text-gray-100 placeholder-gray-600 resize-none focus:outline-none text-lg leading-relaxed"
            style={{
              lineHeight: "1.8",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
            spellCheck={true}
          />
        </div>

        {/* Footer tips */}
        <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>💡 Press Ctrl/Cmd + S to save manually</span>
            <span className="text-gray-600">•</span>
            <span>Auto-saves every 3 seconds</span>
          </div>
          <div>
            {phase.updated_at && (
              <span>
                Last updated: {new Date(phase.updated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}