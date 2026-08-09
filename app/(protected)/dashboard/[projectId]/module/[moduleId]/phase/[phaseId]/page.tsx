"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import VersionHistory from "./components/VersionHistory";
import CommentsPanel from "./components/CommentsPanel";
import RichTextEditor from "./components/RichTextEditor";
import AIWritingPartner from "./components/AIWritingPartner";
import FocusModeEditor from "./components/FocusModeEditor";
import StoryWiki from "./components/StoryWiki";
import { savePhaseMemory, extractAndSaveEntities } from "@/lib/ai/storyMemory";
import WritingSprintModal from "./components/WritingSprintModal";
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
  Wand2,
  Maximize,
  BookMarked,
  RefreshCw,
  Users,
  Flame,
  Edit,
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
  const [showWiki, setShowWiki] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [sprintTimeLeft, setSprintTimeLeft] = useState("");
  const [sprintWordsWritten, setSprintWordsWritten] = useState(0);
  const [isSyncingMemory, setIsSyncingMemory] = useState(false);

  // Edit Phase Title & Description Modal State
  const [showEditPhaseModal, setShowEditPhaseModal] = useState(false);
  const [editPhaseTitle, setEditPhaseTitle] = useState("");
  const [editPhaseDescription, setEditPhaseDescription] = useState("");
  const [savingPhaseInfo, setSavingPhaseInfo] = useState(false);

  const openEditPhaseModal = () => {
    if (!phase) return;
    setEditPhaseTitle(phase.title);
    setEditPhaseDescription(phase.description || "");
    setShowEditPhaseModal(true);
  };

  const handleSavePhaseInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phase || !editPhaseTitle.trim()) return;
    setSavingPhaseInfo(true);

    try {
      const { error } = await supabase
        .from("phases")
        .update({
          title: editPhaseTitle.trim(),
          description: editPhaseDescription.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", phase.id);

      if (error) throw error;

      setPhase((prev) =>
        prev
          ? {
              ...prev,
              title: editPhaseTitle.trim(),
              description: editPhaseDescription.trim() || null,
            }
          : null
      );
      setShowEditPhaseModal(false);
    } catch (err: any) {
      alert("Failed to update phase info: " + (err.message || err));
    } finally {
      setSavingPhaseInfo(false);
    }
  };

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
        let isAcceptedCollaborator = false;

        if (!ownerCheck && !isAssigned) {
          // Check project_members role
          const { data: member } = await supabase
            .from("project_members")
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .eq("status", "accepted")
            .maybeSingle();

          if (member) {
            const role = (member.role || "").toLowerCase();
            // All roles except viewer/beta_reader have write/edit access
            isAcceptedCollaborator = !["viewer", "reader", "beta_reader"].includes(role);
          }

          // Check collaboration_requests
          if (!isAcceptedCollaborator) {
            const { data: collab } = await supabase
              .from("collaboration_requests")
              .select("id")
              .eq("project_id", projectId)
              .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
              .eq("status", "accepted")
              .maybeSingle();

            if (collab) {
              isAcceptedCollaborator = true;
            }
          }
        }

        setIsOwner(ownerCheck);
        setCanEdit(ownerCheck || isAssigned || isAcceptedCollaborator);
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

  const handleMemorySync = async () => {
    if (!phase || !content || isSyncingMemory) return;
    setIsSyncingMemory(true);
    try {
      // Run both in parallel: embed the text + extract entities
      await Promise.all([
        savePhaseMemory(projectId, phaseId, phase.title, content),
        extractAndSaveEntities(projectId, phaseId, phase.title, content),
      ]);
      // Open the wiki so user can see the results
      setShowWiki(true);
    } catch (err) {
      console.error("❌ Memory sync failed:", err);
    } finally {
      setIsSyncingMemory(false);
    }
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
    <div className="flex flex-col flex-1 h-full min-h-0 -m-5 sm:-m-6 bg-[#13121a]">
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
        <div className="pt-14 pb-4 px-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <h3 className="text-lg font-bold text-white">Editor Tools</h3>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/15 transition-all flex items-center gap-1 text-xs font-semibold"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
            <span>Close</span>
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
            onClick={() => {
              setShowSprintModal(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Flame className="w-5 h-5" />
            <span>Writing Sprint {isSprintActive ? `(${sprintTimeLeft})` : ""}</span>
          </button>

          <button
            onClick={() => {
              setShowFocusMode(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            <Maximize className="w-5 h-5" />
            <span>Focus Mode</span>
          </button>

          <button
            onClick={() => {
              handleOpenAIPartner();
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            <Wand2 className="w-5 h-5" />
            <span>AI Writing Partner</span>
          </button>

          <button
            onClick={() => {
              setShowWiki(!showWiki);
              setShowComments(false);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl hover:bg-amber-500/30 transition-all"
          >
            <BookMarked className="w-5 h-5" />
            <span>{showWiki ? "Hide" : "Show"} Story Wiki</span>
          </button>

          <button
            onClick={() => {
              setShowComments(!showComments);
              setShowWiki(false);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{showComments ? "Hide" : "Show"} Comments</span>
          </button>

          <button
            onClick={() => {
              window.open(`/dashboard/${projectId}/characters`, "_blank");
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Character Profiles</span>
          </button>

          <button
            onClick={() => {
              handleMemorySync();
              setIsMobileMenuOpen(false);
            }}
            disabled={isSyncingMemory}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl hover:bg-indigo-500/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncingMemory ? "animate-spin" : ""}`} />
            <span>Sync AI Memory</span>
          </button>

          <button
            onClick={() => {
              setShowVersionHistory(true);
              setIsMobileMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/30 transition-all"
          >
            <History className="w-5 h-5" />
            <span>Version History</span>
          </button>

          <button
            onClick={() => {
              handleManualSave();
              setIsMobileMenuOpen(false);
            }}
            disabled={
              saveStatus === "saving" || content === lastSavedContentRef.current
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>Save Now</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#181724] px-4 sm:px-6 py-2.5 flex-shrink-0 z-30 transition-colors">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Back button and title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                onClick={() => {
                  if (content !== lastSavedContentRef.current) {
                    saveContent();
                  }
                  router.push(`/dashboard/${projectId}/module/${moduleId}`);
                }}
                className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline font-medium">Back</span>
              </button>

              <div className="border-l border-slate-200 dark:border-white/10 pl-3 min-w-0 flex-1 flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {phase.title}
                </h1>
                {canEdit && (
                  <button
                    onClick={openEditPhaseModal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all text-xs font-semibold outfit cursor-pointer shrink-0 ml-1 shadow-sm"
                    title="Edit Phase Title & Description"
                  >
                    <Edit className="w-3 h-3 text-purple-500" />
                    <span>Edit Scene Info</span>
                  </button>
                )}
                {module && (
                  <p className="text-xs text-slate-500 dark:text-gray-400 truncate hidden sm:block ml-2 border-l border-slate-200 dark:border-white/10 pl-2">
                    {module.title}
                  </p>
                )}
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Word Count */}
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-400 px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-lg font-medium">
                <span>{wordCount.toLocaleString()}w</span>
                <span className="text-slate-300 dark:text-gray-600">•</span>
                <span>{charCount.toLocaleString()}c</span>
              </div>

              {/* Save Status */}
              <div className="flex items-center gap-2 min-w-[90px] px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent rounded-lg">
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-4 h-4 text-amber-600 dark:text-yellow-400 animate-spin" />
                    <span className="text-sm font-semibold text-amber-600 dark:text-yellow-400">Saving</span>
                  </>
                )}
                {saveStatus === "saved" && (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-emerald-600 dark:text-green-400">Saved</span>
                  </>
                )}
                {saveStatus === "error" && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">Error</span>
                  </>
                )}
                {saveStatus === "idle" && (
                  <span className="text-sm font-medium text-slate-500 dark:text-gray-400">Ready</span>
                )}
              </div>

              {/* Sprint Companion Button */}
              <button
                onClick={() => setShowSprintModal(true)}
                title="Writing Sprint & Pomodoro Timer"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm ${
                  isSprintActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse shadow-orange-500/20"
                    : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                <Flame className={`w-4 h-4 ${isSprintActive ? "text-white" : "text-amber-500"}`} />
                <span>
                  {isSprintActive
                    ? `${sprintTimeLeft} (+${sprintWordsWritten}w)`
                    : "Sprint"}
                </span>
              </button>

              {/* Focus Mode Button */}
              <button
                onClick={() => setShowFocusMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm"
              >
                <Maximize className="w-4 h-4" />
                <span>Focus</span>
              </button>

              {/* AI Partner Button */}
              <button
                onClick={handleOpenAIPartner}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium text-sm"
              >
                <Wand2 className="w-4 h-4" />
                <span>AI</span>
              </button>

              {/* Memory Sync Button */}
              <button
                onClick={handleMemorySync}
                disabled={isSyncingMemory}
                title="Sync AI Memory — extracts characters, locations, and embeds text for smarter AI suggestions"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-transparent rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingMemory ? "animate-spin" : ""}`} />
                <span>Memory</span>
              </button>

              {/* Story Wiki Button */}
              <button
                onClick={() => {
                  setShowWiki(!showWiki);
                  setShowComments(false);
                }}
                title="Story Wiki — view auto-extracted characters, locations, and items"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
                  showWiki
                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/50"
                    : "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-transparent"
                }`}
              >
                <BookMarked className="w-4 h-4" />
              </button>

              {/* Character Profiles Button */}
              <button
                onClick={() => window.open(`/dashboard/${projectId}/characters`, "_blank")}
                title="Character Profiles — open full character bible in new tab"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-transparent rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-all"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Comments Button */}
              <button
                onClick={() => {
                  setShowComments(!showComments);
                  setShowWiki(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-transparent rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/30 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Version History Button */}
              <button
                onClick={() => setShowVersionHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-transparent rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-500/30 transition-all"
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
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-transparent rounded-lg hover:bg-purple-100 dark:hover:bg-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Header Quick Tools */}
            <div className="lg:hidden flex items-center gap-1.5">
              {/* Quick Sprint */}
              <button
                onClick={() => setShowSprintModal(true)}
                title="Writing Sprint"
                className={`p-2 rounded-lg font-medium text-xs transition-all ${
                  isSprintActive
                    ? "bg-amber-500 text-white animate-pulse"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                }`}
              >
                <Flame className="w-4 h-4" />
              </button>

              {/* Quick AI */}
              <button
                onClick={handleOpenAIPartner}
                title="AI Writing Partner"
                className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                <Wand2 className="w-4 h-4" />
              </button>

              {/* Quick Comments */}
              <button
                onClick={() => {
                  setShowComments(!showComments);
                  setShowWiki(false);
                }}
                title="Comments"
                className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              {/* Menu Launcher */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 ml-1"
                title="All Tools"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      {/* Phase Description */}
      {phase.description && (
        <div className="px-4 sm:px-6 py-2 flex-shrink-0">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-300">
              <strong className="font-semibold">Description:</strong>{" "}
              {phase.description}
            </p>
          </div>
        </div>
      )}

      {/* Main Editor & Side Panels Container */}
      <div className="flex-1 flex min-h-[550px] overflow-hidden bg-white dark:bg-[#13121a]">
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <RichTextEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your story..."
          />
        </div>

        {/* Story Wiki Panel - Desktop */}
        {showWiki && !showComments && (
          <div className="hidden lg:block w-80 h-full border-l border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16151f] overflow-y-auto p-4 flex-shrink-0 z-20">
            <StoryWiki projectId={projectId} />
          </div>
        )}

        {/* Comments Panel - Desktop */}
        {showComments && (
          <div className="hidden lg:block w-80 h-full border-l border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#16151f] overflow-y-auto flex-shrink-0 z-20">
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

      {/* Comments Panel - Mobile Overlay */}
      {showComments && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-slate-950/95 dark:bg-[#0e0d14]/98 backdrop-blur-xl flex flex-col">
          <div className="sticky top-0 bg-slate-900 dark:bg-[#181724] border-b border-slate-700/80 dark:border-white/10 pt-14 pb-4 px-4 flex items-center justify-between z-10 shadow-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Comments & Feedback</h3>
            </div>
            <button
              onClick={() => setShowComments(false)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-md"
              title="Close Comments"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
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
        </div>
      )}

      {/* Story Wiki Panel - Mobile Overlay */}
      {showWiki && (
        <div className="lg:hidden fixed inset-0 z-[100] bg-slate-950/95 dark:bg-[#0e0d14]/98 backdrop-blur-xl flex flex-col">
          <div className="sticky top-0 bg-slate-900 dark:bg-[#181724] border-b border-slate-700/80 dark:border-white/10 pt-14 pb-4 px-4 flex items-center justify-between z-10 shadow-lg">
            <div className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Story Wiki</h3>
            </div>
            <button
              onClick={() => setShowWiki(false)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold shadow-md"
              title="Close Story Wiki"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <StoryWiki projectId={projectId} />
          </div>
        </div>
      )}

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

      {/* Writing Sprint Companion */}
      <WritingSprintModal
        isOpen={showSprintModal}
        onClose={() => setShowSprintModal(false)}
        currentWordCount={wordCount}
        onSprintStateChange={(active, timeLeft, wordsAdded) => {
          setIsSprintActive(active);
          setSprintTimeLeft(timeLeft);
          setSprintWordsWritten(wordsAdded);
        }}
      />

      {/* Edit Phase Title & Description Modal */}
      {showEditPhaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#181724] rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white outfit">Edit Phase Details</h3>
              <button
                onClick={() => setShowEditPhaseModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSavePhaseInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                  Phase Title <span className="text-pink-500">*</span>
                </label>
                <input
                  value={editPhaseTitle}
                  onChange={(e) => setEditPhaseTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0c14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                  Phase Description / Goal
                </label>
                <textarea
                  value={editPhaseDescription}
                  onChange={(e) => setEditPhaseDescription(e.target.value)}
                  placeholder="Outline the scene goals, characters present, or plot beats for this phase..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0c14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 min-h-[90px] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPhaseModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 outfit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPhaseInfo || !editPhaseTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 outfit flex items-center justify-center gap-2"
                >
                  {savingPhaseInfo ? "Saving..." : "Save Phase Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}