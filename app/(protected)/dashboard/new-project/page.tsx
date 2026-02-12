"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const MAX_TEAM_SIZE = 4; // including owner

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

    // Basic email validation
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

      console.log("📝 Creating project for user:", user.id);
      console.log("User email:", user.email);

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
        console.error("❌ Project creation error:", {
          message: projectError.message,
          details: projectError.details,
          hint: projectError.hint,
          code: projectError.code,
        });
        alert(`Failed to create project: ${projectError.message}`);
        setLoading(false);
        return;
      }

      console.log("✅ Project created:", project.id);

      // 2️⃣ Insert owner as member (team only)
      if (isTeam) {
        console.log("👤 Adding owner as member...");

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
          console.error("❌ Owner insert error:", {
            message: ownerError.message,
            details: ownerError.details,
            hint: ownerError.hint,
            code: ownerError.code,
          });
          alert(`Failed to add owner: ${ownerError.message}`);
          setLoading(false);
          return;
        }

        console.log("✅ Owner added");

        // 3️⃣ Insert invited writers
        if (invites.length > 0) {
          console.log("========================================");
          console.log("📧 INVITATION DEBUG START");
          console.log("========================================");
          console.log("User ID:", user.id);
          console.log("Project ID:", project.id);
          console.log("Invites array:", invites);

          const rows = invites.map((email) => ({
            project_id: project.id,
            invited_email: email.toLowerCase(),
            user_id: null,
            role: "editor",
            status: "pending",
            invited_by: user.id,
          }));

          console.log("📧 Rows BEFORE insert:");
          console.log(JSON.stringify(rows, null, 2));

          const { data: insertedData, error: inviteError } = await supabase
            .from("project_members")
            .insert(rows)
            .select("id, project_id, invited_email, user_id, role, status, created_at");

          console.log("📧 Data AFTER insert (what Supabase returned):");
          console.log(JSON.stringify(insertedData, null, 2));
          console.log("📧 Insert error:", inviteError);
          console.log("========================================");
          console.log("📧 INVITATION DEBUG END");
          console.log("========================================");

          if (inviteError) {
            console.error("❌ Invite error:", {
              message: inviteError.message,
              details: inviteError.details,
              hint: inviteError.hint,
              code: inviteError.code,
            });
            alert(`Failed to send invites: ${inviteError.message}`);
            setLoading(false);
            return;
          }

          console.log("✅ Invites sent successfully");
        }
      }

      setLoading(false);
      alert("Project created successfully!");
      router.push(`/dashboard/${project.id}`);
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert(`An unexpected error occurred: ${err}`);
      setLoading(false);
    }
  };

  return (
    <div className="p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 to-white bg-clip-text text-transparent">
          Create New Story
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Story Title *
            </label>
            <input
              placeholder="Enter your story title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              placeholder="Brief description of your story"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[120px] resize-none"
            />
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Project Type
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setIsTeam(false)}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  !isTeam
                    ? "bg-linear-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="font-semibold">Solo Project</div>
                <div className="text-xs mt-1 opacity-70">
                  Write independently
                </div>
              </button>

              <button
                onClick={() => setIsTeam(true)}
                className={`flex-1 py-4 rounded-xl border transition-all ${
                  isTeam
                    ? "bg-linear-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="font-semibold">Team Project</div>
                <div className="text-xs mt-1 opacity-70">
                  Collaborate with others
                </div>
              </button>
            </div>
          </div>

          {/* 👥 Invite Writers (Team only) */}
          {isTeam && (
            <div className="space-y-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Invite Writers</h3>
                <span className="text-sm text-gray-400">
                  {invites.length}/{MAX_TEAM_SIZE - 1} added
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  placeholder="writer@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addInvite()}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={addInvite}
                  className="px-6 py-2 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/25 transition-all font-medium"
                >
                  Add
                </button>
              </div>

              {/* Invited list */}
              {invites.length > 0 && (
                <div className="space-y-2">
                  {invites.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between bg-black/30 border border-white/10 px-4 py-3 rounded-lg"
                    >
                      <span className="text-sm text-gray-300">{email}</span>
                      <button
                        onClick={() => removeInvite(email)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Maximum 4 writers including you
              </p>
            </div>
          )}

          <button
            disabled={loading}
            onClick={handleCreate}
            className="w-full bg-gradient-to-br from-indigo-600 to-purple-600 py-4 rounded-xl font-semibold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Story"}
          </button>
        </div>
      </div>
    </div>
  );
}