"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import VersionHistory from "./components/VersionHistory";
import CommentsPanel from "./components/CommentsPanel";
import RichTextEditor from "./components/RichTextEditor";
import AIWritingPartner from "./components/AIWritingPartner";
import FocusModeEditor from "./components/FocusModeEditor";
import {
  ArrowLeft,
  Save,
  Clock,
  Check,
  AlertCircle,
  FileText,
  MessageSquare,
  History,
  Menu,
  X,
  Sparkles,
  Maximize,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAIPartner, setShowAIPartner] = useState(false);
  const [fullStoryContext, setFullStoryContext] = useState("");
  const [showFocusMode, setShowFocusMode] = useState(false);

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
    const plainText = html.replace(/<[^>]*>/g, " ");
    const words = plainText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
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

    const plainText = finalContent.replace(/<[^>]*>/g, " ");
    const previousPlainText = lastSavedContentRef.current.replace(
      /<[^>]*>/g,
      " "
    );

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
    setShowVersionHistory(false);
  };

  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    saveContent();
  };

  const loadFullStoryContext = async () => {
    try {
      const { data: allModules } = await supabase
        .from("modules")
        .select("id, title")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (!allModules) return "";

      let context = "";

      for (const module of allModules) {
        const { data: modulePh } = await supabase
          .from("phases")
          .select("title, content")
          .eq("module_id", module.id)
          .order("created_at", { ascending: true });

        if (modulePh) {
          context += `\n\n=== ${module.title} ===\n`;
          modulePh.forEach((p) => {
            context += `\n${p.title}:\n${stripHTML(p.content)}\n`;
          });
        }
      }

      return context;
    } catch (err) {
      console.error("Error loading context:", err);
      return "";
    }
  };

  const stripHTML = (html: string): string => {
    return html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
  };

  const handleOpenAIPartner = async () => {
    const context = await loadFullStoryContext();
    setFullStoryContext(context);
    setShowAIPartner(true);
    setIsMobileMenuOpen(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 px-4">
        <div className="text-center">
          <FileText className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <div className="text-gray-400">Loading editor...</div>
        </div>
      </div>
    );
  }

  if (!phase || !canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 px-4">
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
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Go Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-out Menu */}
      <div
        className={`
        fixed top-0 right-0 h-full w-80 z-50
        bg-gray-900 backdrop-blur-xl border-l border-white/10
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Editor Tools</h3>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Stats */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Words</span>
              <span className="text-white font-semibold">
                {wordCount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Characters</span>
              <span className="text-white font-semibold">
                {charCount.toLocaleString()}
              </span>
            </div>
            <div className="pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Status</span>
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
                      <span className="text-sm text-red-400">Error</span>
                    </>
                  )}
                  {saveStatus === "idle" && (
                    <span className="text-sm text-gray-400">Ready</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setShowFocusMode(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Maximize className="w-5 h-5" />
            <span>Focus Mode</span>
          </button>

          <button
            onClick={handleOpenAIPartner}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>AI Writing Partner</span>
          </button>

          <button
            onClick={() => {
              setShowComments(!showComments);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 rounded-xl hover:bg-blue-500/30 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{showComments ? "Hide" : "Show"} Comments</span>
          </button>

          <button
            onClick={() => {
              setShowVersionHistory(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-xl hover:bg-cyan-500/30 transition-all"
          >
            <History className="w-5 h-5" />
            <span>Version History</span>
          </button>

          <button
            onClick={handleManualSave}
            disabled={
              saveStatus === "saving" || content === lastSavedContentRef.current
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>Save Now</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => {
                  if (content !== lastSavedContentRef.current) {
                    saveContent();
                  }
                  router.push(`/dashboard/${projectId}/module/${moduleId}`);
                }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Back</span>
              </button>

              <div className="border-l border-white/10 pl-3 min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-white truncate">
                  {phase.title}
                </h1>
                {module && (
                  <p className="text-xs text-gray-400 truncate hidden sm:block">
                    {module.title}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Word Count */}
              <div className="flex items-center gap-3 text-sm text-gray-400 px-3 py-2 bg-white/5 rounded-lg">
                <span className="font-medium">{wordCount.toLocaleString()}w</span>
                <span className="text-gray-600">•</span>
                <span>{charCount.toLocaleString()}c</span>
              </div>

              {/* Save Status */}
              <div className="flex items-center gap-2 min-w-[90px] px-3 py-2 bg-white/5 rounded-lg">
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span className="text-sm text-yellow-400">Saving</span>
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
                {saveStatus === "idle" && (
                  <span className="text-sm text-gray-400">Ready</span>
                )}
              </div>

              {/* Focus Mode Button */}
              <button
                onClick={() => setShowFocusMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                <Maximize className="w-4 h-4" />
                <span className="text-sm font-medium">Focus</span>
              </button>

              {/* AI Partner Button */}
              <button
                onClick={handleOpenAIPartner}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI</span>
              </button>

              {/* Comments Button */}
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Version History Button */}
              <button
                onClick={() => setShowVersionHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-all"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Save Button */}
              <button
                onClick={handleManualSave}
                disabled={
                  saveStatus === "saving" ||
                  content === lastSavedContentRef.current
                }
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile: Word count + Menu */}
            <div className="lg:hidden flex items-center gap-3">
              <div className="text-xs text-gray-400 font-medium">
                {wordCount.toLocaleString()}w
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Description */}
      {phase.description && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <strong className="font-semibold">Description:</strong>{" "}
              {phase.description}
            </p>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex h-[calc(100vh-160px)]">
        <div className={`flex-1 ${showComments ? "lg:pr-96" : ""}`}>
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your story..."
          />
        </div>

        {/* Comments Panel - Desktop */}
        {showComments && (
          <div className="hidden lg:block fixed right-0 top-[80px] w-96 h-[calc(100vh-80px)] border-l border-white/10 bg-gray-900/95 backdrop-blur-sm overflow-y-auto">
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

        {/* Comments Panel - Mobile Overlay */}
        {showComments && (
          <div className="lg:hidden fixed inset-0 z-40 bg-gray-900">
            <div className="sticky top-0 bg-gray-800 border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
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

      {/* Version History Modal */}
      {showVersionHistory && (
        <VersionHistory
          phaseId={phaseId}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onRestore={handleRestoreVersion}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      {/* AI Writing Partner */}
      {showAIPartner && (
        <AIWritingPartner
          phaseId={phaseId}
          phaseTitle={phase?.title || ""}
          currentContent={content}
          fullStoryContext={fullStoryContext}
          onClose={() => setShowAIPartner(false)}
        />
      )}

      {/* Focus Mode */}
      {showFocusMode && (
        <FocusModeEditor
          content={content}
          onChange={handleContentChange}
          onExit={() => setShowFocusMode(false)}
          wordCount={wordCount}
          charCount={charCount}
        />
      )}
    </div>
  );
}