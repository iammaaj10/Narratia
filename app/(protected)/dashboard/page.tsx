"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";
import {
  PlusCircle,
  Search,
  Filter,
  Archive,
  ArchiveRestore,
  SortAsc,
  Trash2,
  Users,
  User,
  Clock,
  MoreVertical,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    // No alert needed for premium UI, just visual update
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <div className="text-gray-400 font-medium">Loading your stories...</div>
      </div>
    );
  }

  // Empty state (no projects at all)
  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 px-4 text-center"
      >
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full" />
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl"
          >
            <BookOpen className="w-14 h-14 text-purple-300" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 -right-3"
            >
              <Sparkles className="w-8 h-8 text-pink-400" />
            </motion.div>
          </motion.div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Your Story Awaits
        </h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto mb-10">
          The blank page is full of possibilities. Start your first masterpiece manually or let AI guide your imagination.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg">
          <button
            onClick={() => router.push("/dashboard/outline-generator")}
            className="group relative flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 text-cyan-300 rounded-2xl font-semibold border border-cyan-500/20 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            AI Generator
          </button>

          <button
            onClick={() => router.push("/dashboard/new-project")}
            className="group relative flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
          >
            <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Create Blank
          </button>
        </div>
      </motion.div>
    );
  }

  // Projects grid
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Your Stories</h1>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-medium">
              {filteredProjects.length} {filteredProjects.length === 1 ? "Story" : "Stories"}
            </span>
            {showArchived && (
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/20 font-semibold">
                Viewing Archived
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push("/dashboard/outline-generator")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-xl font-semibold border border-blue-200 dark:border-blue-500/20 transition-all group"
          >
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">AI Outline</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            onClick={() => router.push("/dashboard/new-project")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 dark:bg-purple-500 dark:hover:bg-purple-400 text-white rounded-xl font-medium shadow-lg shadow-purple-500/20 transition-all group"
          >
            <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>New Story</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 p-2 rounded-2xl bg-slate-200/50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] backdrop-blur-md">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-400" />
          <input
            type="text"
            placeholder="Search your stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {/* Filter by type */}
          <div className="relative min-w-[130px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-gray-400 pointer-events-none" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="w-full bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer shadow-sm transition-all"
            >
              <option value="all" className="dark:bg-[#1a1921] dark:text-white">All Types</option>
              <option value="solo" className="dark:bg-[#1a1921] dark:text-white">Solo Only</option>
              <option value="team" className="dark:bg-[#1a1921] dark:text-white">Team Only</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-gray-500 text-[10px]">▼</div>
          </div>

          {/* Sort */}
          <div className="relative min-w-[140px]">
            <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-gray-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-8 pr-8 py-2.5 text-xs font-semibold text-slate-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer shadow-sm transition-all"
            >
              <option value="newest" className="dark:bg-[#1a1921] dark:text-white">Newest First</option>
              <option value="oldest" className="dark:bg-[#1a1921] dark:text-white">Oldest First</option>
              <option value="name-asc" className="dark:bg-[#1a1921] dark:text-white">Name (A-Z)</option>
              <option value="name-desc" className="dark:bg-[#1a1921] dark:text-white">Name (Z-A)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-gray-500 text-[10px]">▼</div>
          </div>

          {/* Show Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 min-w-[120px] rounded-xl text-xs font-semibold border shadow-sm transition-all ${showArchived
                ? "bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30"
                : "bg-white dark:bg-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.07] text-slate-700 dark:text-gray-300 border-slate-200/80 dark:border-white/[0.08]"
              }`}
          >
            {showArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? "Active" : "Archived"}
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c0c1b]"
        >
          <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            No stories found
          </h3>
          <p className="text-slate-500 dark:text-gray-400">Try adjusting your search or filters to find what you're looking for.</p>
        </motion.div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredProjects.map((project) => {
            const isOwner = project.owner_id === currentUserId;

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/${project.id}`)}
                className={`group relative cursor-pointer flex flex-col h-[280px] p-6 sm:p-7 rounded-3xl border transition-all duration-300 overflow-hidden hover:-translate-y-1 ${project.archived
                    ? "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] opacity-60"
                    : "bg-white dark:bg-white/[0.03] hover:bg-slate-50/80 dark:hover:bg-white/[0.06] border-slate-200/80 dark:border-white/[0.08] hover:border-purple-500/50 dark:hover:border-purple-500/40 shadow-sm hover:shadow-xl dark:shadow-none"
                  }`}
              >
                {/* Subtle card top glow on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top Bar: Badges & Actions */}
                <div className="relative z-10 flex items-start justify-between mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider ${project.is_team
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20"
                      }`}>
                      {project.is_team ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      {project.is_team ? "Team" : "Solo"}
                    </span>
                    {isOwner && project.is_team && (
                      <span className="inline-flex items-center px-3 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                        Owner
                      </span>
                    )}
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-xl p-1 border border-slate-200 dark:border-white/10 shadow-md">
                      <button
                        onClick={(e) => toggleArchive(project.id, project.archived, e)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-500/10 transition-all"
                        title={project.archived ? "Unarchive" : "Archive"}
                      >
                        {project.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => deleteProject(project.id, project.title, e)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col pt-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {project.description || "No synopsis provided. Click to start writing."}
                  </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-medium text-slate-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                    Updated {new Date(project.updated_at || project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}