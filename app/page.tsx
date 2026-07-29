"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

// ─────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────
const ChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>;
const Sparkles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 12h18M5.2 5.2l13.6 13.6M5.2 18.8L18.8 5.2" /></svg>;
const Users = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const Book = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const Zap = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const Clock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const Download = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
const BarChart = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const MessageSquare = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const OutlineIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const ScreenplayIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>;
const SprintIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const CharacterIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

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
// FEATURE CARD WITH SPOTLIGHT EFFECT
// ─────────────────────────────────────────────────────────────────
function FeatureCard({ children, delay, glowColor }: { children: React.ReactNode, delay: number, glowColor: string }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay, type: "spring", bounce: 0.3 }}
      className={`group relative rounded-[20px] p-8 overflow-hidden cursor-default transition-all duration-300 ${
        isLight
          ? "bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.04)] hover:border-indigo-300/80 hover:shadow-xl"
          : "bg-[#0B0914] border border-white/5 hover:border-white/10 shadow-2xl"
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Cursor Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[20px] opacity-0 transition duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              ${isLight ? glowColor.replace('0.15', '0.08') : glowColor},
              transparent 80%
            )
          `,
        }}
      />
      {/* Static ambient corner glow */}
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-all duration-700 z-0"
        style={{ backgroundColor: glowColor.replace('0.15', isLight ? '0.3' : '1') }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function Page() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navSolid = scrollY > 20;

  // Scroll-linked timeline line
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden transition-colors duration-500"
      style={{
        background: isLight
          ? "linear-gradient(180deg, #f0f3f9 0%, #e6ebf5 50%, #f0f3f9 100%)"
          : "#0d1117",
        color: isLight ? "#0f172a" : "#c9d1d9"
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        @import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap");

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: ${isLight ? "#f0f3f9" : "#05050A"};
          color: ${isLight ? "#0f172a" : "#c9d1d9"};
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        
        h1, h2, h3, h4, h5, h6, .outfit {
          font-family: "Outfit", sans-serif;
        }

        .mono { font-family: "JetBrains Mono", monospace; }

        ::selection {
          background: ${isLight ? "rgba(99,102,241,0.25)" : "rgba(124,58,237,0.4)"};
          color: ${isLight ? "#1e1b4b" : "#fff"};
        }

        /* Premium gradient text */
        .grad-text {
          background: ${isLight ? "linear-gradient(to right, #4338ca, #6d28d9, #db2777)" : "linear-gradient(to right, #818cf8, #c084fc, #f472b6)"};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .grad-text-2 {
          background: ${isLight ? "linear-gradient(to right, #2563eb, #7c3aed)" : "linear-gradient(to right, #60a5fa, #a78bfa)"};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Ambient glow for the timeline */
        .timeline-glow {
          box-shadow: ${isLight ? "0 0 15px 2px rgba(99,102,241,0.3)" : "0 0 20px 4px rgba(124,58,237,0.5), 0 0 40px rgba(236,72,153,0.3)"};
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
          box-shadow: ${isLight ? "0 4px 14px rgba(99,102,241,0.35)" : "0 4px 14px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"};
          transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: ${isLight ? "0 6px 20px rgba(99,102,241,0.45)" : "0 6px 20px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.2)"};
        }

        .btn-secondary {
          background: ${isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255,255,255,0.03)"};
          color: ${isLight ? "#1e293b" : "#e2e8f0"};
          font-family: "Outfit", sans-serif;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 8px;
          border: 1px solid ${isLight ? "rgba(15, 23, 42, 0.15)" : "rgba(255,255,255,0.1)"};
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-secondary:hover {
          background: ${isLight ? "rgba(15, 23, 42, 0.09)" : "rgba(255,255,255,0.08)"};
          border-color: ${isLight ? "rgba(15, 23, 42, 0.25)" : "rgba(255,255,255,0.2)"};
          transform: translateY(-2px);
          color: ${isLight ? "#0f172a" : "#fff"};
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${isLight ? "#f0f3f9" : "#05050A"}; }
        ::-webkit-scrollbar-thumb {
          background: ${isLight ? "#cbd5e1" : "#1e1b4b"};
          border-radius: 4px;
          border: 1px solid ${isLight ? "#f0f3f9" : "#05050A"};
        }
        ::-webkit-scrollbar-thumb:hover { background: ${isLight ? "#94a3b8" : "#312e81"}; }

        /* Grid background */
        .bg-grid {
          background-image: ${
            isLight
              ? "linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)"
              : "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)"
          };
          background-size: 48px 48px;
          background-position: center center;
        }

        /* Perspective for 3D elements */
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div className={`absolute inset-0 bg-grid z-0 pointer-events-none ${isLight ? "opacity-70" : "opacity-50"}`} />
      <div className={`absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none ${isLight ? "bg-indigo-400/15" : "bg-indigo-900/20"}`} />
      <div className={`absolute top-[40%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none ${isLight ? "bg-purple-400/15" : "bg-purple-900/15"}`} />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navSolid
            ? (isLight ? "rgba(240, 243, 249, 0.85)" : "rgba(5, 5, 10, 0.85)")
            : "transparent",
          backdropFilter: navSolid ? "blur(12px)" : "none",
          borderBottom: navSolid
            ? (isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.06)")
            : "1px solid transparent"
        }}>
        <div className="max-w-[1280px] mx-auto px-6 h-[76px] flex items-center justify-between">
          <a href="/" className={`flex items-center gap-3 group transition-colors ${isLight ? "text-slate-900 hover:text-indigo-600" : "text-white hover:text-purple-300"}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all outfit">N</div>
            <span className="font-bold text-2xl tracking-tight outfit">Narratia</span>
          </a>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => router.push("/login")} className={`text-sm font-semibold px-2 transition-colors outfit ${isLight ? "text-slate-700 hover:text-indigo-600" : "text-slate-300 hover:text-white"}`}>Sign in</button>
            <button onClick={() => router.push("/register")} className="btn-primary py-2.5 px-5 text-sm border-0 shadow-lg">Sign up</button>
          </div>
        </div>
      </nav>

      {/* ── MAIN TIMELINE (LEFT GUTTER) ── */}
      <div className="hidden lg:block absolute top-[100px] bottom-0 left-[max(0px,calc(50%-640px+40px))] w-[2px] z-10" style={{ background: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.06)", transform: "translateX(-50%)" }}>
        <motion.div className="w-full bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500 origin-top timeline-glow"
          style={{ scaleY, height: "100%" }} />
      </div>

      <main className="relative z-10 pt-[104px]">
        {/* ── HERO SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] pb-24 relative">
          {/* Timeline node */}
          <div className={`hidden lg:block absolute left-[40px] top-[14px] w-5 h-5 rounded-full border-[3px] bg-indigo-500 timeline-glow transform -translate-x-1/2 z-20 ${isLight ? "border-[#f0f3f9]" : "border-[#05050A]"}`} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className={`text-3xl sm:text-5xl lg:text-[3.6rem] font-extrabold leading-[1.12] tracking-[-0.03em] mb-6 max-w-2xl outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                <span className="inline-block">Your AI-Powered</span>{" "}
                <br className="hidden sm:block" />
                <span className="grad-text inline-block">Writing Ecosystem.</span>
              </h1>

              <p className={`text-base sm:text-lg max-w-xl font-normal leading-[1.7] mb-8 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                The ultimate platform for modern authors. From auto-extracting <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Story Wikis</span> and <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>RAG-powered lore memory</span> to our immersive <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Zen 3D focus mode</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
                <button onClick={() => router.push("/register")} className="btn-primary text-base px-8 py-3.5 w-full sm:w-auto justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">
                  Start writing free
                  <ChevronRight />
                </button>
                <button onClick={() => router.push("/login")} className="btn-secondary text-base px-8 py-3.5 w-full sm:w-auto justify-center backdrop-blur-md">
                  Login to Narratia
                </button>
              </div>

              {/* Stats */}
              <div className={`flex flex-wrap gap-6 sm:gap-12 border-t pt-8 max-w-2xl ${isLight ? "border-slate-200" : "border-white/5"}`}>
                <div>
                  <div className={`text-3xl font-bold mb-1 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={2} suffix="M+" /></div>
                  <div className={`text-xs font-semibold uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-500"}`}>Stories Created</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold mb-1 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={100} suffix="K+" /></div>
                  <div className={`text-xs font-semibold uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-500"}`}>Active Writers</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold mb-1 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={99} suffix=".9%" /></div>
                  <div className={`text-xs font-semibold uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-500"}`}>Reliability</div>
                </div>
              </div>
            </motion.div>

            {/* ── UNIQUE HOLOGRAPHIC 3D BOOK ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:flex relative w-full h-[600px] items-center justify-center"
              style={{ perspective: 1500 }}
            >
              {/* Overall Book Rotation */}
              <motion.div
                animate={{ rotateX: [20, 25, 20], rotateY: [-25, -15, -25], y: [-15, 15, -15] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-[500px] h-[360px] transform-style-3d"
              >
                {/* Book Glow */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[90px] pointer-events-none ${isLight ? "bg-indigo-500/10" : "bg-indigo-500/15"}`} />

                {/* Left Static Stack */}
                <div className={`absolute top-0 right-1/2 w-[250px] h-full backdrop-blur-md border-y border-l rounded-l-[24px] origin-right flex items-center justify-center overflow-hidden ${
                  isLight ? "bg-white/80 border-slate-200/90 shadow-md" : "bg-[#0B0914]/80 border-white/10"
                }`} style={{ transform: "rotateY(-4deg)" }}>
                  <div className={`w-[150%] h-[150%] absolute border-[2px] rounded-full ${isLight ? "border-indigo-500/10" : "border-indigo-500/5"}`} style={{ transform: "translate(-20%, -10%)" }} />
                  <div className={`w-[100%] h-[100%] absolute border-[1px] rounded-full ${isLight ? "border-purple-500/10" : "border-purple-500/5"}`} style={{ transform: "translate(-10%, 10%)" }} />
                </div>
                <div className={`absolute top-0 right-1/2 w-[250px] h-full border-y border-l rounded-l-[24px] origin-right ${
                  isLight ? "bg-slate-50/90 border-slate-200/60" : "bg-[#05050A]/90 border-white/5"
                }`} style={{ transform: "rotateY(-8deg) translateZ(-5px)" }} />
                <div className={`absolute top-0 right-1/2 w-[250px] h-full border-y border-l rounded-l-[24px] origin-right ${
                  isLight ? "bg-slate-100 border-slate-200/60" : "bg-[#05050A] border-white/5"
                }`} style={{ transform: "rotateY(-12deg) translateZ(-10px)" }} />

                {/* Right Static Stack */}
                <div className={`absolute top-0 left-1/2 w-[250px] h-full backdrop-blur-md border-y border-r rounded-r-[24px] origin-left flex items-center justify-center overflow-hidden ${
                  isLight ? "bg-white/80 border-slate-200/90 shadow-md" : "bg-[#0B0914]/80 border-white/10"
                }`} style={{ transform: "rotateY(4deg)" }}>
                  <div className={`w-[150%] h-[150%] absolute border-[2px] rounded-full ${isLight ? "border-indigo-500/10" : "border-indigo-500/5"}`} style={{ transform: "translate(20%, -10%)" }} />
                </div>
                <div className={`absolute top-0 left-1/2 w-[250px] h-full border-y border-r rounded-r-[24px] origin-left ${
                  isLight ? "bg-slate-50/90 border-slate-200/60" : "bg-[#05050A]/90 border-white/5"
                }`} style={{ transform: "rotateY(8deg) translateZ(-5px)" }} />
                <div className={`absolute top-0 left-1/2 w-[250px] h-full border-y border-r rounded-r-[24px] origin-left ${
                  isLight ? "bg-slate-100 border-slate-200/60" : "bg-[#05050A] border-white/5"
                }`} style={{ transform: "rotateY(12deg) translateZ(-10px)" }} />

                {/* The Spine */}
                <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-6 bg-gradient-to-r blur-[3px] z-10 ${
                  isLight ? "from-transparent via-slate-400/20 to-transparent" : "from-transparent via-white/20 to-transparent"
                }`} />
                <div className="absolute top-[-20px] bottom-[-20px] left-1/2 -translate-x-1/2 w-12 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent rounded-[50%] blur-xl z-10" />

                {/* Animated Flipping Pages (Hologram Data) */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`absolute top-0 left-1/2 w-[250px] h-full origin-left overflow-hidden flex flex-col justify-center p-8 space-y-6 rounded-r-[24px] border-y border-r ${
                      isLight ? "border-indigo-400/30" : "border-purple-500/40"
                    }`}
                    style={{
                      background: isLight
                        ? "linear-gradient(to right, rgba(99,102,241,0.12), rgba(168,85,247,0.04))"
                        : "linear-gradient(to right, rgba(99,102,241,0.15), rgba(168,85,247,0.02))",
                      backdropFilter: "blur(6px)"
                    }}
                    initial={{ rotateY: 3, opacity: 0 }}
                    animate={{ rotateY: -183, opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 2,
                    }}
                  >
                    {/* Glowing floating symbols on the page */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                      isLight ? "bg-white/90 border-indigo-200 text-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "bg-white/5 border-white/10 text-purple-200 shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                    }`}>
                      {i % 2 === 0 ? <Sparkles /> : <Zap />}
                    </div>

                    {/* Data lines representing story being written */}
                    <div className="space-y-4 w-full">
                      <div className={`h-2 w-full rounded-full overflow-hidden relative ${isLight ? "bg-indigo-200/50" : "bg-indigo-300/30"}`}>
                        <motion.div className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-1/3 rounded-full blur-[2px]" animate={{ x: [-100, 250] }} transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }} />
                      </div>
                      <div className={`h-2 w-5/6 rounded-full ${isLight ? "bg-indigo-200/40" : "bg-indigo-300/20"}`} />
                      <div className={`h-2 w-4/6 rounded-full ${isLight ? "bg-indigo-200/30" : "bg-indigo-300/10"}`} />

                      <div className={`mt-6 relative p-4 rounded-xl border ${isLight ? "border-pink-300/40 bg-pink-500/5" : "border-pink-500/20 bg-pink-500/10"}`}>
                        <div className="h-2 w-3/4 bg-pink-400/60 rounded-full mb-3" />
                        <div className="h-2 w-1/2 bg-pink-400/40 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FLOATING MANUSCRIPT & LORE NODES SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes dash {
              to { stroke-dashoffset: -100; }
            }
            .animate-dash {
              animation: dash 5s linear infinite;
            }
          `}} />

          {/* Ambient center glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[150px] pointer-events-none ${
            isLight ? "bg-indigo-500/5" : "bg-indigo-500/10"
          }`} />

          <div className="relative w-full max-w-6xl mx-auto min-h-[480px] flex items-center">

            {/* The Main Manuscript */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="w-full lg:w-3/5 z-10 relative"
            >
              <div className={`pl-8 sm:pl-16 border-l-2 py-8 relative ${isLight ? "border-indigo-500/30" : "border-indigo-500/20"}`}>
                <div className="absolute left-[-2px] top-0 h-1/3 w-[2px] bg-gradient-to-b from-indigo-500 to-transparent" />

                <div className="mb-4 flex items-center gap-3">
                  <div className={`px-3 py-1 border rounded-full text-xs font-bold tracking-widest uppercase ${
                    isLight ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                  }`}>Chapter 1</div>
                  <div className={`text-sm mono ${isLight ? "text-slate-500" : "text-slate-500"}`}>12:04 AM • Auto-saved</div>
                </div>

                <h2 className={`text-5xl sm:text-6xl font-extrabold mb-10 outfit tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>The Awakening</h2>

                <div className="space-y-10">
                  <p className={`text-xl sm:text-2xl leading-[1.7] font-serif ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    The city of neon and chrome hummed beneath the heavy rain. It was a rhythmic, pulsing sound that vibrated through the floorboards of <span className="relative inline-block cursor-pointer group">
                      <span className={`absolute -inset-2 rounded-lg blur-md transition-all duration-300 ${isLight ? "bg-amber-500/20 group-hover:bg-amber-500/40" : "bg-amber-500/10 group-hover:bg-amber-500/30"}`} />
                      <span className={`relative border-b-2 ${isLight ? "text-amber-700 border-amber-600/60 font-semibold" : "text-amber-300 border-amber-500/40"}`}>Kael's</span>
                    </span> tiny apartment.
                  </p>

                  <p className={`text-xl sm:text-2xl leading-[1.7] font-serif ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    He stared at the glowing <span className="relative inline-block cursor-pointer group">
                      <span className={`absolute -inset-2 rounded-lg blur-md transition-all duration-300 ${isLight ? "bg-cyan-500/20 group-hover:bg-cyan-500/40" : "bg-cyan-500/10 group-hover:bg-cyan-500/30"}`} />
                      <span className={`relative border-b-2 ${isLight ? "text-cyan-700 border-cyan-600/60 font-semibold" : "text-cyan-300 border-cyan-500/40"}`}>cyber-terminal</span>
                    </span>. The cursor blinked back at him, almost mockingly. The code was compiled, the narrative locked in. All he had to do was execute.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* The Floating Wiki Cards */}
            <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-2/5 space-y-16">

              {/* SVG Connector Lines */}
              <svg className="absolute left-[-250px] top-0 w-[400px] h-[500px] pointer-events-none z-0">
                <path d="M 0 160 C 150 160 150 40 300 40" fill="none" stroke={isLight ? "rgba(217, 119, 6, 0.6)" : "rgba(245, 158, 11, 0.4)"} strokeWidth="2" strokeDasharray="6,6" className="animate-dash" />
                <path d="M 0 380 C 150 380 200 320 350 320" fill="none" stroke={isLight ? "rgba(8, 145, 178, 0.6)" : "rgba(6, 182, 212, 0.4)"} strokeWidth="2" strokeDasharray="6,6" className="animate-dash" />
              </svg>

              {/* Kael Lore Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              >
                <motion.div
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className={`relative z-10 backdrop-blur-xl border rounded-2xl p-6 transition-colors ${
                    isLight
                      ? "bg-white/95 border-amber-500/40 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.12)] hover:border-amber-500/60"
                      : "bg-[#0B0914]/90 border-amber-500/30 shadow-[0_20px_50px_-10px_rgba(245,158,11,0.15)] hover:border-amber-500/50"
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                  <div className="flex items-start gap-5 mb-5 relative z-10">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                      isLight ? "bg-amber-50 border-amber-300 text-amber-600 shadow-sm" : "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                    }`}>
                      <Users />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-amber-700" : "text-amber-500/90"}`}>Character Log</div>
                      </div>
                      <div className={`text-2xl font-bold outfit ${isLight ? "text-slate-900" : "text-white"}`}>Kael Vance</div>
                    </div>
                  </div>

                  <p className={`text-[0.95rem] leading-relaxed relative z-10 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    A rogue archivist trying to decode the lost sequences of the old world. Known for his reckless brilliance and a cybernetic left eye.
                  </p>
                </motion.div>
              </motion.div>

              {/* Cyber-Terminal Lore Card */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="ml-16"
              >
                <motion.div
                  animate={{ y: [8, -8, 8] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className={`relative z-10 backdrop-blur-xl border rounded-2xl p-6 transition-colors ${
                    isLight
                      ? "bg-white/95 border-cyan-500/40 shadow-[0_20px_50px_-10px_rgba(6,182,212,0.12)] hover:border-cyan-500/60"
                      : "bg-[#0B0914]/90 border-cyan-500/30 shadow-[0_20px_50px_-10px_rgba(6,182,212,0.15)] hover:border-cyan-500/50"
                  }`}
                >
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3 pointer-events-none" />

                  <div className="flex items-start gap-5 mb-5 relative z-10">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
                      isLight ? "bg-cyan-50 border-cyan-300 text-cyan-600 shadow-sm" : "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    }`}>
                      <Zap />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <div className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-cyan-700" : "text-cyan-500/90"}`}>Artifact</div>
                      </div>
                      <div className={`text-2xl font-bold outfit ${isLight ? "text-slate-900" : "text-white"}`}>Cyber-Terminal</div>
                    </div>
                  </div>

                  <p className={`text-[0.95rem] leading-relaxed relative z-10 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                    An illegal, heavily modified rig capable of interfacing directly with the deep neural net of the city. Highly unstable.
                  </p>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className={`hidden lg:block absolute left-[40px] top-[140px] w-5 h-5 rounded-full border-[3px] bg-pink-500 timeline-glow transform -translate-x-1/2 z-20 ${isLight ? "border-[#f0f3f9]" : "border-[#05050A]"}`} />

          <div className="mb-10">
            <h2 className={`text-3xl sm:text-5xl font-extrabold mb-3 outfit ${isLight ? "text-slate-900" : "text-white"}`}>
              Everything you need to <span className="grad-text-2">tell your story.</span>
            </h2>
            <p className={`text-lg sm:text-xl max-w-2xl ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Write, world-build, and focus with cutting-edge AI tools built specifically for narrative creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: AI Outline Generator */}
            <FeatureCard delay={0} glowColor="rgba(99, 102, 241, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              }`}>
                <OutlineIcon />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>AI Outline Generator</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Instantly generate structured, beat-by-beat plot outlines, act breakdowns, and scene lists tailored to your story tone.
              </p>
            </FeatureCard>

            {/* Feature 2: Screenplay Mode */}
            <FeatureCard delay={0.1} glowColor="rgba(168, 85, 247, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-purple-50 border-purple-200 text-purple-600 shadow-sm" : "bg-purple-500/10 border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              }`}>
                <ScreenplayIcon />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>Screenplay & Script Mode</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Professional screenplay formatting engine with automated character sluglines, dialogue shortcuts, and Final Draft ready export.
              </p>
            </FeatureCard>

            {/* Feature 3: Writing Sprint Timer */}
            <FeatureCard delay={0.2} glowColor="rgba(236, 72, 153, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-pink-50 border-pink-200 text-pink-600 shadow-sm" : "bg-pink-500/10 border-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)]"
              }`}>
                <SprintIcon />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>Writing Sprints & Velocity</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Crush word count goals with timed writing sprints, real-time velocity tracking, word per minute analytics, and daily streaks.
              </p>
            </FeatureCard>

            {/* Feature 4: Interactive Character AI */}
            <FeatureCard delay={0.3} glowColor="rgba(249, 115, 22, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-orange-50 border-orange-200 text-orange-600 shadow-sm" : "bg-orange-500/10 border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              }`}>
                <CharacterIcon />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>Interactive Character AI</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Chat in real time with your fictional characters, uncover deep psychological motivations, and auto-map relationship webs.
              </p>
            </FeatureCard>

            {/* Feature 5: Auto Story Wiki */}
            <FeatureCard delay={0.4} glowColor="rgba(6, 182, 212, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-cyan-50 border-cyan-200 text-cyan-600 shadow-sm" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              }`}>
                <Book />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>Auto Story Wiki</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Gemini engine automatically extracts Characters, Locations, and Items as you write, keeping a living lore database.
              </p>
            </FeatureCard>

            {/* Feature 6: Zen 3D Focus Mode */}
            <FeatureCard delay={0.5} glowColor="rgba(16, 185, 129, 0.15)">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-5 ${
                isLight ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              }`}>
                <Zap />
              </div>
              <h3 className={`text-lg font-bold mb-2 outfit ${isLight ? "text-slate-900" : "text-white"}`}>Zen 3D Focus Mode</h3>
              <p className={`text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                Interactive 3D particle environments (Cosmic, Snow, Ember) that react dynamically to your typing speed and mood.
              </p>
            </FeatureCard>
          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className={`hidden lg:block absolute left-[40px] top-[100px] w-5 h-5 rounded-full border-[3px] bg-purple-500 timeline-glow transform -translate-x-1/2 z-20 ${isLight ? "border-[#f0f3f9]" : "border-[#05050A]"}`} />

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative max-w-5xl mx-auto rounded-3xl p-[1px] overflow-hidden shadow-2xl">
            {/* Subtle gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40" />

            <div className={`backdrop-blur-2xl rounded-[23px] px-8 md:px-12 py-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 transition-colors ${
              isLight
                ? "bg-white/90 shadow-2xl border border-indigo-100"
                : "bg-[#0B0914]/90 border border-white/5"
            }`}>
              {/* Magical inner glow */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="relative z-10 text-center md:text-left flex-1">
                <h2 className={`text-3xl md:text-4xl font-extrabold mb-3 outfit tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  Your universe awaits.
                </h2>
                <p className={`text-base md:text-lg font-serif leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  An intelligent workspace where your story's universe remembers itself as you write.
                </p>
              </div>

              <div className="relative z-10 flex-shrink-0">
                <button onClick={() => router.push("/register")} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white font-semibold text-lg shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                  Begin your narrative
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={`max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-12 mt-12 border-t text-sm transition-colors ${
          isLight ? "border-slate-200 text-slate-600" : "border-[#30363d] text-[#8b949e]"
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                isLight ? "bg-slate-200 text-slate-800" : "bg-[#30363d] text-white"
              }`}>N</div>
              <span>© 2026 Narratia Inc.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="#" className={`transition-colors ${isLight ? "hover:text-indigo-600" : "hover:text-blue-400"}`}>Terms</a>
              <a href="#" className={`transition-colors ${isLight ? "hover:text-indigo-600" : "hover:text-blue-400"}`}>Privacy</a>
              <a href="#" className={`transition-colors ${isLight ? "hover:text-indigo-600" : "hover:text-blue-400"}`}>Docs</a>
              <a href="#" className={`transition-colors ${isLight ? "hover:text-indigo-600" : "hover:text-blue-400"}`}>Contact</a>
            </div>

            <div className="flex items-center gap-2">
              Developed by <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>Maaj Bhadgaonkar</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}