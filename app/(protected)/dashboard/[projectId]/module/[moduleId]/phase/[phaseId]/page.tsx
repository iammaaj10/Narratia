"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import VersionHistory from "./components/VersionHistory";
import CommentsPanel from "./components/CommentsPanel";
import RichTextEditor from "./components/RichTextEditor";
import {
  ArrowLeft,
  Save,
  Clock,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
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
  const [showComments, setShowComments] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [lastVersionSave, setLastVersionSave] = useState(0);

  // Refs
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef("");
  const isSavingRef = useRef(false);

  useEffect(() => {
    loadPhaseData();

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

      const loadedContent = phaseData.content || "";
      setContent(loadedContent);
      lastSavedContentRef.current = loadedContent;
      updateCounts(loadedContent);

      const { data: moduleData } = await supabase
        .from("modules")
        .select("title, project_id")
        .eq("id", moduleId)
        .single();

      if (moduleData) {
        setModule(moduleData);
      }

      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id")
        .eq("id", projectId)
        .single();

      if (projectData) {
        const ownerCheck = projectData.owner_id === user.id;
        const isAssigned = phaseData.assigned_to === user.id;
        setIsOwner(ownerCheck);
        setCanEdit(ownerCheck || isAssigned);
      }
    } catch (err) {
      console.error("❌ Error loading phase:", err);
      alert("An error occurred while loading the editor");
    } finally {
      setLoading(false);
    }
  };

  const updateCounts = (html: string) => {
    // Strip HTML tags for word count
    const plainText = html.replace(/<[^>]*>/g, ' ');
    const words = plainText.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
    setCharCount(plainText.length);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    updateCounts(value);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveContent(value);
    }, 3000);
  };

  const saveContent = async (contentToSave?: string) => {
    if (isSavingRef.current) {
      return;
    }

    const finalContent = contentToSave !== undefined ? contentToSave : content;

    if (finalContent === lastSavedContentRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");

    // Strip HTML for word count
    const plainText = finalContent.replace(/<[^>]*>/g, ' ');
    const previousPlainText = lastSavedContentRef.current.replace(/<[^>]*>/g, ' ');
    
    const previousWordCount = previousPlainText
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length;

    const currentWordCount = plainText
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length;

    const wordsAdded = Math.max(0, currentWordCount - previousWordCount);

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

      lastSavedContentRef.current = finalContent;
      setSaveStatus("saved");

      // Track writing session
      if (wordsAdded > 0) {
        try {
          await supabase.rpc("track_writing_session", {
            p_user_id: currentUserId,
            p_phase_id: phaseId,
            p_words_written: wordsAdded,
          });
        } catch (sessionErr) {
          console.error("⚠️ Failed to track session:", sessionErr);
        }
      }

      setTimeout(() => setSaveStatus("idle"), 2000);

      // Version snapshot
      const now = Date.now();
      const timeSinceLastVersion = now - lastVersionSave;
      const shouldSaveVersion =
        timeSinceLastVersion > 5 * 60 * 1000 || currentWordCount % 50 === 0;

      if (shouldSaveVersion && currentWordCount > 0) {
        await supabase.from("phase_versions").insert({
          phase_id: phaseId,
          content: finalContent,
          word_count: currentWordCount,
          created_by: currentUserId,
        });
        setLastVersionSave(now);
      }
    } catch (err) {
      console.error("❌ Unexpected save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleRestoreVersion = (versionContent: string) => {
    setContent(versionContent);
    updateCounts(versionContent);
    saveContent(versionContent);
  };

  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    saveContent();
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (content !== lastSavedContentRef.current) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes.";
        saveContent();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (content !== lastSavedContentRef.current) {
        saveContent();
      }
    };
  }, [content]);

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

  if (!phase || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You don't have permission to edit this phase.
          </p>
          <button
            onClick={() =>
              router.push(`/dashboard/${projectId}/module/${moduleId}`)
            }
            className="px-6 py-3 bg-linear-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Go Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (content !== lastSavedContentRef.current) {
                    saveContent();
                  }
                  router.push(`/dashboard/${projectId}/module/${moduleId}`);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
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

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="font-medium">
                  {wordCount.toLocaleString()} words
                </span>
                <span className="text-gray-600">•</span>
                <span>{charCount.toLocaleString()} chars</span>
              </div>

              <div className="flex items-center gap-2 min-w-[100px]">
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
                    <span className="text-sm text-red-400">Error</span>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">{showComments ? "Hide" : "Show"} Comments</span>
              </button>

              <button
                onClick={() => setShowVersionHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all"
              >
                <History className="w-4 h-4" />
                <span className="text-sm">History</span>
              </button>

              <button
                onClick={handleManualSave}
                disabled={
                  saveStatus === "saving" ||
                  content === lastSavedContentRef.current
                }
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex h-[calc(100vh-80px)]">
        <div className={`flex-1 ${showComments ? "" : "max-w-7xl mx-auto"}`}>
          {phase.description && (
            <div className="px-6 pt-6">
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-300">
                  <strong>Phase Description:</strong> {phase.description}
                </p>
              </div>
            </div>
          )}

          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your story..."
          />
        </div>

        {showComments && (
          <div className="w-96 h-full">
            <CommentsPanel
              phaseId={phaseId}
              currentUserId={currentUserId}
              isOwner={isOwner}
              projectId={projectId}
              moduleId={moduleId}
              phaseTitle={phase?.title || ""}
              assignedTo={phase?.assigned_to || null}
            />
          </div>
        )}
      </div>

      {showVersionHistory && (
        <VersionHistory
          phaseId={phaseId}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}