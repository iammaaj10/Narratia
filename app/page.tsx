"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Sphere,
  MeshDistortMaterial,
  Float,
  Environment,
  Stars,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";

// -------------------------------------------------------------------
// BOOK ANIMATION — Three.js imperative (runs before page is visible)
// -------------------------------------------------------------------
function BookAnimation({ onComplete }: { onComplete: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const el = mountRef.current;

    // ── Renderer ──────────────────────────────────────────────────
    const W = window.innerWidth,
      H = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05050f);
    scene.fog = new THREE.FogExp2(0x05050f, 0.016);

    const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 300);
    camera.position.set(0, 1.8, 8.5);
    camera.lookAt(0, 0, 0);

    // ── Lighting ───────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a0f40, 1.2));

    const key = new THREE.DirectionalLight(0x7c7cf8, 3.5);
    key.position.set(4, 8, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    scene.add(key);

    const fill = new THREE.PointLight(0x9333ea, 4, 28);
    fill.position.set(-6, 4, 4);
    scene.add(fill);

    const rim = new THREE.PointLight(0xa78bfa, 3, 20);
    rim.position.set(0, 6, -6);
    scene.add(rim);

    const under = new THREE.PointLight(0x6366f1, 2, 14);
    under.position.set(0, -4, 2);
    scene.add(under);

    // ── Ground + Grid ──────────────────────────────────────────────
    const gnd = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({
        color: 0x050510,
        roughness: 0.95,
        metalness: 0.05,
      }),
    );
    gnd.rotation.x = -Math.PI / 2;
    gnd.position.y = -2.8;
    gnd.receiveShadow = true;
    scene.add(gnd);
    const grid = new THREE.GridHelper(40, 50, 0x1a1a3e, 0x0c0c22);
    grid.position.y = -2.8;
    scene.add(grid);

    // ── Stars ──────────────────────────────────────────────────────
    const sp = new Float32Array(4000 * 3);
    for (let i = 0; i < sp.length; i++) sp[i] = (Math.random() - 0.5) * 250;
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.07,
        transparent: true,
        opacity: 0.42,
      }),
    );
    scene.add(stars);

    // ── Dust particles ─────────────────────────────────────────────
    const dp = new Float32Array(1500 * 3);
    for (let i = 0; i < 1500; i++) {
      dp[i * 3] = (Math.random() - 0.5) * 22;
      dp[i * 3 + 1] = (Math.random() - 0.5) * 14;
      dp[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xb09aff,
        size: 0.035,
        transparent: true,
        opacity: 0.28,
        sizeAttenuation: true,
      }),
    );
    scene.add(dust);

    // ── Book constants ──────────────────────────────────────────────
    const BW = 2.5,
      BH = 3.4,
      BD = 0.22;
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    const mFront = new THREE.MeshStandardMaterial({
      color: 0x1e1070,
      roughness: 0.18,
      metalness: 0.72,
    });
    const mBack = new THREE.MeshStandardMaterial({
      color: 0x110850,
      roughness: 0.28,
      metalness: 0.55,
    });
    const mSpine = new THREE.MeshStandardMaterial({
      color: 0x2d1a90,
      roughness: 0.14,
      metalness: 0.82,
    });
    const mEdge = new THREE.MeshStandardMaterial({
      color: 0xcfc0f0,
      roughness: 0.92,
      metalness: 0.0,
    });
    const mGold = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.08,
      metalness: 1.0,
      emissive: new THREE.Color(0xff8c00),
      emissiveIntensity: 0.25,
    });
    const mEmboss = new THREE.MeshStandardMaterial({
      color: 0x5b5bd6,
      roughness: 0.08,
      metalness: 0.95,
      emissive: new THREE.Color(0x4040b0),
      emissiveIntensity: 0.4,
    });

    // Spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(BD, BH, BD), mSpine);
    spine.castShadow = true;
    bookGroup.add(spine);

    // Back cover
    const back = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD * 0.4), mBack);
    back.position.set(-BW / 2, 0, 0);
    back.castShadow = true;
    bookGroup.add(back);

    // Page block edge
    const pb = new THREE.Mesh(
      new THREE.BoxGeometry(BW * 0.96, BH * 0.96, BD * 0.35),
      mEdge,
    );
    pb.position.set(-BW / 2, 0, BD * 0.04);
    bookGroup.add(pb);

    // Front cover group (pivots at spine edge)
    const frontGroup = new THREE.Group();
    frontGroup.position.set(BD * 0.5, 0, BD * 0.5);
    bookGroup.add(frontGroup);

    const front = new THREE.Mesh(
      new THREE.BoxGeometry(BW, BH, BD * 0.4),
      mFront,
    );
    front.position.set(BW / 2, 0, 0);
    front.castShadow = true;
    frontGroup.add(front);

    // Gold accent lines
    [-0.9, -1.15].forEach((y) => {
      const l = new THREE.Mesh(
        new THREE.BoxGeometry(BW * 0.82, 0.022, 0.022),
        mGold,
      );
      l.position.set(BW / 2, y, BD * 0.22);
      frontGroup.add(l);
    });

    // Gold border frame
    (
      [
        [BW / 2, BH / 2 - 0.08, BD * 0.22, BW * 0.9, 0.018, 0.018],
        [BW / 2, -BH / 2 + 0.08, BD * 0.22, BW * 0.9, 0.018, 0.018],
        [0.14, 0, BD * 0.22, 0.018, BH * 0.88, 0.018],
        [BW - 0.14, 0, BD * 0.22, 0.018, BH * 0.88, 0.018],
      ] as [number, number, number, number, number, number][]
    ).forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mGold);
      m.position.set(x, y, z);
      frontGroup.add(m);
    });

    // Embossed N
    const emboss = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.8, 0.055),
      mEmboss,
    );
    emboss.position.set(BW / 2, 0.4, BD * 0.23);
    frontGroup.add(emboss);

    // Page fans
    const NUM_PAGES = 22;
    const pageGroup = new THREE.Group();
    pageGroup.position.copy(frontGroup.position);
    bookGroup.add(pageGroup);

    const pages: THREE.Mesh[] = [];
    for (let i = 0; i < NUM_PAGES; i++) {
      const pMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().lerpColors(
          new THREE.Color(0xf0eaff),
          new THREE.Color(0xd4c4ff),
          (i / (NUM_PAGES - 1)) * 0.25,
        ),
        roughness: 0.9,
        metalness: 0.0,
        side: THREE.DoubleSide,
      });
      const pg = new THREE.Mesh(
        new THREE.PlaneGeometry(BW * 0.95, BH * 0.95),
        pMat,
      );
      pg.position.set(BW / 2, 0, -BD * 0.16 + (i / NUM_PAGES) * BD * 0.32);
      pg.castShadow = true;
      pages.push(pg);
      pageGroup.add(pg);
    }

    // Floating rune glyphs
    const rColors = [0x6366f1, 0x8b5cf6, 0xa78bfa, 0xc4b5fd, 0x818cf8];
    const runes: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i++) {
      const s = 0.12 + Math.random() * 0.22;
      const rm = new THREE.MeshStandardMaterial({
        color: rColors[i % 5],
        emissive: new THREE.Color(rColors[i % 5]),
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
      });
      const r = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 1.5), rm);
      const ang = (i / 10) * Math.PI * 2;
      const rad = 4 + Math.random() * 2.5;
      r.position.set(
        Math.cos(ang) * rad,
        -0.5 + Math.random() * 3.5,
        Math.sin(ang) * rad - 0.5,
      );
      (r as any).userData = {
        baseY: r.position.y,
        phase: Math.random() * Math.PI * 2,
        spd: 0.35 + Math.random() * 0.45,
      };
      scene.add(r);
      runes.push(r);
    }

    // ── Animation state ─────────────────────────────────────────────
    let animPhase: "wait" | "open" | "zoom" | "done" = "wait";
    let phaseT = 0;
    const TARGET = -Math.PI * 0.97;
    const camStart = new THREE.Vector3(0, 1.8, 8.5);
    const camEnd = new THREE.Vector3(0, 9, 20);

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const clock = new THREE.Clock();
    let rafId: number;
    let finished = false;

    function tick() {
      rafId = requestAnimationFrame(tick);
      if (finished) return;
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();

      dust.rotation.y += 0.001;
      stars.rotation.y += 0.0001;

      runes.forEach((r) => {
        const ud = (r as any).userData;
        r.position.y = ud.baseY + Math.sin(t * ud.spd + ud.phase) * 0.28;
        r.rotation.y = t * 0.25 + ud.phase;
        r.rotation.z = Math.sin(t * 0.4 + ud.phase) * 0.15;
      });

      if (animPhase === "wait") {
        bookGroup.rotation.y = Math.sin(t * 0.45) * 0.12 - 0.1;
        bookGroup.position.y = Math.sin(t * 0.7) * 0.15;
      }

      if (animPhase === "open") {
        phaseT += dt * 0.5;
        if (phaseT > 1) phaseT = 1;
        const e = easeInOutCubic(phaseT);
        frontGroup.rotation.y = TARGET * e;
        pages.forEach((pg, i) => {
          const delay = (i / NUM_PAGES) * 0.3;
          const pT = Math.max(0, Math.min(1, (phaseT - delay) * 1.4));
          pg.rotation.y =
            TARGET * easeOutQuart(pT) * ((i + 1) / NUM_PAGES) * 0.55;
        });
        bookGroup.rotation.y = -0.15 + e * 0.1;
        bookGroup.position.y = Math.sin(t * 0.5) * 0.06;
        fill.intensity = 4 + e * 5;
        rim.intensity = 3 + e * 4;
        under.intensity = 2 + e * 3;
        if (phaseT >= 1) {
          animPhase = "zoom";
          phaseT = 0;
        }
      }

      if (animPhase === "zoom") {
        phaseT += dt * 0.55;
        if (phaseT > 1) phaseT = 1;
        const e = easeOutQuart(phaseT);
        camera.position.lerpVectors(camStart, camEnd, e);
        camera.lookAt(0, e * 1.5, 0);
        scene.fog = new THREE.FogExp2(0x05050f, 0.016 + e * 0.2);
        frontGroup.rotation.y = TARGET;
        bookGroup.position.y = Math.sin(t * 0.5) * 0.05;
        if (phaseT >= 1) {
          animPhase = "done";
          finished = true;
          onComplete();
        }
      }

      renderer.render(scene, camera);
    }

    tick();
    const kickOff = setTimeout(() => {
      animPhase = "open";
    }, 1100);

    // ── Resize ──────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ─────────────────────────────────────────────────────
    return () => {
      clearTimeout(kickOff);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [onComplete]);

  return (
    <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 9999 }} />
  );
}

