"use client";

import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import {
  BookOpen,
  Sparkles,
  Wand2,
  Users,
  Film,
  Flame,
  Maximize,
  History,
  MessageSquare,
  Search,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  BookMarked,
  Layers,
  Zap,
  Lock,
  FileText,
  Copy,
  Check,
  Compass,
  ArrowLeft,
  RefreshCw,
  Clock,
  Shield,
  HelpCircle,
} from "lucide-react";

interface DocTopic {
  id: string;
  category: string;
  categoryIcon: any;
  title: string;
  badge?: string;
  summary: string;
  content: React.ReactNode;
}

export default function DocsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeTopicId, setActiveTopicId] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [simulatedCmd, setSimulatedCmd] = useState<string | null>(null);
  const [helpfulFeedback, setHelpfulFeedback] = useState<"yes" | "no" | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const topics: DocTopic[] = [
    {
      id: "quickstart",
      category: "Getting Started",
      categoryIcon: Compass,
      title: "Quick Start Guide",
      badge: "Essential",
      summary: "Learn how Narratia works and start writing your first novel or screenplay in 2 minutes.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Welcome to <strong>Narratia</strong> — an advanced, distraction-free storytelling workspace built for authors, novelists, screenwriters, and creative teams. Narratia combines an interactive TipTap text editor with context-aware AI memory, real-time collaboration, and immersive focus environments.
          </p>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs sm:text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>Core Concept: Living AI Memory</span>
            </div>
            <p className="leading-relaxed">
              Narratia automatically extracts <strong>Characters, Locations, and Artifacts</strong> from your scenes into a living <strong>Story Wiki</strong>. When you invoke AI features, Narratia injects your lore into the AI prompt so your story stays 100% consistent!
            </p>
          </div>

          <h3 className="text-lg font-bold outfit text-slate-900 dark:text-white pt-2">3-Step Workflow to Launch Your Story:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs">1</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Create Project</div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                Start a <strong>Solo Story</strong> or a <strong>Team Collaboration</strong> project. You can also generate a full 3-Act plot structure with the AI Outline Generator.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs">2</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Write & Switch Scenes</div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                Use the sticky formatting toolbar, inline AI slash commands (<code className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">/ai</code>), and quick Scene Switcher controls.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-extrabold flex items-center justify-center text-xs">3</div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">Export & Publish</div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
                Export your manuscript to PDF, ePub, Markdown, or Final Draft (.fdx) format when ready.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "solo-vs-team",
      category: "Getting Started",
      categoryIcon: Compass,
      title: "Solo vs. Team Mode & Scene Navigation",
      badge: "Workflow",
      summary: "Understand project modes and how scene switching works for Solo and Team projects.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Narratia supports two distinct project workflows designed specifically for individual authors vs. collaborative teams.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Solo Mode */}
            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-600 dark:text-purple-300 text-base">📖 Solo Mode</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">Default</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Designed for single authors. Includes the <strong>Inline Scene Switcher</strong> inside the editor header!
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Scene Dropdown selector in editor sticky bar</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>1-click <strong>Previous (`&lt;`)</strong> and <strong>Next (`&gt;`)</strong> scene navigation</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Automatic auto-save when switching scenes</span>
                </li>
              </ul>
            </div>

            {/* Team Mode */}
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-600 dark:text-indigo-300 text-base">👥 Team Mode</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Collaborative</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Designed for multi-author writers room. Team members work strictly on scenes assigned to them.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Assign specific scenes/phases to team members</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Prevents accidental overwrite of co-authors' work</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Role-based permissions (Editor, Co-Author, Beta Reader)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ai-writing-partner",
      category: "AI Engine",
      categoryIcon: Sparkles,
      title: "AI Writing Partner & Lore Sync",
      badge: "AI Feature",
      summary: "How to use the AI Writing Partner sidebar and auto-sync story memory.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Click the <strong>AI button (`Wand2`)</strong> in the editor header to open your <strong>AI Writing Partner</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">Key Capabilities:</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Simultaneous Editing:</strong> The AI sidebar opens without any dimming or backdrop blur so you can edit text and chat with the AI at the same time!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Plot & Dialogue Advice:</strong> Ask for plot twists, character reactions, dialogue fixes, or scene pacing ideas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Lore Memory Sync:</strong> Click the <strong>Memory (`RefreshCw`)</strong> button to re-scan your scenes and update the AI vector database.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "story-wiki",
      category: "AI Engine",
      categoryIcon: Sparkles,
      title: "Story Wiki & Entity Extraction",
      badge: "Core Lore",
      summary: "Automatic lore extraction for characters, locations, items, events, and concepts.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Click the <strong>BookMarked icon</strong> in the editor toolbar to toggle the <strong>Story Wiki Drawer</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 space-y-1">
              <span className="font-bold text-purple-400 text-sm">👤 Characters</span>
              <p className="text-slate-400 leading-relaxed">Tracks character names, traits, and first appearances.</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <span className="font-bold text-emerald-400 text-sm">📍 Locations</span>
              <p className="text-slate-400 leading-relaxed">Stores cities, buildings, rooms, and fantasy worlds.</p>
            </div>
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-1">
              <span className="font-bold text-amber-400 text-sm">🗝️ Items & Lore</span>
              <p className="text-slate-400 leading-relaxed">Logs weapons, relic documents, magic items, and events.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "slash-commands",
      category: "Editor Tools",
      categoryIcon: FileText,
      title: "Slash Commands & Formatting Toolbar",
      badge: "Editor",
      summary: "Trigger inline AI transformations and text formatting directly inside the editor.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Type <code className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">/</code> on a blank line or highlight any sentence to open the inline AI toolbar.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>TRY INLINE COMMAND GENERATOR</span>
              <span className="text-purple-400">Click to preview</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSimulatedCmd("continue")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  simulatedCmd === "continue" ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai continue
              </button>
              <button
                onClick={() => setSimulatedCmd("polish")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  simulatedCmd === "polish" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai polish
              </button>
              <button
                onClick={() => setSimulatedCmd("sensory")}
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                  simulatedCmd === "sensory" ? "bg-emerald-600 text-white border-emerald-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai sensory
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-slate-300 leading-relaxed min-h-[70px] flex items-center">
              {simulatedCmd === "continue" && (
                <span className="text-purple-300">"The neon rain glistened off Kael's coat as he stepped into the shadowed alleyway..."</span>
              )}
              {simulatedCmd === "polish" && (
                <span className="text-indigo-300">"Silence descended upon the docks—heavy, suffused with the scent of ozone and salt."</span>
              )}
              {simulatedCmd === "sensory" && (
                <span className="text-emerald-300">"The cold metal terminal hummed against his fingertips, vibrating with low electrical warmth."</span>
              )}
              {!simulatedCmd && (
                <span className="text-slate-500 italic">Select a slash command above to see live simulated generation...</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "focus-and-sprints",
      category: "Productivity",
      categoryIcon: Flame,
      title: "Zen 3D Focus Mode & Writing Sprints",
      badge: "Flow State",
      summary: "Distraction-free ambient environments, Pomodoro timers, and live WPM tracking.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Boost your writing velocity with built-in productivity companions designed for authors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-500 text-base">
                <Flame className="w-5 h-5" />
                <span>Writing Sprint Companion</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Set a 15, 25, or 45-minute timed sprint goal. Tracks your <strong>Words Per Minute (WPM)</strong> and total words written in real time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-500 text-base">
                <Maximize className="w-5 h-5" />
                <span>Zen 3D Focus Mode</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Hides all UI distractions and lets you write against immersive 3D particle backgrounds (Galaxy, Snowfall, Ember Storm, Typewriter mode).
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "collaboration-notifications",
      category: "Collaboration",
      categoryIcon: Users,
      title: "Team Invites, Roles & Real-Time Notifications",
      badge: "Realtime",
      summary: "Manage team invitations, role permissions, inline comments, and notifications.",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Narratia features a real-time notification engine scoped to your user account.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/10 space-y-3 text-xs text-slate-300">
            <div className="font-bold text-purple-400 text-sm">Notification Types:</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">Invite</span>
                <span>Receive collaboration invitations with 1-click Accept / Decline buttons directly in your notification bell.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">Comments</span>
                <span>Get notified whenever a co-author leaves or replies to a comment on your scenes.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Assignments</span>
                <span>Instant alert when a scene or module is assigned to you in Team mode.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "screenplay-and-exports",
      category: "Publishing",
      categoryIcon: Film,
      title: "Screenplay Mode & Export Options",
      badge: "Publishing",
      summary: "Format feature scripts and export to PDF, ePub, Markdown, or Final Draft (.fdx).",
      content: (
        <div className="space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Export your stories anytime into industry-standard publishing formats.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-purple-400 bg-purple-500/5">
              📄 PDF
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-indigo-400 bg-indigo-500/5">
              📚 ePub (eBook)
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-emerald-400 bg-emerald-500/5">
              📝 Markdown
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/10 text-center font-bold text-pink-400 bg-pink-500/5">
              🎬 Final Draft (.fdx)
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTopic = topics.find((t) => t.id === activeTopicId) || topics[0];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"}`}>
      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
        isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className={`flex items-center gap-1.5 text-xs font-semibold hover:text-purple-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </a>
            <div className="h-5 w-px bg-slate-200 dark:bg-white/10" />
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center font-extrabold text-sm text-white shadow-md shadow-purple-500/20">N</div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight outfit">Narratia Docs</span>
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/contact" className={`hidden sm:block text-xs font-semibold hover:text-purple-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Support</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── MAIN DOCS LAYOUT ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Live Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-8 py-2.5 rounded-2xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-white/[0.04] border-white/10 text-white"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white">✕</button>
            )}
          </div>

          {/* Navigation Categories */}
          <div className="space-y-5">
            {Array.from(new Set(topics.map((t) => t.category))).map((cat) => (
              <div key={cat} className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-gray-400 px-3 py-1.5 flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-purple-500" />
                  <span>{cat}</span>
                </div>
                {filteredTopics
                  .filter((t) => t.category === cat)
                  .map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveTopicId(topic.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer ${
                        activeTopicId === topic.id
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20"
                          : isLight
                          ? "hover:bg-slate-200/60 text-slate-700"
                          : "hover:bg-white/5 text-slate-300 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{topic.title}</span>
                      {topic.badge && activeTopicId !== topic.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold shrink-0 ml-2">
                          {topic.badge}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Article Reader View */}
        <main className="lg:col-span-9">
          <article className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl space-y-6 ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0c0b14]/90 border-white/10"
          }`}>
            {/* Article Header */}
            <header className="border-b border-slate-200 dark:border-white/10 pb-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-bold">{activeTopic.category}</span>
                {activeTopic.badge && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold">
                    {activeTopic.badge}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight outfit text-slate-900 dark:text-white">{activeTopic.title}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{activeTopic.summary}</p>
            </header>

            {/* Article Content */}
            <div className="pt-2">{activeTopic.content}</div>

            {/* Helpful Feedback Widget */}
            <footer className="border-t border-slate-200 dark:border-white/10 pt-6 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-gray-400 font-medium">Was this guide helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHelpfulFeedback("yes")}
                  className={`px-3 py-1.5 rounded-xl border transition-all font-semibold cursor-pointer ${
                    helpfulFeedback === "yes" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                  }`}
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setHelpfulFeedback("no")}
                  className={`px-3 py-1.5 rounded-xl border transition-all font-semibold cursor-pointer ${
                    helpfulFeedback === "no" ? "bg-rose-500/20 border-rose-500 text-rose-400" : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                  }`}
                >
                  👎 No
                </button>
              </div>
            </footer>
          </article>
        </main>
      </div>
    </div>
  );
}
