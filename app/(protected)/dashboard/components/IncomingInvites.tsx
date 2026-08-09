"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Check, X } from "lucide-react";

type Invite = {
  id: string;
  project_id: string;
  role: string;
  invited_email: string;
  status: string;
  projects: {
    title: string;
  };
};

export default function IncomingInvites() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

 const loadInvites = async () => {
  setLoading(true);
  setError(null);

  try {
    // 1. Check auth first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("❌ Auth error:", authError);
      setError(`Auth failed: ${authError.message}`);
      setLoading(false);
      return;
    }

    if (!user || !user.email) {
      console.warn("No authenticated user found in IncomingInvites");
      setError("Not logged in");
      setLoading(false);
      return;
    }



    // 2. Query with detailed error logging & fallback
    const { data, error: queryError } = await supabase
      .from("project_members")
      .select("id, project_id, role, invited_email, status")
      .or(`invited_email.eq."${user.email.toLowerCase()}",user_id.eq."${user.id}"`)
      .eq("status", "pending");

    if (queryError) {
      console.error("❌ Query error:", queryError.message || JSON.stringify(queryError));
      setInvites([]);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const projectIds = data.map((m) => m.project_id).filter(Boolean);
      const { data: projData } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds);

      const projMap = new Map(projData?.map((p) => [p.id, p.title]) || []);
      const formattedInvites: Invite[] = data.map((m) => ({
        ...m,
        projects: {
          title: projMap.get(m.project_id) || "Untitled Project",
        },
      }));
      setInvites(formattedInvites);
    } else {
      setInvites([]);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
};

  const respond = async (id: string, projectId: string, accept: boolean) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in");
        return;
      }



      if (accept) {
        // Ensure project.is_team = true
        await supabase
          .from("projects")
          .update({ is_team: true })
          .eq("id", projectId);

        const { error } = await supabase
          .from("project_members")
          .update({
            status: "accepted",
            user_id: user.id,
          })
          .eq("id", id);

        if (error) {
          console.error("❌ Error accepting:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          alert(`Failed to accept: ${error.message}`);
          return;
        }

        // Notify Project Owner and log activity
        try {
          const targetInvite = invites.find((i) => i.id === id);
          const { data: project } = await supabase
            .from("projects")
            .select("owner_id, title")
            .eq("id", projectId)
            .single();

          if (project?.owner_id) {
            // Get user username if available
            const { data: userProfile } = await supabase
              .from("profiles")
              .select("username")
              .eq("id", user.id)
              .single();

            const nameToDisplay = userProfile?.username || user.email;

            // 1. Insert notification for owner
            await supabase.from("notifications").insert({
              user_id: project.owner_id,
              type: "invite",
              title: "Invitation Accepted 🎉",
              message: `${nameToDisplay} accepted your invitation to collaborate on "${project.title}"`,
              link: `/dashboard/${projectId}/team`,
              project_id: projectId,
              read: false,
            });

            // 2. Insert team activity log
            await supabase.from("project_activity").insert({
              project_id: projectId,
              user_id: user.id,
              action_type: "member_joined",
              action_details: `${nameToDisplay} joined the team as ${targetInvite?.role || "collaborator"}`,
            });
          }
        } catch (notifErr) {
          console.warn("⚠️ Notification warning:", notifErr);
        }

        alert("Invite accepted! Redirecting to workspace...");
        window.location.href = `/dashboard/${projectId}`;
      } else {
        const { error } = await supabase
          .from("project_members")
          .update({ status: "rejected" })
          .eq("id", id);

        if (error) {
          console.error("❌ Error rejecting:", {
            message: error.message,
            details: error.details,
          });
          alert(`Failed to reject: ${error.message}`);
          return;
        }


        setInvites((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <div className="text-gray-400 text-sm">Loading invitations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-red-300 text-sm mb-2">
          ⚠️ Error loading invitations
        </p>
        <p className="text-xs text-gray-400 mb-3">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={loadInvites}
            className="text-xs px-3 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          >
            Try Again
          </button>
          <button
            onClick={() => setError(null)}
            className="text-xs px-3 py-1 rounded bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  if (invites.length === 0) {
    return null; // Don't show anything if no invites
  }

  return (
    <div className="mb-8 rounded-xl border border-purple-500/20 bg-linear-to-r from-purple-500/5 to-pink-500/5 p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
        Team Invitations ({invites.length})
      </h3>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/10 hover:border-purple-500/30 transition-all"
          >
            <div>
              <p className="text-white font-medium">
                {invite.projects.title || "Untitled Project"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Role: <span className="text-purple-300">{invite.role}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => respond(invite.id, invite.project_id, true)}
                className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all hover:scale-110"
                title="Accept"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => respond(invite.id, invite.project_id, false)}
                className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all hover:scale-110"
                title="Reject"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}