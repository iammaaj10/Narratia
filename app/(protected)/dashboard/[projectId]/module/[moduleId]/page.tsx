"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  ArrowLeft,
  PlusCircle,
  FileText,
  User,
  Edit,
  Trash2,
} from "lucide-react";

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

      // Check session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("🔐 Session:", sessionData.session ? "EXISTS" : "MISSING");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("❌ No user found");
        router.push("/login");
        return;
      }

      console.log("✅ User ID:", user.id);

      // Load module
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("*")
        .eq("id", moduleId)
        .single();

      console.log("📊 Module query:", { data: moduleData, error: moduleError });

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

        // Load team members if team project
        // Load team members if team project
        if (projectData.is_team) {
          // First get accepted members
          const { data: membersData, error: membersError } = await supabase
            .from("project_members")
            .select("user_id")
            .eq("project_id", projectId)
            .eq("status", "accepted")
            .not("user_id", "is", null);

          console.log("👥 Members query result:", {
            data: membersData,
            error: membersError,
          });

          if (membersError) {
            console.error("❌ Members error:", membersError);
          } else if (membersData && membersData.length > 0) {
            // Then get their profiles separately
            const userIds = membersData.map((m) => m.user_id);

            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .in("id", userIds);

            console.log("👥 Profiles query result:", {
              data: profilesData,
              error: profilesError,
            });

            if (profilesData) {
              // Combine them
              const combined = membersData.map((member) => ({
                user_id: member.user_id,
                profiles:
                  profilesData.find((p) => p.id === member.user_id) || null,
              }));

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
        `,
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
      <div className="p-12 text-center">
        <div className="text-gray-400">Loading module...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-400">Module not found</div>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/dashboard/${projectId}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-3">
              {module.title}
            </h1>
            {module.description && (
              <p className="text-gray-400 text-lg">{module.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Phases Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Phases / Episodes</h2>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreatePhase(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Create Phase
            </button>
          )}
        </div>

        {/* Phases List */}
        {phases.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-white/20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No phases yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create phases to organize your story episodes
            </p>
            {isOwner && (
              <button
                onClick={() => setShowCreatePhase(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Create First Phase
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-semibold">
                        Phase {index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-white">
                        {phase.title}
                      </h3>
                    </div>

                    {phase.description && (
                      <p className="text-sm text-gray-400 mb-3">
                        {phase.description}
                      </p>
                    )}

                    {/* Assigned Writer */}
                    {phase.profiles && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Assigned to: {phase.profiles.username}</span>
                      </div>
                    )}

                    {/* Word Count */}
                    <div className="mt-2 text-xs text-gray-500">
                      {phase.content
                        ? `${phase.content.split(" ").filter((w) => w.length > 0).length} words`
                        : "No content yet"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/${projectId}/module/${moduleId}/phase/${phase.id}`,
                        )
                      }
                      className="p-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => deletePhase(phase.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Phase Modal */}
      {showCreatePhase && (
        <CreatePhaseModal
          moduleId={moduleId}
          teamMembers={teamMembers}
          onClose={() => setShowCreatePhase(false)}
          onSuccess={() => {
            setShowCreatePhase(false);
            loadModuleData();
          }}
        />
      )}
    </div>
  );
}

// Create Phase Modal Component
function CreatePhaseModal({
  moduleId,
  teamMembers,
  onClose,
  onSuccess,
}: {
  moduleId: string;
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

    const { error } = await supabase.from("phases").insert({
      module_id: moduleId,
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      content: "",
    });

    setLoading(false);

    if (error) {
      console.error("❌ Phase creation error:", error);
      alert(`Failed to create phase: ${error.message}`);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Phase</h2>

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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[80px] resize-none"
            />
          </div>

          {/* Assign Writer */}
          {teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign Writer (Optional)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
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

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Phase"}
          </button>
        </div>
      </div>
    </div>
  );
}
