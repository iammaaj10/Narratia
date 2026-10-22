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
  // Called when a remote peer sends a content update.
  // The handler must set the editor content WITHOUT triggering a broadcast back.
  onRemoteContentUpdate: (content: string, senderId: string) => void;
  enabled: boolean;
};

const COLLAB_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#f97316",
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

  // isReceivingRemote: true while we are applying a remote update.
  // broadcastContent checks this to avoid echoing the remote change back.
  const isReceivingRemoteRef = useRef(false);

  const lastBroadcastRef = useRef<string>("");
  const broadcastThrottleRef = useRef<NodeJS.Timeout | null>(null);

  // Keep a stable ref to the callback so the channel listener always calls
  // the latest version without needing to re-subscribe.
  const onRemoteContentUpdateRef = useRef(onRemoteContentUpdate);
  onRemoteContentUpdateRef.current = onRemoteContentUpdate;

  useEffect(() => {
    // Wait until we have a real user id AND the project is confirmed to be a
    // team project before opening the channel.
    if (!enabled || !currentUserId || !phaseId) return;

    const channelName = `collab:phase:${phaseId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: currentUserId },
        // ack: false = fire-and-forget broadcast (lower latency)
        broadcast: { ack: false },
      },
    });

    // ── Presence: who is currently in this phase ──────────────────────────
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: CollaboratorPresence[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (key === currentUserId) return; // exclude self
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

    // Also handle join/leave explicitly so the list updates instantly
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (key === currentUserId) return;
      const p = (newPresences as any[])[0];
      if (!p) return;
      setCollaborators((prev) => {
        if (prev.find((c) => c.userId === key)) return prev;
        return [
          ...prev,
          {
            userId: key,
            username: p.username || "Unknown",
            avatarUrl: p.avatar_url || null,
            color: getColorForUser(key),
            lastActive: p.last_active || Date.now(),
          },
        ];
      });
    });

    channel.on("presence", { event: "leave" }, ({ key }) => {
      setCollaborators((prev) => prev.filter((c) => c.userId !== key));
    });

    // ── Broadcast: receive content changes from other editors ─────────────
    channel.on("broadcast", { event: "content-update" }, (payload) => {
      const { content, senderId } = payload.payload as {
        content: string;
        senderId: string;
      };

      // Supabase may deliver our own broadcast if `self: true` is set in
      // older SDK versions – guard against it.
      if (senderId === currentUserId) return;

      // Mark that we are about to apply a remote update so broadcastContent
      // skips this change.
      isReceivingRemoteRef.current = true;
      onRemoteContentUpdateRef.current(content, senderId);
      // Give the React render cycle time to flush before we allow broadcasts
      // again, otherwise the editor's onUpdate fires and re-broadcasts.
      setTimeout(() => {
        isReceivingRemoteRef.current = false;
      }, 600); // must be > RichTextEditor debounce (500ms)
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

    // Heartbeat every 30 s to keep presence alive
    const heartbeat = setInterval(async () => {
      if (channelRef.current) {
        await channelRef.current.track({
          username: currentUsername,
          avatar_url: currentAvatarUrl,
          last_active: Date.now(),
        });
      }
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      if (broadcastThrottleRef.current) clearTimeout(broadcastThrottleRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setCollaborators([]);
    };
  // Re-run whenever `enabled` flips true (i.e. after loadPhaseData resolves isTeam)
  // or the user / phase changes.
  }, [phaseId, currentUserId, currentUsername, currentAvatarUrl, enabled]);

  /**
   * Call this whenever local content changes.
   * Throttled to 800 ms and silenced while applying a remote update.
   */
  const broadcastContent = useCallback(
    (content: string) => {
      if (!enabled) return;
      if (isReceivingRemoteRef.current) return; // never echo remote changes
      if (!channelRef.current) return;
      if (content === lastBroadcastRef.current) return;

      if (broadcastThrottleRef.current) clearTimeout(broadcastThrottleRef.current);

      broadcastThrottleRef.current = setTimeout(() => {
        if (channelRef.current && !isReceivingRemoteRef.current) {
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
    isReceivingRemote: isReceivingRemoteRef,
  };
}
