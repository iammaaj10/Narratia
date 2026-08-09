"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, X } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  project_id: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("❌ Notifications error:", error);
    } else {
      setNotifications(data || []);
      setUnreadCount(data?.filter((n) => !n.read).length || 0);
    }

    setLoading(false);
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error) {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (!error) {
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      if (notification && !notification.read) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    }
  };

  const handleAcceptInvite = async (notification: Notification) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let targetProjectId = notification.project_id;

      // 1. Check collaboration_requests table
      const { data: collabRequests } = await supabase
        .from("collaboration_requests")
        .select("*")
        .eq("recipient_id", user.id)
        .eq("status", "pending");

      if (collabRequests && collabRequests.length > 0) {
        const req = collabRequests[0];
        targetProjectId = targetProjectId || req.project_id;

        // Update collab request status
        await supabase
          .from("collaboration_requests")
          .update({ status: "accepted" })
          .eq("id", req.id);

        // Add member to project_members
        if (req.project_id) {
          await supabase.from("project_members").insert({
            project_id: req.project_id,
            user_id: user.id,
            role: req.proposed_role || "editor",
            status: "accepted",
          });

          // Notify sender
          await supabase.from("notifications").insert({
            user_id: req.sender_id,
            type: "invite",
            title: "Collaboration Accepted 🎉",
            message: `Your request to collaborate as ${req.proposed_role || "editor"} was accepted!`,
            link: `/dashboard/${req.project_id}`,
            project_id: req.project_id,
            read: false,
          });
        }
      }

      // 2. Also check project_members table for pending email/user invites
      if (targetProjectId) {
        // Ensure project has is_team = true so collaborator isn't redirected
        await supabase
          .from("projects")
          .update({ is_team: true })
          .eq("id", targetProjectId);

        const { data: members } = await supabase
          .from("project_members")
          .select("id")
          .eq("project_id", targetProjectId)
          .or(`user_id.eq.${user.id},invited_email.eq.${user.email?.toLowerCase()}`);

        if (members && members.length > 0) {
          await supabase
            .from("project_members")
            .update({
              status: "accepted",
              user_id: user.id,
            })
            .eq("id", members[0].id);
        }

        // Notify Project Owner if different from user
        const { data: project } = await supabase
          .from("projects")
          .select("owner_id, title")
          .eq("id", targetProjectId)
          .single();

        if (project?.owner_id && project.owner_id !== user.id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

          const name = profile?.username || user.email;

          await supabase.from("notifications").insert({
            user_id: project.owner_id,
            type: "invite",
            title: "Invitation Accepted 🎉",
            message: `${name} accepted your invitation to join "${project.title}"`,
            link: `/dashboard/${targetProjectId}/team`,
            project_id: targetProjectId,
            read: false,
          });
        }
      }

      await markAsRead(notification.id);
      setShowDropdown(false);

      if (targetProjectId) {
        router.push(`/dashboard/${targetProjectId}`);
      } else if (notification.link) {
        router.push(notification.link);
      }
    } catch (err: any) {
      console.error("Error accepting invite:", err);
      if (notification.link) router.push(notification.link);
    }
  };

  const handleDeclineInvite = async (notification: Notification) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Decline collab requests
      await supabase
        .from("collaboration_requests")
        .update({ status: "declined" })
        .eq("recipient_id", user.id)
        .eq("status", "pending");

      // Decline project members
      if (notification.project_id) {
        const { data: members } = await supabase
          .from("project_members")
          .select("id")
          .eq("project_id", notification.project_id)
          .or(`user_id.eq.${user.id},invited_email.eq.${user.email?.toLowerCase()}`);

        if (members && members.length > 0) {
          await supabase
            .from("project_members")
            .update({ status: "rejected" })
            .eq("id", members[0].id);
        }
      }

      await deleteNotification(notification.id);
    } catch (err) {
      console.error("Error declining invite:", err);
    }
  };

  const isPendingAction = (notification: Notification) => {
    const title = notification.title.toLowerCase();
    if (title.includes("accepted") || title.includes("declined") || title.includes("rejected")) {
      return false;
    }

    return (
      notification.type === "collab_request" ||
      title.includes("collaboration request") ||
      title.includes("project invitation") ||
      title.includes("new invitation")
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    // If it's a pending invite requiring action, clicking the card body shouldn't trigger navigation
    if (isPendingAction(notification)) return;

    if (!notification.read) {
      markAsRead(notification.id);
    }

    const destination = notification.link || (notification.project_id ? `/dashboard/${notification.project_id}` : null);
    if (destination) {
      router.push(destination);
      setShowDropdown(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invite":
        return "👥";
      case "comment":
        return "💬";
      case "assignment":
        return "📝";
      case "mention":
        return "🔔";
      default:
        return "📢";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / Mobile Modal */}
      {showDropdown && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-md bg-white dark:bg-[#181724] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl z-[100] max-h-[80vh] sm:max-h-[550px] flex flex-col overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1.5 rounded-xl text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 dark:text-gray-400 text-sm">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-gray-400 text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-all ${
                      notification.read
                        ? "bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                        : "bg-purple-500/10 hover:bg-purple-500/15"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="text-xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        {isPendingAction(notification) && (
                          <div className="flex items-center gap-2 my-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleAcceptInvite(notification)}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Request</span>
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(notification)}
                              className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-red-500/20 text-slate-700 dark:text-gray-300 hover:text-red-500 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(notification.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1.5 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200/80 dark:border-white/[0.08] text-center bg-slate-50/50 dark:bg-white/[0.02]">
              <button
                onClick={() => {
                  setShowDropdown(false);
                }}
                className="text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}