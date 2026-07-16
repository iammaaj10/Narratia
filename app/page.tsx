"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// ─────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>;
const Sparkles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M5.2 5.2l13.6 13.6M5.2 18.8L18.8 5.2" /></svg>;
const Users = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const Book = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const Zap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;

// ─────────────────────────────────────────────────────────────────
// COUNTER
// ─────────────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const dur = 2000, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setCount(Math.floor(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, started]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navSolid = scrollY > 20;

  // GitHub-style scroll-linked timeline line
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden" style={{ background: "#0d1117", color: "#c9d1d9" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap");

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: #05050A;
        }
        
        h1, h2, h3, h4, h5, h6, .outfit {
          font-family: "Outfit", sans-serif;
        }

        .mono { font-family: "JetBrains Mono", monospace; }

        ::selection { background: rgba(124,58,237,0.4); color: #fff; }

        /* Premium gradient text */
        .grad-text {
          background: linear-gradient(to right, #818cf8, #c084fc, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .grad-text-2 {
          background: linear-gradient(to right, #60a5fa, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Ambient glow for the timeline */
        .timeline-glow {
          box-shadow: 0 0 20px 4px rgba(124,58,237,0.5), 0 0 40px rgba(236,72,153,0.3);
        }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea);
          color: #ffffff;
          font-family: "Outfit", sans-serif;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 8px;
          border: none;
          box-shadow: 0 4px 14px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.2); }

        .btn-secondary {
          background: rgba(255,255,255,0.03);
          color: #e2e8f0;
          font-family: "Outfit", sans-serif;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); transform: translateY(-2px); color: #fff; }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #05050A; }
        ::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 4px; border: 1px solid #05050A; }
        ::-webkit-scrollbar-thumb:hover { background: #312e81; }

        /* Grid background */
        .bg-grid {
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          background-position: center center;
        }

        /* Editor window */
        .editor-window {
          background: #0B0914;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,58,237,0.1);
          overflow: hidden;
        }
        .editor-header {
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 14px 20px;
          display: flex; gap: 8px; align-items: center;
        }
        .dot { width: 12px; height: 12px; border-radius: 50%; }
        .dot-r { background: #ff5f56; border: 1px solid #e0443e; }
        .dot-y { background: #ffbd2e; border: 1px solid #dea123; }
        .dot-g { background: #27c93f; border: 1px solid #1aab29; }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div className="absolute inset-0 bg-grid z-0 opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[-20%] w-[600px] h-[600px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none" />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navSolid ? "rgba(5, 5, 10, 0.85)" : "transparent",
          backdropFilter: navSolid ? "blur(12px)" : "none",
          borderBottom: navSolid ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent"
        }}>
        <div className="max-w-[1280px] mx-auto px-6 h-[76px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group text-white hover:text-purple-300 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all outfit">N</div>
            <span className="font-bold text-2xl tracking-tight outfit">Narratia</span>
          </a>
          <div className="flex items-center gap-5">
            <button onClick={() => router.push("/login")} className="text-sm font-semibold text-slate-300 hover:text-white px-2 transition-colors outfit">Sign in</button>
            <button onClick={() => router.push("/register")} className="btn-primary py-2.5 px-5 text-sm border-0 shadow-lg">Sign up</button>
          </div>
        </div>
      </nav>

      {/* ── MAIN TIMELINE (LEFT GUTTER) ── */}
      <div className="hidden lg:block absolute top-[100px] bottom-0 left-[max(0px,calc(50%-640px+40px))] w-[2px] z-10" style={{ background: "rgba(255,255,255,0.06)", transform: "translateX(-50%)" }}>
        <motion.div className="w-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 origin-top timeline-glow"
          style={{ scaleY, height: "100%" }} />
      </div>

      <main className="relative z-10 pt-[160px]">
        {/* ── HERO SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] pb-24 relative">
          {/* Timeline node */}
          <div className="hidden lg:block absolute left-[40px] top-[24px] w-5 h-5 rounded-full border-[3px] border-[#05050A] bg-indigo-500 timeline-glow transform -translate-x-1/2 z-20" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-6xl lg:text-[5rem] font-extrabold leading-[1.05] tracking-tight text-white mb-6 max-w-4xl outfit">
              Let's build from here, <br className="hidden sm:block" />
              <span className="grad-text">word by word.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 max-w-2xl font-normal leading-relaxed mb-10">
              The complete developer-grade platform for writers. AI-assisted drafting, real-time team collaboration, and seamless multi-format publishing.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
              <button onClick={() => router.push("/register")} className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center">
                Start writing
                <ChevronRight />
              </button>
              <button onClick={() => router.push("/login")} className="btn-secondary text-base px-8 py-4 w-full sm:w-auto justify-center">
                Login to Narratia
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 sm:gap-16 border-y border-white/5 py-8 mb-8 max-w-3xl">
              <div>
                <div className="text-4xl font-bold text-white mb-1 outfit"><Counter target={2} suffix="M+" /></div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider outfit">Stories Created</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1 outfit"><Counter target={100} suffix="K+" /></div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider outfit">Active Writers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-1 outfit"><Counter target={99} suffix=".9%" /></div>
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider outfit">Reliability</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── EDITOR PREVIEW SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className="hidden lg:block absolute left-[40px] top-[100px] w-5 h-5 rounded-full border-[3px] border-[#05050A] bg-purple-500 timeline-glow transform -translate-x-1/2 z-20" />

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
            className="editor-window relative">
            <div className="editor-header">
              <div className="dot dot-r" />
              <div className="dot dot-y" />
              <div className="dot dot-g" />
              <div className="ml-4 px-3 py-1 bg-black/40 border border-white/5 rounded-md text-xs font-medium text-slate-400 flex items-center gap-2 mono">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586a.25.25 0 0 1 .177.073l2.414 2.414a.25.25 0 0 1 .073.177v11.586A1.75 1.75 0 0 1 11.25 16h-7.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25V3.5h-2.25a.75.75 0 0 1-.75-.75V.5Z" /></svg>
                chapter-01.txt
              </div>
            </div>
            <div className="p-8 sm:p-12 min-h-[400px] relative bg-[#05050A]">
              {/* Line numbers (fake) */}
              <div className="absolute left-0 top-0 bottom-0 w-[50px] bg-[#0B0914] border-r border-white/5 flex flex-col items-center py-12 text-slate-600 mono text-xs leading-8 select-none">
                {Array.from({ length: 10 }).map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>

              <div className="pl-6 max-w-3xl">
                <h2 className="text-3xl font-bold text-white mb-6 outfit">The Awakening</h2>
                <div className="space-y-4">
                  <p className="text-slate-300 text-lg leading-relaxed">The city of neon and chrome hummed beneath the heavy rain. It was a rhythmic, pulsing sound that vibrated through the floorboards of Kael's tiny apartment.</p>
                  <p className="text-slate-300 text-lg leading-relaxed">He stared at the glowing terminal. The cursor blinked back at him, almost mockingly. The code was compiled, the narrative locked in. All he had to do was execute.</p>

                  {/* AI Suggestion highlight */}
                  <div className="relative mt-6 border-l-2 border-purple-500 pl-4 py-2 bg-purple-500/10 rounded-r-md">
                    <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.6)]">
                      <Sparkles />
                    </div>
                    <p className="text-purple-300 font-medium text-lg leading-relaxed italic">
                      "Or at least, that's what he thought before the screen flickered to crimson."
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded shadow-sm transition">Accept</button>
                      <button className="px-3 py-1 bg-transparent hover:bg-white/5 text-[#8b949e] border border-[#30363d] text-xs font-semibold rounded transition">Reject</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-24 relative">
          <div className="hidden lg:block absolute left-[40px] top-[140px] w-5 h-5 rounded-full border-[3px] border-[#05050A] bg-pink-500 timeline-glow transform -translate-x-1/2 z-20" />

          <div className="mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 outfit">
              Accelerate your <span className="grad-text-2">workflow.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl">
              Write, edit, and collaborate with tools designed to remove friction from your creative process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="bg-[#0B0914] border border-white/5 rounded-[16px] p-8 hover:border-indigo-500/30 transition-colors duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-500/20 transition-all" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 mb-6">
                <Sparkles />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 outfit">AI Co-Pilot</h3>
              <p className="text-slate-400 leading-relaxed">
                Get context-aware suggestions, generate plot outlines, and overcome writer's block with our specialized storytelling AI model integrated directly into the editor.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#0B0914] border border-white/5 rounded-[16px] p-8 hover:border-purple-500/30 transition-colors duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-purple-500/20 transition-all" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-6">
                <Users />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 outfit">Real-time Collaboration</h3>
              <p className="text-slate-400 leading-relaxed">
                Work seamlessly with co-writers or editors. See multiple cursors, leave inline comments, and track every revision in real-time, just like code.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#0B0914] border border-white/5 rounded-[16px] p-8 hover:border-pink-500/30 transition-colors duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-pink-500/20 transition-all" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-pink-400 mb-6">
                <Zap />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 outfit">Story Arcs & Logic</h3>
              <p className="text-slate-400 leading-relaxed">
                Map out character relationships, track timelines, and build structural outlines. Keep your world logic consistent across hundreds of chapters.
              </p>
            </motion.div>

            {/* Card 4 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[#0B0914] border border-white/5 rounded-[16px] p-8 hover:border-orange-500/30 transition-colors duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:bg-orange-500/20 transition-all" />
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-orange-400 mb-6">
                <Book />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 outfit">Export to Anything</h3>
              <p className="text-slate-400 leading-relaxed">
                Compile your manuscript with one click. Generate print-ready PDFs, standard screenplay formats, EPUBs, or push directly to web platforms.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-24 relative">
          <div className="hidden lg:block absolute left-[40px] top-[140px] w-5 h-5 rounded-full border-[3px] border-[#05050A] bg-indigo-400 timeline-glow transform -translate-x-1/2 z-20" />

          <div className="bg-[#0B0914] border border-white/5 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-[80px]" />

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 outfit">Ready to write?</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Join the largest platform for modern writers. Start your free project today.
              </p>
              <button onClick={() => router.push("/register")} className="btn-primary text-lg px-10 py-5 w-full sm:w-auto">
                Start creating for free
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-12 mt-12 border-t border-[#30363d] text-[#8b949e] text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#30363d] flex items-center justify-center font-bold text-white text-xs">N</div>
              <span>© 2026 Narratia Inc.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className="hover:text-blue-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Docs</a>
              <a href="#" className="hover:text-blue-400 transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-2">
              Developed by <span className="text-white font-medium">Maaj Bhadgaonkar</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}