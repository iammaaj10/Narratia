"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  BookOpen,
  Users,
  PlusCircle,
  FolderOpen,
  ArrowLeft,
  Share2,
  MessageCircle,
  Loader2,
  ChevronRight,
  Wand2,
  Settings,
  MoreVertical,
  Calendar,
  Edit,
  Trash2
} from "lucide-react";
import ExportModal from "./module/[moduleId]/phase/[phaseId]/components/ExportModal";
import ShareSettingsModal from "../components/ShareSettingsModal";

type Project = {
  id: string;
  title: string;
  description: string | null;
  is_team: boolean;
  owner_id: string;
  is_public: boolean;
  slug: string | null;
  view_count: number;
};

type Member = {
  id: string;
  role: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareSettings, setShowShareSettings] = useState(false);

  // Edit Story Title & Description Modal State
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  // Edit Module Modal State
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");
  const [editModuleDescription, setEditModuleDescription] = useState("");
  const [savingModule, setSavingModule] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, description, is_team, owner_id, is_public, slug, view_count, created_at, updated_at")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("❌ Project error:", projectError);
        alert("Failed to load project");
        router.push("/dashboard");
        return;
      }

      setProject(projectData);
      const owner = projectData.owner_id === user.id;
      setIsOwner(owner);

      // Security: verify user has access to this project
      if (!owner) {
        // Check project_members table
        const { data: membership } = await supabase
          .from("project_members")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .eq("status", "accepted")
          .maybeSingle();

        // Also check collaboration_requests table
        const { data: collab } = await supabase
          .from("collaboration_requests")
          .select("id")
          .eq("project_id", projectId)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq("status", "accepted")
          .maybeSingle();

        if (!membership && !collab) {
          console.warn("⚠️ Access denied: User is not owner, member, or accepted collaborator.");
          router.push("/dashboard");
          return;
        }

        // Ensure is_team flag is enabled so collaborators stay in workspace
        if (!projectData.is_team) {
          await supabase
            .from("projects")
            .update({ is_team: true })
            .eq("id", projectId);
          projectData.is_team = true;
          setProject((prev) => (prev ? { ...prev, is_team: true } : null));
        }
      }

      if (projectData.is_team) {
        const { data: memberRecords } = await supabase
          .from("project_members")
          .select("id, role, user_id")
          .eq("project_id", projectId)
          .eq("status", "accepted")
          .not("user_id", "is", null);

        if (memberRecords && memberRecords.length > 0) {
          const userIds = memberRecords.map((m) => m.user_id);

          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", userIds);

          const combined = memberRecords.map((member) => ({
            id: member.id,
            role: member.role,
            profiles:
              profilesData?.find((p) => p.id === member.user_id) || null,
          }));

          setMembers(combined as unknown as Member[]);
        }
      }

      const { data: modulesData } = await supabase
        .from("modules")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setModules(modulesData || []);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProjectInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editTitle.trim()) return;
    setSavingProject(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        })
        .eq("id", project.id);

      if (error) throw error;

      setProject((prev) =>
        prev ? { ...prev, title: editTitle.trim(), description: editDescription.trim() || null } : null
      );
      setShowEditProjectModal(false);
    } catch (err: any) {
      alert("Failed to update story info: " + (err.message || err));
    } finally {
      setSavingProject(false);
    }
  };

  const openEditProjectModal = () => {
    if (!project) return;
    setEditTitle(project.title);
    setEditDescription(project.description || "");
    setShowEditProjectModal(true);
  };

  const openEditModuleModal = (moduleToEdit: Module) => {
    setEditingModule(moduleToEdit);
    setEditModuleTitle(moduleToEdit.title);
    setEditModuleDescription(moduleToEdit.description || "");
    setShowEditModuleModal(true);
  };

  const handleSaveModuleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !editModuleTitle.trim()) return;
    setSavingModule(true);

    try {
      const { error } = await supabase
        .from("modules")
        .update({
          title: editModuleTitle.trim(),
          description: editModuleDescription.trim() || null,
        })
        .eq("id", editingModule.id);

      if (error) throw error;

      await loadProjectData();
      setShowEditModuleModal(false);
    } catch (err: any) {
      alert("Failed to update module: " + (err.message || err));
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Are you sure you want to delete this module and all its phases?")) return;
    try {
      const { error } = await supabase.from("modules").delete().eq("id", moduleId);
      if (error) throw error;
      await loadProjectData();
    } catch (err: any) {
      alert("Failed to delete module: " + (err.message || err));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <div className="text-gray-400 font-medium">Loading project details...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-12"
    >
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-lg shadow-xl border border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-bold mb-4">Edit Story Info</h2>
            <form onSubmit={handleSaveProjectInfo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent h-24"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                <button type="submit" disabled={savingProject} className="px-4 py-2 rounded-lg bg-purple-600 text-white flex-1">
                  {savingProject ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => router.push("/dashboard")}
          className="group flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center border border-purple-200 dark:border-white/10">
                <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="inline-flex px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-gray-300">
                {project.is_team ? "Team Project" : "Solo Project"}
              </div>
              {project.is_public && (
                <div className="inline-flex px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Public
                </div>
              )}
            </motion.div>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                {project.title}
              </h1>
              {isOwner && (
                <button
                  onClick={openEditProjectModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-all text-xs font-bold outfit cursor-pointer shrink-0 mt-1 shadow-sm"
                  title="Edit Story Title & Synopsis"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Story Info</span>
                </button>
              )}
            </motion.div>

            {project.description ? (
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-slate-600 dark:text-gray-400 text-base lg:text-lg max-w-3xl leading-relaxed">
                {project.description}
              </motion.p>
            ) : isOwner ? (
              <button
                onClick={openEditProjectModal}
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1.5 pt-1"
              >
                + Add story premise & synopsis
              </button>
            ) : null}
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap items-center gap-3 shrink-0">
            {project.is_team && isOwner && (
              <button
                onClick={() => router.push(`/dashboard/${projectId}/team`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white shadow-sm transition-all group"
              >
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                Team
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setShowShareSettings(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all group outfit"
              >
                <Share2 className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                {project.is_public ? "Manage Community Link 🌐" : "Publish to Community 🌐"}
              </button>
            )}

            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white shadow-sm transition-all group"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              Export
            </button>

            <button
              onClick={() => router.push(`/dashboard/${projectId}/settings`)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 shadow-sm transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Team Members Section */}
        {project.is_team && members.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 shadow-md dark:shadow-none"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Collaborators</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-white/10 text-xs font-semibold text-purple-700 dark:text-gray-300">
                  {members.length}
                </span>
              </div>
              {isOwner && (
                <button
                  onClick={() => router.push(`/dashboard/${projectId}/team`)}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold"
                >
                  Manage
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {members.map((member) => {
                if (!member.profiles) return null;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-default group"
                  >
                    {member.profiles.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/20"
                        alt={member.profiles.username}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-inner">
                        <span className="text-white text-xs font-bold">
                          {member.profiles.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        {member.profiles.username}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Characters Section — Quick Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          onClick={() => router.push(`/dashboard/${projectId}/characters`)}
          className="group cursor-pointer p-5 rounded-2xl border border-purple-200 dark:border-purple-500/20 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-500/[0.06] dark:to-indigo-500/[0.04] hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center border border-purple-200 dark:border-purple-500/30 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">Character Profiles</h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">View and manage your story&apos;s cast of characters</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
          </div>
        </motion.div>

        {/* Story Modules Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Story Modules</h2>
                <p className="text-sm text-slate-600 dark:text-gray-400">Organize your story into acts, chapters, or scenes.</p>
              </div>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowCreateModule(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium shadow-lg shadow-purple-500/25 transition-all group"
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                <span>New Module</span>
              </button>
            )}
          </div>

          {/* Modules List */}
          {modules.length === 0 ? (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 rounded-3xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-white/[0.01]"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 border border-slate-200 dark:border-transparent">
                <FolderOpen className="w-10 h-10 text-slate-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No modules created yet
              </h3>
              <p className="text-slate-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                Break your story down into manageable chunks. Start by creating your first module.
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowCreateModule(true)}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
                >
                  Create First Module
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence>
                {modules.map((module, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ y: -4 }}
                    key={module.id}
                    onClick={() => router.push(`/dashboard/${projectId}/module/${module.id}`)}
                    className="group cursor-pointer flex flex-col h-48 p-6 rounded-3xl bg-white dark:bg-white/[0.03] hover:bg-slate-50/80 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.08] hover:border-purple-400 dark:hover:border-purple-500/40 shadow-md hover:shadow-xl dark:shadow-none transition-all overflow-hidden relative"
                  >
                    <div className="flex items-start justify-between mb-3 z-10">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-white/5 flex items-center justify-center border border-purple-200 dark:border-white/10 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 group-hover:border-purple-300 dark:group-hover:border-purple-500/30 transition-colors">
                        <FolderOpen className="w-5 h-5 text-purple-600 dark:text-gray-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isOwner && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModuleModal(module);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/10 transition-all"
                              title="Edit Module Title & Description"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteModule(module.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                              title="Delete Module"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 z-10">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-1">
                        {module.title}
                      </h3>
                      {module.description ? (
                        <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2">
                          {module.description}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-gray-500 italic">
                          No description
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-gray-500 font-medium z-10">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                      {new Date(module.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModule && (
          <CreateModuleModal
            projectId={projectId}
            onClose={() => setShowCreateModule(false)}
            onSuccess={() => {
              setShowCreateModule(false);
              loadProjectData();
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit Module Modal */}
      {showEditModuleModal && editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#181724] rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white outfit">Edit Module Details</h3>
              <button
                onClick={() => setShowEditModuleModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveModuleInfo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                  Module Title <span className="text-pink-500">*</span>
                </label>
                <input
                  value={editModuleTitle}
                  onChange={(e) => setEditModuleTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0c14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                  Module Description / Overview
                </label>
                <textarea
                  value={editModuleDescription}
                  onChange={(e) => setEditModuleDescription(e.target.value)}
                  placeholder="Summary of chapters or plot arc contained in this module..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0c14] text-sm text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 min-h-[90px] resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModuleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 outfit"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingModule || !editModuleTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 outfit flex items-center justify-center gap-2"
                >
                  {savingModule ? "Saving..." : "Save Module Info"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExportModal && project && (
        <ExportModal
          projectId={projectId}
          projectTitle={project.title}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showShareSettings && project && (
        <ShareSettingsModal
          projectId={projectId}
          project={project}
          onClose={() => setShowShareSettings(false)}
          onUpdate={() => loadProjectData()}
        />
      )}
    </motion.div>
  );
}

function CreateModuleModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Module title is required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("modules").insert({
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || null,
    });

    setLoading(false);

    if (error) {
      console.error("❌ Module creation error:", error);
      alert(`Failed to create module: ${error.message}`);
      return;
    }

    onSuccess();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-white/10 p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center border border-purple-200 dark:border-purple-500/30">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              New Module
            </h2>
          </div>

          <div className="space-y-5 mb-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider ml-1 flex items-center gap-2">
                Module Title
                <span className="text-purple-600 dark:text-purple-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Season 1, Act 1, Beginning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wider ml-1">
                Description (Optional)
              </label>
              <textarea
                placeholder="Brief description of this module's contents"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/10 rounded-2xl px-5 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[120px] resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              Create Module
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
