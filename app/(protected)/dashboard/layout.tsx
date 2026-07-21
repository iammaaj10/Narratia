"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfileAvatar from "./components/ProfileAvatar";
import IncomingInvites from "./components/IncomingInvites";
import NotificationBell from "./components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import { Home, BarChart3, Menu, X } from "lucide-react";
import { BookOpen, PlusCircle, LogOut, Sparkles } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("❌ No authenticated user");
          router.push("/login");
          return;
        }

        console.log("✅ User authenticated:", user.id);

        // Try to get profile
        let { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!data) {
          console.log("⚠️ No profile found, creating one...");

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
            // Even if insert fails, show basic profile
            data = {
              username: newUsername,
              avatar_url: null,
            };
          } else {
            console.log("✅ Profile created successfully");
            data = newProfile;
          }
        }

        console.log("✅ Profile loaded:", data);

        // Set profile state
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
    {
      id: "new-project",
      label: "Create Story",
      icon: PlusCircle,
      path: "/dashboard/new-project",
    },
    {
      id: "stats",
      label: "Statistics",
      icon: BarChart3,
      path: "/dashboard/stats",
    },
  ];

  const handleNavigation = (path: string, id: string) => {
    setActiveTab(id);
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#02020a]">
        <div className="text-center px-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-400">Loading your space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#02020a] selection:bg-purple-500/30 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`
        fixed lg:sticky top-0 lg:top-6 inset-y-0 left-0 z-50
        w-64 lg:w-56 lg:h-[calc(100vh-3rem)]
        lg:ml-6 lg:mr-4
        bg-[#0a0a1a]/80 backdrop-blur-2xl border-r lg:border border-white/10 lg:rounded-[2rem]
        transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col shadow-2xl
      `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center justify-between border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
              Narratia
            </h1>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden lg:flex p-8 items-center gap-3 group cursor-pointer border-b border-white/5" onClick={() => router.push("/")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all group-hover:scale-105">
            <span className="text-white font-bold text-base">N</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-300 group-hover:to-purple-300 transition-all">
            Narratia
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 lg:p-5 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.id)}
                className="w-full relative group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-left outline-none"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/20 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 flex items-center gap-3 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110 text-purple-400" : "group-hover:scale-110"}`}
                  />
                  <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 lg:p-5 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group outline-none"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2.5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 border border-white/10"
          >
            <Menu className="w-5 h-5" />
          </button>
          {profile && (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ProfileAvatar
                profile={profile}
                onAvatarUpdate={(url) => setProfile((p) => p && { ...p, avatar_url: url })}
              />
            </div>
          )}
        </div>

        <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-6 lg:pt-0 flex flex-col gap-2">
          {profile && (
            <div className="space-y-2 relative z-50">
              {/* Desktop Header */}
              <div className="hidden lg:flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{profile.username}</span>
                  </h2>
                  <span className="text-white/20 text-sm">|</span>
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div className="scale-90 origin-right">
                    <NotificationBell />
                  </div>
                  <div className="h-6 w-[1px] bg-white/10" />
                  <div className="scale-90 origin-right">
                    <ProfileAvatar
                      profile={profile}
                      onAvatarUpdate={(url) => setProfile((p) => p && { ...p, avatar_url: url })}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Header Additions */}
              <div className="lg:hidden space-y-2">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{profile.username}</span>
                  </h2>
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <NotificationBell />
                </div>
              </div>
              
              <IncomingInvites />
            </div>
          )}

          {/* Page Content Container */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 bg-[#0a0a1a]/60 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col"
          >
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5 pointer-events-none" />
            <div className="flex-1 relative z-10 p-5 sm:p-6 lg:p-6">
              {children}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
