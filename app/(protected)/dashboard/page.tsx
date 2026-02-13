"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PlusCircle, Trash2 } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  is_team: boolean;
  owner_id: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setCurrentUserId(user.id);

      // 1️⃣ Solo projects (owner)
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id, title, description, is_team, owner_id")
        .eq("owner_id", user.id);

      // 2️⃣ Team projects (accepted member)
      const { data: memberProjects } = await supabase
        .from("project_members")
        .select(
          `
          project:projects (
            id,
            title,
            description,
            is_team,
            owner_id
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const teamProjects =
        memberProjects?.map((m: any) => m.project) ?? [];

      // 3️⃣ Merge + remove duplicates
      const allProjects = [
        ...(ownedProjects ?? []),
        ...teamProjects,
      ].filter(
        (p, index, self) =>
          index === self.findIndex((x) => x.id === p.id)
      );

      setProjects(allProjects);
      setLoading(false);
    };

    loadProjects();
  }, []);

  const deleteProject = async (projectId: string, projectTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking delete

    if (!confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone and will delete all modules and phases.`)) {
      return;
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("❌ Delete error:", error);
      alert(`Failed to delete project: ${error.message}`);
      return;
    }

    // Remove from UI
    setProjects(projects.filter(p => p.id !== projectId));
    alert("Project deleted successfully!");
  };

  if (loading) {
    return <div className="p-12 text-gray-400">Loading projects...</div>;
  }

  // 🔹 Empty state (no projects)
  if (projects.length === 0) {
    return (
      <div className="p-12">
        <div className="text-center space-y-6 py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-4">
            <PlusCircle className="w-10 h-10 text-purple-300" />
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
            Your Story Dashboard
          </h1>

          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Your stories will appear here. Start creating your first masterpiece!
          </p>

          <div className="pt-8">
            <button
              onClick={() => router.push("/dashboard/new-project")}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 hover:scale-105"
            >
              Create Your First Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Projects grid
  return (
    <div className="p-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-white">Your Stories</h1>

        <button
          onClick={() => router.push("/dashboard/new-project")}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:scale-105 transition"
        >
          <PlusCircle className="w-5 h-5" />
          New Story
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const isOwner = project.owner_id === currentUserId;

          return (
            <div
              key={project.id}
              onClick={() => router.push(`/dashboard/${project.id}`)}
              className="cursor-pointer p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all group relative"
            >
              {/* Delete Button (Only for owners) */}
              {isOwner && (
                <button
                  onClick={(e) => deleteProject(project.id, project.title, e)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <h3 className="text-xl font-semibold text-white mb-2 pr-10">
                {project.title}
              </h3>

              <p className="text-gray-400 text-sm line-clamp-3">
                {project.description || "No description"}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <div className="text-xs inline-flex px-3 py-1 rounded-full bg-purple-500/10 text-purple-300">
                  {project.is_team ? "Team Project" : "Solo Project"}
                </div>
                {isOwner && (
                  <div className="text-xs inline-flex px-3 py-1 rounded-full bg-blue-500/10 text-blue-300">
                    Owner
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}