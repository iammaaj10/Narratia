"use client";

import { useState, useEffect, useRef } from "react";
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
  Terminal,
  ExternalLink,
  Laptop,
  Share2,
  Sliders,
  Feather,
  Edit3,
  Bookmark,
  ChevronDown,
  Command,
  CornerDownLeft,
  X,
  MessageCircle,
  Hash,
  FileCode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubHeading {
  id: string;
  title: string;
}

interface DocTopic {
  id: string;
  category: string;
  categoryIcon: any;
  title: string;
  badge?: string;
  summary: string;
  subheadings: SubHeading[];
  content: React.ReactNode;
}

export default function DocsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [activeTopicId, setActiveTopicId] = useState("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [simulatedCmd, setSimulatedCmd] = useState<string | null>("continue");
  const [codeTab, setCodeTab] = useState<"slash" | "sdk" | "json">("slash");
  const [helpfulFeedback, setHelpfulFeedback] = useState<"yes" | "no" | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const topics: DocTopic[] = [
    {
      id: "quickstart",
      category: "Getting Started",
      categoryIcon: Compass,
      title: "Quick Start Guide",
      badge: "Essential",
      summary: "Understand the core architecture of Narratia and start writing your first story in under 2 minutes.",
      subheadings: [
        { id: "overview", title: "Overview" },
        { id: "core-concept", title: "Living AI Story Memory" },
        { id: "3-step-workflow", title: "3-Step Workflow" },
        { id: "next-steps", title: "Next Steps" },
      ],
      content: (
        <div className="space-y-8">
          <div id="overview" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2 group">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Overview
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              <strong>Narratia</strong> is an advanced story engineering environment tailored for novelists, screenwriters, worldbuilders, and collaborative creative teams. It couples a headless TipTap rich-text canvas with a localized RAG vector lore memory, real-time collaboration, and immersive focus environments.
            </p>
          </div>

          {/* Next.js style Callout */}
          <div id="core-concept" className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4.5 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-neutral-200 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Good to know: Living AI Story Memory</span>
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
              Unlike generic word processors or standard LLM chats, Narratia continuously breaks your story into ~500-word logical chunks and automatically parses entities (characters, locations, relics, rules) into a live <strong>Story Wiki</strong>. When AI actions are requested, relevant lore is dynamically retrieved and injected into prompt context.
            </p>
          </div>

          <div id="3-step-workflow" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              3-Step Workflow
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 space-y-2.5">
                <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center">1</div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Create Project</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Start a <strong>Solo Story</strong> or a <strong>Team Collaboration</strong> project, or generate a 3-Act plot structure with the AI Outline Generator.
                </p>
              </div>

              <div className="p-4.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 space-y-2.5">
                <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center">2</div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Write & Switch Scenes</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Use the sticky editor toolbar, inline slash commands (<code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-neutral-800 dark:text-neutral-300 text-xs">/ai</code>), and instant Scene Switcher controls.
                </p>
              </div>

              <div className="p-4.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 space-y-2.5">
                <div className="w-6 h-6 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-black font-mono font-bold text-xs flex items-center justify-center">3</div>
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Export Anywhere</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Export publication-ready manuscripts to PDF, ePub (eBook), clean Markdown, or industry standard Final Draft (.fdx).
                </p>
              </div>
            </div>
          </div>

          {/* Next.js style Code Window */}
          <div id="next-steps" className="space-y-3">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Quick Commands
            </h2>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-950 text-neutral-200">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/80 text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Interactive Editor Shortcuts</span>
                </div>
                <button
                  onClick={() => handleCopy("/ai continue\nCtrl+Shift+Z\nCtrl+Shift+S", "quick-copy")}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedSnippet === "quick-copy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSnippet === "quick-copy" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="p-4 font-mono text-xs space-y-1.5">
                <div className="text-neutral-500">// Keyboard shortcuts inside TipTap Editor</div>
                <div><span className="text-purple-400">/ai continue</span> <span className="text-neutral-500">→ Continue prose at cursor</span></div>
                <div><span className="text-purple-400">Ctrl + Shift + Z</span> <span className="text-neutral-500">→ Toggle Zen 3D Focus Mode</span></div>
                <div><span className="text-purple-400">Ctrl + Shift + S</span> <span className="text-neutral-500">→ Start Pomodoro Writing Sprint</span></div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "solo-vs-team",
      category: "Getting Started",
      categoryIcon: Compass,
      title: "Solo vs. Team Mode Workflows",
      badge: "Architecture",
      summary: "Understand the differences between solo author linear writing and team-based phase assignments.",
      subheadings: [
        { id: "comparison", title: "Feature Comparison" },
        { id: "solo-mode", title: "Solo Mode Workflow" },
        { id: "team-mode", title: "Team Mode & Roles" },
      ],
      content: (
        <div className="space-y-8">
          <div id="comparison" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Feature Comparison
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Narratia customizes the editor interface based on the project's <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono">is_team</code> flag.
            </p>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                    <th className="py-3 px-4">Feature</th>
                    <th className="py-3 px-4">Solo Story (<code className="font-mono">is_team: false</code>)</th>
                    <th className="py-3 px-4">Team Story (<code className="font-mono">is_team: true</code>)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">Scene Switcher</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">✓ Dropdown + Prev/Next arrows in header</td>
                    <td className="py-3 px-4 text-neutral-400">Disabled (locked to assigned scene)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">Auto-Save Switch</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">✓ Auto-saves before switching scenes</td>
                    <td className="py-3 px-4 text-neutral-400">Manual / background periodic save</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">Collaborator Assignment</td>
                    <td className="py-3 px-4 text-neutral-400">Not required</td>
                    <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-medium">✓ Role-based permissions per scene</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">Team Invites Hub</td>
                    <td className="py-3 px-4 text-neutral-400">Hidden</td>
                    <td className="py-3 px-4 text-purple-600 dark:text-purple-400 font-medium">✓ Realtime invitations & roles panel</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div id="solo-mode" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Solo Mode Workflow
            </h2>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 bg-white dark:bg-neutral-950 space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                When writing as a solo author, jumping between chapters is frictionless. The sticky header includes a scene selector dropdown displaying <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs text-purple-500 font-bold">Scene 1: The Arrival</code> alongside <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs text-neutral-400">&lt;</code> and <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs text-neutral-400">&gt;</code> navigation arrows.
              </p>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
                💡 <strong>Zero Data Loss:</strong> Switching scenes automatically detects dirty editor state and saves your active manuscript before loading the destination scene.
              </div>
            </div>
          </div>

          <div id="team-mode" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Team Mode & Permissions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-1.5">
                <div className="font-bold text-xs text-purple-600 dark:text-purple-400">Co-Author</div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Full editing and writing access to assigned scenes.</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-1.5">
                <div className="font-bold text-xs text-blue-600 dark:text-blue-400">Line Editor</div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Leave comments, suggestion threads, and structural notes.</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 space-y-1.5">
                <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400">Beta Reader</div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">Read-only review permissions with chapter reaction tools.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "rich-text-editor",
      category: "Editor & AI Engine",
      categoryIcon: FileText,
      title: "TipTap Rich-Text Editor & Sticky Suite",
      badge: "Core",
      summary: "Detailed overview of the sticky formatting toolbar, text styling, and custom extensions.",
      subheadings: [
        { id: "sticky-architecture", title: "Sticky Docking System" },
        { id: "formatting-controls", title: "Formatting Controls" },
        { id: "keyboard-shortcuts", title: "Keyboard Shortcuts" },
      ],
      content: (
        <div className="space-y-8">
          <div id="sticky-architecture" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Sticky Docking System
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              The editor architecture ensures editing tools never scroll away during deep writing sessions.
            </p>
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Top App Navbar</span>
                <span className="text-purple-500 font-bold">sticky top-0 z-50 (56px)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Scene Title & Info Bar</span>
                <span className="text-purple-500 font-bold">sticky top-14 z-30 (50px)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>RichTextEditor Toolbar</span>
                <span className="text-purple-500 font-bold">sticky top-[106px] z-20 (46px)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                <span>Side Panels (Comments / Wiki)</span>
                <span className="text-purple-500 font-bold">sticky top-[106px] h-[calc(100vh-106px)]</span>
              </div>
            </div>
          </div>

          <div id="formatting-controls" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Formatting Controls
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center font-medium">
                <strong>Bold / Italic / Strike</strong>
              </div>
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center font-medium">
                <strong>H1, H2, H3 Headers</strong>
              </div>
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center font-medium">
                <strong>Bullet & Ordered Lists</strong>
              </div>
              <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 text-center font-medium">
                <strong>Blockquotes & Code</strong>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "slash-commands",
      category: "Editor & AI Engine",
      categoryIcon: Zap,
      title: "Inline AI Commands (/ai)",
      badge: "Interactive",
      summary: "Trigger inline AI transformations and text expansions directly inside TipTap.",
      subheadings: [
        { id: "simulator", title: "Interactive Simulator" },
        { id: "command-reference", title: "Command Reference" },
      ],
      content: (
        <div className="space-y-8">
          <div id="simulator" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Interactive Simulator
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Type <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-purple-500 font-bold">/</code> on a blank line or highlight any sentence to invoke the inline AI toolbar.
            </p>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-neutral-950 text-white">
              <div className="p-4 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400">Select an inline AI transformation:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSimulatedCmd("continue")}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      simulatedCmd === "continue" ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    /ai continue
                  </button>
                  <button
                    onClick={() => setSimulatedCmd("polish")}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      simulatedCmd === "polish" ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    /ai polish
                  </button>
                  <button
                    onClick={() => setSimulatedCmd("sensory")}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      simulatedCmd === "sensory" ? "bg-purple-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    /ai sensory
                  </button>
                </div>
              </div>

              <div className="p-5 font-mono text-xs leading-relaxed text-neutral-300 min-h-[90px] flex items-center">
                {simulatedCmd === "continue" && (
                  <span className="text-purple-300">"The rain poured over the battlements of Winterhold as Lord Cedric unsheathed his blade, knowing the archivist had not come alone..."</span>
                )}
                {simulatedCmd === "polish" && (
                  <span className="text-blue-300">"Silence descended upon the docks—heavy and suffocating, laced with the sharp tang of salt and ozone."</span>
                )}
                {simulatedCmd === "sensory" && (
                  <span className="text-emerald-300">"The cold steel hilt bit into his palm; the scent of burning pine smoke hung thick in the damp evening air."</span>
                )}
              </div>
            </div>
          </div>

          <div id="command-reference" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Command Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30">
                <code className="font-bold text-purple-600 dark:text-purple-400 font-mono">/ai continue</code>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">Generates the next logical narrative paragraph based on previous scene context.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30">
                <code className="font-bold text-blue-600 dark:text-blue-400 font-mono">/ai polish</code>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">Refines phrasing, eliminates passive voice, and elevates narrative rhythm.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30">
                <code className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">/ai sensory</code>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">Enhances world atmosphere with sight, sound, smell, and tactile details.</p>
              </div>
              <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30">
                <code className="font-bold text-amber-600 dark:text-amber-400 font-mono">/ai dialogue</code>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">Sharpens character voice, subtext, and natural spoken flow.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "story-wiki-memory",
      category: "Editor & AI Engine",
      categoryIcon: BookMarked,
      title: "Story Wiki & Vector RAG Memory",
      badge: "RAG Engine",
      summary: "How Narratia automatically extracts lore entities and indexes scene memory for generative consistency.",
      subheadings: [
        { id: "entity-extraction", title: "Automatic Entity Extraction" },
        { id: "memory-sync", title: "Memory Sync & Vector Search" },
      ],
      content: (
        <div className="space-y-8">
          <div id="entity-extraction" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Automatic Entity Extraction
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              When scenes are saved, background Named Entity Recognition (NER) identifies 5 core lore categories and stores them in <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs">story_entities</code>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 space-y-1">
                <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">👤 Characters</span>
                <p className="text-neutral-600 dark:text-neutral-400">Names, physical traits, motivations, and first appearances.</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">📍 Locations</span>
                <p className="text-neutral-600 dark:text-neutral-400">Cities, landmarks, rooms, and fantasy geography.</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">🗝️ Items & Lore</span>
                <p className="text-neutral-600 dark:text-neutral-400">Weapons, relics, political factions, and magic systems.</p>
              </div>
            </div>
          </div>

          <div id="memory-sync" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Memory Sync & RAG Querying
            </h2>
            <div className="p-4.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              <p>
                Clicking the <strong>Memory Sync (<RefreshCw className="w-3.5 h-3.5 inline text-purple-500" />)</strong> button in the editor triggers a full re-scan. Manuscript chunks are scored with PostgreSQL keyword index matching to feed relevant lore into AI requests.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "focus-and-sprints",
      category: "Productivity",
      categoryIcon: Flame,
      title: "Zen 3D Focus Mode & Sprints",
      badge: "Flow",
      summary: "Full-screen distraction-free typing environments with ambient 3D particles and Pomodoro timers.",
      subheadings: [
        { id: "focus-mode", title: "Zen 3D Focus Mode" },
        { id: "writing-sprints", title: "Writing Sprints & WPM" },
      ],
      content: (
        <div className="space-y-8">
          <div id="focus-mode" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Zen 3D Focus Mode
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Press <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs text-purple-500 font-bold">Ctrl+Shift+Z</code> to enter full-screen distraction-free mode.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 space-y-1">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">🌌 Ambient Particles</span>
                <p className="text-neutral-600 dark:text-neutral-400">Choose between Cosmic Starfield, Winter Snowfall, and Campfire Embers.</p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 space-y-1">
                <span className="font-bold text-neutral-900 dark:text-neutral-100">⌨️ Typewriter Scrolling</span>
                <p className="text-neutral-600 dark:text-neutral-400">Keeps the active sentence vertically centered on your screen.</p>
              </div>
            </div>
          </div>

          <div id="writing-sprints" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Writing Sprints & WPM Tracker
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Set 15, 25, or 45-minute timed sprint goals. Narratia calculates your live Words Per Minute velocity and provides detailed session reports upon completion.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "collaboration-notifications",
      category: "Collaboration",
      categoryIcon: Users,
      title: "Real-Time Notifications & Social Hub",
      badge: "Realtime",
      summary: "Scoped WebSocket notification streams, comment threads, and creator profile showcases.",
      subheadings: [
        { id: "notifications-engine", title: "Real-Time Notification Engine" },
        { id: "creator-hub", title: "Creator Hub & Profiles" },
      ],
      content: (
        <div className="space-y-8">
          <div id="notifications-engine" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Real-Time Notification Engine
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Narratia connects to a user-filtered Supabase WebSocket stream (<code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-xs text-purple-500 font-bold">user_id=eq.$&#123;user.id&#125;</code>) for instantaneous notification delivery with zero database polling.
            </p>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>1-Click Interactive Invites</span>
              </div>
              <p>Project invitations can be accepted or declined directly inside the notification dropdown card without navigating away from your work.</p>
            </div>
          </div>

          <div id="creator-hub" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Creator Hub & WhatsApp-Style Avatar Preview
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Clicking your avatar in the navigation bar opens a sleek preview modal to inspect your picture or upload a new photo live.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "publishing-exports",
      category: "Publishing",
      categoryIcon: Film,
      title: "Screenplay Mode & Export Formats",
      badge: "Exports",
      summary: "Industry standard screenplay auto-formatting and client-side multi-format manuscript exports.",
      subheadings: [
        { id: "screenplay-formatting", title: "Screenplay Formatting" },
        { id: "export-formats", title: "Supported Export Formats" },
      ],
      content: (
        <div className="space-y-8">
          <div id="screenplay-formatting" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Screenplay Formatting
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-400">
              Switching any chapter to Screenplay Mode enforces Hollywood-standard formatting rules:
            </p>

            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 font-mono text-xs bg-neutral-950 text-neutral-200 space-y-1.5">
              <div className="text-neutral-400 font-bold">EXT. ABANDONED OBSERVATORY - NIGHT</div>
              <div className="text-neutral-500 pl-4">A gust of wind sweeps dry leaves across the broken glass dome.</div>
              <div className="text-purple-400 text-center font-bold pt-2">ELENA</div>
              <div className="text-neutral-400 text-center italic">(whispering into her comms)</div>
              <div className="text-neutral-200 text-center max-w-sm mx-auto">"The signal isn't coming from the city. It's coming from above."</div>
            </div>
          </div>

          <div id="export-formats" className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span className="text-neutral-400 dark:text-neutral-600 font-mono text-sm">#</span>
              Supported Export Formats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 text-center font-bold text-neutral-900 dark:text-neutral-100">
                📄 PDF
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 text-center font-bold text-neutral-900 dark:text-neutral-100">
                📚 ePub (eBook)
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 text-center font-bold text-neutral-900 dark:text-neutral-100">
                📝 Markdown
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/30 text-center font-bold text-neutral-900 dark:text-neutral-100">
                🎬 Final Draft (.fdx)
              </div>
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
  const activeIndex = topics.findIndex((t) => t.id === activeTopic.id);
  const prevTopic = activeIndex > 0 ? topics[activeIndex - 1] : null;
  const nextTopic = activeIndex < topics.length - 1 ? topics[activeIndex + 1] : null;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      isLight ? "bg-white text-neutral-900" : "bg-[#000000] text-neutral-100"
    }`}>
      {/* ── 1. NARRATIA BRANDED TOP NAVBAR ── */}
      <header className={`sticky top-0 z-40 h-14 sm:h-16 w-full border-b backdrop-blur-xl transition-colors ${
        isLight ? "bg-white/85 border-slate-200" : "bg-[#040408]/90 border-white/[0.08]"
      }`}>
        <div className="max-w-[1536px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Narratia Logo + Navigation Links */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
                <span className="text-white font-extrabold text-sm sm:text-base tracking-tight">N</span>
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors">
                Narratia
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                Docs
              </span>
            </a>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <a
                href="/docs"
                className="px-3 py-1.5 rounded-lg text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-500/15 border border-purple-200/80 dark:border-purple-500/20"
              >
                Documentation
              </a>
              <a
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all"
              >
                Dashboard
              </a>
              <a
                href="/community"
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all"
              >
                Showcase
              </a>
              <a
                href="/contact"
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-white/5 transition-all"
              >
                Support
              </a>
            </nav>
          </div>

          {/* Right: Quick Search Bar + Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className={`flex items-center justify-between gap-3 px-3 py-1.5 w-40 sm:w-60 rounded-xl border text-xs text-slate-500 dark:text-slate-400 transition-all cursor-pointer shadow-sm ${
                isLight
                  ? "bg-slate-100/80 hover:bg-slate-200/60 border-slate-200"
                  : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 shrink-0 text-purple-500" />
                <span className="truncate">Search docs...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/10 font-mono text-[10px] text-slate-500 dark:text-slate-300">
                <span>⌘</span>K
              </kbd>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── 2. NEXT.JS 3-COLUMN MAIN LAYOUT ── */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 flex">
        
        {/* ── LEFT SIDEBAR (NAVIGATION TREE) ── */}
        <aside className={`hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto py-8 pr-6 border-r transition-colors ${
          isLight ? "border-neutral-200" : "border-neutral-800"
        }`}>
          <div className="space-y-6 text-[13px]">
            {Array.from(new Set(topics.map((t) => t.category))).map((cat) => (
              <div key={cat} className="space-y-1.5">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 text-xs px-2 mb-2 tracking-tight">
                  {cat}
                </h4>
                <div className="space-y-0.5 border-l border-neutral-200 dark:border-neutral-800 ml-2 pl-2">
                  {topics
                    .filter((t) => t.category === cat)
                    .map((topic) => {
                      const isActive = activeTopicId === topic.id;
                      return (
                        <button
                          key={topic.id}
                          onClick={() => setActiveTopicId(topic.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md transition-all flex items-center justify-between text-[13px] cursor-pointer ${
                            isActive
                              ? "font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/15"
                              : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                          }`}
                        >
                          <span className="truncate">{topic.title}</span>
                          {topic.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                              {topic.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── CENTER CONTENT ARTICLE ── */}
        <main className="flex-1 min-w-0 py-8 lg:px-12 max-w-4xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-4 font-mono">
            <span>Docs</span>
            <span>/</span>
            <span>{activeTopic.category}</span>
            <span>/</span>
            <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{activeTopic.title}</span>
          </div>

          {/* Title & Summary */}
          <div className="space-y-3 pb-8 border-b border-neutral-200 dark:border-neutral-800 mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              {activeTopic.title}
            </h1>
            <p className="text-[16px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {activeTopic.summary}
            </p>
          </div>

          {/* Topic Body Content */}
          <div className="space-y-8">
            {activeTopic.content}
          </div>

          {/* Previous / Next Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-12 mt-12 border-t border-neutral-200 dark:border-neutral-800">
            {prevTopic ? (
              <button
                onClick={() => setActiveTopicId(prevTopic.id)}
                className={`p-4 rounded-xl border text-left transition-all group cursor-pointer ${
                  isLight ? "bg-white hover:bg-neutral-50 border-neutral-200" : "bg-neutral-950 hover:bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="text-xs text-neutral-500 flex items-center gap-1 mb-1">
                  <span>←</span> Previous
                </div>
                <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-purple-500 transition-colors">
                  {prevTopic.title}
                </div>
              </button>
            ) : <div />}

            {nextTopic && (
              <button
                onClick={() => setActiveTopicId(nextTopic.id)}
                className={`p-4 rounded-xl border text-right transition-all group cursor-pointer ${
                  isLight ? "bg-white hover:bg-neutral-50 border-neutral-200" : "bg-neutral-950 hover:bg-neutral-900 border-neutral-800"
                }`}
              >
                <div className="text-xs text-neutral-500 flex items-center justify-end gap-1 mb-1">
                  Next <span>→</span>
                </div>
                <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-purple-500 transition-colors">
                  {nextTopic.title}
                </div>
              </button>
            )}
          </div>

          {/* Helpful Feedback Widget */}
          <div className="pt-8 mt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
            <span>Was this documentation page helpful?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHelpfulFeedback("yes")}
                className={`px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                  helpfulFeedback === "yes" ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 font-semibold" : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setHelpfulFeedback("no")}
                className={`px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
                  helpfulFeedback === "no" ? "bg-rose-500/10 border-rose-500 text-rose-500 font-semibold" : "bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ("ON THIS PAGE" TOC) ── */}
        <aside className={`hidden xl:block w-64 shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto py-8 pl-6 border-l transition-colors ${
          isLight ? "border-neutral-200" : "border-neutral-800"
        }`}>
          <div className="space-y-4 text-xs">
            <h4 className="font-semibold text-neutral-900 dark:text-neutral-200 uppercase tracking-wider text-[11px] font-mono">
              On this page
            </h4>
            <div className="space-y-2 text-neutral-600 dark:text-neutral-400">
              {activeTopic.subheadings.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => scrollToHeading(sub.id)}
                  className="block w-full text-left hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors truncate cursor-pointer"
                >
                  {sub.title}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── 3. SPOTLIGHT COMMAND PALETTE SEARCH MODAL (Cmd+K) ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
                isLight ? "bg-white border-neutral-200" : "bg-[#0a0a0a] border-neutral-800 text-white"
              }`}
            >
              {/* Search Header */}
              <div className="flex items-center px-4 border-b border-neutral-200 dark:border-neutral-800">
                <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search documentation, features, guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-4 text-sm bg-transparent border-none focus:outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Results List */}
              <div className="p-2 max-h-80 overflow-y-auto space-y-1">
                {filteredTopics.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => {
                        setActiveTopicId(topic.id);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        isLight ? "hover:bg-neutral-100" : "hover:bg-neutral-900"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-mono text-purple-500 uppercase">{topic.category}</div>
                        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{topic.title}</div>
                        <div className="text-xs text-neutral-500 line-clamp-1">{topic.summary}</div>
                      </div>
                      <CornerDownLeft className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>

              {/* Search Footer */}
              <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <div className="flex items-center gap-2">
                  <span>Navigation:</span>
                  <kbd className="px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700">ESC to close</kbd>
                </div>
                <span>Next.js Documentation Style</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
