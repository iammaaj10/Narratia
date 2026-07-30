"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

export default function TermsPage() {
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
            <span className="font-bold text-xl tracking-tight outfit">Narratia Terms</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/privacy" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Privacy Policy</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <article className={`p-8 md:p-12 rounded-3xl border backdrop-blur-xl space-y-8 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
        }`}>
          <header className="border-b border-slate-100 dark:border-white/10 pb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">Legal Agreement</span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight outfit mt-2">Terms of Service</h1>
            <p className="text-xs text-slate-400 mt-2 font-mono">Last Updated: July 30, 2026</p>
          </header>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">1. Acceptance of Terms</h2>
            <p className="text-slate-400">
              By creating an account or accessing Narratia, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">2. Story Content & Ownership</h2>
            <p className="text-slate-400">
              You retain 100% full intellectual property rights and ownership over all original text, manuscripts, world lore, outlines, and character details created or uploaded to Narratia. Narratia does not claim any ownership over your creative works.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">3. AI Service Usage & Privacy</h2>
            <p className="text-slate-400">
              Narratia utilizes Google Gemini API integrations for text assistance and RAG lore retrieval. Your private manuscripts are not used to train public machine learning models.
            </p>
          </section>

          <section className="space-y-4 text-sm leading-relaxed">
            <h2 className="text-lg font-bold outfit">4. Account Security</h2>
            <p className="text-slate-400">
              You are responsible for maintaining the confidentiality of your login credentials. You must notify Narratia support immediately if you suspect unauthorized access to your account.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
