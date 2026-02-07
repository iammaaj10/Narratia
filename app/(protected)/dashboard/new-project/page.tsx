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

    if (invites.includes(inviteEmail)) {
      alert("This email is already added");
      return;
    }

    if (invites.length >= MAX_TEAM_SIZE - 1) {
      alert("You can only add 3 writers");
      return;
    }

    setInvites([...invites, inviteEmail]);
    setInviteEmail("");
  };

  const removeInvite = (email: string) => {
    setInvites(invites.filter((e) => e !== email));
  };

  const handleCreate = async () => {
    if (!title.trim()) return alert("Title is required");

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 1️⃣ Create project
    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        title,
        description,
        owner_id: user.id,
        is_team: isTeam,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    // 2️⃣ Insert owner as member (team only)
    if (isTeam) {
      await supabase.from("project_members").insert({
        project_id: project.id,
        user_id: user.id,
        role: "owner",
        status: "accepted",
        invited_by: user.id,
      });

      // 3️⃣ Insert invited writers
      if (invites.length > 0) {
        const rows = invites.map((email) => ({
          project_id: project.id,
          invited_email: email,
          role: "editor",
          status: "pending",
          invited_by: user.id,
        }));

        await supabase.from("project_members").insert(rows);
      }
    }

    setLoading(false);
    router.push(`/dashboard/${project.id}`);
  };

  return (
    <div className="max-w-xl space-y-8">
      <h2 className="text-3xl font-bold">Create New Story</h2>

      <input
        placeholder="Story title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3"
      />

      <textarea
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 min-h-[100px]"
      />

      {/* Project Type */}
      <div className="flex gap-4">
        <button
          onClick={() => setIsTeam(false)}
          className={`flex-1 py-3 rounded-xl border ${
            !isTeam
              ? "bg-indigo-600 border-indigo-500"
              : "border-gray-700 bg-gray-900"
          }`}
        >
          Solo Project
        </button>

        <button
          onClick={() => setIsTeam(true)}
          className={`flex-1 py-3 rounded-xl border ${
            isTeam
              ? "bg-indigo-600 border-indigo-500"
              : "border-gray-700 bg-gray-900"
          }`}
        >
          Team Project
        </button>
      </div>

      {/* 👥 Invite Writers (Team only) */}
      {isTeam && (
        <div className="space-y-4 rounded-xl border border-gray-700 p-4">
          <h3 className="font-semibold">
            Invite Writers ({invites.length}/{MAX_TEAM_SIZE - 1})
          </h3>

          <div className="flex gap-2">
            <input
              placeholder="writer@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
            />
            <button
              onClick={addInvite}
              className="px-4 rounded-lg bg-indigo-600"
            >
              Add
            </button>
          </div>

          {/* Invited list */}
          <div className="space-y-2">
            {invites.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg"
              >
                <span className="text-sm">{email}</span>
                <button
                  onClick={() => removeInvite(email)}
                  className="text-red-400 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400">
            Max 4 writers including you
          </p>
        </div>
      )}

      <button
        disabled={loading}
        onClick={handleCreate}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 rounded-xl font-semibold disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Story"}
      </button>
    </div>
  );
}
