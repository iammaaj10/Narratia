"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { notificationHelpers } from "@/lib/notifications/createNotification";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  User,
  X,
  Plus,
  Loader2,
  Mail,
  ChevronLeft,
  BookOpen,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

const MAX_TEAM_SIZE = 4;

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col max-w-6xl mx-auto pb-12"
    >
      {/* Top Nav */}
      <div className="mb-6 lg:mb-10 pt-2 lg:pt-0">
        <Link 
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-white transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left Column: Context / Branding */}
        <div className="lg:w-[35%] flex flex-col">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] mb-6">
              <BookOpen className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
              Bring your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                imagination
              </span>{" "}
              to life.
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Every great masterpiece starts with a single idea. Give your story a name, a premise, and choose whether to write solo or invite collaborators to join your creative journey.
            </p>
            
            <div className="hidden lg:block p-5 rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Sparkles className="w-24 h-24" />
              </div>
              <Sparkles className="text-purple-400 mb-3 w-5 h-5" />
              <h4 className="text-white font-medium text-sm mb-1.5">Writer's Tip</h4>
              <p className="text-gray-500 text-xs leading-relaxed">
                Start with a strong hook or an intriguing character. Don't worry about getting everything perfect right now—you can always change the title and synopsis later using our AI tools.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:w-[65%]">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            className="bg-black/20 rounded-[2rem] p-6 sm:p-8 lg:p-10 border border-white/5 shadow-2xl relative"
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />
            
            <div className="relative z-10 space-y-8">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Story Title <span className="text-pink-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    placeholder="e.g., The Midnight Library"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.04] focus:bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Synopsis / Premise
                </label>
                <div className="relative group">
                  <textarea
                    placeholder="A brief overview of your story's plot or themes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white/[0.03] hover:bg-white/[0.04] focus:bg-white/[0.05] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 min-h-[120px] resize-none transition-all"
                  />
                </div>
              </div>

              {/* Project Type */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Collaboration Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Solo Option */}
                  <button
                    onClick={() => setIsTeam(false)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                      !isTeam
                        ? "bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${!isTeam ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 group-hover:text-gray-300"}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-medium transition-colors ${!isTeam ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                          Solo Project
                        </h3>
                        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                          Write independently. Perfect for personal novels.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Team Option */}
                  <button
                    onClick={() => setIsTeam(true)}
                    className={`relative p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden group ${
                      isTeam
                        ? "bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex flex-col gap-3 relative z-10">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isTeam ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 group-hover:text-gray-300"}`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-medium transition-colors ${isTeam ? "text-white" : "text-gray-400 group-hover:text-gray-200"}`}>
                          Team Project
                        </h3>
                        <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">
                          Collaborate with others. Great for co-writing.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Team Invites Section */}
              <AnimatePresence>
                {isTeam && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2">
                      <div className="p-5 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-sm">Invite Writers</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Add collaborators via email</p>
                          </div>
                          <div className="flex items-center justify-center px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
                            <span className="text-xs font-medium text-purple-300">
                              {invites.length} / {MAX_TEAM_SIZE - 1}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <Mail className="w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                              placeholder="writer@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addInvite()}
                              className="w-full bg-black/40 border border-purple-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                              disabled={invites.length >= MAX_TEAM_SIZE - 1}
                            />
                          </div>
                          <button
                            onClick={addInvite}
                            disabled={!inviteEmail.trim() || invites.length >= MAX_TEAM_SIZE - 1}
                            className="flex items-center justify-center w-10 h-10 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {invites.length > 0 && (
                            <motion.div 
                              initial={{ opacity: 0 }} 
                              animate={{ opacity: 1 }} 
                              className="space-y-2 pt-1"
                            >
                              {invites.map((email) => (
                                <motion.div
                                  key={email}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                      <User className="w-3 h-3 text-purple-300" />
                                    </div>
                                    <span className="text-gray-300 text-sm">{email}</span>
                                  </div>
                                  <button
                                    onClick={() => removeInvite(email)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <div className="pt-2 mt-8">
                <button
                  disabled={loading || !title.trim()}
                  onClick={handleCreate}
                  className="group relative w-full sm:w-auto ml-auto flex items-center justify-center gap-2 px-8 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Start Writing
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}