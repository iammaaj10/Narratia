"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { notificationHelpers } from "@/lib/notifications/createNotification";
import {
  ArrowLeft,
  PlusCircle,
  FileText,
  User,
  Edit,
  Trash2,
  Film,
  Heart,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Module = {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
};

type Phase = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

type TeamMember = {
  user_id: string;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
};

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<Module | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showCreatePhase, setShowCreatePhase] = useState(false);

  useEffect(() => {
    loadModuleData();
  }, [moduleId]);

  const loadModuleData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      if (moduleError) {
        console.error("❌ Module error:", moduleError);
        alert("Failed to load module");
        router.push(`/dashboard/${projectId}`);
        return;
      }

      setModule(moduleData);

      // Check if user is owner
      const { data: projectData } = await supabase
        .from("projects")
        .select("owner_id, is_team")
        .eq("id", projectId)
        .single();

      if (projectData) {
        setIsOwner(projectData.owner_id === user.id);

        if (projectData.is_team) {
          const { data: membersData } = await supabase
            .from("project_members")
            .select("user_id, role")
            .eq("project_id", projectId)
            .eq("status", "accepted")
            .not("user_id", "is", null);

          if (membersData && membersData.length > 0) {
            const userIds = membersData.map((m) => m.user_id);

            const { data: profilesData } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .in("id", userIds);

            if (profilesData) {
              const combined = userIds
                .map((userId) => {
                  const profile = profilesData.find((p) => p.id === userId);
                  return {
                    user_id: userId,
                    profiles: profile || null,
                  };
                })
                .filter((m) => m.profiles !== null);

              setTeamMembers(combined as TeamMember[]);
            }
          }
        }
      }

      // Load phases
      const { data: phasesData } = await supabase
        .from("phases")
        .select(
          `
          id,
          title,
          description,
          assigned_to,
          content,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `
        )
        .eq("module_id", moduleId)
        .order("created_at", { ascending: true });

      setPhases((phasesData || []) as unknown as Phase[]);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePhase = async (phaseId: string) => {
    if (!confirm("Are you sure you want to delete this phase?")) return;

    const { error } = await supabase.from("phases").delete().eq("id", phaseId);

    if (error) {
      console.error("❌ Delete error:", error);
      alert(`Failed to delete phase: ${error.message}`);
      return;
    }

    setPhases(phases.filter((p) => p.id !== phaseId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-gray-400">Loading module...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-gray-400">Module not found</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-12"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => router.push(`/dashboard/${projectId}`)}
          className="group flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-purple-400 transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Project
        </button>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-4">
          <div className="flex-1">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div className="inline-flex px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-300">
                Story Module
              </div>
            </motion.div>
            
            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
              {module.title}
            </motion.h1>
            
            {module.description && (
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-gray-400 text-base lg:text-lg max-w-3xl leading-relaxed">
                {module.description}
              </motion.p>
            )}
          </div>
        </div>

        {/* Phases Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Phases / Episodes</h2>
                <p className="text-sm text-gray-400">Manage the individual scenes of this module.</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Emotion Heatmap */}
                {phases.length > 0 && (
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/${projectId}/module/${moduleId}/emotions`
                      )
                    }
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 rounded-xl font-medium border border-pink-500/20 transition-all group"
                  >
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Heatmap</span>
                  </button>
                )}

                {/* Convert to Screenplay */}
                {phases.length > 0 && (
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/${projectId}/module/${moduleId}/screenplay`
                      )
                    }
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-xl font-medium border border-cyan-500/20 transition-all group"
                  >
                    <Film className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Screenplay</span>
                  </button>
                )}

                {/* Create Phase */}
                <button
                  onClick={() => setShowCreatePhase(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all group"
                >
                  <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  <span>New Phase</span>
                </button>
              </div>
            )}
          </div>

          {/* Phases List */}
          {phases.length === 0 ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 rounded-3xl border border-dashed border-white/20 bg-white/[0.01]"
            >
              <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <FileText className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No phases created yet
              </h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                Break your story down into manageable scenes or chapters.
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowCreatePhase(true)}
                  className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-105"
                >
                  Create First Phase
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {phases.map((phase, index) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => router.push(`/dashboard/${projectId}/module/${moduleId}/phase/${phase.id}`)}
                    className="group cursor-pointer relative p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-purple-500/30 hover:shadow-[0_8px_30px_rgb(168,85,247,0.1)] transition-all overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] pointer-events-none group-hover:bg-purple-500/10 transition-colors rounded-full" />
                    
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-400 group-hover:bg-purple-500/20 group-hover:text-purple-300 group-hover:border-purple-500/30 transition-colors">
                          {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                          {phase.title}
                        </h3>
                      </div>

                      {phase.description && (
                        <p className="text-sm text-gray-400 truncate pl-11 mb-3">
                          {phase.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pl-11">
                        {/* Assigned Writer */}
                        {phase.profiles && (
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-black/20 px-2 py-1 rounded-md">
                            <User className="w-3.5 h-3.5" />
                            <span className="truncate">
                              {phase.profiles.username}
                            </span>
                          </div>
                        )}

                        {/* Word Count */}
                        <div className="text-xs font-medium text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                          {phase.content
                            ? `${phase.content.split(" ").filter((w) => w.length > 0).length} words`
                            : "No content yet"}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="relative z-10 flex items-center gap-2 self-end sm:self-auto opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/${projectId}/module/${moduleId}/phase/${phase.id}`);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 transition-all"
                        title="Edit Phase"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhase(phase.id);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 transition-all"
                          title="Delete Phase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Phase Modal */}
      {showCreatePhase && (
        <CreatePhaseModal
          moduleId={moduleId}
          projectId={projectId}
          teamMembers={teamMembers}
          onClose={() => setShowCreatePhase(false)}
          onSuccess={() => {
            setShowCreatePhase(false);
            loadModuleData();
          }}
        />
      )}
    </motion.div>
  );
}

// Create Phase Modal Component
function CreatePhaseModal({
  moduleId,
  projectId,
  teamMembers,
  onClose,
  onSuccess,
}: {
  moduleId: string;
  projectId: string;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Phase title is required");
      return;
    }

    setLoading(true);

    const { data: newPhase, error } = await supabase
      .from("phases")
      .insert({
        module_id: moduleId,
        title: title.trim(),
        description: description.trim() || null,
        assigned_to: assignedTo || null,
        content: "",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Phase creation error:", error);
      alert(`Failed to create phase: ${error.message}`);
      setLoading(false);
      return;
    }

    // Send notification if assigned to someone
    if (assignedTo && newPhase) {
      await notificationHelpers.phaseAssignment(
        assignedTo,
        title.trim(),
        projectId,
        moduleId,
        newPhase.id
      );
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          Create New Phase
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phase Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Episode 1, Chapter 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Brief description of this phase"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[80px] resize-none"
            />
          </div>

          {teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign Writer (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => {
                  if (!member.profiles) return null;
                  return (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profiles.username}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl border border-white/10 text-sm sm:text-base text-gray-300 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Phase"}
          </button>
        </div>
      </div>
    </div>
  );
}