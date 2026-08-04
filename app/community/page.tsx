"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

interface CommunityStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  genre: string;
  view_count: number;
  like_count: number;
  created_at: string;
  owner: {
    id: string;
    username: string;
    avatar_url: string | null;
    open_for_collaboration: boolean;
  };
}

export default function CommunityPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [stories, setStories] = useState<CommunityStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const genres = ["All", "Sci-Fi", "High Fantasy", "Screenplay", "Thriller", "Romance", "Cyberpunk", "Fiction"];

  useEffect(() => {
    loadCommunityStories();
  }, []);

  const loadCommunityStories = async () => {
    try {
      setLoading(true);

      // Primary query: fetch public projects from Supabase
      let { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("id, title, slug, description, genre, view_count, like_count, created_at, owner_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      // Fallback query if is_public column or optional columns aren't in schema yet
      if (projectError || !projectData || projectData.length === 0) {
        const { data: baseData } = await supabase
          .from("projects")
          .select("id, title, description, created_at, owner_id")
          .order("created_at", { ascending: false });

        if (baseData && baseData.length > 0) {
          projectData = baseData.map((item: any) => ({
            ...item,
            slug: item.id,
            genre: "Fiction",
            view_count: 0,
            like_count: 0,
            is_public: true,
          }));
        } else {
          projectData = [];
        }
      }

      if (projectData.length === 0) {
        setStories([]);
        setLoading(false);
        return;
      }

      // Load profile details for each owner
      const storyList: CommunityStory[] = await Promise.all(
        projectData.map(async (item: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, open_for_collaboration")
            .eq("id", item.owner_id)
            .maybeSingle();

          return {
            id: item.id,
            title: item.title,
            slug: item.slug || item.id,
            description: item.description,
            genre: item.genre || "Fiction",
            view_count: item.view_count || 0,
            like_count: item.like_count || 0,
            created_at: item.created_at,
            owner: {
              id: item.owner_id,
              username: profile?.username || "Author",
              avatar_url: profile?.avatar_url || null,
              open_for_collaboration: profile?.open_for_collaboration ?? true,
            },
          };
        })
      );

      setStories(storyList);
    } catch (err) {
      console.error("Error loading community stories:", err);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.owner.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGenre = selectedGenre === "All" || story.genre.toLowerCase() === selectedGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md outfit">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia Community</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Dashboard</a>
            <a href="/docs" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Docs</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── HERO & SEARCH ── */}
      <main className="max-w-[1280px] mx-auto px-6 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 inline-block">
            Explore Stories & Creators
          </span>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight outfit ${isLight ? "text-slate-900" : "text-white"}`}>
            Discover extraordinary universes.
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            Read original manuscripts published by authors, connect with storytellers, and request co-author collaborations.
          </p>

          {/* Search Box */}
          <div className="relative max-w-xl mx-auto pt-2">
            <input
              type="text"
              placeholder="Search stories, authors, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-5 py-3.5 rounded-2xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isLight ? "bg-white border-slate-200 text-slate-900 shadow-sm" : "bg-[#0b0c10] border-white/10 text-white"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-4 top-5 text-xs text-slate-400 hover:text-white">✕</button>
            )}
          </div>

          {/* Genre Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedGenre === g
                    ? "bg-indigo-600 text-white shadow-sm"
                    : isLight
                    ? "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    : "bg-white/[0.04] border border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* ── STORIES GRID ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 space-y-4 max-w-xl mx-auto">
            <div className="text-4xl">📚</div>
            <h3 className="text-xl font-bold outfit">No public stories published yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Be the first creator to publish your story project to the community network! You can publish any of your manuscripts directly from your workspace or profile.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit shadow-lg shadow-indigo-500/20"
            >
              Go to Dashboard & Publish Story
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className={`group rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                  isLight
                    ? "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-lg"
                    : "bg-[#0b0c10]/80 border-white/10 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                }`}
              >
                <div className="space-y-4">
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/creator/${story.owner.username}`)}
                      className="flex items-center gap-2.5 group/author text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white">
                        {story.owner.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold group-hover/author:text-indigo-400 transition-colors">
                          @{story.owner.username}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(story.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>

                    {story.owner.open_for_collaboration && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Open for Collab
                      </span>
                    )}
                  </div>

                  {/* Story Title & Description */}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-1 block">
                      {story.genre}
                    </span>
                    <h3 className={`text-xl font-bold outfit mb-2 group-hover:text-indigo-400 transition-colors ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}>
                      {story.title}
                    </h3>
                    <p className={`text-xs leading-relaxed line-clamp-3 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                      {story.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Footer Stats & Read Button */}
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">👁️ {story.view_count}</span>
                    <span className="flex items-center gap-1">❤️ {story.like_count}</span>
                  </div>

                  <button
                    onClick={() => router.push(`/story/${story.slug}`)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all outfit"
                  >
                    Read Story
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
