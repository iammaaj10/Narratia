"use client";

import { supabase } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Mail, Lock, User, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password || !username) {
      alert("All fields are required");
      return;
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {


      // Step 1: Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim()
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) {
        console.error("❌ Signup error:", signUpError);
        alert(`Failed to create account: ${signUpError.message}`);
        setLoading(false);
        return;
      }



      // Step 2: Check if profile was created by trigger
      if (signUpData.user) {


        // Wait a moment for the trigger to fire
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("id", signUpData.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("⚠️ Could not verify profile:", profileError);
        } else if (profile) {

        } else {
          console.warn("⚠️ Profile not found, creating manually...");

          // Manually create profile if trigger didn't work
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: signUpData.user.id,
              username: username.trim(),
              avatar_url: null,
            });

          if (insertError) {
            console.error("❌ Failed to create profile:", insertError);
          } else {

          }
        }
      }

      setLoading(false);

      // Show success message
      alert(
        "Account created successfully! " +
        (signUpData.user?.email_confirmed_at
          ? "You can now log in."
          : "Please check your email to verify your account before logging in.")
      );

      // Redirect to login
      router.push("/login");

    } catch (err) {
      console.error("❌ Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f0f3f9] dark:bg-[#05050A] transition-colors duration-300">
      {/* Left Pane - Visual Storytelling */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-white dark:bg-[#0A0A10] border-r border-slate-200 dark:border-white/5 transition-colors duration-300">
        {/* Subtle abstract gradient */}
        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent blur-3xl rounded-full" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
           <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="w-10 h-10 bg-slate-900 text-white dark:bg-white dark:text-black rounded-xl flex items-center justify-center font-bold text-xl outfit shadow-lg">
                N
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight outfit">
                Narratia
              </span>
           </Link>

           <div className="max-w-md">
             <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 outfit leading-[1.2]">
               Your story deserves <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:to-purple-400">the perfect canvas.</span>
             </h2>
             <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
               Join thousands of writers who have found their voice on the most advanced storytelling platform ever built.
             </p>
           </div>
           
           <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>© 2026 Narratia Inc.</span>
           </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex items-center justify-center relative">
         <div className="w-full max-w-[400px] px-6 py-12">
            <div className="lg:hidden flex items-center gap-2 mb-12">
              <div className="w-8 h-8 bg-slate-900 text-white dark:bg-white dark:text-black rounded flex items-center justify-center font-bold text-lg outfit">N</div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight outfit">Narratia</span>
            </div>
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 outfit">
                Create an account
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter your details to get started.
              </p>
            </div>
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                <input
                  type="text"
                  placeholder="writer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm shadow-sm dark:shadow-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm shadow-sm dark:shadow-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm shadow-sm dark:shadow-none"
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black rounded-xl py-3.5 font-semibold text-sm transition-colors mt-6 flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
              </button>
            </form>
            
            <div className="mt-8 text-center space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-purple-600 dark:text-white hover:underline transition-colors">
                  Sign in
                </Link>
              </p>
              <p className="text-[11px] text-slate-500">
                By creating an account, you agree to our{" "}
                <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline">Terms</Link>
                {" "}and{" "}
                <Link href="#" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline">Privacy</Link>
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}