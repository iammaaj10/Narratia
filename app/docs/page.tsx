"use client";

import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

interface DocTopic {
  id: string;
  category: string;
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
      title: "Quick Start Guide",
      badge: "Essential",
      summary: "Learn the core concepts of Narratia and create your first story project in 2 minutes.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            Welcome to <strong>Narratia</strong> — the modern writing ecosystem built for novel writers, screenwriters, and narrative creators. Narratia combines an intuitive rich-text editor with automated AI story memory, plot generator tools, and distraction-free writing modes.
          </p>

          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider block">💡 Core Concept</span>
            <span>Narratia keeps a living <strong>Story Wiki</strong> of your characters, locations, and lore items. When you use AI tools, it automatically references this lore so your world stays consistent.</span>
          </div>

          <h3 className="text-lg font-bold outfit">3-Step Workflow:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">1</div>
              <div className="font-bold text-sm">Generate or Create</div>
              <p className="text-slate-400">Use the AI Outline Generator to build a 3-Act plot structure or create a custom project from scratch.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</div>
              <div className="font-bold text-sm">Write with AI Partner</div>
              <p className="text-slate-400">Type <code className="px-1 py-0.5 rounded bg-black/20 font-mono text-indigo-300">/ai</code> inside the editor to expand prose, polish dialogue, or generate next scenes.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">3</div>
              <div className="font-bold text-sm">Export Anywhere</div>
              <p className="text-slate-400">Export your manuscript to PDF, ePub, Markdown, or Final Draft (.fdx) for screenplays.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "outline-generator",
      category: "AI Engine",
      title: "AI Plot Outline Generator",
      badge: "AI Feature",
      summary: "Generate structured beat-by-beat plot outlines, act breakdowns, and chapter lists from a single premise.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            The <strong>AI Outline Generator</strong> takes your high-level story concept and builds a comprehensive narrative architecture formatted into <strong>Act I</strong>, <strong>Act II</strong>, and <strong>Act III</strong>.
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono space-y-2 text-slate-300">
            <div className="text-slate-500">// Example Prompt Format</div>
            <div className="text-indigo-400">Premise: "A rogue archivist in a cyberpunk city discovers a secret neural key."</div>
            <div className="text-emerald-400">Tone: Dark Sci-Fi Noir | Pacing: Fast-Paced</div>
          </div>

