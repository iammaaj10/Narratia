import { supabase } from "@/lib/supabase/client";

export interface CreatorProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  open_for_collaboration: boolean;
  twitter_handle: string | null;
  discord_handle: string | null;
  website_url: string | null;
  created_at?: string;
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface CollabRequest {
  id: string;
  project_id: string;
  sender_id: string;
  recipient_id: string;
  proposed_role: string;
  pitch_message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  project_title?: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    username: string;
    avatar_url: string | null;
  };
}

// ─────────────────────────────────────────────────────────────────
// PROFILE & FOLLOW API
// ─────────────────────────────────────────────────────────────────

export async function fetchCreatorProfile(username: string, currentUserId?: string): Promise<CreatorProfile | null> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", username)
      .maybeSingle();

    if (!profile) return null;

    // Fetch follower and following counts
    let followers_count = 0;
    let following_count = 0;
    let is_following = false;

    try {
      const { count: followers } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profile.id);
      
      const { count: following } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profile.id);

      followers_count = followers || 0;
      following_count = following || 0;

      if (currentUserId) {
        const { data: followRecord } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.id)
          .single();
        
        is_following = !!followRecord;
      }
    } catch {
      // Table fallback
    }

    return {
      ...profile,
      followers_count,
      following_count,
      is_following,
    };
  } catch (err) {
    console.error("Error fetching creator profile:", err);
    return null;
  }
}

export async function toggleFollowUser(targetUserId: string, followerId: string): Promise<boolean> {
  try {
    // Check if following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", targetUserId)
      .single();

    if (existing) {
      await supabase.from("user_follows").delete().eq("id", existing.id);
      return false; // Now unfollowed
    } else {
      await supabase.from("user_follows").insert({
        follower_id: followerId,
        following_id: targetUserId,
      });

      // Create notification
      try {
        await supabase.from("notifications").insert({
          user_id: targetUserId,
          type: "follow",
          title: "New Follower",
          message: "Someone started following your story journey!",
        });
      } catch {
        // Notification table fallback
      }

      return true; // Now following
    }
  } catch (err) {
    console.error("Error toggling follow state:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// COLLABORATION REQUESTS API
// ─────────────────────────────────────────────────────────────────

export async function sendCollabRequest(payload: {
  projectId: string;
  senderId: string;
  recipientId: string;
  proposedRole: string;
  pitchMessage: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from("collaboration_requests").insert({
      project_id: payload.projectId,
      sender_id: payload.senderId,
      recipient_id: payload.recipientId,
      proposed_role: payload.proposedRole,
      pitch_message: payload.pitchMessage,
      status: "pending",
    });

    if (error) throw error;

    // Send notification to recipient
    try {
      await supabase.from("notifications").insert({
        user_id: payload.recipientId,
        type: "collab_request",
        title: "New Collaboration Request",
        message: `You received a request to collaborate as ${payload.proposedRole}.`,
      });
    } catch {
      // notification table fallback
    }

    return { success: true, message: "Collaboration request sent successfully!" };
  } catch (err: any) {
    console.error("Error sending collab request:", err);
    return { success: false, message: err.message || "Failed to send collaboration request." };
  }
}

export async function fetchCollabRequests(userId: string): Promise<CollabRequest[]> {
  try {
    const { data, error } = await supabase
      .from("collaboration_requests")
      .select("*, projects(title), sender_profile:profiles!sender_id(username, avatar_url)")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      project_id: item.project_id,
      sender_id: item.sender_id,
      recipient_id: item.recipient_id,
      proposed_role: item.proposed_role,
      pitch_message: item.pitch_message,
      status: item.status,
      created_at: item.created_at,
      project_title: item.projects?.title || "Untitled Story",
      sender_profile: item.sender_profile || { username: "Author", avatar_url: null },
    }));
  } catch (err) {
    console.error("Error fetching collab requests:", err);
    return [];
  }
}

export async function updateCollabStatus(requestId: string, status: "accepted" | "declined", projectId: string, senderId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("collaboration_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) throw error;

    if (status === "accepted") {
      // Add user to project_members
      try {
        await supabase.from("project_members").insert({
          project_id: projectId,
          user_id: senderId,
          role: "editor",
          status: "accepted",
        });
      } catch {
        // Table fallback
      }
    }

    return true;
  } catch (err) {
    console.error("Error updating collab status:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// DIRECT MESSAGES API
// ─────────────────────────────────────────────────────────────────

export async function fetchDirectMessages(currentUserId: string, otherUserId: string): Promise<DirectMessage[]> {
  try {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("Error fetching DMs:", err);
    return [];
  }
}

export async function sendDirectMessage(senderId: string, recipientId: string, content: string): Promise<DirectMessage | null> {
  try {
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content.trim(),
      })
      .select()
      .single();

    if (error || !data) throw error;
    return data;
  } catch (err) {
    console.error("Error sending DM:", err);
    return null;
  }
}
