"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
  Link as LinkIcon,
  Code,
} from "lucide-react";
import { useCallback, useEffect } from "react";

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
};

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing your story...",
}: RichTextEditorProps) {
  const editor = useEditor({
  immediatelyRender: false, // ← Add this line
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-purple-400 underline hover:text-purple-300 cursor-pointer",
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
    CharacterCount,
  ],
  content,
  editorProps: {
    attributes: {
      class:
        "prose prose-invert prose-lg max-w-none focus:outline-none min-h-[500px] px-8 py-6",
    },
  },
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});

  // Update editor content when prop changes (for loading saved content)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Toolbar */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1 p-2 flex-wrap">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-white/10">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("bold") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("italic") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("underline") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("strike") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("heading", { level: 1 })
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-400"
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-400"
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-400"
              }`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("bulletList") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("orderedList")
                  ? "bg-purple-500/20 text-purple-300"
                  : "text-gray-400"
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          {/* Blocks */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("blockquote") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("codeBlock") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400"
              title="Horizontal Rule (Scene Break)"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-1 px-2 border-r border-white/10">
            <button
              onClick={setLink}
              className={`p-2 rounded hover:bg-white/10 transition-colors ${
                editor.isActive("link") ? "bg-purple-500/20 text-purple-300" : "text-gray-400"
              }`}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1 px-2">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-white/10 transition-colors text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Word Count */}
          <div className="ml-auto flex items-center gap-4 px-4 text-sm text-gray-400">
            <div>
              {editor.storage.characterCount.words()} words
            </div>
            <div>
              {editor.storage.characterCount.characters()} characters
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          color: #e5e7eb;
          font-family: 'Georgia', serif;
          line-height: 1.8;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #6b7280;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror:focus {
          outline: none;
        }

        .ProseMirror h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #fff;
        }

        .ProseMirror h2 {
          font-size: 2rem;
          font-weight: bold;
          margin-top: 1.75rem;
          margin-bottom: 0.875rem;
          color: #fff;
        }

        .ProseMirror h3 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: #fff;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
        }

        .ProseMirror ul li {
          list-style-type: disc;
        }

        .ProseMirror ol li {
          list-style-type: decimal;
        }

        .ProseMirror li {
          margin: 0.5rem 0;
        }

        .ProseMirror blockquote {
          border-left: 4px solid #a855f7;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #d1d5db;
        }

        .ProseMirror code {
          background-color: rgba(168, 85, 247, 0.1);
          color: #c084fc;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .ProseMirror pre {
          background-color: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background: none;
          color: #e5e7eb;
          padding: 0;
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid rgba(168, 85, 247, 0.3);
          margin: 2rem 0;
        }

        .ProseMirror a {
          color: #a855f7;
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a:hover {
          color: #c084fc;
        }

        .ProseMirror strong {
          font-weight: bold;
          color: #fff;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
          text-decoration: underline;
        }

        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}