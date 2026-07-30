"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useSpring, useMotionValue, useMotionTemplate } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

// ─────────────────────────────────────────────────────────────────
// ICONS (Minimalist 1.5px stroke SVGs)
// ─────────────────────────────────────────────────────────────────
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const Sparkles = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
  </svg>
);

const Users = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Book = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const Zap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const OutlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const ScreenplayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.5" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const SprintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 10" />
  </svg>
);

const CharacterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

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
// BESPOKE FEATURE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────
interface FeatureCardProps {
  delay: number;
  badge: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: "indigo" | "violet" | "sky" | "amber" | "emerald" | "rose";
  children: React.ReactNode;
}

function FeatureCard({ delay, badge, title, description, icon, accentColor, children }: FeatureCardProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const badgeStyles = {
    indigo: isLight ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    violet: isLight ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-purple-500/10 text-purple-300 border-purple-500/20",
    sky: isLight ? "bg-sky-50 text-sky-700 border-sky-200" : "bg-sky-500/10 text-sky-300 border-sky-500/20",
    amber: isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/10 text-amber-300 border-amber-500/20",
    emerald: isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    rose: isLight ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-rose-500/10 text-rose-300 border-rose-500/20",
  }[accentColor];

  const iconStyles = {
    indigo: isLight ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    violet: isLight ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-purple-500/10 text-purple-400 border-purple-500/20",
    sky: isLight ? "bg-sky-50 text-sky-600 border-sky-100" : "bg-sky-500/10 text-sky-400 border-sky-500/20",
    amber: isLight ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-amber-500/10 text-amber-400 border-amber-500/20",
    emerald: isLight ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: isLight ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-rose-500/10 text-rose-400 border-rose-500/20",
  }[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      className={`group relative rounded-2xl p-6 transition-all duration-300 cursor-default flex flex-col justify-between overflow-hidden ${isLight
          ? "bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-xl hover:-translate-y-0.5"
          : "bg-[#0b0c10]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
        }`}
      onMouseMove={handleMouseMove}
    >
      {/* Top sheen line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none" />

      {/* Dynamic cursor spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-500 group-hover:opacity-100 z-0"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              ${isLight ? "rgba(99, 102, 241, 0.05)" : "rgba(255, 255, 255, 0.04)"},
              transparent 80%
            )
          `,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${iconStyles}`}>
            {icon}
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${badgeStyles}`}>
            {badge}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className={`text-lg font-bold mb-2 tracking-tight outfit ${isLight ? "text-slate-900" : "text-white"}`}>
          {title}
        </h3>
        <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
          {description}
        </p>
      </div>

      {/* Visual Micro UI Preview */}
      <div className="relative z-10 mt-6 pt-2 border-t border-slate-100 dark:border-white/[0.05]">
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
        background: isLight ? "#f8fafc" : "#06070a",
        color: isLight ? "#0f172a" : "#f1f5f9"
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          background: ${isLight ? "#f8fafc" : "#06070a"};
          color: ${isLight ? "#0f172a" : "#f1f5f9"};
        }
        
        h1, h2, h3, h4, h5, h6, .outfit {
          font-family: "Outfit", sans-serif;
        }

        .mono { font-family: "JetBrains Mono", monospace; }
        .transform-style-3d { transform-style: preserve-3d; }

        ::selection {
          background: ${isLight ? "rgba(99,102,241,0.2)" : "rgba(124,58,237,0.3)"};
          color: ${isLight ? "#1e1b4b" : "#fff"};
        }

        /* Ambient grid pattern */
        .bg-grid {
          background-image: ${isLight
          ? "linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)"
          : "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)"
        };
          background-size: 40px 40px;
          background-position: center center;
        }
      `}</style>

      {/* ── BACKGROUND AMBIENT LIGHTING ── */}
      <div className={`absolute inset-0 bg-grid z-0 pointer-events-none ${isLight ? "opacity-80" : "opacity-60"}`} />
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-[140px] pointer-events-none ${isLight ? "bg-indigo-500/5" : "bg-indigo-600/10"}`} />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navSolid
            ? (isLight ? "rgba(248, 250, 252, 0.85)" : "rgba(6, 7, 10, 0.85)")
            : "transparent",
          backdropFilter: navSolid ? "blur(16px)" : "none",
          borderBottom: navSolid
            ? (isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.06)")
            : "1px solid transparent"
        }}>
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md outfit">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia</span>
          </a>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button onClick={() => router.push("/login")} className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors outfit ${isLight ? "text-slate-700 hover:text-indigo-600" : "text-slate-300 hover:text-white"}`}>Sign in</button>
            <button onClick={() => router.push("/register")} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm hover:shadow transition-all outfit">Get Started</button>
          </div>
        </div>
      </nav>

      {/* ── MAIN TIMELINE (LEFT GUTTER) ── */}
      <div className="hidden lg:block absolute top-[90px] bottom-0 left-[max(0px,calc(50%-640px+40px))] w-[1px] z-10" style={{ background: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.06)", transform: "translateX(-50%)" }}>
        <motion.div className="w-full bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-500 origin-top"
          style={{ scaleY, height: "100%" }} />
      </div>

      <main className="relative z-10 pt-[96px]">
        {/* ── HERO SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] pb-20 relative">
          <div className={`hidden lg:block absolute left-[40px] top-[14px] w-3.5 h-3.5 rounded-full border-2 bg-indigo-600 transform -translate-x-1/2 z-20 ${isLight ? "border-slate-100" : "border-[#06070a]"}`} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>


              <h1 className={`text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight mb-6 outfit ${isLight ? "text-slate-900" : "text-white"}`}>
                Your AI-Powered <br />
                <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">Writing Ecosystem.</span>
              </h1>

              <p className={`text-base sm:text-lg max-w-xl font-normal leading-relaxed mb-8 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
                The ultimate workspace for modern authors. From auto-extracting <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>Story Wikis</span> and <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>RAG lore memory</span> to our focused <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>Zen 3D writing mode</span>.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                <button onClick={() => router.push("/register")} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all flex items-center justify-center gap-2 outfit">
                  Start writing free
                  <ChevronRight />
                </button>
                <button onClick={() => router.push("/login")} className={`w-full sm:w-auto px-6 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 outfit ${isLight
                    ? "border-slate-200 hover:border-slate-300 bg-white/80 text-slate-800"
                    : "border-white/10 hover:border-white/20 bg-white/[0.03] text-slate-200"
                  }`}>
                  Sign in to workspace
                </button>
              </div>

              {/* Stats */}
              <div className={`flex flex-wrap gap-8 border-t pt-6 max-w-xl ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <div>
                  <div className={`text-2xl font-bold mb-0.5 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={2} suffix="M+" /></div>
                  <div className={`text-xs font-medium uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-400"}`}>Stories Created</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold mb-0.5 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={100} suffix="K+" /></div>
                  <div className={`text-xs font-medium uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-400"}`}>Active Writers</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold mb-0.5 outfit ${isLight ? "text-slate-900" : "text-white"}`}><Counter target={99} suffix=".9%" /></div>
                  <div className={`text-xs font-medium uppercase tracking-wider outfit ${isLight ? "text-slate-500" : "text-slate-400"}`}>Uptime Guarantee</div>
                </div>
              </div>
            </motion.div>

            {/* ── UNIQUE HOLOGRAPHIC 3D FLIPPING BOOK ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="hidden lg:flex relative w-full h-[540px] items-center justify-center"
              style={{ perspective: 1500 }}
            >
              {/* Overall Book Floating & Rotation */}
              <motion.div
                animate={{ rotateX: [18, 24, 18], rotateY: [-24, -14, -24], y: [-12, 12, -12] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-[480px] h-[340px] transform-style-3d"
              >
                {/* Ambient Soft Glow Behind Book */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full blur-[80px] pointer-events-none ${isLight ? "bg-indigo-500/10" : "bg-indigo-600/15"}`} />

                {/* Left Book Base / Pages Stack */}
                <div className={`absolute top-0 right-1/2 w-[240px] h-full backdrop-blur-xl border-y border-l rounded-l-[20px] origin-right flex items-center justify-center overflow-hidden ${isLight ? "bg-white/90 border-slate-200 shadow-lg" : "bg-[#0b0c10]/90 border-white/10 shadow-2xl"
                  }`} style={{ transform: "rotateY(-4deg)" }}>
                  <div className={`w-[140%] h-[140%] absolute border rounded-full ${isLight ? "border-indigo-500/10" : "border-indigo-500/5"}`} style={{ transform: "translate(-20%, -10%)" }} />
                </div>
                <div className={`absolute top-0 right-1/2 w-[240px] h-full border-y border-l rounded-l-[20px] origin-right ${isLight ? "bg-slate-50/90 border-slate-200/60" : "bg-[#08090d]/90 border-white/5"
                  }`} style={{ transform: "rotateY(-8deg) translateZ(-6px)" }} />
                <div className={`absolute top-0 right-1/2 w-[240px] h-full border-y border-l rounded-l-[20px] origin-right ${isLight ? "bg-slate-100 border-slate-200/60" : "bg-[#06070a] border-white/5"
                  }`} style={{ transform: "rotateY(-12deg) translateZ(-12px)" }} />

                {/* Right Book Base / Pages Stack */}
                <div className={`absolute top-0 left-1/2 w-[240px] h-full backdrop-blur-xl border-y border-r rounded-r-[20px] origin-left flex items-center justify-center overflow-hidden ${isLight ? "bg-white/90 border-slate-200 shadow-lg" : "bg-[#0b0c10]/90 border-white/10 shadow-2xl"
                  }`} style={{ transform: "rotateY(4deg)" }}>
                  <div className={`w-[140%] h-[140%] absolute border rounded-full ${isLight ? "border-indigo-500/10" : "border-indigo-500/5"}`} style={{ transform: "translate(20%, -10%)" }} />
                </div>
                <div className={`absolute top-0 left-1/2 w-[240px] h-full border-y border-r rounded-r-[20px] origin-left ${isLight ? "bg-slate-50/90 border-slate-200/60" : "bg-[#08090d]/90 border-white/5"
                  }`} style={{ transform: "rotateY(8deg) translateZ(-6px)" }} />
                <div className={`absolute top-0 left-1/2 w-[240px] h-full border-y border-r rounded-r-[20px] origin-left ${isLight ? "bg-slate-100 border-slate-200/60" : "bg-[#06070a] border-white/5"
                  }`} style={{ transform: "rotateY(12deg) translateZ(-12px)" }} />

                {/* Book Spine Shadow / Light Effect */}
                <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-5 bg-gradient-to-r blur-[2px] z-10 ${isLight ? "from-transparent via-slate-400/20 to-transparent" : "from-transparent via-white/15 to-transparent"
                  }`} />
                <div className="absolute top-[-10px] bottom-[-10px] left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent rounded-[50%] blur-lg z-10" />

                {/* Animated Flipping Holographic Pages */}
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`absolute top-0 left-1/2 w-[240px] h-full origin-left overflow-hidden flex flex-col justify-between p-6 rounded-r-[20px] border-y border-r ${isLight ? "border-indigo-400/30" : "border-indigo-500/30"
                      }`}
                    style={{
                      background: isLight
                        ? "linear-gradient(to right, rgba(99,102,241,0.1), rgba(139,92,246,0.03))"
                        : "linear-gradient(to right, rgba(99,102,241,0.12), rgba(139,92,246,0.02))",
                      backdropFilter: "blur(8px)"
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
                    {/* Glowing Symbol / Icon on Page */}
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${isLight ? "bg-white/90 border-indigo-200 text-indigo-600 shadow-sm" : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                        }`}>
                        {i % 2 === 0 ? <Sparkles /> : <Zap />}
                      </div>
                      <span className="text-[10px] font-mono text-indigo-400 font-medium">PAGE 0{i + 1}</span>
                    </div>

                    {/* Animated Writing Lines */}
                    <div className="space-y-3 w-full my-auto">
                      <div className={`h-2 w-full rounded-full overflow-hidden relative ${isLight ? "bg-indigo-200/50" : "bg-indigo-300/20"}`}>
                        <motion.div
                          className="absolute top-0 bottom-0 left-0 bg-indigo-500 w-1/3 rounded-full blur-[1px]"
                          animate={{ x: [-80, 240] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                        />
                      </div>
                      <div className={`h-2 w-5/6 rounded-full ${isLight ? "bg-indigo-200/40" : "bg-indigo-300/15"}`} />
                      <div className={`h-2 w-4/6 rounded-full ${isLight ? "bg-indigo-200/30" : "bg-indigo-300/10"}`} />

                      <div className={`mt-4 p-3 rounded-lg border text-[11px] font-serif leading-snug italic ${isLight ? "border-indigo-200/60 bg-indigo-50/50 text-indigo-900" : "border-indigo-500/20 bg-indigo-500/10 text-indigo-200"
                        }`}>
                        "Chapter {i + 1}: The sequence began to unfold..."
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>AUTO-SYNCED</span>
                      <span className="text-emerald-400">LIVE</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FLOATING MANUSCRIPT SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className="relative w-full max-w-6xl mx-auto flex items-center">
            {/* The Main Manuscript */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-3/5 z-10"
            >
              <div className={`pl-6 sm:pl-10 border-l-2 py-4 relative ${isLight ? "border-slate-300" : "border-white/10"}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase border ${isLight ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                    }`}>Chapter 1</span>
                  <span className={`text-xs mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>Live Manuscript Preview</span>
                </div>

                <h2 className={`text-3xl sm:text-4xl font-extrabold mb-6 outfit tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  The Awakening
                </h2>

                <div className="space-y-6">
                  <p className={`text-lg sm:text-xl leading-relaxed font-serif ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    The city of neon and chrome hummed beneath the heavy rain. It was a rhythmic, pulsing sound that vibrated through the floorboards of <span className={`px-1.5 py-0.5 rounded border text-amber-400 font-semibold ${isLight ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-500/10 border-amber-500/20 text-amber-300"}`}>Kael's</span> tiny apartment.
                  </p>

                  <p className={`text-lg sm:text-xl leading-relaxed font-serif ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                    He stared at the glowing <span className={`px-1.5 py-0.5 rounded border ${isLight ? "bg-sky-50 border-sky-200 text-sky-800" : "bg-sky-500/10 border-sky-500/20 text-sky-300"}`}>cyber-terminal</span>. The cursor blinked back at him, almost mockingly. The code was compiled, the narrative locked in.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Sidebar Floating Cards */}
            <div className="hidden lg:block w-2/5 pl-10 space-y-4">
              <div className={`p-4 rounded-xl border backdrop-blur-md ${isLight ? "bg-white/90 border-slate-200 text-slate-800 shadow-sm" : "bg-[#0b0c10]/90 border-white/10 text-slate-200"
                }`}>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <Users /> Character Entity
                </div>
                <div className="font-bold text-sm mb-1 outfit">Kael Vance</div>
                <div className="text-xs text-slate-400 leading-relaxed">Rogue archivist decoding legacy sequences of the old world.</div>
              </div>

              <div className={`p-4 rounded-xl border backdrop-blur-md ${isLight ? "bg-white/90 border-slate-200 text-slate-800 shadow-sm" : "bg-[#0b0c10]/90 border-white/10 text-slate-200"
                }`}>
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  <Zap /> Story Artifact
                </div>
                <div className="font-bold text-sm mb-1 outfit">Cyber-Terminal</div>
                <div className="text-xs text-slate-400 leading-relaxed">Modified hardware interface connected to the deep neural net.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className={`hidden lg:block absolute left-[40px] top-[100px] w-3.5 h-3.5 rounded-full border-2 bg-violet-600 transform -translate-x-1/2 z-20 ${isLight ? "border-slate-100" : "border-[#06070a]"}`} />

          {/* Section Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 outfit">
              <Sparkles />
              Integrated Story Engine
            </div>
            <h2 className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 outfit ${isLight ? "text-slate-900" : "text-white"}`}>
              Everything you need to <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">tell your story.</span>
            </h2>
            <p className={`text-base sm:text-lg max-w-2xl leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              Write, world-build, and focus with a unified suite of AI tools engineered specifically for authors, screenwriters, and narrative creators.
            </p>
          </div>

          {/* 6 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* 1. AI Outline Generator */}
            <FeatureCard
              delay={0}
              badge="Beat Breakdown"
              title="AI Outline Generator"
              description="Instantly generate structured, beat-by-beat plot outlines, act breakdowns, and scene lists tailored to your story tone."
              icon={<OutlineIcon />}
              accentColor="indigo"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-mono text-[11px] text-indigo-400 font-medium">ACT I: THE HOOK</span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] border border-indigo-500/20">3 Beats</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05]">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-700 dark:text-slate-300 truncate text-[11px]">Inciting incident at midnight harbor</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-white/[0.02] border border-slate-200/40 dark:border-white/[0.04]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span className="text-slate-500 dark:text-slate-400 truncate text-[11px]">Discovery of the hidden archive</span>
                </div>
              </div>
            </FeatureCard>

            {/* 2. Screenplay Mode */}
            <FeatureCard
              delay={0.1}
              badge="Industry Format"
              title="Screenplay & Script Mode"
              description="Professional screenplay formatting engine with automated character sluglines, dialogue shortcuts, and Final Draft ready export."
              icon={<ScreenplayIcon />}
              accentColor="violet"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">EXT. NEON DOCKS - NIGHT</div>
                <div className="text-violet-400 font-semibold pl-10 text-[10px]">KAEL</div>
                <div className="text-slate-600 dark:text-slate-300 pl-5 border-l border-violet-500/30 text-[11px] leading-snug">"The key wasn't lost. It was hidden."</div>
              </div>
            </FeatureCard>

            {/* 3. Writing Sprint Timer */}
            <FeatureCard
              delay={0.2}
              badge="Real-time Analytics"
              title="Writing Sprints & Velocity"
              description="Crush word count goals with timed writing sprints, real-time velocity tracking, word per minute analytics, and daily streaks."
              icon={<SprintIcon />}
              accentColor="rose"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-mono text-[11px]">SPRINT TIMER</span>
                  <span className="font-mono text-emerald-400 font-semibold text-[11px]">24:18 ACTIVE</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-rose-400 w-[68%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-0.5">
                  <span>1,420 words</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">68 WPM</span>
                </div>
              </div>
            </FeatureCard>

            {/* 4. Interactive Character AI */}
            <FeatureCard
              delay={0.3}
              badge="Persona Engine"
              title="Interactive Character AI"
              description="Chat in real time with your fictional characters, uncover deep psychological motivations, and auto-map relationship webs."
              icon={<CharacterIcon />}
              accentColor="amber"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-[10px] font-bold text-black">KV</div>
                  <span className="text-slate-700 dark:text-slate-200 font-medium text-[11px]">Kael Vance (Protagonist)</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.05] text-slate-600 dark:text-slate-300 text-[11px] italic">
                  "I don't trust the Guild's council."
                </div>
              </div>
            </FeatureCard>

            {/* 5. Auto Story Wiki */}
            <FeatureCard
              delay={0.4}
              badge="RAG Lore Memory"
              title="Auto Story Wiki"
              description="Gemini engine automatically extracts Characters, Locations, and Items as you write, keeping a living lore database."
              icon={<Book />}
              accentColor="sky"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] flex flex-wrap gap-1.5 text-xs">
                <span className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 dark:text-indigo-300 text-[10px] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-indigo-400" /> Kael Vance
                </span>
                <span className="px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-400 dark:text-sky-300 text-[10px] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-sky-400" /> Citadel 9
                </span>
                <span className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 dark:text-amber-300 text-[10px] flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-400" /> Cipher Key
                </span>
              </div>
            </FeatureCard>

            {/* 6. Zen 3D Focus Mode */}
            <FeatureCard
              delay={0.5}
              badge="Distraction Free"
              title="Zen 3D Focus Mode"
              description="Interactive 3D particle environments (Cosmic, Snow, Ember) that react dynamically to your typing speed and mood."
              icon={<Zap />}
              accentColor="emerald"
            >
              <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Flow State Active
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 dark:text-emerald-300 text-[10px] border border-emerald-500/20">Cosmic Mode</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>3D particle landscape synced with keyboard pace</span>
                </div>
              </div>
            </FeatureCard>

          </div>
        </section>

        {/* ── CTA SECTION ── */}
        <section className="max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-16 relative">
          <div className={`hidden lg:block absolute left-[40px] top-[80px] w-3.5 h-3.5 rounded-full border-2 bg-indigo-600 transform -translate-x-1/2 z-20 ${isLight ? "border-slate-100" : "border-[#06070a]"}`} />

          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative max-w-5xl mx-auto rounded-3xl p-[1px] overflow-hidden shadow-2xl">
            <div className={`rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl border ${isLight
                ? "bg-white/90 border-slate-200 shadow-xl"
                : "bg-[#0b0c10]/90 border-white/10 shadow-black"
              }`}>
              <div className="relative z-10 text-center md:text-left flex-1">
                <h2 className={`text-2xl md:text-4xl font-extrabold mb-3 outfit tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                  Your universe awaits.
                </h2>
                <p className={`text-sm md:text-base leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                  An intelligent workspace where your story's universe remembers itself as you write.
                </p>
              </div>

              <div className="relative z-10 flex-shrink-0">
                <button onClick={() => router.push("/register")} className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all outfit">
                  Begin your narrative free
                </button>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={`max-w-[1280px] mx-auto px-6 lg:pl-[120px] py-10 mt-8 border-t text-xs transition-colors ${isLight ? "border-slate-200 text-slate-500" : "border-white/10 text-slate-400"
          }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">N</div>
              <span>© 2026 Narratia Inc. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Docs</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Contact</a>
            </div>

            <div>
              Developed by <span className={`font-medium ${isLight ? "text-slate-900" : "text-white"}`}>Maaj Bhadgaonkar</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}