          <h3 className="text-lg font-bold outfit">Converting Outlines to Workspace:</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Once your outline is generated, click <strong>"Convert to Project"</strong>. Narratia will automatically provision a new project in your dashboard, populated with modules for each chapter and pre-formatted scene files.
          </p>
        </div>
      ),
    },
    {
      id: "story-wiki",
      category: "AI Engine",
      title: "Story Wiki & RAG Lore Memory",
      badge: "Core Architecture",
      summary: "How Narratia automatically extracts lore entities and syncs them with vector memory.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            As you write in the editor, Narratia’s background engine continuously parses your text for recurring <strong>Characters</strong>, <strong>Locations</strong>, and <strong>Key Artifacts</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1">
              <span className="font-bold text-amber-400">👤 Characters</span>
              <p className="text-slate-300">Tracks physical traits, psychological motivations, and relationships.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 space-y-1">
              <span className="font-bold text-sky-400">📍 Locations</span>
              <p className="text-slate-300">Stores descriptions of cities, rooms, landmarks, and spatial rules.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-1">
              <span className="font-bold text-emerald-400">🗝️ Artifacts</span>
              <p className="text-slate-300">Logs important weapons, documents, magic items, or technology.</p>
            </div>
          </div>

          <h3 className="text-lg font-bold outfit">RAG Query Integration:</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            When you ask the AI to write or polish text, the RAG (Retrieval-Augmented Generation) layer fetches relevant entities from your Wiki and inserts them as system context into the Gemini API prompt.
          </p>
        </div>
      ),
    },
    {
      id: "slash-commands",
      category: "Editor Tools",
      title: "Slash Commands & AI Toolbar",
      badge: "Interactive",
      summary: "Trigger inline AI transformations directly inside your TipTap text editor.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            You don't need to open side panels to use AI. Simply type <code className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">/</code> anywhere on a blank line or highlight text to invoke the inline AI toolbar.
          </p>

          <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
            <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>INTERACTIVE COMMAND SIMULATOR</span>
              <span className="text-indigo-400">Click a command to test output</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSimulatedCmd("continue")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  simulatedCmd === "continue" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai continue
              </button>
              <button
                onClick={() => setSimulatedCmd("polish")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  simulatedCmd === "polish" ? "bg-purple-600 text-white border-purple-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai polish
              </button>
              <button
                onClick={() => setSimulatedCmd("sensory")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  simulatedCmd === "sensory" ? "bg-emerald-600 text-white border-emerald-500" : "bg-white/5 border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                /ai sensory
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-slate-300 leading-relaxed min-h-[70px] flex items-center">
              {simulatedCmd === "continue" && (
                <span className="text-indigo-300">"The neon rain glistened off Kael's coat as he stepped into the shadowed alleyway, knowing the archivist was waiting..."</span>
              )}
              {simulatedCmd === "polish" && (
                <span className="text-purple-300">"Silence descended upon the docks—heavy, suffused with the scent of ozone and salt."</span>
              )}
              {simulatedCmd === "sensory" && (
                <span className="text-emerald-300">"The cold metal terminal hummed against his fingertips, vibrating with low electrical warmth."</span>
              )}
              {!simulatedCmd && (
                <span className="text-slate-500 italic">Select a slash command above to see live simulated AI generation...</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "screenplay-mode",
      category: "Editor Tools",
      title: "Screenplay & Script Formatting",
      badge: "Hollywood Format",
      summary: "Write feature screenplays with automatic scene sluglines, parentheticals, and Final Draft exports.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            Switch any chapter into <strong>Screenplay Mode</strong> to enable automatic script formatting adhering to industry standards.
          </p>

          <div className="p-4 rounded-xl bg-slate-900 border border-white/10 font-mono text-xs space-y-2">
            <div className="text-slate-400">EXT. DOWNTOWN ALLEY - NIGHT</div>
            <div className="text-slate-300 pl-4">Rain pours onto the cracked asphalt.</div>
            <div className="text-indigo-400 text-center font-bold">KAEL</div>
            <div className="text-slate-400 text-center italic">(whispering)</div>
            <div className="text-slate-200 text-center max-w-xs mx-auto">"We don't have much time before the network resets."</div>
          </div>

          <h3 className="text-lg font-bold outfit">Export Options:</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Screenplays can be exported directly to <strong>Final Draft (.fdx)</strong>, high-resolution PDF, or standard Markdown files.
          </p>
        </div>
      ),
    },
    {
      id: "zen-focus",
      category: "Productivity",
      title: "Zen 3D Focus Mode & Sprints",
      badge: "Flow State",
      summary: "Distraction-free ambient environments and timed writing velocity tracking.",
      content: (
        <div className="space-y-6">
          <p className="text-sm leading-relaxed">
            Enter <strong>Zen 3D Focus Mode</strong> to hide all UI elements and immerse yourself in dynamic 3D particle landscapes that respond to your typing speed.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 space-y-1">
              <span className="font-bold text-indigo-400">🌌 Cosmic Space</span>
              <p className="text-slate-400">Floating starfield nebulae.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/10 space-y-1">
              <span className="font-bold text-sky-400">❄️ Snowfall</span>
              <p className="text-slate-400">Soothing winter snow particles.</p>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-1">
              <span className="font-bold text-amber-400">🔥 Campfire Ember</span>
              <p className="text-slate-400">Warm glowing embers.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "keyboard-shortcuts",
      category: "Reference",
      title: "Keyboard Shortcuts Reference",
      badge: "Cheat Sheet",
      summary: "Speed up your writing workflow with essential keyboard shortcuts.",
      content: (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">Master these keyboard shortcuts to write faster without leaving your keyboard.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Shortcut</th>
                  <th className="py-2.5 px-3">Copy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                <tr>
                  <td className="py-3 px-3 font-medium">Trigger Inline AI Toolbar</td>
                  <td className="py-3 px-3 font-mono text-indigo-400">Ctrl + /  or  /ai</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleCopy("/ai", "shortcut-1")} className="text-xs text-slate-400 hover:text-white">
                      {copiedSnippet === "shortcut-1" ? "Copied! ✓" : "Copy"}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Toggle Zen 3D Focus Mode</td>
                  <td className="py-3 px-3 font-mono text-indigo-400">Ctrl + Shift + Z</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleCopy("Ctrl+Shift+Z", "shortcut-2")} className="text-xs text-slate-400 hover:text-white">
                      {copiedSnippet === "shortcut-2" ? "Copied! ✓" : "Copy"}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Start Writing Sprint</td>
                  <td className="py-3 px-3 font-mono text-indigo-400">Ctrl + Shift + S</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleCopy("Ctrl+Shift+S", "shortcut-3")} className="text-xs text-slate-400 hover:text-white">
                      {copiedSnippet === "shortcut-3" ? "Copied! ✓" : "Copy"}
                    </button>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-medium">Toggle Story Wiki Drawer</td>
                  <td className="py-3 px-3 font-mono text-indigo-400">Ctrl + Shift + W</td>
                  <td className="py-3 px-3">
                    <button onClick={() => handleCopy("Ctrl+Shift+W", "shortcut-4")} className="text-xs text-slate-400 hover:text-white">
                      {copiedSnippet === "shortcut-4" ? "Copied! ✓" : "Copy"}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
        <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md">N</div>
            <span className="font-bold text-xl tracking-tight outfit">Narratia Docs</span>
          </a>
          <div className="flex items-center gap-4">
            <a href="/contact" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Contact Support</a>
            <a href="/login" className={`text-sm font-semibold hover:text-indigo-500 transition-colors ${isLight ? "text-slate-600" : "text-slate-300"}`}>Sign in</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── DOCS CONTAINER ── */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Live Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isLight ? "bg-white border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white">✕</button>
            )}
          </div>

          {/* Navigation Categories */}
          <div className="space-y-4">
            {Array.from(new Set(topics.map((t) => t.category))).map((cat) => (
              <div key={cat} className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">{cat}</div>
                {filteredTopics
                  .filter((t) => t.category === cat)
                  .map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveTopicId(topic.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                        activeTopicId === topic.id
                          ? "bg-indigo-600 text-white font-semibold shadow-sm"
                          : isLight
                          ? "hover:bg-slate-200/60 text-slate-700"
                          : "hover:bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{topic.title}</span>
                      {topic.badge && activeTopicId !== topic.id && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{topic.badge}</span>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Article Content View */}
        <main className="lg:col-span-9">
          <article className={`p-8 rounded-3xl border backdrop-blur-xl space-y-8 ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0b0c10]/90 border-white/10"
          }`}>
            <header className="border-b border-slate-100 dark:border-white/10 pb-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">{activeTopic.category}</span>
                {activeTopic.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium">
                    {activeTopic.badge}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight outfit">{activeTopic.title}</h1>
              <p className="text-sm text-slate-400 leading-relaxed">{activeTopic.summary}</p>
            </header>

            {/* Render Topic Body */}
            <div>{activeTopic.content}</div>

            {/* Helpful Feedback Widget */}
            <footer className="border-t border-slate-100 dark:border-white/10 pt-6 flex items-center justify-between text-xs">
              <span className="text-slate-400">Was this documentation helpful?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHelpfulFeedback("yes")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
                    helpfulFeedback === "yes" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
                  }`}
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setHelpfulFeedback("no")}
                  className={`px-3 py-1.5 rounded-lg border transition-all ${
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
