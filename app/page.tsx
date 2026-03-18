"use client";

import { useState, useEffect, useRef, RefObject } from "react";
import { useRouter } from "next/navigation";

// --- Utility: useInView hook ---
function useInView(options: IntersectionObserverInit = {}): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.15, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

// --- Floating Particles Canvas ---
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.opacity})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}

// --- Magnetic Button ---
function MagneticButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.05)`;
  };
  const handleMouseLeave = () => {
    const btn = btnRef.current;
    if (!btn) return;
    btn.style.transform = "translate(0,0) scale(1)";
  };
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {children}
    </button>
  );
}

// --- Animated Counter ---
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// --- Reveal wrapper ---
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(48px)",
        transition: `opacity 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms, transform 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// --- Typewriter ---
function Typewriter({ words }: { words: string[] }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [display, setDisplay] = useState("");
  useEffect(() => {
    const word = words[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && charIdx <= word.length) {
      setDisplay(word.slice(0, charIdx));
      timeout = setTimeout(() => setCharIdx(c => c + 1), 100);
    } else if (!deleting && charIdx > word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && charIdx >= 0) {
      setDisplay(word.slice(0, charIdx));
      timeout = setTimeout(() => setCharIdx(c => c - 1), 50);
    } else {
      setDeleting(false);
      setWordIdx(w => (w + 1) % words.length);
      timeout = setTimeout(() => setCharIdx(1), 200);
    }
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words]);
  return (
    <span>
      {display}
      <span className="inline-block w-0.5 h-[1em] bg-indigo-400 ml-1 align-middle animate-blink" />
    </span>
  );
}

