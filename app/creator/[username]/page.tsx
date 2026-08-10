"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Camera, Loader2, User } from "lucide-react";
import {
  fetchCreatorProfile,
  toggleFollowUser,
  fetchUserFollowers,
  fetchUserFollowing,
  CreatorProfile,
  FollowerUser,
} from "@/lib/social/socialClient";
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

  // Followers & Following Modal State
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<"followers" | "following">("followers");
  const [followersList, setFollowersList] = useState<FollowerUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowerUser[]>([]);
  const [loadingFollowersData, setLoadingFollowersData] = useState(false);

  // Tab State for profile owner
  const [activeTab, setActiveTab] = useState<"public" | "private">("public");

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    twitter_handle: "",
    discord_handle: "",
    website_url: "",
    open_for_collaboration: true,
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  const handleProfilePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only images are allowed");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      alert("Image must be under 4MB");
      return;
    }

    setUploadingProfilePhoto(true);

    try {
      let finalUrl: string | null = null;

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `avatar_${Date.now()}.${fileExt}`;
        const filePath = `${creator?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { cacheControl: "3600", upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
          finalUrl = urlData.publicUrl;
        }
      } catch (storageErr) {
        console.warn("Storage upload fallback:", storageErr);
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (creator?.id) {
        const { error } = await supabase.from("profiles").update({ avatar_url: finalUrl }).eq("id", creator.id);
        if (error) throw error;
        setCreator((prev) => (prev ? { ...prev, avatar_url: finalUrl } : null));
        alert("Profile picture updated successfully!");
      }
    } catch (err: any) {
      console.error("Failed to update profile photo:", err);
      alert("Failed to update profile photo: " + (err.message || err));
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  // Collab Pitch Modal State
  const [selectedCollabStory, setSelectedCollabStory] = useState<{ id: string; title: string } | null>(null);

  const openFollowModal = async (initialTab: "followers" | "following") => {
    if (!creator) return;
    setFollowersModalTab(initialTab);
    setIsFollowersModalOpen(true);
    setLoadingFollowersData(true);

    try {
      const [followers, following] = await Promise.all([
        fetchUserFollowers(creator.id),
        fetchUserFollowing(creator.id),
      ]);
      setFollowersList(followers);
      setFollowingList(following);
    } catch (err) {
      console.error("Error fetching followers/following list:", err);
    } finally {
      setLoadingFollowersData(false);
    }
  };

  // Only true if the logged-in user's ID matches the profile being viewed
  // NOTE: the old conditions (email prefix / username match) were always true
  // because creator.username === rawUsername by definition, so every profile
  // showed "Edit Profile" — that was the bug.
  const isSelf = Boolean(currentUser && creator && currentUser.id === creator.id);

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

      // If not found by username/uuid lookup, check if it's the logged-in user's own profile
      // (their profile row may exist but have username = null, and URL may be their UUID)
      if (!profile && user) {
        const { data: selfProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (selfProfile) {
          const storedUsername = selfProfile.username?.toLowerCase() ?? "";
          const urlUsername = rawUsername.toLowerCase();
          const authUsername = (user.user_metadata?.username as string | undefined)?.toLowerCase() ?? "";

          // It's the user's own profile if:
          // (a) stored DB username matches the URL, OR
          // (b) username is null in DB but auth metadata username matches URL, OR
          // (c) the URL is the user's own UUID (fallback from community page)
          const isOwnProfile =
            (storedUsername && storedUsername === urlUsername) ||
            (!selfProfile.username && authUsername && authUsername === urlUsername) ||
            rawUsername === user.id;

          if (isOwnProfile) {
            // Patch the username into the DB from auth metadata if it's missing
            const nameToSet = selfProfile.username || authUsername || rawUsername;
            if (!selfProfile.username && nameToSet !== user.id) {
              await supabase
                .from("profiles")
                .update({ username: nameToSet.trim() })
                .eq("id", user.id);
            }
            profile = {
              ...selfProfile,
              username: nameToSet !== user.id ? nameToSet : (selfProfile.username || "Author"),
              followers_count: 0,
              following_count: 0,
              is_following: false,
            };
          }
        }
      }

      // Truly not found — nobody owns this username
      if (!profile) {
        setLoading(false);
        return;
      }

      setCreator(profile);
      setIsFollowing(profile.is_following || false);
      setFollowersCount(profile.followers_count || 0);
      setFollowingCount(profile.following_count || 0);

      setEditForm({
        bio: profile.bio || "",
        twitter_handle: profile.twitter_handle || "",
        discord_handle: profile.discord_handle || "",
        website_url: profile.website_url || "",
        open_for_collaboration: profile.open_for_collaboration ?? true,
      });

      // Target owner ID: if viewing self, use current logged in user ID
      const targetUserId = user && (user.id === profile.id || user.email?.split("@")[0].toLowerCase() === rawUsername.toLowerCase())
        ? user.id
        : profile.id;

      if (targetUserId) {
        const isSelfProfile = Boolean(user && user.id === targetUserId);
        let userProjects: any[] = [];

        if (isSelfProfile) {
          // Owner sees all their projects (public and private)
          const { data } = await supabase
            .from("projects")
            .select("id, title, slug, description, genre, is_public, view_count, like_count, created_at")
            .eq("owner_id", targetUserId)
            .order("created_at", { ascending: false });
          userProjects = data || [];
        } else {
          // Visitor:
          // 1. Fetch public projects owned by this creator
          const { data: publicProjects } = await supabase
            .from("projects")
            .select("id, title, slug, description, genre, is_public, view_count, like_count, created_at")
            .eq("owner_id", targetUserId)
            .eq("is_public", true)
            .order("created_at", { ascending: false });

          userProjects = publicProjects || [];

          // 2. If logged in visitor, check for private projects granted to this user via project_members
          if (user) {
            const rEmail = user.email?.toLowerCase() || "";
            const { data: rProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", user.id)
              .maybeSingle();

            const rName = rProfile?.username || "";
            const rNameLower = rName.toLowerCase();

            // Match user_id OR invited_email (email / username / lowercase username)
            const conditions = [`user_id.eq."${user.id}"`];
            if (rEmail) conditions.push(`invited_email.eq."${rEmail}"`);
            if (rName) conditions.push(`invited_email.eq."${rName}"`);
            if (rNameLower && rNameLower !== rName) conditions.push(`invited_email.eq."${rNameLower}"`);

            const { data: memberRows, error: memberErr } = await supabase
              .from("project_members")
              .select("project_id")
              .eq("status", "accepted")
              .or(conditions.join(","));

            console.log("DEBUG CREATOR PAGE - visitor:", user.email, "target:", targetUserId);
            console.log("DEBUG CREATOR PAGE - memberRows:", memberRows, "error:", memberErr);

            if (memberRows && memberRows.length > 0) {
              const allowedIds = Array.from(new Set(memberRows.map((m) => m.project_id))).filter(Boolean);
              
              if (allowedIds.length > 0) {
                const { data: allowedPrivateProjects, error: projErr } = await supabase
                  .from("projects")
                  .select("id, title, slug, description, genre, is_public, view_count, like_count, created_at")
                  .eq("owner_id", targetUserId)
                  .eq("is_public", false)
                  .in("id", allowedIds);

                console.log("DEBUG CREATOR PAGE - allowedPrivateProjects:", allowedPrivateProjects, "error:", projErr);

                if (allowedPrivateProjects && allowedPrivateProjects.length > 0) {
                  const existingIds = new Set(userProjects.map((p: any) => p.id));
                  for (const p of allowedPrivateProjects) {
                    if (!existingIds.has(p.id)) {
                      userProjects.push(p);
                    }
                  }
                }
              }
            }
          }
        }

        setStories(userProjects);
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

    // Optimistic update
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleFollowUser(creator.id, currentUser.id);
    } catch {
      // Revert optimistic update if DB call failed
      setIsFollowing(!nextState);
      setFollowersCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      alert("Could not update follow status. Please try again.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !creator) return;

    setUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
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

  const handlePublishToggle = async (story: StoryCard) => {
    try {
      const nextPublicState = !story.is_public;

      // If making public and slug is missing, generate slug or use ID
      let finalSlug = story.slug;
      if (nextPublicState && !finalSlug) {
        finalSlug = story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || story.id;
      }

      await supabase
        .from("projects")
        .update({
          is_public: nextPublicState,
          slug: nextPublicState ? finalSlug : story.slug,
        })
        .eq("id", story.id);

      // Optimistically update local state so community & profile reflect changes live
      setStories((prev) =>
        prev.map((s) =>
          s.id === story.id ? { ...s, is_public: nextPublicState, slug: finalSlug } : s
        )
      );
    } catch (err) {
      console.error("Error publishing story:", err);
    }
  };

  const publicStories = stories.filter((s) => s.is_public);
  const privateStories = stories.filter((s) => !s.is_public);
  const displayedStories =
    isSelf || privateStories.length > 0
      ? activeTab === "public"
        ? publicStories
        : privateStories
      : publicStories;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? "bg-slate-50" : "bg-[#06070a]"}`}>
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-white"}`}>
        <div className="text-center max-w-sm space-y-4">
          <div className="text-5xl">🔍</div>
          <h1 className="text-2xl font-extrabold outfit">Creator Not Found</h1>
          <p className={`text-sm leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            No creator profile exists for <span className="font-mono font-semibold text-indigo-400">@{rawUsername}</span>.
            They may not have set up their profile yet.
          </p>
          <a
            href="/community"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit shadow-lg shadow-indigo-500/20"
          >
            Browse Community Stories
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${isLight ? "bg-white/90 border-slate-200 shadow-sm" : "bg-[#06070a]/90 border-white/10"
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

      {/* ── PROFILE HEADER CONTENT ── */}
      <main className="max-w-5xl mx-auto px-6 py-8 sm:py-10 relative z-10 pb-20">
        <div className="space-y-6">
          {/* Avatar & Header Alignment Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 pb-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              {/* Avatar Box */}
              <div
                onClick={() => isSelf && !uploadingProfilePhoto && profileImageInputRef.current?.click()}
                className={`relative group/creatoravatar overflow-hidden rounded-2xl ${
                  isSelf ? "cursor-pointer" : ""
                }`}
                title={isSelf ? "Click to change profile picture" : creator.username}
              >
                {creator.avatar_url ? (
                  <img
                    src={creator.avatar_url}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-md border border-white/10"
                    alt={creator.username}
                  />
                ) : (
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl sm:text-2xl font-bold outfit shadow-md ${
                      isLight
                        ? "bg-slate-900 text-white"
                        : "bg-zinc-800 text-white border border-white/10"
                    }`}
                  >
                    {creator.username.substring(0, 2).toUpperCase()}
                  </div>
                )}

                {/* Camera overlay for owner */}
                {isSelf && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover/creatoravatar:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white rounded-2xl">
                    {uploadingProfilePhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mb-0.5" />
                        <span className="text-[10px] font-bold outfit uppercase">Change</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Name & Handle Stack */}
              <div className="space-y-1 sm:mb-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                    {creator.username}
                  </h1>
                  {creator.open_for_collaboration ? (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}>
                      Open to Collab
                    </span>
                  ) : (
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${isLight ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-slate-500/10 border-slate-500/20 text-slate-400"
                      }`}>
                      Private Profile
                    </span>
                  )}
                </div>
                <div className={`text-xs font-mono font-semibold ${isLight ? "text-slate-500" : "text-indigo-400"}`}>@{creator.username}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:mb-1">
              {isSelf ? (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs border shadow-sm transition-all outfit flex items-center gap-1.5 ${isLight
                      ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                      : "bg-white/5 border-white/15 text-white hover:bg-white/10"
                    }`}
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm outfit ${isFollowing
                        ? "bg-slate-800 text-slate-200 border border-white/10 hover:bg-rose-600 hover:text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                  >
                    {isFollowing ? "Following ✓" : "+ Follow Author"}
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard/messages?recipient=${creator.id}`)}
                    className={`px-5 py-2 rounded-xl font-semibold text-xs border transition-all outfit ${isLight ? "border-slate-300 hover:border-slate-400 bg-white text-slate-800" : "border-white/10 hover:border-white/20 bg-white/[0.04] text-white"
                      }`}
                  >
                    💬 Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="space-y-4 max-w-3xl pt-2">
            <p className={`text-sm sm:text-base leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              {creator.bio || "No bio provided yet."}
            </p>

            {/* Social Handles */}
            {(creator.twitter_handle || creator.discord_handle || creator.website_url) && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                {creator.twitter_handle && (
                  <a href={`https://twitter.com/${creator.twitter_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    🐦 {creator.twitter_handle}
                  </a>
                )}
                {creator.discord_handle && (
                  <span>🎮 {creator.discord_handle}</span>
                )}
                {creator.website_url && (
                  <a href={creator.website_url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-xs">
                    🔗 {creator.website_url}
                  </a>
                )}
              </div>
            )}

            {/* Follower Stats — Clickable */}
            <div className={`flex items-center gap-6 text-xs font-mono pt-3 border-t ${isLight ? "border-slate-200 text-slate-600" : "border-white/10 text-slate-400"}`}>
              <button
                onClick={() => openFollowModal("followers")}
                className="hover:text-indigo-500 transition-colors cursor-pointer group flex items-center gap-1"
              >
                <span className={`font-bold text-sm ${isLight ? "text-slate-900 group-hover:text-indigo-600" : "text-white group-hover:text-indigo-400"}`}>
                  {followersCount}
                </span>
                <span className="underline decoration-dotted underline-offset-4">Followers</span>
              </button>

              <button
                onClick={() => openFollowModal("following")}
                className="hover:text-indigo-500 transition-colors cursor-pointer group flex items-center gap-1"
              >
                <span className={`font-bold text-sm ${isLight ? "text-slate-900 group-hover:text-indigo-600" : "text-white group-hover:text-indigo-400"}`}>
                  {followingCount}
                </span>
                <span className="underline decoration-dotted underline-offset-4">Following</span>
              </button>
            </div>
          </div>

          {/* Stories Section */}
          <div className={`pt-8 border-t space-y-6 ${isLight ? "border-slate-200" : "border-white/10"}`}>
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className={`text-xl font-bold outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                {isSelf ? "Story Management & Portfolio" : "Author Manuscripts"}
              </h2>

              {isSelf || privateStories.length > 0 ? (
                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <button
                    onClick={() => setActiveTab("public")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "public"
                        ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    🌐 Community Public ({publicStories.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("private")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "private"
                        ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                  >
                    🔒 Private Manuscripts ({privateStories.length})
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{publicStories.length} Published</span>
              )}
            </div>

            {/* Stories Grid */}
            {displayedStories.length === 0 ? (
              <div className={`text-center py-12 rounded-3xl border border-dashed space-y-3 ${isLight ? "bg-white border-slate-200" : "bg-[#0b0c10]/60 border-white/10"
                }`}>
                <div className="text-3xl">
                  {isSelf && activeTab === "public" ? "🌐" : "📖"}
                </div>
                <h3 className={`text-base font-bold outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                  {isSelf && activeTab === "public" && privateStories.length > 0
                    ? "No public stories available"
                    : "No manuscripts available"}
                </h3>
                <p className={`text-xs max-w-md mx-auto leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  {isSelf ? (
                    activeTab === "public" && privateStories.length > 0 ? (
                      `No public stories available yet. You have ${privateStories.length} private manuscript(s) in your workspace. Switch to 'Private Manuscripts' tab to publish them to the community!`
                    ) : (
                      "You haven't created any stories yet. Start writing your first manuscript!"
                    )
                  ) : (
                    "No public stories available. This author has not published any manuscripts to the community yet."
                  )}
                </p>
                {isSelf && (
                  <div className="pt-2 flex justify-center gap-3">
                    {activeTab === "public" && privateStories.length > 0 ? (
                      <button
                        onClick={() => setActiveTab("private")}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit shadow-md shadow-indigo-500/20"
                      >
                        Publish Private Manuscript
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push("/dashboard/new-project")}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all outfit shadow-md shadow-indigo-500/20"
                      >
                        + Create First Story
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayedStories.map((story) => (
                  <div
                    key={story.id}
                    className={`p-6 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between ${isLight ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-[#0b0c10]/90 border-white/10"
                      }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                          {story.genre || "Fiction"}
                        </span>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span>👁️ {story.view_count || 0}</span>
                          <span>❤️ {story.like_count || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <h3 className={`font-bold text-lg outfit truncate pr-2 ${isLight ? "text-slate-900" : "text-white"}`}>{story.title}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono ${story.is_public
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                          }`}>
                          {story.is_public ? "🌐 Public" : "🔒 Private"}
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        {story.description || "No description provided."}
                      </p>
                    </div>

                    <div className={`pt-5 mt-5 border-t flex items-center justify-between gap-3 ${isLight ? "border-slate-100" : "border-white/10"
                      }`}>
                      {isSelf ? (
                        <button
                          onClick={() => handlePublishToggle(story)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all outfit ${story.is_public
                              ? "border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                            }`}
                        >
                          {story.is_public ? "Unpublish" : "🚀 Publish to Community"}
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setSelectedCollabStory({
                              id: story.id,
                              title: story.title,
                            })
                          }
                          className="px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-500/20 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl ${isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0c0d12] border-white/10 text-white"
            }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-6">
              <h2 className="text-xl font-bold outfit">Edit Author Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              {/* Profile Photo Upload Field */}
              <div className="p-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {creator.avatar_url ? (
                    <img
                      src={creator.avatar_url}
                      className="w-12 h-12 rounded-xl object-cover border border-white/10"
                      alt="Profile preview"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center font-bold text-sm">
                      {creator.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs outfit">Profile Picture</div>
                    <div className="text-[11px] text-slate-400">JPG, PNG, WebP up to 4MB</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => profileImageInputRef.current?.click()}
                  disabled={uploadingProfilePhoto}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {uploadingProfilePhoto ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-400 uppercase tracking-wider mb-1">Author Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell readers about your stories, writing genres, and lore universe..."
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
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
                    className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
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
                    className={`w-full px-3 py-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
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
                  className={`w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
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
                <label htmlFor="collabToggle" className={`font-semibold cursor-pointer ${isLight ? "text-slate-700" : "text-slate-300"}`}>
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

      {/* ── FOLLOWERS & FOLLOWING LIST MODAL ── */}
      {isFollowersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsFollowersModalOpen(false)}
          />

          {/* Modal Container */}
          <div
            className={`relative z-10 w-full max-w-[440px] rounded-3xl border shadow-2xl overflow-hidden ${
              isLight
                ? "bg-white border-slate-200/80"
                : "bg-[#111318] border-white/[0.08]"
            }`}
            style={{
              animation: "modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Gradient Accent Bar */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-extrabold tracking-tight outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                  {creator?.username ? `@${creator.username}` : "Creator"}
                </h2>
                <button
                  onClick={() => setIsFollowersModalOpen(false)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all text-sm ${
                    isLight
                      ? "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  ✕
                </button>
              </div>

              {/* Tab Switcher */}
              <div className={`flex rounded-2xl p-1 ${isLight ? "bg-slate-100" : "bg-white/[0.04]"}`}>
                <button
                  onClick={() => setFollowersModalTab("followers")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold outfit transition-all ${
                    followersModalTab === "followers"
                      ? isLight
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : isLight
                        ? "text-slate-500 hover:text-slate-700"
                        : "text-slate-400 hover:text-white"
                  }`}
                >
                  👥 Followers
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    followersModalTab === "followers"
                      ? isLight ? "bg-slate-100 text-slate-700" : "bg-white/20 text-white"
                      : isLight ? "bg-slate-200 text-slate-500" : "bg-white/5 text-slate-500"
                  }`}>
                    {followersList.length}
                  </span>
                </button>

                <button
                  onClick={() => setFollowersModalTab("following")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold outfit transition-all ${
                    followersModalTab === "following"
                      ? isLight
                        ? "bg-white text-slate-900 shadow-sm"
                        : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : isLight
                        ? "text-slate-500 hover:text-slate-700"
                        : "text-slate-400 hover:text-white"
                  }`}
                >
                  ✨ Following
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    followersModalTab === "following"
                      ? isLight ? "bg-slate-100 text-slate-700" : "bg-white/20 text-white"
                      : isLight ? "bg-slate-200 text-slate-500" : "bg-white/5 text-slate-500"
                  }`}>
                    {followingList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className={`mx-6 border-t ${isLight ? "border-slate-100" : "border-white/5"}`} />

            {/* List Body */}
            <div className="px-4 py-4 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {loadingFollowersData ? (
                <div className="py-16 text-center space-y-3">
                  <div className="relative mx-auto w-10 h-10">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  </div>
                  <p className={`text-xs font-medium ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    Discovering creators...
                  </p>
                </div>
              ) : (followersModalTab === "followers" ? followersList : followingList).length === 0 ? (
                <div className="py-14 text-center space-y-3">
                  <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl ${
                    isLight ? "bg-slate-50" : "bg-white/[0.03]"
                  }`}>
                    {followersModalTab === "followers" ? "🫂" : "🔭"}
                  </div>
                  <div>
                    <p className={`text-sm font-bold outfit ${isLight ? "text-slate-800" : "text-white"}`}>
                      {followersModalTab === "followers" ? "No followers yet" : "Not following anyone"}
                    </p>
                    <p className={`text-xs mt-1 max-w-[240px] mx-auto leading-relaxed ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                      {followersModalTab === "followers"
                        ? "When other creators follow this profile, they'll appear here."
                        : "Creators followed by this profile will show up here."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {(followersModalTab === "followers" ? followersList : followingList).map((user) => (
                    <a
                      key={user.id}
                      href={`/creator/${user.username}`}
                      className={`group flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 ${
                        isLight
                          ? "hover:bg-slate-50 active:bg-slate-100"
                          : "hover:bg-white/[0.04] active:bg-white/[0.07]"
                      }`}
                    >
                      {/* Avatar with Gradient Ring */}
                      <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[2px]">
                          <div className={`w-full h-full rounded-[10px] flex items-center justify-center font-bold text-sm outfit ${
                            isLight ? "bg-white text-slate-800" : "bg-[#111318] text-white"
                          }`}>
                            {(user.username || "A").substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        {/* Online indicator dot */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111318]" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold outfit truncate group-hover:text-indigo-500 transition-colors ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}>
                          {user.full_name || user.username}
                        </h4>
                        <p className={`text-[11px] font-mono truncate ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                          @{user.username}
                        </p>
                      </div>

                      {/* Arrow Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0 ${
                        isLight ? "bg-slate-100 text-slate-600" : "bg-white/5 text-slate-400"
                      }`}>
                        →
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-3 border-t text-center ${isLight ? "border-slate-100" : "border-white/5"}`}>
              <p className={`text-[10px] font-mono ${isLight ? "text-slate-300" : "text-slate-600"}`}>
                Narratia Creator Network
              </p>
            </div>
          </div>

          {/* Animation Keyframes */}
          <style>{`
            @keyframes modalSlideUp {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Hidden File Input for Profile Photo Upload */}
      <input
        ref={profileImageInputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/jpg,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleProfilePhotoUpload(file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
