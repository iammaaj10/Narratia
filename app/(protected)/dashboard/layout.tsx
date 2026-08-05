"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfileAvatar from "./components/ProfileAvatar";
import IncomingInvites from "./components/IncomingInvites";
import NotificationBell from "./components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { BarChart3, Menu, X, BookOpen, PlusCircle, LogOut, Compass, MessageSquare, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  email: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setUnauthenticated(true);
          setLoading(false);
          return;
        }

        let { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (!data) {
          const newUsername = user.email?.split("@")[0] || "Writer";

          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              username: newUsername,
              avatar_url: null,
            })
            .select("username, avatar_url")
            .single();

          if (insertError) {
            console.error("❌ Failed to create profile:", insertError);
            data = { username: newUsername, avatar_url: null };
          } else {
            data = newProfile;
          }
        }

        const avatarUrl = data?.avatar_url
          ? `${data.avatar_url}?t=${Date.now()}`
          : null;

        setProfile({
          id: user.id,
          username: data?.username ?? user.email?.split("@")[0] ?? "Writer",
          avatar_url: avatarUrl,
          email: user.email ?? "",
        });
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BookOpen, path: "/dashboard" },
    { id: "new-project", label: "Create Story", icon: PlusCircle, path: "/dashboard/new-project" },
    { id: "community", label: "Explore Community", icon: Compass, path: "/community" },
    { id: "messages", label: "Messages", icon: MessageSquare, path: "/dashboard/messages" },
    { id: "stats", label: "Statistics", icon: BarChart3, path: "/dashboard/stats" },
  ];

  // Derive active tab from the current URL instead of state
  const getActiveId = () => {
    if (pathname === "/dashboard") return "dashboard";
    if (pathname.startsWith("/dashboard/new-project")) return "new-project";
    if (pathname.startsWith("/community") || pathname.startsWith("/creator")) return "community";
    if (pathname.startsWith("/dashboard/messages")) return "messages";
    if (pathname.startsWith("/dashboard/stats")) return "stats";
    return "";
  };
  const activeTab = getActiveId();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-[#111113]">
        <div className="text-center px-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <BookOpen className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-slate-600 dark:text-gray-400">Loading your space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f3f9] dark:bg-[#111113] selection:bg-purple-500/30 selection:text-white transition-colors duration-300">

      {/* ── Background depth layer (dark mode only) ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Light mode glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-purple-500/10 blur-[130px] opacity-40 dark:opacity-0" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[55%] rounded-full bg-indigo-500/10 blur-[130px] opacity-40 dark:opacity-0" />
        {/* Dark mode: clean radial depth — no color, just subtle lightness in center */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, #1e1c28 0%, transparent 70%)",
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          TOP NAVIGATION BAR
      ══════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full">
        {/* Glass backdrop */}
        <div className="absolute inset-0 bg-white/80 dark:bg-[#1c1b20]/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.05]" />

        <div className="relative flex items-center h-14 px-4 sm:px-6 gap-4">

          {/* ── Logo ── */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 group flex-shrink-0 outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:shadow-purple-500/50 group-hover:scale-105 transition-all">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors hidden sm:block">
              Narratia
            </span>
          </button>

          {/* ── Divider ── */}
          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block flex-shrink-0" />

          {/* ── Desktop Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 outline-none group ${isActive
                      ? "text-purple-700 dark:text-white"
                      : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5"
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="topNavIndicator"
                      className="absolute inset-0 bg-purple-100/90 dark:bg-purple-500/15 border border-purple-200/80 dark:border-purple-500/20 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 transition-transform duration-200 ${isActive ? "text-purple-600 dark:text-purple-400 scale-110" : "group-hover:scale-110"}`} />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Right side: actions ── */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">

            {/* Greeting — desktop only */}
            {profile && (
              <span className="hidden lg:block text-sm text-slate-500 dark:text-gray-400 mr-1">
                Hi, <span className="font-semibold text-slate-700 dark:text-gray-200">{profile.username}</span>
              </span>
            )}

            <ThemeToggle />

            {profile && (
              <>
                <button
                  onClick={() => router.push(`/creator/${profile.username}`)}
                  title="View Public Profile"
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all outline-none"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden xl:block">My Profile</span>
                </button>
                <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
                <NotificationBell />
                <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
                <ProfileAvatar
                  profile={profile}
                  onAvatarUpdate={(url) => setProfile((p) => p && { ...p, avatar_url: url })}
                />
              </>
            )}

            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />

            {/* Logout — desktop */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 outline-none"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:block">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-gray-400 outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════
          MOBILE SLIDE-DOWN MENU
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-down panel */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="fixed top-14 left-0 right-0 z-50 mx-3 mt-2 bg-white dark:bg-[#1f1e24] rounded-2xl border border-slate-200/80 dark:border-white/[0.07] shadow-2xl overflow-hidden"
            >
              <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
                {profile && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{profile.username}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{profile.email}</p>
                  </div>
                )}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 dark:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="p-2 space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.path); setIsMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${isActive
                          ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-white border border-purple-200/80 dark:border-purple-500/20"
                          : "text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-white/5"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-purple-600 dark:text-purple-400" : ""}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="p-2 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          MAIN CONTENT — full width, full height
      ══════════════════════════════════════ */}
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-5 flex flex-col gap-3">

          {/* Incoming invites banner (shown on all dashboard pages) */}
          {profile && (
            <div className="relative z-20">
              <IncomingInvites />
            </div>
          )}

          {/* Page content — full-width card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 bg-white/90 dark:bg-[#1a1921] backdrop-blur-2xl dark:backdrop-blur-none rounded-2xl border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden relative flex flex-col"
          >
            {/* Subtle inner ring */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-slate-200/60 dark:ring-0 pointer-events-none" />
            <div className="flex-1 relative z-10 p-5 sm:p-6">
              {children}
            </div>
          </motion.div>

        </div>
      </main>

      {/* ══════════════════════════════════════
          AUTHENTICATION REQUIRED POPUP MODAL
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {unauthenticated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-[#1a1921] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-5"
            >
              {/* Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
                🔒
              </div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold outfit text-slate-900 dark:text-white">
                  Authentication Required
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Your session has expired or you are not signed in. Log in to access your Narratia author dashboard.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/25 outfit"
                >
                  Log In to Continue
                </button>

                <button
                  onClick={() => router.push("/community")}
                  className="w-full py-2.5 px-5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all outfit"
                >
                  Explore Community
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
