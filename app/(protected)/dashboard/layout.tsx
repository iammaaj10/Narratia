"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfileAvatar from "./components/ProfileAvatar";
import { BookOpen, PlusCircle, LogOut, Sparkles } from "lucide-react";

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
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      // 1️⃣ Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      // 2️⃣ Fetch profile (RLS-safe)
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle(); // IMPORTANT

      if (error) {
        console.error("Profile fetch error:", {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        return;
      }

      // 3️⃣ Cache-busted avatar (prevents stale image)
      const avatarUrl = data?.avatar_url
        ? `${data.avatar_url}?t=${Date.now()}`
        : null;

      setProfile({
        id: user.id,
        username: data?.username ?? "Writer",
        avatar_url: avatarUrl,
        email: user.email ?? "",
      });
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BookOpen,
      path: "/dashboard",
    },
    {
      id: "new-project",
      label: "Create Story",
      icon: PlusCircle,
      path: "/dashboard/new-project",
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/30 backdrop-blur-xl flex flex-col">
        {/* Logo */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
              Narratia
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-purple-500/20 text-white border border-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          {profile && (
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  Welcome back, {profile.username}
                </h2>
                <p className="text-gray-400 text-sm">{profile.email}</p>
              </div>

              <ProfileAvatar
                profile={profile}
                onAvatarUpdate={(url) =>
                  setProfile((p) => p && { ...p, avatar_url: url })
                }
              />
            </div>
          )}

          {/* Page Content */}
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
