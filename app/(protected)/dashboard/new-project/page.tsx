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
      className="h-full flex flex-col max-w-5xl mx-auto pb-12 px-4"
    >
      {/* Top Nav */}
      <div className="mb-6 lg:mb-8 pt-2 lg:pt-0">
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

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
        {/* Left Column: Context / Branding */}
        <div className="lg:w-[35%] flex flex-col">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)] mb-5">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3 leading-tight">
              Bring your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                imagination
              </span>{" "}
              to life.
            </h1>
            <p className="text-gray-400 text-[13px] leading-relaxed mb-6">
              Every great masterpiece starts with a single idea. Give your story a name, a premise, and choose whether to write solo or invite collaborators to join your creative journey.
            </p>

            <div className="hidden lg:block p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 relative overflow-hidden shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-2 mb-2 relative z-10">
                <Lightbulb className="text-amber-400 w-4 h-4" />
                <h4 className="text-amber-200 font-medium text-[13px]">Writer's Tip</h4>
              </div>
              <p className="text-amber-100/70 text-[12px] leading-relaxed relative z-10">
                Start with a strong hook or an intriguing character. Don't worry about getting everything perfect right now—you can always revise and refine your title and synopsis later. Just start writing!
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Form */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0b0f19] rounded-2xl p-6 sm:p-7 border border-indigo-500/20"
          >
            <div className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-indigo-200 ml-1">
                  Story Title <span className="text-pink-400">*</span>
                </label>
                <input
                  placeholder="e.g., The Midnight Library"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#131726] hover:bg-[#1a1f33] focus:bg-[#1a1f33] border border-indigo-500/30 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-indigo-300/40 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  autoFocus
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-indigo-200 ml-1">
                  Synopsis / Premise
                </label>
                <textarea
                  placeholder="A brief overview of your story's plot or themes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#131726] hover:bg-[#1a1f33] focus:bg-[#1a1f33] border border-indigo-500/30 rounded-lg px-4 py-3 text-[14px] text-white placeholder:text-indigo-300/40 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 min-h-[100px] resize-none transition-colors"
                />
              </div>

              {/* Project Type */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-indigo-200 ml-1">
                  Collaboration
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Solo Option */}
                  <button
                    onClick={() => setIsTeam(false)}
                    className={`relative p-3.5 rounded-xl border transition-colors text-left group ${!isTeam
                        ? "bg-indigo-500/10 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-[#131726] border-indigo-500/20 hover:border-indigo-500/40 hover:bg-[#1a1f33]"
                      }`}
                  >
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${!isTeam ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-900/50 text-indigo-300 group-hover:text-indigo-200"}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-[14px] transition-colors ${!isTeam ? "text-white" : "text-indigo-200 group-hover:text-white"}`}>
                          Solo Project
                        </h3>
                        <p className={`text-[12px] mt-0.5 leading-relaxed ${!isTeam ? "text-indigo-200" : "text-indigo-300/70"}`}>
                          Write independently.
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Team Option */}
                  <button
                    onClick={() => setIsTeam(true)}
                    className={`relative p-3.5 rounded-xl border transition-colors text-left group ${isTeam
                        ? "bg-indigo-500/10 border-indigo-400 ring-1 ring-indigo-400"
                        : "bg-[#131726] border-indigo-500/20 hover:border-indigo-500/40 hover:bg-[#1a1f33]"
                      }`}
                  >
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isTeam ? "bg-indigo-500/30 text-indigo-200" : "bg-indigo-900/50 text-indigo-300 group-hover:text-indigo-200"}`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className={`font-semibold text-[14px] transition-colors ${isTeam ? "text-white" : "text-indigo-200 group-hover:text-white"}`}>
                          Team Project
                        </h3>
                        <p className={`text-[12px] mt-0.5 leading-relaxed ${isTeam ? "text-indigo-200" : "text-indigo-300/70"}`}>
                          Collaborate with others.
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
                    <div className="pt-1">
                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-[#131726] space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white text-[14px]">Invite Writers</h3>
                            <p className="text-[13px] text-indigo-300/70 mt-0.5">Add collaborators via email</p>
                          </div>
                          <div className="flex items-center justify-center px-2.5 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30">
                            <span className="text-[12px] font-semibold text-indigo-200">
                              {invites.length} / {MAX_TEAM_SIZE - 1}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Mail className="w-4 h-4 text-indigo-300/50 group-focus-within:text-indigo-300 transition-colors" />
                            </div>
                            <input
                              placeholder="writer@example.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && addInvite()}
                              className="w-full bg-[#0b0f19] hover:bg-[#1a1f33] focus:bg-[#1a1f33] border border-indigo-500/30 rounded-lg pl-9 pr-3 py-2.5 text-[14px] text-white placeholder:text-indigo-300/40 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                              disabled={invites.length >= MAX_TEAM_SIZE - 1}
                            />
                          </div>
                          <button
                            onClick={addInvite}
                            disabled={!inviteEmail.trim() || invites.length >= MAX_TEAM_SIZE - 1}
                            className="flex items-center justify-center w-10 h-10 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {invites.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="space-y-2 pt-1.5"
                            >
                              {invites.map((email) => (
                                <motion.div
                                  key={email}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex items-center justify-between bg-[#1a1f33] border border-indigo-500/20 px-3.5 py-2.5 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center">
                                      <User className="w-3.5 h-3.5 text-indigo-200" />
                                    </div>
                                    <span className="text-indigo-50 font-medium text-[14px]">{email}</span>
                                  </div>
                                  <button
                                    onClick={() => removeInvite(email)}
                                    className="p-1.5 rounded-md text-indigo-300/50 hover:bg-red-500/20 hover:text-red-400 transition-colors"
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
              <div className="pt-4">
                <button
                  disabled={loading || !title.trim()}
                  onClick={handleCreate}
                  className="group relative w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white rounded-xl font-bold text-[14px] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
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