"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { X, Sparkles } from "lucide-react";
import ZenBackground from "./ZenBackground";
import { analyzeParagraphEmotion } from "@/lib/ai/geminiClient";

type Theme = "light" | "dark" | "sepia" | "zen";

type FocusModeEditorProps = {
  content: string;
  onChange: (content: string) => void;
  onExit: () => void;
  wordCount: number;
  charCount: number;
};

export default function FocusModeEditor({
  content,
  onChange,
  onExit,
  wordCount,
  charCount,
}: FocusModeEditorProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(0);
  const [emotionColor, setEmotionColor] = useState("#6366f1");
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Typing speed tracking
  const keystrokes = useRef<number>(0);
  
  // Emotion tracking
  const lastAnalyzedText = useRef<string>("");

  const editor = useEditor({
    immediatelyRender: false, // ← ADD THIS LINE
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your story...",
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: "focus:outline-none max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      keystrokes.current = Math.min(keystrokes.current + 1, 30); // Cap max burst
    },
  });

  // Typing speed decay loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (keystrokes.current > 0) {
        setTypingSpeed(Math.min(keystrokes.current / 20, 1)); // Max speed at 20 strokes per 100ms interval? No, that's too much. Wait, keystrokes accumulate over 100ms.
        keystrokes.current = Math.max(keystrokes.current - 1, 0); // Decay by 1 every 100ms (10 chars per second)
      } else {
        setTypingSpeed(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Debounced emotion analysis (every 10 seconds if text changed)
  useEffect(() => {
    if (theme !== "zen") return;
    
    const analyzeText = async () => {
      if (!editor) return;
      const text = editor.getText();
      const lastChars = text.slice(-300); // Only analyze the last ~50 words to be fast
      
      if (lastChars.length > 50 && lastChars !== lastAnalyzedText.current) {
        lastAnalyzedText.current = lastChars;
        const color = await analyzeParagraphEmotion(lastChars);
        setEmotionColor(color);
      }
    };

    const interval = setInterval(analyzeText, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [theme, editor]);

  // Typewriter mode - keep cursor centered
  useEffect(() => {
    if (!typewriterMode || !editor) return;

    const handleScroll = () => {
      const editorElement = editorRef.current?.querySelector(".ProseMirror");
      if (!editorElement) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const targetY = viewportHeight / 2;

      const scrollOffset = rect.top - targetY;
      if (Math.abs(scrollOffset) > 50) {
        editorRef.current?.scrollBy({
          top: scrollOffset,
          behavior: "smooth",
        });
      }
    };

    editor.on("selectionUpdate", handleScroll);
    return () => {
      editor.off("selectionUpdate", handleScroll);
    };
  }, [typewriterMode, editor]);

  // ESC to exit
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onExit]);

  // Theme classes
  const themeClasses = {
    light: "bg-white text-gray-900",
    dark: "bg-gray-950 text-gray-100",
    sepia: "bg-[#f4ecd8] text-[#5c4a3a]",
    zen: "bg-transparent text-gray-100", // Transparent to show 3D background
  };

  const editorThemeClasses = {
    light: "prose-gray",
    dark: "prose-invert",
    sepia: "prose-stone",
    zen: "prose-invert",
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Hide body scrollbar to prevent double scrollbars
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] ${themeClasses[theme]} transition-colors duration-300`}
    >
      {theme === "zen" && (
        <ZenBackground typingSpeed={typingSpeed} emotionColor={emotionColor} />
      )}
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between opacity-100 transition-opacity duration-300 z-50 bg-[#02020a]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg p-2">
            <button
              onClick={() => setTheme("light")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                theme === "light"
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                theme === "dark"
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                theme === "sepia"
                  ? "bg-[#f4ecd8] text-[#5c4a3a]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📜 Sepia
            </button>
            <button
              onClick={() => setTheme("zen")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors ${
                theme === "zen"
                  ? "bg-purple-600/50 text-white border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-purple-400 hover:text-purple-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Zen 3D
            </button>
          </div>

          {/* Typewriter Mode Toggle */}
          <button
            onClick={() => setTypewriterMode(!typewriterMode)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
              typewriterMode
                ? "bg-purple-500 text-white"
                : "bg-black/20 backdrop-blur-sm text-gray-300 hover:bg-black/30"
            }`}
          >
            ⌨️ Typewriter {typewriterMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* Exit Button */}
        <button
          onClick={onExit}
          className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-lg text-gray-300 hover:bg-black/30 transition-colors"
        >
          <X className="w-4 h-4" />
          Exit Focus Mode (ESC)
        </button>
      </div>

      {/* Editor Container */}
      <div
        ref={editorRef}
        className="relative h-full overflow-y-auto flex items-center justify-center px-8 py-20 z-10"
      >
        <div className="w-full max-w-4xl">
          <EditorContent
            editor={editor}
            className={`
              focus-mode-editor
              prose
              max-w-none
              ${editorThemeClasses[theme]}
              text-lg leading-relaxed
            `}
          />
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3 text-sm pointer-events-auto shadow-lg">
          <span className="text-gray-300">
            {wordCount.toLocaleString()} words • {charCount.toLocaleString()}{" "}
            characters
          </span>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .focus-mode-editor .ProseMirror {
          min-height: 100vh;
          padding: 7rem 0 6rem 0;
        }

        .focus-mode-editor .ProseMirror:focus {
          outline: none;
        }

        .focus-mode-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }

        .focus-mode-editor h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 1.5rem;
        }

        .focus-mode-editor h2 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }

        .focus-mode-editor h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .focus-mode-editor p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }

        .focus-mode-editor ul,
        .focus-mode-editor ol {
          padding-left: 2rem;
          margin-bottom: 1.5rem;
        }

        .focus-mode-editor li {
          margin-bottom: 0.5rem;
        }

        .focus-mode-editor blockquote {
          border-left: 4px solid #9333ea;
          padding-left: 1.5rem;
          margin: 1.5rem 0;
          font-style: italic;
        }

        .focus-mode-editor code {
          background: rgba(0, 0, 0, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }

        .focus-mode-editor pre {
          background: rgba(0, 0, 0, 0.1);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }

        .focus-mode-editor a {
          color: #9333ea;
          text-decoration: underline;
        }

        /* Sepia theme specific */
        .bg-\\[\\#f4ecd8\\] .focus-mode-editor blockquote {
          border-left-color: #8b7355;
        }

        .bg-\\[\\#f4ecd8\\] .focus-mode-editor a {
          color: #8b7355;
        }
      `}</style>
    </div>,
    document.body
  );
}