"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fetchCreatorProfile, toggleFollowUser, CreatorProfile } from "@/lib/social/socialClient";
import CollabRequestModal from "@/components/social/CollabRequestModal";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

interface StoryCard {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  genre: string | null;
  is_public: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
}

export default function CreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;

  const { theme } = useTheme();
  const isLight = theme === "light";

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    twitter_handle: "",
    discord_handle: "",
    website_url: "",
    open_for_collaboration: true,
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Collab Pitch Modal State
  const [selectedCollabStory, setSelectedCollabStory] = useState<{ id: string; title: string } | null>(null);

  const isSelf = currentUser && creator && (currentUser.id === creator.id || currentUser.email?.split("@")[0] === rawUsername);

  useEffect(() => {
    loadCreatorData();
  }, [rawUsername]);

  const loadCreatorData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch user profile from database
      let profile = await fetchCreatorProfile(rawUsername, user?.id);

      // If viewing self or profile doesn't exist yet, attempt direct lookup/insert
      if (!profile && user) {
        const { data: selfProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (selfProfile) {
          profile = {
            ...selfProfile,
            followers_count: 0,
            following_count: 0,
            is_following: false,
          };
        }
      }

      if (!profile) {
        // Fallback for new uninitialized users
        profile = {
          id: user?.id || "unregistered",
          username: rawUsername,
          full_name: user?.email?.split("@")[0] || rawUsername,
          avatar_url: null,
          banner_url: null,
          bio: "Author & narrative creator on Narratia.",
          open_for_collaboration: true,
          twitter_handle: null,
          discord_handle: null,
          website_url: null,
          followers_count: 0,
          following_count: 0,
          is_following: false,
        };
      }

      setCreator(profile);
      setIsFollowing(profile.is_following || false);
      setFollowersCount(profile.followers_count || 0);
      setFollowingCount(profile.following_count || 0);

      setEditForm({
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        twitter_handle: profile.twitter_handle || "",
        discord_handle: profile.discord_handle || "",
        website_url: profile.website_url || "",
        open_for_collaboration: profile.open_for_collaboration ?? true,
      });

      // Load real stories from database
      if (profile.id) {
        let query = supabase
          .from("projects")
          .select("id, title, slug, description, genre, is_public, view_count, like_count, created_at")
          .eq("owner_id", profile.id)
          .order("created_at", { ascending: false });

        // If not viewing self, filter to only public projects
        if (!user || user.id !== profile.id) {
          query = query.eq("is_public", true);
        }

        const { data: userProjects } = await query;
        setStories(userProjects || []);
      }
    } catch (err) {
      console.error("Error loading creator data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    if (!creator) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    await toggleFollowUser(creator.id, currentUser.id);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !creator) return;

    setUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name.trim(),
          bio: editForm.bio.trim(),
          twitter_handle: editForm.twitter_handle.trim() || null,
          discord_handle: editForm.discord_handle.trim() || null,
          website_url: editForm.website_url.trim() || null,
          open_for_collaboration: editForm.open_for_collaboration,
        })
        .eq("id", currentUser.id);

      if (error) throw error;

      setCreator((prev) =>
        prev
          ? {
              ...prev,
              full_name: editForm.full_name.trim(),
              bio: editForm.bio.trim(),
              twitter_handle: editForm.twitter_handle.trim() || null,
              discord_handle: editForm.discord_handle.trim() || null,
              website_url: editForm.website_url.trim() || null,
              open_for_collaboration: editForm.open_for_collaboration,
            }
          : null
      );

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to update profile. Please try again.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const toggleStoryVisibility = async (storyId: string, currentPublicState: boolean) => {
    try {
      const nextState = !currentPublicState;
      await supabase.from("projects").update({ is_public: nextState }).eq("id", storyId);
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, is_public: nextState } : s))
      );
    } catch (err) {
      console.error("Error toggling story visibility:", err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? "bg-slate-50" : "bg-[#06070a]"}`}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/community" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md outfit">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia Creators</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Dashboard</a>
            <a href="/community" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Community</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── BANNER ── */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-indigo-950 via-violet-900 to-purple-950 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-transparent to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-20 relative z-10 pb-20">
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-[#06070a] bg-gradient-to-tr from-indigo-500 via-violet-600 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-2xl outfit">
                {creator.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-2xl sm:text-3xl font-extrabold outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                    {creator.full_name || creator.username}
                  </h1>
                  {creator.open_for_collaboration ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Open for Collab
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">
                      Private
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-indigo-400 font-medium">@{creator.username}</div>
              </div>
            </div>

            {/* Action Suite */}
            <div className="flex flex-wrap items-center gap-3">
              {isSelf ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all outfit"
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md outfit ${
                      isFollowing
                        ? "bg-slate-800 text-slate-200 border border-white/10 hover:bg-rose-600 hover:text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
                    }`}
                  >
                    {isFollowing ? "Following ✓" : "+ Follow Author"}
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard/messages?recipient=${creator.id}`)}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-xs border transition-all outfit ${
                      isLight ? "border-slate-200 hover:border-slate-300 bg-white" : "border-white/10 hover:border-white/20 bg-white/[0.04]"
                    }`}
                  >
                    💬 Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-4 max-w-3xl">
            <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {creator.bio || "No bio provided yet."}
            </p>

            {/* Social Handles */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
              {creator.twitter_handle && (
                <a href={`https://twitter.com/${creator.twitter_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">
                  🐦 {creator.twitter_handle}
                </a>
              )}
              {creator.discord_handle && (
                <span className="text-slate-400">🎮 {creator.discord_handle}</span>
              )}
              {creator.website_url && (
                <a href={creator.website_url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors truncate max-w-xs">
                  🔗 {creator.website_url}
                </a>
              )}
            </div>

            {/* Follower Stats */}
            <div className="flex items-center gap-6 text-xs font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-white/10">
              <div>
                <span className="font-bold text-sm text-white mr-1">{followersCount}</span> Followers
              </div>
              <div>
                <span className="font-bold text-sm text-white mr-1">{followingCount}</span> Following
              </div>
            </div>
          </div>

          {/* Published Stories Section */}
          <div className="pt-8 border-t border-slate-100 dark:border-white/10 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold outfit">
                {isSelf ? "My Story Projects" : "Published Works"}
              </h2>
              <span className="text-xs text-slate-400 font-mono">{stories.length} Manuscripts</span>
            </div>

            {stories.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 space-y-3">
                <div className="text-3xl">📖</div>
                <h3 className="text-sm font-bold outfit">No stories found</h3>
                <p className="text-xs text-slate-400">
                  {isSelf
                    ? "You haven't created any stories yet. Start writing your first project!"
                    : "This creator hasn't published any public stories yet."}
                </p>
                {isSelf && (
                  <button
                    onClick={() => router.push("/dashboard/new-project")}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit"
                  >
                    + Create First Story
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className={`p-6 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between ${
                      isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                          {story.genre || "Fiction"}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                          <span>👁️ {story.view_count || 0}</span>
                          <span>❤️ {story.like_count || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg outfit truncate pr-2">{story.title}</h3>
                        {isSelf && (
                          <button
                            onClick={() => toggleStoryVisibility(story.id, story.is_public)}
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono transition-all ${
                              story.is_public
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20"
                            }`}
                          >
                            {story.is_public ? "🌐 Public" : "🔒 Private"}
                          </button>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        {story.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-3">
                      {!isSelf && (
                        <button
                          onClick={() =>
                            setSelectedCollabStory({
                              id: story.id,
                              title: story.title,
                            })
                          }
                          className="px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-semibold text-xs hover:bg-indigo-500/20 transition-all"
                        >
                          🤝 Request Collab
                        </button>
                      )}

                      <button
                        onClick={() =>
                          isSelf
                            ? router.push(`/dashboard/${story.id}`)
                            : router.push(`/story/${story.slug || story.id}`)
                        }
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all ml-auto outfit"
                      >
                        {isSelf ? "Open Workspace" : "Read Story"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── EDIT PROFILE MODAL ── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0c0d12] border-white/10 text-white"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-6">
              <h2 className="text-xl font-bold outfit">Edit Author Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="e.g. Maaj Bhadgaonkar"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Author Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell readers about your stories, writing genres, and lore universe..."
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Twitter / X Handle</label>
                  <input
                    type="text"
                    value={editForm.twitter_handle}
                    onChange={(e) => setEditForm({ ...editForm, twitter_handle: e.target.value })}
                    placeholder="@username"
                    className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Discord Tag</label>
                  <input
                    type="text"
                    value={editForm.discord_handle}
                    onChange={(e) => setEditForm({ ...editForm, discord_handle: e.target.value })}
                    placeholder="username#0000"
                    className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Personal Website URL</label>
                <input
                  type="url"
                  value={editForm.website_url}
                  onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="collabToggle"
                  checked={editForm.open_for_collaboration}
                  onChange={(e) => setEditForm({ ...editForm, open_for_collaboration: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="collabToggle" className="font-semibold text-slate-300 cursor-pointer">
                  Open for Collaboration Requests
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20"
                >
                  {updatingProfile ? "Saving..." : "Save Profile Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collaboration Pitch Modal */}
      {selectedCollabStory && (
        <CollabRequestModal
          isOpen={!!selectedCollabStory}
          onClose={() => setSelectedCollabStory(null)}
          projectId={selectedCollabStory.id}
          projectTitle={selectedCollabStory.title}
          recipientId={creator.id}
          senderId={currentUser?.id || ""}
        />
      )}
    </div>
  );
}
