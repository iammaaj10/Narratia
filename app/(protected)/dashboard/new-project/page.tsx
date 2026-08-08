"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { notificationHelpers } from "@/lib/notifications/createNotification";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  Users,
  User,
  X,
  Plus,
  Loader2,
  Mail,
  ChevronLeft,
  ArrowRight,
  Feather,
  Bookmark
} from "lucide-react";
import Link from "next/link";

const MAX_TEAM_SIZE = 4;

const GENRES = [
  { id: "Fantasy", label: "Fantasy", icon: "🔮" },
  { id: "Sci-Fi", label: "Sci-Fi", icon: "🚀" },
  { id: "Mystery", label: "Mystery", icon: "🔍" },
  { id: "Thriller", label: "Thriller", icon: "⚡" },
  { id: "Romance", label: "Romance", icon: "💖" },
  { id: "Drama", label: "Drama", icon: "🎭" },
  { id: "Non-Fiction", label: "Non-Fiction", icon: "📜" },
];

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Fantasy");
  const [isTeam, setIsTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addInvite = () => {
    if (!inviteEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    if (invites.includes(inviteEmail.toLowerCase())) {
      alert("This email is already added");
      return;
    }

    if (invites.length >= MAX_TEAM_SIZE - 1) {
      alert("You can only add 3 writers");
      return;
    }

    setInvites([...invites, inviteEmail.toLowerCase()]);
    setInviteEmail("");
  };

  const removeInvite = (email: string) => {
    setInvites(invites.filter((e) => e !== email));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in");
        setLoading(false);
        return;
      }

      // 1️⃣ Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: title.trim(),
          description: description.trim(),
          genre: genre,
          owner_id: user.id,
          is_team: isTeam,
        })
        .select()
        .single();

      if (projectError) {
        console.error("❌ Project creation error:", projectError);
        alert(`Failed to create project: ${projectError.message}`);
        setLoading(false);
        return;
      }

      // 2️⃣ Insert owner as member (team only)
      if (isTeam) {
        const { error: ownerError } = await supabase
          .from("project_members")
          .insert({
            project_id: project.id,
            user_id: user.id,
            invited_email: user.email?.toLowerCase() || "",
            role: "owner",
            status: "accepted",
            invited_by: user.id,
          });

        if (ownerError) {
          console.error("❌ Owner insert error:", ownerError);
          alert(`Failed to add owner: ${ownerError.message}`);
          setLoading(false);
          return;
        }

        // 3️⃣ Insert invited writers
        if (invites.length > 0) {
          const rows = invites.map((email) => ({
            project_id: project.id,
            invited_email: email.toLowerCase(),
            user_id: null,
            role: "editor",
            status: "pending",
            invited_by: user.id,
          }));

          const { error: inviteError } = await supabase
            .from("project_members")
            .insert(rows);

          if (inviteError) {
            console.error("❌ Invite error:", inviteError);
            alert(`Failed to send invites: ${inviteError.message}`);
            setLoading(false);
            return;
          }

          // Send notifications to invited users
          for (const email of invites) {
            const { data: invitedUser } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", email.toLowerCase())
              .single();

            if (invitedUser) {
              const { data: ownerProfile } = await supabase
                .from("profiles")
                .select("username")
                .eq("id", user.id)
                .single();

              await notificationHelpers.projectInvite(
                invitedUser.id,
                title.trim(),
                ownerProfile?.username || user.email || "Someone",
                project.id
              );
            }
          }
        }
      }

      setLoading(false);
      router.push(`/dashboard/${project.id}`);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert(`An unexpected error occurred: ${err}`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col relative min-h-full">
      {/* Top Back Link */}
      <div className="pb-4 mb-4 relative z-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center mr-2 border border-slate-200 dark:border-white/10 group-hover:border-indigo-500/40 transition-colors">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Back to Dashboard
        </Link>
      </div>

      {/* Main 2-Column Full-Screen Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start relative z-10 pb-8">
        {/* LEFT COLUMN: Story Context & Live Card Preview */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight outfit leading-snug">
              Create New Story
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Define your title, premise, and genre to launch a new workspace.
            </p>
          </motion.div>

          {/* Real-time Live Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, duration: 0.25 }}
            className="relative rounded-2xl p-5 border bg-white dark:bg-[#12131a] border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                LIVE PREVIEW
              </span>
              <Bookmark className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10 outfit">
                  {GENRES.find((g) => g.id === genre)?.icon} {genre}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10 outfit">
                  {isTeam ? "👥 Team Project" : "👤 Solo Writer"}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white outfit line-clamp-2">
                {title.trim() || "Untitled Story..."}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-4 min-h-[50px]">
                {description.trim() || "Your synopsis and story premise will appear here..."}
              </p>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Feather className="w-3.5 h-3.5 text-indigo-500" /> RAG Context Ready
                </span>
                <span>0 Words</span>
              </div>
            </div>
          </motion.div>

          {/* Writer Prompt Tip Box */}
          <div className="rounded-2xl p-4 bg-slate-50 dark:bg-[#12131a] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs outfit text-slate-900 dark:text-white">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Writer's Tip</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90 text-slate-600 dark:text-slate-400">
              Start with a clear conflict or central hook in your premise. You can refine title and details anytime later.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean Solid Form Controls */}
        <div className="lg:col-span-7 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
            className="rounded-2xl p-6 sm:p-7 bg-white dark:bg-[#12131a] border border-slate-200 dark:border-white/10 shadow-sm space-y-5"
          >
            {/* Story Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between outfit">
                <span>Story Title <span className="text-pink-500">*</span></span>
                <span className="text-[11px] font-mono text-slate-400">{title.length}/100</span>
              </label>
              <input
                placeholder="e.g. The Midnight Library"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0c10] hover:bg-slate-100/70 dark:hover:bg-[#08090d] focus:bg-white dark:focus:bg-[#0b0c10] border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-all"
                autoFocus
              />
            </div>

            {/* Genre Selector Pills */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                Primary Genre
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGenre(g.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 outfit cursor-pointer ${
                      genre === g.id
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Synopsis / Premise */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between outfit">
                <span>Synopsis / Premise</span>
                <span className="text-[11px] font-mono text-slate-400">Optional</span>
              </label>
              <textarea
                placeholder="A brief overview of your story's plot, themes, or characters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0c10] hover:bg-slate-100/70 dark:hover:bg-[#08090d] focus:bg-white dark:focus:bg-[#0b0c10] border border-slate-200 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none min-h-[100px] resize-none transition-all"
              />
            </div>

            {/* Collaboration Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                Collaboration Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                {/* Solo Mode */}
                <button
                  type="button"
                  onClick={() => setIsTeam(false)}
                  className={`p-3.5 rounded-xl border transition-all text-left flex items-start gap-3 cursor-pointer ${
                    !isTeam
                      ? "bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-500 dark:border-indigo-500"
                      : "bg-slate-50 dark:bg-[#0b0c10] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !isTeam
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold outfit ${!isTeam ? "text-indigo-950 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                      Solo Project
                    </h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${!isTeam ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}>
                      Write independently.
                    </p>
                  </div>
                </button>

                {/* Team Mode */}
                <button
                  type="button"
                  onClick={() => setIsTeam(true)}
                  className={`p-3.5 rounded-xl border transition-all text-left flex items-start gap-3 cursor-pointer ${
                    isTeam
                      ? "bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-500 dark:border-indigo-500"
                      : "bg-slate-50 dark:bg-[#0b0c10] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isTeam
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold outfit ${isTeam ? "text-indigo-950 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>
                      Team Project
                    </h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isTeam ? "text-indigo-700 dark:text-indigo-300" : "text-slate-500 dark:text-slate-400"}`}>
                      Collaborate with others.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Team Writer Invitations */}
            <AnimatePresence>
              {isTeam && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1 space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0b0c10] border border-slate-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 outfit">
                        Invite Writers
                      </span>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                        {invites.length} / {MAX_TEAM_SIZE - 1} Added
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          placeholder="writer@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                          className="w-full bg-white dark:bg-[#12131a] border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                          disabled={invites.length >= MAX_TEAM_SIZE - 1}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addInvite}
                        disabled={!inviteEmail.trim() || invites.length >= MAX_TEAM_SIZE - 1}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 outfit cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>

                    {invites.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {invites.map((email) => (
                          <div
                            key={email}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#12131a] border border-slate-200 dark:border-white/5 text-xs"
                          >
                            <span className="font-mono text-slate-700 dark:text-slate-300">{email}</span>
                            <button
                              type="button"
                              onClick={() => removeInvite(email)}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Launch Action Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={loading || !title.trim()}
                onClick={handleCreate}
                className="w-full py-3.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outfit cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    Start Writing <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}