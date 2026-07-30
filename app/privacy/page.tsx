"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

export default function PrivacyPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
      }`}>
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia Privacy</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/terms" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Terms of Service</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <article className={`p-8 md:p-12 rounded-3xl border backdrop-blur-xl space-y-8 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
        }`}>
          <header className="border-b border-slate-100 dark:border-white/10 pb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">Data Protection</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight outfit mt-2">Privacy Policy</h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: July 30, 2026</p>
          </header>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">1. Information We Collect</h2>
            <p className="text-slate-400">
              We collect account authentication details (email, username) and manuscript content you explicitly save to your project workspaces to enable cloud synchronization and AI story features.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">2. Data Encryption & Security</h2>
            <p className="text-slate-400">
              All manuscript data is secured in Supabase PostgreSQL databases with encrypted connection streams (SSL/TLS) and strict Row-Level Security (RLS) policies preventing unauthorized access.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">3. No AI Training on User Stories</h2>
            <p className="text-slate-400">
              Your creative writing, character details, and story world lore are never sold to third parties or used to train open LLM models.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
