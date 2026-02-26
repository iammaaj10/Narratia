import { supabase } from "@/lib/supabase/client";

type NotificationType = "invite" | "comment" | "assignment" | "mention" | "phase_complete";

type CreateNotificationParams = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  projectId?: string;
  phaseId?: string;
  commentId?: string;
};

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || null,
    project_id: params.projectId || null,
    phase_id: params.phaseId || null,
    comment_id: params.commentId || null,
    read: false,
  });

  if (error) {
    console.error("❌ Notification creation error:", error);
  }

  return { error };
}

// Helper functions for common notification types
export const notificationHelpers = {
  // When someone is invited to a project
  projectInvite: async (userId: string, projectTitle: string, inviterName: string, projectId: string) => {
    return createNotification({
      userId,
      type: "invite",
      title: "New Project Invitation",
      message: `${inviterName} invited you to collaborate on "${projectTitle}"`,
      link: `/dashboard`,
      projectId,
    });
  },

  // When someone is assigned to a phase
  phaseAssignment: async (userId: string, phaseTitle: string, projectId: string, moduleId: string, phaseId: string) => {
    return createNotification({
      userId,
      type: "assignment",
      title: "New Phase Assigned",
      message: `You've been assigned to write "${phaseTitle}"`,
      link: `/dashboard/${projectId}/module/${moduleId}/phase/${phaseId}`,
      projectId,
      phaseId,
    });
  },

  // When someone comments on your phase
  newComment: async (userId: string, commenterName: string, phaseTitle: string, projectId: string, moduleId: string, phaseId: string, commentId: string) => {
    return createNotification({
      userId,
      type: "comment",
      title: "New Comment",
      message: `${commenterName} commented on "${phaseTitle}"`,
      link: `/dashboard/${projectId}/module/${moduleId}/phase/${phaseId}`,
      projectId,
      phaseId,
      commentId,
    });
  },

  // When someone mentions you in a comment
  mention: async (userId: string, mentionerName: string, projectId: string, moduleId: string, phaseId: string) => {
    return createNotification({
      userId,
      type: "mention",
      title: "You were mentioned",
      message: `${mentionerName} mentioned you in a comment`,
      link: `/dashboard/${projectId}/module/${moduleId}/phase/${phaseId}`,
      projectId,
      phaseId,
    });
  },
};