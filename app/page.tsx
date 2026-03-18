"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, Float, Environment, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

// --- 3D Animated Sphere ---
function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 100]} scale={2.5}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

// --- Floating Particles (FIXED) ---
function FloatingParticles() {
  const count = 200;
  
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, [count]);

  const particlesRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#a855f7"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// --- 3D Background Scene ---
function Scene3D() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />
      <AnimatedSphere />
      <FloatingParticles />
      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Environment preset="night" />
    </>
  );
}

// --- 3D Card Component ---
function Card3D({ children, delay = 0, className = "" }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.8,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        rotateX: 5,
        z: 50,
        transition: { duration: 0.3 },
      }}
      className={`perspective-1000 ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </motion.div>
  );
}

// --- Animated Counter ---
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [target]);

  return <span>{count}{suffix}</span>;
}

// --- Feature Card with 3D Effect ---
function FeatureCard3D({ icon, title, description, index }: any) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateY(${x * 20}deg)
      rotateX(${-y * 20}deg)
      translateZ(30px)
    `;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `
        perspective(1000px)
        rotateY(0deg)
        rotateX(0deg)
        translateZ(0px)
      `;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, z: -100 }}
      animate={{ opacity: 1, scale: 1, z: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.3s ease-out",
        }}
        className="group relative p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-gray-900/90 to-indigo-900/40 backdrop-blur-xl overflow-hidden cursor-pointer h-full"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative z-10" style={{ transform: "translateZ(50px)" }}>
          <div className="text-6xl mb-6 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
            {icon}
          </div>
          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
            {description}
          </p>
        </div>

        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700" />
      </div>
    </motion.div>
  );
}

// --- Main Landing Page ---
export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&display=swap');
        
        * {
          scroll-behavior: smooth;
          font-family: 'Orbitron', sans-serif;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }

        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.5),
                        0 0 60px rgba(139, 92, 246, 0.3),
                        inset 0 0 30px rgba(139, 92, 246, 0.2);
          }
          50% { 
            box-shadow: 0 0 50px rgba(139, 92, 246, 0.8),
                        0 0 100px rgba(139, 92, 246, 0.5),
                        inset 0 0 50px rgba(139, 92, 246, 0.4);
          }
        }

        .glow-intense {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .glass-morphism {
          background: rgba(17, 25, 40, 0.75);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.125);
        }
      `}</style>

      <div className="min-h-screen bg-black overflow-hidden relative">
        {/* 3D Background */}
        <div className="fixed inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
            <Suspense fallback={null}>
              <Scene3D />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Cursor Follower Glow */}
        <div
          className="fixed w-96 h-96 rounded-full pointer-events-none z-50 mix-blend-screen"
          style={{
            background: `radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)`,
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />

        {/* Navigation */}
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
            scrollY > 50
              ? "glass-morphism shadow-2xl shadow-indigo-500/20"
              : "bg-transparent"
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <motion.a
                href="/"
                className="flex items-center gap-3 group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl glow-intense transform group-hover:rotate-12 transition-transform">
                  N
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent">
                  NARRATIA
                </span>
              </motion.a>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, rotateZ: 2 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden sm:block px-6 py-3 text-sm font-semibold text-white hover:text-indigo-300 transition-all rounded-xl hover:bg-white/5"
                  onClick={() => router.push("/login")}
                >
                  SIGN IN
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, rotateZ: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 text-sm font-bold text-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-xl glow-intense"
                  onClick={() => router.push("/register")}
                >
                  START FREE
                </motion.button>
              </div>
            </div>
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, type: "spring", bounce: 0.5 }}
              className="inline-flex items-center gap-3 px-6 py-3 glass-morphism rounded-full text-sm font-bold text-indigo-300 mb-12 glow-intense"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </span>
              AI-POWERED STORYTELLING REVOLUTION
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            >
              <span className="text-white">Where stories evolve</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                 into experiences.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Experience the future of storytelling with immersive collaboration,
              AI-powered insights, and real-time team synchronization.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotateZ: 2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push("/register")}
                className="group relative px-12 py-5 text-lg font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl overflow-hidden glow-intense"
              >
                <span className="relative z-10">ENTER THE MATRIX</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 text-lg font-bold text-white glass-morphism rounded-2xl border border-indigo-500/50 hover:border-indigo-400 transition-all"
              >
                WATCH DEMO ▶
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
            >
              {[
                { icon: "⭐", value: 10, suffix: "K+", label: "ACTIVE WRITERS" },
                { icon: "📚", value: 50, suffix: "K+", label: "STORIES CREATED" },
                { icon: "🚀", value: 99, suffix: "%", label: "SATISFACTION" },
              ].map((stat, i) => (
                <Card3D key={i} delay={1 + i * 0.1}>
                  <div className="glass-morphism p-8 rounded-2xl border border-indigo-500/30 text-center">
                    <div className="text-5xl mb-4 animate-float-slow">{stat.icon}</div>
                    <div className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                      <Counter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="text-sm text-gray-400 font-bold">{stat.label}</div>
                  </div>
                </Card3D>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                QUANTUM-POWERED{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  FEATURES
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Next-generation tools that bend reality to your creative will
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: "🎭",
                  title: "STORY ARCS",
                  description:
                    "Organize your narrative into well defined arcs with clear progression and structure",
                },
                {
                  icon: "🤖",
                  title: "AI CO-PILOT",
                  description:
                    "Real-time AI assistance that understands your vision and enhances every word.",
                },
                {
                  icon: "⚡",
                  title: "QUANTUM SYNC",
                  description:
                    "Instant collaboration across dimensions with zero-latency team synchronization.",
                },
                {
                  icon: "🌌",
                  title: "REALITY EXPORT",
                  description:
                    "Transform your stories into any format: books, scripts, or screen play",
                },
              ].map((feature, index) => (
                <FeatureCard3D key={index} {...feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                READY TO{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                  TRANSCEND REALITY?
                </span>
              </h2>
              <p className="text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Join the revolution. Your epic story awaits in the quantum realm.
              </p>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/register")}
                className="px-16 py-6 text-xl font-black text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl glow-intense"
              >
                LAUNCH INTO NARRATIA →
              </motion.button>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}