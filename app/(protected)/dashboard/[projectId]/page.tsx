"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  BookOpen, 
  Users, 
  PlusCircle, 
  FolderOpen,
  ArrowLeft 
} from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  is_team: boolean;
  owner_id: string;
};


type Member = {
  id: string;
  role: string;
  profiles: {  // ← REPLACE the old Member type with this
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

      // Load project
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

      // Load team members (if team project)
      if (projectData.is_team) {
  const { data: membersData } = await supabase
    .from("project_members")
    .select(
      `
      id,
      role,
      profiles!inner (
        username,
        avatar_url
      )
    `
    )
    .eq("project_id", projectId)
    .eq("status", "accepted");

  setMembers((membersData || []) as unknown as Member[]);
}

      // Load modules
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
      <div className="p-12 text-center">
        <div className="text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-400">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-12 space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-3">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-gray-400 text-lg">{project.description}</p>
            )}
            <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-sm">
              {project.is_team ? "Team Project" : "Solo Project"}
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
     {/* Team Members */}
{project.is_team && members.length > 0 && (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
    <div className="flex items-center gap-2 mb-4">
      <Users className="w-5 h-5 text-purple-400" />
      <h2 className="text-lg font-semibold text-white">Team Members</h2>
      <span className="text-sm text-gray-400">({members.length})</span>
    </div>

    <div className="flex flex-wrap gap-3">
      {members.map((member) => {
        // Add null check for profiles
        if (!member.profiles) return null;
        
        return (
          <div
            key={member.id}
            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10"
          >
            {member.profiles.avatar_url ? (
              <img
                src={member.profiles.avatar_url}
                className="w-8 h-8 rounded-full"
                alt={member.profiles.username}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {member.profiles.username[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-white">
                {member.profiles.username}
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {member.role}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}

      {/* Modules Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Story Modules</h2>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreateModule(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Create Module
            </button>
          )}
        </div>

        {/* Modules Grid */}
        {modules.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-white/20">
            <FolderOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No modules yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start organizing your story by creating modules
            </p>
            {isOwner && (
              <button
                onClick={() => setShowCreateModule(true)}
                className="px-6 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                Create First Module
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                onClick={() =>
                  router.push(`/dashboard/${projectId}/module/${module.id}`)
                }
                className="cursor-pointer p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all group"
              >
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {module.title}
                </h3>
                {module.description && (
                  <p className="text-sm text-gray-400 line-clamp-3">
                    {module.description}
                  </p>
                )}
                <div className="mt-4 text-xs text-gray-500">
                  Created {new Date(module.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Module Modal */}
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
    </div>
  );
}

// Create Module Modal Component
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
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Module</h2>

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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[100px] resize-none"
            />
          </div>
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
            {loading ? "Creating..." : "Create Module"}
          </button>
        </div>
      </div>
    </div>
  );
}