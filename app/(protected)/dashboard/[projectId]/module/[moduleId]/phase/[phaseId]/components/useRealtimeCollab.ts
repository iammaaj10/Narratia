"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type CollaboratorPresence = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  color: string;
  lastActive: number;
};

type UseRealtimeCollabOptions = {
  phaseId: string;
  currentUserId: string;
  currentUsername: string;
  currentAvatarUrl: string | null;
  onRemoteContentUpdate: (content: string, senderId: string) => void;
  enabled: boolean; // only enable for team projects
};

// Distinct colors for collaborators
const COLLAB_COLORS = [
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // emerald
  "#ec4899", // pink
  "#3b82f6", // blue
  "#f97316", // orange
];

function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

export function useRealtimeCollab({
  phaseId,
  currentUserId,
  currentUsername,
  currentAvatarUrl,
  onRemoteContentUpdate,
  enabled,
}: UseRealtimeCollabOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const lastBroadcastRef = useRef<string>("");
  const broadcastThrottleRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !currentUserId || !phaseId) return;

    const channelName = `collab:phase:${phaseId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUserId },
        broadcast: { self: false }, // don't receive own broadcasts
      },
    });

    // ── Presence: track who's online ──
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: CollaboratorPresence[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (key === currentUserId) return; // skip self
        const latest = (presences as any[])[0];
        if (latest) {
          users.push({
            userId: key,
            username: latest.username || "Unknown",
            avatarUrl: latest.avatar_url || null,
            color: getColorForUser(key),
            lastActive: latest.last_active || Date.now(),
          });
        }
      });

      setCollaborators(users);
    });

    // ── Broadcast: receive content from other editors ──
    channel.on("broadcast", { event: "content-update" }, (payload) => {
      const { content, senderId } = payload.payload;
      if (senderId === currentUserId) return; // safety

      isRemoteUpdateRef.current = true;
      onRemoteContentUpdate(content, senderId);

      // Reset flag after a short delay so local edits resume normally
      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 100);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          username: currentUsername,
          avatar_url: currentAvatarUrl,
          last_active: Date.now(),
        });
      }
    });

    channelRef.current = channel;

    // Heartbeat: update presence every 30s
    const heartbeat = setInterval(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          username: currentUsername,
          avatar_url: currentAvatarUrl,
          last_active: Date.now(),
        });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (broadcastThrottleRef.current) {
        clearTimeout(broadcastThrottleRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [phaseId, currentUserId, currentUsername, currentAvatarUrl, enabled]);

  // Broadcast local content changes to other editors (throttled)
  const broadcastContent = useCallback(
    (content: string) => {
      if (!enabled || !channelRef.current || isRemoteUpdateRef.current) return;
      if (content === lastBroadcastRef.current) return;

      // Throttle: max 1 broadcast per 800ms to avoid flooding
      if (broadcastThrottleRef.current) {
        clearTimeout(broadcastThrottleRef.current);
      }

      broadcastThrottleRef.current = setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "content-update",
            payload: {
              content,
              senderId: currentUserId,
              timestamp: Date.now(),
            },
          });
          lastBroadcastRef.current = content;
        }
        broadcastThrottleRef.current = null;
      }, 800);
    },
    [enabled, currentUserId]
  );

  return {
    collaborators,
    broadcastContent,
    isRemoteUpdate: isRemoteUpdateRef,
  };
}
