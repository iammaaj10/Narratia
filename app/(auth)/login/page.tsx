"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-[#05050A]">
      {/* Left Pane - Visual Storytelling */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0A0A10] border-r border-white/5">
        {/* Subtle abstract gradient */}
        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl rounded-full" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
           <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center font-bold text-xl outfit">
                N
              </div>
              <span className="text-2xl font-bold text-white tracking-tight outfit">
                Narratia
              </span>
           </Link>

           <div className="max-w-md">
             <h2 className="text-4xl font-bold text-white mb-6 outfit leading-[1.2]">
               Your story deserves <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">the perfect canvas.</span>
             </h2>
             <p className="text-lg text-slate-400 leading-relaxed">
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
              <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center font-bold text-lg outfit">N</div>
              <span className="text-xl font-bold text-white tracking-tight outfit">Narratia</span>
            </div>
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2 outfit">
                Welcome back
              </h1>
              <p className="text-slate-400 text-sm">
                Enter your credentials to access your workspace.
              </p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white hover:bg-slate-200 text-black rounded-xl py-3.5 font-semibold text-sm transition-colors mt-6 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-white hover:text-indigo-300 transition-colors">
                  Create one now
                </Link>
              </p>
            </div>
         </div>
      </div>
    </div>
  );
}