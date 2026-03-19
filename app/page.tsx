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

// --- Floating Particles ---
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
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.03;
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
        size={0.04}
        color="#818cf8"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// --- 3D Background Scene ---
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

// --- Animated Counter ---
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

  return <span>{count}{suffix}</span>;
}

// --- Feature Card ---
function FeatureCard({ icon, title, description, index }: any) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    cardRef.current.style.transform = `
      perspective(1000px)
      rotateY(${x * 8}deg)
      rotateX(${-y * 8}deg)
      translateZ(10px)
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
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
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

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" />
      </div>
    </motion.div>
  );
}

// --- Main Landing Page ---
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
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          scroll-behavior: smooth;
          font-family: 'Inter', sans-serif;
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }

        @keyframes glow-pulse {
          0%, 100% { 
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
            scrollY > 50
              ? "glass-card shadow-lg"
              : "bg-transparent"
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
              Experience the future of storytelling with immersive collaboration,
              AI-powered insights, and real-time team synchronization.
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
                { icon: "✨", value: 10, suffix: "K+", label: "Active Writers" },
                { icon: "📚", value: 50, suffix: "K+", label: "Stories Created" },
                { icon: "⚡", value: 99, suffix: "%", label: "Satisfaction" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="glass-card p-6 sm:p-8 rounded-xl text-center"
                >
                  <div className="text-3xl sm:text-4xl mb-3 animate-float-gentle">{stat.icon}</div>
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    <Counter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
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
                Join thousands of writers building their worlds on Narratia. Free to start, scales with your ambition.
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

        {/* Footer Spacer */}
        <div className="h-20" />
      </div>
    </>
  );
}