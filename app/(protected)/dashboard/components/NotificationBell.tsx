"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, X, CheckCheck, UserCheck, MessageSquare, ShieldAlert, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Relative time formatter
function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanupSubscription: (() => void) | undefined;

    const initNotifications = async () => {
      const user = await loadNotifications();
      if (user) {
        cleanupSubscription = subscribeToUserNotifications(user.id);
      }
    };

    initNotifications();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (cleanupSubscription) cleanupSubscription();
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("❌ Notifications error:", error);
    } else {
      const items = data || [];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    }

    setLoading(false);
    return user;
  };

  const subscribeToUserNotifications = (userId: string) => {
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setUnreadCount((prev) => Math.max(0, notifications.filter((n) => !n.read).length));
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
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const target = notifications.find((n) => n.id === notificationId);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
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

        await supabase
          .from("collaboration_requests")
          .update({ status: "accepted" })
          .eq("id", req.id);

        if (req.project_id) {
          await supabase.from("project_members").insert({
            project_id: req.project_id,
            user_id: user.id,
            role: req.proposed_role || "editor",
            status: "accepted",
          });

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

      // 2. Check project_members table
      if (targetProjectId) {
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

      await supabase
        .from("collaboration_requests")
        .update({ status: "declined" })
        .eq("recipient_id", user.id)
        .eq("status", "pending");

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

  const isPendingInvite = (notification: Notification) => {
    if (notification.read) return false;
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
    if (isPendingInvite(notification)) return;

    if (!notification.read) {
      markAsRead(notification.id);
    }

    const destination = notification.link || (notification.project_id ? `/dashboard/${notification.project_id}` : null);
    if (destination) {
      router.push(destination);
      setShowDropdown(false);
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "invite":
      case "collab_request":
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case "assignment":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "mention":
        return <ShieldAlert className="w-4 h-4 text-pink-400" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus:outline-none cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown / Mobile Modal */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-md bg-white dark:bg-[#16151f] border border-slate-200/80 dark:border-white/[0.08] rounded-2xl shadow-2xl z-[100] max-h-[80vh] sm:max-h-[520px] flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/90 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white outfit">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
                  title="Close Notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-slate-500 dark:text-gray-400 text-xs font-medium">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-2 border border-purple-500/20">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-slate-800 dark:text-gray-200 text-sm font-bold">You're all caught up!</p>
                  <p className="text-slate-500 dark:text-gray-400 text-xs">No new notifications right now.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3.5 transition-colors group relative ${
                        notification.read
                          ? "bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                          : "bg-purple-500/5 dark:bg-purple-500/10 hover:bg-purple-500/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon Badge */}
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {getNotificationBadge(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 shrink-0">
                              {formatRelativeTime(notification.created_at)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-gray-300 mb-1.5 line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>

                          {/* Accept / Decline Invite Action Buttons */}
                          {isPendingInvite(notification) && (
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
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 dark:text-gray-500 hover:text-red-500 transition-all flex-shrink-0"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}