// --- Feature Card with tilt ---
function FeatureCard({ icon, title, description, index }: { icon: string; title: string; description: string; index: number }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [ref, inView] = useInView();
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(20px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(800px) rotateY(0) rotateX(0) translateZ(0)";
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(60px)",
        transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 120}ms, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 120}ms`,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", 
          transformStyle: "preserve-3d" 
        }}
        className="group relative p-8 rounded-2xl border border-gray-800 hover:border-indigo-500/60 bg-gray-900/60 backdrop-blur-md overflow-hidden cursor-default h-full"
      >
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.12) 0%, transparent 70%)" }} 
        />
        <div className="text-5xl mb-5 transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 ease-out">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-500">
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm transition-colors duration-500 group-hover:text-gray-300">
          {description}
        </p>
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out" />
      </div>
    </div>
  );
}

export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { 
          font-family: 'DM Sans', sans-serif;
          scroll-behavior: smooth;
        }
        h1, h2 { font-family: 'Syne', sans-serif; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .animate-blink { animation: blink 1.2s ease-in-out infinite; }

        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-16px) rotate(2deg); }
          66% { transform: translateY(-8px) rotate(-2deg); }
        }
        .animate-float { animation: float 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }
        .animate-float-delay { animation: float 8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite 4s; }

        @keyframes gradient-shift {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient { 
          background-size: 200% 200%; 
          animation: gradient-shift 6s ease-in-out infinite; 
        }

        @keyframes spin-slow { 
          from{transform:rotate(0deg)} 
          to{transform:rotate(360deg)} 
        }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }

        @keyframes pulse-glow {
          0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 50px rgba(139,92,246,0.7), 0 0 100px rgba(99,102,241,0.3); }
        }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }

        @keyframes slide-up-fade {
          from { opacity:0; transform: translateY(40px) scale(0.96); }
          to { opacity:1; transform: translateY(0) scale(1); }
        }
        .hero-line-1 { animation: slide-up-fade 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both; }
        .hero-line-2 { animation: slide-up-fade 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both; }
        .hero-line-3 { animation: slide-up-fade 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both; }
        .hero-line-4 { animation: slide-up-fade 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.8s both; }
        .hero-line-5 { animation: slide-up-fade 1s cubic-bezier(0.34, 1.56, 0.64, 1) 1.0s both; }

        @keyframes marquee { 
          from{transform:translateX(0)} 
          to{transform:translateX(-50%)} 
        }
        .animate-marquee { animation: marquee 30s linear infinite; }

        .glow-text { 
          text-shadow: 0 0 60px rgba(139,92,246,0.5), 0 0 30px rgba(139,92,246,0.3); 
        }

        /* Smooth hover transitions */
        button, a, .transition-all {
          transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="min-h-screen bg-gray-950 overflow-x-hidden">

        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          scrollY > 50 ? "bg-gray-950/98 backdrop-blur-xl shadow-2xl shadow-gray-900/60" : "bg-transparent"
        } border-b border-gray-800/50`}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg animate-pulse-glow transform group-hover:scale-110 transition-transform duration-500">
                  N
                </div>
                <span className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-all duration-500">
                  Narratia
                </span>
              </a>
              <div className="flex items-center gap-3">
                <button
                  className="hidden sm:block px-5 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-all duration-500 rounded-lg hover:bg-white/5"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
                <MagneticButton
                  className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white hover:bg-indigo-50 rounded-lg transition-all duration-500 shadow-lg hover:shadow-xl"
                  onClick={() => router.push("/register")}
                >
                  Sign up
                </MagneticButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
          <ParticleCanvas />

          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-indigo-700/10 rounded-full filter blur-[100px] pointer-events-none animate-float" />
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-700/10 rounded-full filter blur-[100px] pointer-events-none animate-float-delay" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-5">
            <div className="w-full h-full rounded-full border border-indigo-400 animate-spin-slow" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            <div className="text-center max-w-5xl mx-auto">

              <div className="hero-line-1 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-sm font-medium text-indigo-400 mb-10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Collaborative Storytelling Platform
              </div>

              <h1 className="hero-line-2 text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                Where stories are
              </h1>
              <h1 className="hero-line-3 text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-tight glow-text">
                <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  <Typewriter words={["built together", "born epic", "brought to life", "imagined boldly"]} />
                </span>
              </h1>

              <p className="hero-line-4 text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
                Create, organize, and develop long-form stories in a structured
                way. Build epic narratives solo or with your team.
              </p>

              <div className="hero-line-5 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <MagneticButton
                  className="relative w-full sm:w-auto px-10 py-5 text-base font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 rounded-xl overflow-hidden group animate-pulse-glow shadow-2xl"
                  onClick={() => router.push("/register")}
                >
                  <span className="relative z-10">Start writing for free</span>
                  <div className="absolute inset-0 bg-linear-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </MagneticButton>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2 group transition-all duration-500 hover:scale-105">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-500">⭐</span>
                  <span><strong className="text-white"><Counter target={10} suffix="K+" /></strong> active writers</span>
                </div>
                <div className="w-px h-4 bg-gray-700 hidden sm:block" />
                <div className="flex items-center gap-2 group transition-all duration-500 hover:scale-105">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-500">📚</span>
                  <span><strong className="text-white"><Counter target={50} suffix="K+" /></strong> stories created</span>
                </div>
                <div className="w-px h-4 bg-gray-700 hidden sm:block" />
                <div className="flex items-center gap-2 group transition-all duration-500 hover:scale-105">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-500">✨</span>
                  <span><strong className="text-white">Free</strong> to start</span>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 animate-bounce">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </section>

        {/* Marquee strip */}
        <div className="relative py-5 bg-indigo-600/10 border-y border-indigo-500/20 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap gap-12 text-indigo-400/60 text-sm font-medium tracking-wider">
            {["COLLABORATIVE WRITING", "STORY ARCS", "CHAPTER MANAGEMENT", "REAL-TIME EDITING", "VERSION CONTROL", "TEAM WORKSPACES",
              "COLLABORATIVE WRITING", "STORY ARCS", "CHAPTER MANAGEMENT", "REAL-TIME EDITING", "VERSION CONTROL", "TEAM WORKSPACES"].map((t, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-indigo-400/60 inline-block" />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-28 px-6 bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
                Everything you need to{" "}
                <span className="bg-linear-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  build stories
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful tools designed specifically for writers who think big
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📚", title: "Story Arcs", description: "Organize your narrative into well-defined arcs with clear progression and structure." },
                { icon: "✍️", title: "Collaborative Writing", description: "Write together in real-time or async. Comment, suggest, and build worlds as a team." },
                { icon: "📖", title: "Chapter Management", description: "Break arcs into phases and chapters. Track progress with version control built in." },
                { icon: "🎯", title: "Solo or Team", description: "Create private projects or invite your writing team. Full permission management." },
              ].map((feature, index) => (
                <FeatureCard key={index} index={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-28 px-6 bg-linear-to-b from-gray-900 to-gray-950 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-500 to-transparent" />
          </div>

          <div className="max-w-6xl mx-auto">
            <Reveal className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-5">
                From idea to epic in{" "}
                <span className="bg-linearient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  three steps
                </span>
              </h2>
              <p className="text-xl text-gray-400">Get started in minutes, scale to novels</p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 relative">
              <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-linear-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0" />
              {[
                { step: "01", title: "Create your project", description: "Start a new story project. Choose solo writing or invite your team." },
                { step: "02", title: "Structure your story", description: "Break it into arcs and chapters. Organize your narrative flow." },
                { step: "03", title: "Write and collaborate", description: "Start writing. Get feedback. Iterate. Build something amazing." },
              ].map((item, index) => (
                <Reveal key={index} delay={index * 180} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-900 border border-gray-700 group-hover:border-indigo-500 text-indigo-400 text-sm font-mono mb-7 shadow-lg transition-all duration-700 group-hover:shadow-indigo-500/40 group-hover:shadow-2xl group-hover:scale-125">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-indigo-300 transition-colors duration-500">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed transition-colors duration-500 group-hover:text-gray-300">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-36 px-6 overflow-hidden bg-gray-950">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-float-delay" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-indigo-500/5 rounded-full animate-spin-slow" />
          </div>

          <div className="relative max-w-5xl mx-auto text-center">
            <Reveal>
              <div className="inline-block mb-8 px-5 py-2.5 bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/30 rounded-full text-sm font-medium text-indigo-400">
                ✨ Join the storytelling revolution
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                Ready to start your{" "}
                <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient glow-text">
                  epic story?
                </span>
              </h2>
            </Reveal>

            <Reveal delay={240}>
              <p className="text-xl md:text-2xl text-gray-400 mb-14 leading-relaxed max-w-3xl mx-auto">
                Join thousands of writers building their worlds on Narratia. Free to start, scales with your ambition.
              </p>
            </Reveal>

            <Reveal delay={360}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <MagneticButton
                  onClick={() => router.push("/register")}
                  className="group relative w-full sm:w-auto px-14 py-6 text-lg font-bold text-white rounded-2xl overflow-hidden bg-linear-to-r from-indigo-600 to-purple-600 animate-pulse-glow shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Get started for free
                    <span className="inline-block group-hover:translate-x-2 transition-transform duration-500">→</span>
                  </span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                </MagneticButton>
              </div>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}