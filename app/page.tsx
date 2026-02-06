"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const [scrollY, setScrollY] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-950">
        {/* Navigation */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            scrollY > 50
              ? "bg-gray-950/95 backdrop-blur-md shadow-gray-900/50"
              : "bg-gray-950/80 backdrop-blur-sm"
          } border-b border-gray-800`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-8">
                <a href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    N
                  </div>
                  <span className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    Narratia
                  </span>
                </a>
              </div>

              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
                <button
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  onClick={() => router.push("/register")}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-sm font-medium text-indigo-400 mb-8 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Collaborative Storytelling Platform
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
                Where stories are
                <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  built together
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-100">
                Create, organize, and develop long-form stories in a structured
                way. Build epic narratives solo or with your team.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up animation-delay-200">
                <button
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => router.push("/register")}
                >
                  Start writing for free
                </button>
               </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 animate-fade-in-up animation-delay-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span>
                    <strong className="text-white">10K+</strong> active writers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📚</span>
                  <span>
                    <strong className="text-white">50K+</strong> stories created
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✨</span>
                  <span>
                    <strong className="text-white">Free</strong> to start
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Everything you need to build stories
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Powerful tools designed specifically for writers who think big
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: "📚",
                  title: "Story Arcs",
                  description:
                    "Organize your narrative into well-defined arcs with clear progression and structure.",
                },
                {
                  icon: "✍️",
                  title: "Collaborative Writing",
                  description:
                    "Write together in real-time or async. Comment, suggest, and build worlds as a team.",
                },
                {
                  icon: "📖",
                  title: "Chapter Management",
                  description:
                    "Break arcs into phases and chapters. Track progress with version control built in.",
                },
                {
                  icon: "🎯",
                  title: "Solo or Team",
                  description:
                    "Create private projects or invite your writing team. Full permission management.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl border border-gray-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 bg-gray-900 hover:bg-gradient-to-br hover:from-indigo-500/10 hover:to-purple-500/10"
                >
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                From idea to epic in three steps
              </h2>
              <p className="text-xl text-gray-400">
                Get started in minutes, scale to novels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "1",
                  title: "Create your project",
                  description:
                    "Start a new story project. Choose solo writing or invite your team.",
                },
                {
                  step: "2",
                  title: "Structure your story",
                  description:
                    "Break it into arcs and chapters. Organize your narrative flow.",
                },
                {
                  step: "3",
                  title: "Write and collaborate",
                  description:
                    "Start writing. Get feedback. Iterate. Build something amazing.",
                },
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl font-bold mb-6 shadow-lg">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Redesigned for Dark Theme */}
        <section className="relative py-32 px-6 overflow-hidden bg-gray-950">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>

          {/* Gradient Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
          </div>

          {/* Content */}
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-indigo-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-full text-sm font-medium text-indigo-400">
              ✨ Join the storytelling revolution
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Ready to start your{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                epic story?
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-400 mb-12 leading-relaxed max-w-3xl mx-auto">
              Join thousands of writers building their worlds on Narratia. Free
              to start, scales with your ambition.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => router.push("/register")}
                className="group relative w-full sm:w-auto px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 transform hover:-translate-y-1 hover:scale-105"
              >
                Get started for free
              </button>
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse-slow {
            0%,
            100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.5;
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }

          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }

          .animation-delay-100 {
            animation-delay: 0.1s;
            animation-fill-mode: backwards;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
            animation-fill-mode: backwards;
          }

          .animation-delay-300 {
            animation-delay: 0.3s;
            animation-fill-mode: backwards;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .bg-grid-pattern {
            background-image:
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              );
            background-size: 50px 50px;
          }
        `}</style>
      </div>
    </>
  );
}
