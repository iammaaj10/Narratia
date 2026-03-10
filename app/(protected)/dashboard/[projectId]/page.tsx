"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Download,
  BookOpen,
  Users,
  PlusCircle,
  FolderOpen,
  ArrowLeft,
  Share2,
  MessageCircle,
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
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) {
        console.error("❌ Project error:", projectError);
        alert("Failed to load project");
        router.push("/dashboard");
        return;
      }

      setProject(projectData);
      setIsOwner(projectData.owner_id === user.id);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-gray-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Dashboard</span>
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-2 sm:mb-3">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-gray-400 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">
                {project.description}
              </p>
            )}
            <div className="inline-flex px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-300 text-xs sm:text-sm font-medium">
              {project.is_team ? "Team Project" : "Solo Project"}
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        {project.is_team && members.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Team Members
              </h2>
              <span className="text-xs sm:text-sm text-gray-400">
                ({members.length})
              </span>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {members.map((member) => {
                if (!member.profiles) return null;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-white/10"
                  >
                    {member.profiles.avatar_url ? (
                      <img
                        src={member.profiles.avatar_url}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                        alt={member.profiles.username}
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-semibold">
                          {member.profiles.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-white">
                        {member.profiles.username}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-400 capitalize">
                        {member.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Story Modules Section */}
        <div>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Story Modules
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3">
              {/* Team Management Button */}
              {project.is_team && isOwner && (
                <button
                  onClick={() => router.push(`/dashboard/${projectId}/team`)}
                  className="flex items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-purple-500/20 text-purple-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-purple-500/30 transition-all"
                >
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Manage Team</span>
                </button>
              )}

              {/* Share Story Button */}
              <button
                onClick={() => setShowShareSettings(true)}
                className="flex items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-green-500/20 text-green-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-green-500/30 transition-all"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Share Story</span>
              </button>

              {/* Reader Comments Button */}
              <button
                onClick={() => router.push(`/dashboard/${projectId}/comments`)}
                className="flex items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-500/20 text-blue-300 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:bg-blue-500/30 transition-all"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Comments</span>
              </button>

              {/* Export Button */}
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Export</span>
              </button>

              {/* Create Module Button */}
              {isOwner && (
                <button
                  onClick={() => setShowCreateModule(true)}
                  className="flex items-center justify-center lg:justify-start gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all sm:col-span-2 lg:col-span-1"
                >
                  <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="whitespace-nowrap">Create Module</span>
                </button>
              )}
            </div>
          </div>

          {/* Modules List */}
          {modules.length === 0 ? (
            <div className="text-center py-12 sm:py-16 rounded-xl border border-dashed border-white/20">
              <FolderOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                No modules yet
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">
                Start organizing your story by creating modules
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowCreateModule(true)}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                >
                  Create First Module
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {modules.map((module) => (
                <div
                  key={module.id}
                  onClick={() =>
                    router.push(`/dashboard/${projectId}/module/${module.id}`)
                  }
                  className="cursor-pointer p-5 sm:p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors break-words">
                    {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-3 mb-3">
                      {module.description}
                    </p>
                  )}
                  <div className="text-[10px] sm:text-xs text-gray-500">
                    Created {new Date(module.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
    </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          Create New Module
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Module Title *
            </label>
            <input
              type="text"
              placeholder="e.g., Season 1, Act 1, Beginning"
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
              placeholder="Brief description of this module"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[100px] resize-none"
            />
          </div>
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
            {loading ? "Creating..." : "Create Module"}
          </button>
        </div>
      </div>
    </div>
  );
}