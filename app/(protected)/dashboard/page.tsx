"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { PlusCircle } from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  is_team: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // 1️⃣ Solo projects (owner)
      const { data: ownedProjects } = await supabase
        .from("projects")
        .select("id, title, description, is_team")
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
            is_team
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
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => router.push(`/dashboard/${project.id}`)}
            className="cursor-pointer p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
          >
            <h3 className="text-xl font-semibold text-white mb-2">
              {project.title}
            </h3>

            <p className="text-gray-400 text-sm line-clamp-3">
              {project.description || "No description"}
            </p>

            <div className="mt-4 text-xs inline-flex px-3 py-1 rounded-full bg-purple-500/10 text-purple-300">
              {project.is_team ? "Team Project" : "Solo Project"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
