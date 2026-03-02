"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Users,
  Crown,
  UserX,
  UserCog,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Shield,
  LogOut,
  AlertTriangle,
} from "lucide-react";

type Member = {
  id: string;
  user_id: string | null;
  invited_email: string;
  role: string;
  status: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  } | null;
};

type ActivityLog = {
  id: string;
  action_type: string;
  action_details: any;
  created_at: string;
  profiles: {
    username: string;
  } | null;
};

export default function TeamManagementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTo, setTransferTo] = useState("");

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUserId(user.id);

    // Load project
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!projectData) {
      alert("Project not found");
      router.push("/dashboard");
      return;
    }

    setProject(projectData);
    setIsOwner(projectData.owner_id === user.id);

    if (projectData.owner_id !== user.id) {
      alert("Only the project owner can manage the team");
      router.push(`/dashboard/${projectId}`);
      return;
    }

    // Load members
    const { data: memberRecords } = await supabase
      .from("project_members")
      .select("id, user_id, invited_email, role, status, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (memberRecords) {
      // Get profiles for members with user_id
      const userIds = memberRecords
        .filter((m) => m.user_id)
        .map((m) => m.user_id);

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        const combined = memberRecords.map((member) => ({
          ...member,
          profiles: member.user_id
            ? profilesData?.find((p) => p.id === member.user_id) || null
            : null,
        }));

        setMembers(combined as Member[]);
      } else {
        setMembers(memberRecords as Member[]);
      }
    }

    // Load activity log
    const { data: activityData } = await supabase
      .from("project_activity")
      .select(
        `
        id,
        action_type,
        action_details,
        created_at,
        user_id
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (activityData) {
      // Get profiles for activity log
      const activityUserIds = activityData
        .filter((a) => a.user_id)
        .map((a) => a.user_id);

      if (activityUserIds.length > 0) {
        const { data: activityProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", activityUserIds);

        const combinedActivity = activityData.map((activity: any) => ({
          ...activity,
          profiles: activity.user_id
            ? activityProfiles?.find((p) => p.id === activity.user_id) || null
            : null,
        }));

        setActivityLog(combinedActivity);
      } else {
        setActivityLog(activityData as any);
      }
    }

    setLoading(false);
  };

  const removeMember = async (memberId: string, memberEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${memberEmail} from this project?`
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      alert("Failed to remove member");
      return;
    }

    // Log activity
    await supabase.rpc("log_project_activity", {
      p_project_id: projectId,
      p_user_id: currentUserId,
      p_action_type: "member_removed",
      p_action_details: { email: memberEmail },
    });

    loadData();
  };

  const changeRole = async (memberId: string, newRole: string, email: string) => {
    const { error } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      alert("Failed to change role");
      return;
    }

    // Log activity
    await supabase.rpc("log_project_activity", {
      p_project_id: projectId,
      p_user_id: currentUserId,
      p_action_type: "role_changed",
      p_action_details: { email, new_role: newRole },
    });

    loadData();
  };

  const cancelInvite = async (memberId: string, email: string) => {
    if (!confirm(`Cancel invitation for ${email}?`)) return;

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      alert("Failed to cancel invitation");
      return;
    }

    // Log activity
    await supabase.rpc("log_project_activity", {
      p_project_id: projectId,
      p_user_id: currentUserId,
      p_action_type: "invite_cancelled",
      p_action_details: { email },
    });

    loadData();
  };

  const transferOwnership = async () => {
    if (!transferTo) {
      alert("Please select a new owner");
      return;
    }

    if (
      !confirm(
        "Are you sure? You will lose owner privileges. This cannot be undone!"
      )
    ) {
      return;
    }

    // Update project owner
    const { error: projectError } = await supabase
      .from("projects")
      .update({ owner_id: transferTo })
      .eq("id", projectId);

    if (projectError) {
      alert("Failed to transfer ownership");
      return;
    }

    // Update roles
    await supabase
      .from("project_members")
      .update({ role: "editor" })
      .eq("project_id", projectId)
      .eq("user_id", currentUserId);

    await supabase
      .from("project_members")
      .update({ role: "owner" })
      .eq("project_id", projectId)
      .eq("user_id", transferTo);

    // Log activity
    const newOwner = members.find((m) => m.user_id === transferTo);
    await supabase.rpc("log_project_activity", {
      p_project_id: projectId,
      p_user_id: currentUserId,
      p_action_type: "ownership_transferred",
      p_action_details: {
        new_owner: newOwner?.profiles?.username || newOwner?.invited_email,
      },
    });

    alert("Ownership transferred successfully!");
    router.push(`/dashboard/${projectId}`);
  };

  const leaveProject = async () => {
    if (isOwner) {
      alert("Owners cannot leave. Transfer ownership first.");
      return;
    }

    if (!confirm("Are you sure you want to leave this project?")) return;

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", currentUserId);

    if (error) {
      alert("Failed to leave project");
      return;
    }

    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="p-12">
        <div className="text-gray-400">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Team Management
              </h1>
              <p className="text-gray-400">{project?.title}</p>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 transition-all"
              >
                <Shield className="w-4 h-4" />
                Transfer Ownership
              </button>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Team Members</h2>
            <span className="text-sm text-gray-400">({members.length})</span>
          </div>

          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {member.profiles?.avatar_url ? (
                    <img
                      src={member.profiles.avatar_url}
                      className="w-12 h-12 rounded-full"
                      alt={member.profiles.username}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-300 font-semibold">
                        {member.profiles?.username?.[0]?.toUpperCase() ||
                          member.invited_email[0].toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {member.profiles?.username || member.invited_email}
                      </p>
                      {member.role === "owner" && (
                        <Crown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="capitalize">{member.role}</span>
                      <span>•</span>
                      {member.status === "accepted" ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && member.role !== "owner" && (
                  <div className="flex items-center gap-2">
                    {/* Change Role */}
                    {member.status === "accepted" && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          changeRole(
                            member.id,
                            e.target.value,
                            member.profiles?.username || member.invited_email
                          )
                        }
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-500"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}

                    {/* Cancel Invite */}
                    {member.status === "pending" && (
                      <button
                        onClick={() => cancelInvite(member.id, member.invited_email)}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                        title="Cancel Invitation"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Remove Member */}
                    <button
                      onClick={() =>
                        removeMember(
                          member.id,
                          member.profiles?.username || member.invited_email
                        )
                      }
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Activity Log</h2>
          </div>

          <div className="space-y-2">
            {activityLog.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No activity yet</p>
            ) : (
              activityLog.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-white/5 rounded-lg text-sm"
                >
                  <p className="text-gray-300">
                    <span className="font-medium text-white">
                      {activity.profiles?.username || "Someone"}
                    </span>{" "}
                    {getActivityText(activity.action_type, activity.action_details)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-md w-full">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              <h3 className="text-2xl font-bold text-white">
                Transfer Ownership
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Transfer project ownership to another team member. You will become
                an editor.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Owner
                </label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white"
                >
                  <option value="">Select member...</option>
                  {members
                    .filter(
                      (m) =>
                        m.status === "accepted" &&
                        m.role !== "owner" &&
                        m.user_id
                    )
                    .map((m) => (
                      <option key={m.id} value={m.user_id!}>
                        {m.profiles?.username || m.invited_email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-orange-300">
                  ⚠️ Warning: This action cannot be undone. The new owner will have
                  full control of the project.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={transferOwnership}
                disabled={!transferTo}
                className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getActivityText(actionType: string, details: any): string {
  switch (actionType) {
    case "member_removed":
      return `removed ${details?.email || "a member"}`;
    case "role_changed":
      return `changed ${details?.email || "a member"}'s role to ${details?.new_role}`;
    case "invite_cancelled":
      return `cancelled invitation for ${details?.email}`;
    case "ownership_transferred":
      return `transferred ownership to ${details?.new_owner}`;
    case "member_left":
      return "left the project";
    default:
      return actionType;
  }
}