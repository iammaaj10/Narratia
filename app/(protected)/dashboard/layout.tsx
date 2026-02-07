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
  const [loading, setLoading] = useState(true);
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
          .maybeSingle(); // Use maybeSingle instead of single to avoid error on no rows

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
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 animate-pulse mx-auto mb-4" />
          <p className="text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 backdrop-blur-xl bg-black/20 flex flex-col">
        {/* Logo */}
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
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
                className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white shadow-lg shadow-purple-500/10 border border-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-105 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {profile && (
            <div className="mb-12 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                  Welcome back, {profile.username}
                </h2>
                <p className="text-gray-400 text-sm">{profile.email}</p>
              </div>

              <ProfileAvatar
                profile={profile}
                onAvatarUpdate={(url) => {
                  console.log("🔄 Updating avatar URL:", url);
                  setProfile((p) => p && { ...p, avatar_url: url });
                }}
              />
            </div>
          )}

          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}