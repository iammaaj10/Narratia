"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";
import {
  PlusCircle,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  SortAsc,
  Trash2,
} from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  is_team: boolean;
  owner_id: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";
type FilterOption = "all" | "solo" | "team";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, sortBy, filterBy, showArchived]);

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
      .select(
        "id, title, description, is_team, owner_id, archived, created_at, updated_at"
      )
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
          owner_id,
          archived,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .eq("status", "accepted");

    const teamProjects =
      memberProjects?.map((m: any) => m.project).filter(Boolean) ?? [];

    // 3️⃣ Merge + remove duplicates
    const allProjects = [...(ownedProjects ?? []), ...teamProjects].filter(
      (p, index, self) => index === self.findIndex((x) => x.id === p.id)
    );

    setProjects(allProjects);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Filter by archived status
    filtered = filtered.filter((p) =>
      showArchived ? p.archived : !p.archived
    );

    // Filter by type
    if (filterBy === "solo") {
      filtered = filtered.filter((p) => !p.is_team);
    } else if (filterBy === "team") {
      filtered = filtered.filter((p) => p.is_team);
    }

    // Search by title or description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredProjects(filtered);
  };

  const toggleArchive = async (
    projectId: string,
    currentArchived: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const { error } = await supabase
      .from("projects")
      .update({ archived: !currentArchived })
      .eq("id", projectId);

    if (error) {
      console.error("❌ Archive error:", error);
      alert("Failed to update project");
      return;
    }

    setProjects(
      projects.map((p) =>
        p.id === projectId ? { ...p, archived: !currentArchived } : p
      )
    );
  };

  const deleteProject = async (
    projectId: string,
    projectTitle: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (
      !confirm(
        `Are you sure you want to delete "${projectTitle}"? This action cannot be undone and will delete all modules and phases.`
      )
    ) {
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

    setProjects(projects.filter((p) => p.id !== projectId));
    alert("Project deleted successfully!");
  };

  if (loading) {
    return (
      <div className="p-12">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    );
  }

  // Empty state (no projects at all)
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
            Your stories will appear here. Start creating your first
            masterpiece!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <button
              onClick={() => router.push("/dashboard/outline-generator")}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              AI Outline Generator
            </button>

            <button
              onClick={() => router.push("/dashboard/new-project")}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Create Your First Story
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Projects grid
  return (
    <div className="p-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Stories</h1>
          <p className="text-gray-400 text-sm">
            {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "story" : "stories"}
            {showArchived && " (archived)"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard/outline-generator")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            AI Outline Generator
          </button>

          <button
            onClick={() => router.push("/dashboard/new-project")}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            New Story
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Filter by type */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Projects</option>
            <option value="solo">Solo Only</option>
            <option value="team">Team Only</option>
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-3 text-white focus:outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>

        {/* Show Archived Toggle */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            showArchived
              ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
              : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
          }`}
        >
          {showArchived ? (
            <ArchiveRestore className="w-5 h-5" />
          ) : (
            <Archive className="w-5 h-5" />
          )}
          {showArchived ? "Show Active" : "Show Archived"}
        </button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/20">
          <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No projects found
          </h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isOwner = project.owner_id === currentUserId;

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/${project.id}`)}
                className={`cursor-pointer p-6 rounded-2xl border transition-all group relative ${
                  project.archived
                    ? "bg-white/[0.01] border-orange-500/20 opacity-60"
                    : "bg-white/[0.03] border-white/10 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
                }`}
              >
                {/* Archive/Delete buttons (Only for owners) */}
                {isOwner && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button
                      onClick={(e) =>
                        toggleArchive(project.id, project.archived, e)
                      }
                      className="p-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-all"
                      title={project.archived ? "Unarchive" : "Archive"}
                    >
                      {project.archived ? (
                        <ArchiveRestore className="w-4 h-4" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) =>
                        deleteProject(project.id, project.title, e)
                      }
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <h3 className="text-xl font-semibold text-white mb-2 pr-20">
                  {project.title}
                </h3>

                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                  {project.description || "No description"}
                </p>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs inline-flex px-3 py-1 rounded-full bg-purple-500/10 text-purple-300">
                    {project.is_team ? "Team Project" : "Solo Project"}
                  </div>
                  {isOwner && (
                    <div className="text-xs inline-flex px-3 py-1 rounded-full bg-blue-500/10 text-blue-300">
                      Owner
                    </div>
                  )}
                  {project.archived && (
                    <div className="text-xs inline-flex px-3 py-1 rounded-full bg-orange-500/10 text-orange-300">
                      Archived
                    </div>
                  )}
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  Updated{" "}
                  {new Date(
                    project.updated_at || project.created_at
                  ).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}