// -------------------------------------------------------------------
// ORIGINAL 3D BACKGROUND — unchanged
// -------------------------------------------------------------------
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.25;
    }
  });
  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.2}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.35}
          speed={1.5}
          roughness={0.3}
          metalness={0.7}
        />
      </Sphere>
    </Float>
  );
}

function FloatingParticles() {
  const count = 150;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return positions;
  }, [count]);
  const particlesRef = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (particlesRef.current)
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.03;
  });
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#818cf8"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <spotLight
        position={[0, 15, 0]}
        angle={0.25}
        penumbra={1}
        intensity={0.8}
      />
      <AnimatedSphere />
      <FloatingParticles />
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.8}
      />
      <Environment preset="night" />
    </>
  );
}

// -------------------------------------------------------------------
// ORIGINAL Counter — unchanged
// -------------------------------------------------------------------
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
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
  }, [target]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// -------------------------------------------------------------------
// ORIGINAL FeatureCard — unchanged
// -------------------------------------------------------------------
function FeatureCard({ icon, title, description, index }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
        }}
        className="group relative p-6 sm:p-8 rounded-2xl border border-indigo-500/20 bg-gray-900/50 backdrop-blur-sm hover:border-indigo-500/40 overflow-hidden h-full"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="text-4xl sm:text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 group-hover:text-indigo-300 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" />
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------------------
// MAIN PAGE — original content, zero changes
// -------------------------------------------------------------------
export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const [bookDone, setBookDone] = useState(false);
  const [showPage, setShowPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // When book animation finishes, fade in the page
  const handleBookComplete = () => {
    setBookDone(true);
    setTimeout(() => setShowPage(true), 50);
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap");
        * {
          scroll-behavior: smooth;
          font-family: "Inter", sans-serif;
        }

        @keyframes float-gentle {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
          }
        }
        .glow-button {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(17, 24, 39, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(99, 102, 241, 0.1);
        }
      `}</style>

      {/* ── Book animation overlay (plays first) ── */}
      <AnimatePresence>
        {!bookDone && (
          <motion.div
            key="book-overlay"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <BookAnimation onComplete={handleBookComplete} />
            <div
              style={{
                position: "absolute",
                bottom: "2.5rem",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: "0.72rem",
                color: "rgba(167,139,250,0.45)",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                animation: "float-gentle 2.2s ease-in-out infinite",
                pointerEvents: "none",
              }}
            >
              Opening your world…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Original Narratia page — fades in after book ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showPage ? 1 : 0 }}
        transition={{ duration: 0.9, ease: "easeIn" }}
      >
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black overflow-hidden relative">
          {/* 3D Background */}
          <div className="fixed inset-0 z-0 opacity-60">
            <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
              <Suspense fallback={null}>
                <Scene3D />
                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.3}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Gradient Overlays */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          </div>

          {/* Navigation */}
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
              scrollY > 50 ? "glass-card shadow-lg" : "bg-transparent"
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                <a href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg transform group-hover:scale-105 transition-transform">
                    N
                  </div>
                  <span className="text-xl sm:text-2xl font-semibold text-white">
                    Narratia
                  </span>
                </a>
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    className="hidden sm:block px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </button>
                  <button
                    className="px-5 sm:px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25"
                    onClick={() => router.push("/register")}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </motion.nav>

          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32 pb-16 sm:pb-20">
            <div className="relative z-10 max-w-6xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm font-medium text-indigo-300 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
                AI-Powered Storytelling Platform
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="text-white">Where stories evolve</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  into experiences.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
              >
                Experience the future of storytelling with immersive
                collaboration, AI-powered insights, and real-time team
                synchronization.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
              >
                <button
                  onClick={() => router.push("/register")}
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/30 glow-button"
                >
                  Start Writing for Free
                </button>
                <button className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white glass-card rounded-xl hover:bg-white/5 transition-all">
                  Watch Demo →
                </button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto"
              >
                {[
                  {
                    icon: "✨",
                    value: 10,
                    suffix: "K+",
                    label: "Active Writers",
                  },
                  {
                    icon: "📚",
                    value: 50,
                    suffix: "K+",
                    label: "Stories Created",
                  },
                  { icon: "⚡", value: 99, suffix: "%", label: "Satisfaction" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                    className="glass-card p-6 sm:p-8 rounded-xl text-center"
                  >
                    <div className="text-3xl sm:text-4xl mb-3 animate-float-gentle">
                      {stat.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                      <Counter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section className="relative py-20 sm:py-32 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                  Everything you need to{" "}
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    build stories
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                  Powerful tools designed for writers who think big
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: "🎭",
                    title: "Story Arcs",
                    description:
                      "Organize your narrative into well defined arcs with clear progression and structure",
                  },
                  {
                    icon: "✍️",
                    title: "AI Co-Pilot",
                    description:
                      "Real-time AI assistance that understands your vision and enhances every word.",
                  },
                  {
                    icon: "⚡",
                    title: "Team Collaboration",
                    description:
                      "Instant collaboration with zero-latency team synchronization and real-time editing.",
                  },
                  {
                    icon: "📖",
                    title: "Multi-Format Export",
                    description:
                      "Transform your stories into any format: books, scripts, or screenplays",
                  },
                ].map((feature, index) => (
                  <FeatureCard key={index} {...feature} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-20 sm:py-32 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Ready to start your{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    epic story?
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Join thousands of writers building their worlds on Narratia.
                  Free to start, scales with your ambition.
                </p>
                <button
                  onClick={() => router.push("/register")}
                  className="px-10 sm:px-12 py-4 sm:py-5 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-2xl shadow-indigo-500/30 glow-button"
                >
                  Get Started for Free →
                </button>
              </motion.div>
            </div>
          </section>

          <footer className="relative border-t border-indigo-500/10 py-12 sm:py-16 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              {/* Centered Brand Section */}
              <div className="flex flex-col items-center justify-center text-center mb-12">
                <a
                  href="/"
                  className="flex items-center gap-3 mb-4 group w-fit"
                >
                  <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold transform group-hover:scale-105 transition-transform">
                    N
                  </div>
                  <span className="text-lg font-semibold text-white">
                    Narratia
                  </span>
                </a>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  The AI-powered storytelling platform for writers who dream big
                  and create without limits to give the world some mindblowing stories.
                </p>
              </div>

              {/* Footer Bottom */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-indigo-500/10">
                <p className="text-sm text-gray-600">
                  © 2026 Narratia Inc. All rights reserved.
                </p>
                <div className="flex gap-6">
                  {[
                    "Privacy Policy",
                    "Terms of Service",
                    "Cookie Settings",
                  ].map((item, i) => (
                    <a
                      key={i}
                      href="#"
                      className="text-sm text-gray-600 hover:text-indigo-400 transition-colors"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </footer>
          <div className="h-20" />
        </div>
      </motion.div>
    </>
  );
}
