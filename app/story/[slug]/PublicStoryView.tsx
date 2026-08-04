"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import {
  BookOpen,
  User,
  Calendar,
  Eye,
  Share2,
  Twitter,
  Facebook,
  Link as LinkIcon,
  MessageCircle,
  Clock,
  Sparkles,
} from "lucide-react";

type Project = {
  id: string;
  title: string;
  description: string | null;
  view_count: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

type Phase = {
  id: string;
  title: string;
  description: string | null;
  content: string;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  phases: Phase[];
};

type Props = {
  project: Project;
  modules: Module[];
};

export default function PublicStoryView({ project, modules }: Props) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState({
    name: "",
    email: "",
    content: "",
  });

  useEffect(() => {
    trackView();
    loadComments();
  }, []);

  const trackView = async () => {
    try {
      await supabase.from("story_views").insert({
        project_id: project.id,
        viewer_ip: null,
        viewer_country: null,
      });

      await supabase.rpc("increment_view_count", {
        project_id: project.id,
      });
    } catch (e) {
      // Handled silently
    }
  };

  const loadComments = async () => {
    try {
      const { data } = await supabase
        .from("reader_comments")
        .select("*")
        .eq("project_id", project.id)
        .eq("approved", true)
        .order("created_at", { ascending: false });

      setComments(data || []);
    } catch (e) {
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!newComment.name.trim() || !newComment.content.trim()) {
      alert("Please fill in your name and comment");
      return;
    }

    const { error } = await supabase.from("reader_comments").insert({
      project_id: project.id,
      reader_name: newComment.name.trim(),
      reader_email: newComment.email.trim() || null,
      content: newComment.content.trim(),
      approved: false,
    });

    if (error) {
      alert("Failed to submit comment");
      return;
    }

    alert("Comment submitted! It will appear after author approval.");
    setNewComment({ name: "", email: "", content: "" });
    setShowComments(false);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareOnTwitter = () => {
    const text = `Check out "${project.title}" by ${project.profiles.username} on Narratia`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Story link copied to clipboard!");
  };

  // Clean HTML helper for word count
  const stripHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, " ");
  };

  const totalWords = modules.reduce(
    (sum, module) =>
      sum +
      module.phases.reduce((phaseSum, phase) => {
        const cleanText = stripHtml(phase.content || "");
        return (
          phaseSum +
          (cleanText.trim().split(/\s+/).filter((w) => w.length > 0).length || 0)
        );
      }, 0),
    0
  );

  const readingTime = Math.max(1, Math.ceil(totalWords / 200));

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isLight ? "bg-[#f8fafc] text-slate-900" : "bg-[#06070a] text-slate-100"
      }`}
    >
      {/* ── STICKY NAVBAR ── */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors ${
          isLight ? "bg-white/80 border-slate-200" : "bg-[#06070a]/80 border-white/10"
        }`}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/community" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-md outfit">
              N
            </div>
            <span className="font-bold text-lg tracking-tight outfit group-hover:text-indigo-500 transition-colors">
              Narratia
            </span>
          </a>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                    : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>

              {showShareMenu && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ${
                    isLight
                      ? "bg-white border-slate-200 text-slate-900 shadow-slate-300/50"
                      : "bg-[#0f1117] border-white/10 text-white shadow-black/80"
                  }`}
                >
                  <button
                    onClick={shareOnTwitter}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-500/10 flex items-center gap-3 text-xs font-medium transition-colors"
                  >
                    <Twitter className="w-4 h-4 text-sky-400" />
                    Share on Twitter
                  </button>
                  <button
                    onClick={shareOnFacebook}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-500/10 flex items-center gap-3 text-xs font-medium transition-colors"
                  >
                    <Facebook className="w-4 h-4 text-blue-500" />
                    Share on Facebook
                  </button>
                  <button
                    onClick={copyLink}
                    className="w-full px-4 py-3 text-left hover:bg-indigo-500/10 flex items-center gap-3 text-xs font-medium transition-colors border-t border-slate-100 dark:border-white/5"
                  >
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                    Copy Story Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title Header */}
        <div className="mb-12 text-center space-y-4">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 inline-block">
            Published Manuscript
          </span>

          <h1
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight outfit leading-tight ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {project.title}
          </h1>

          {project.description && (
            <p
              className={`text-base sm:text-lg max-w-xl mx-auto leading-relaxed ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {project.description}
            </p>
          )}

          {/* Author & Story Meta */}
          <div
            className={`pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium border-t max-w-md mx-auto ${
              isLight ? "border-slate-200 text-slate-500" : "border-white/10 text-slate-400"
            }`}
          >
            <a
              href={`/creator/${project.profiles.username}`}
              className="flex items-center gap-2 hover:text-indigo-500 transition-colors font-bold text-slate-700 dark:text-slate-200"
            >
              {project.profiles.avatar_url ? (
                <img
                  src={project.profiles.avatar_url}
                  className="w-7 h-7 rounded-full object-cover border border-indigo-500/30"
                  alt={project.profiles.username}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
                  {project.profiles.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span>@{project.profiles.username}</span>
            </a>

            <span>•</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-indigo-500" />
              <span>{project.view_count} views</span>
            </div>

            <span>•</span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>

            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>{totalWords.toLocaleString()} words ({readingTime} min)</span>
            </div>
          </div>
        </div>

        {/* Story Modules & Chapters */}
        <div className="space-y-12">
          {modules.length === 0 ? (
            <div
              className={`text-center py-12 rounded-2xl border border-dashed ${
                isLight ? "border-slate-200 bg-white" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <p className="text-sm text-slate-400">This story manuscript does not have published content phases yet.</p>
            </div>
          ) : (
            modules.map((module) => (
              <div key={module.id} className="space-y-8">
                {/* Module Title */}
                <div className="border-b border-indigo-500/20 pb-3">
                  <h2
                    className={`text-2xl font-bold outfit ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {module.title}
                  </h2>
                  {module.description && (
                    <p className="text-xs text-slate-400 mt-1">{module.description}</p>
                  )}
                </div>

                {/* Phases Content */}
                <div className="space-y-10">
                  {module.phases.map((phase) => (
                    <article
                      key={phase.id}
                      className={`p-6 sm:p-8 rounded-2xl border transition-all ${
                        isLight
                          ? "bg-white border-slate-200 shadow-sm"
                          : "bg-[#0b0c10] border-white/10 shadow-lg"
                      }`}
                    >
                      <h3
                        className={`text-xl font-bold outfit mb-2 ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {phase.title}
                      </h3>
                      {phase.description && (
                        <p className="text-xs text-indigo-400 italic mb-4 font-serif">
                          {phase.description}
                        </p>
                      )}

                      {/* Render formatted HTML content or formatted text */}
                      <div
                        className={`prose max-w-none text-base leading-relaxed ${
                          isLight
                            ? "prose-slate text-slate-800"
                            : "prose-invert text-slate-200"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: phase.content || "<p class='text-slate-400 italic'>Empty phase content.</p>",
                        }}
                      />
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── COMMENTS SECTION ── */}
        <div className="mt-16 pt-12 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-8">
            <h3
              className={`text-xl font-bold outfit ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Reader Comments ({comments.length})
            </h3>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all outfit"
            >
              <MessageCircle className="w-4 h-4" />
              {showComments ? "Cancel Comment" : "Leave a Comment"}
            </button>
          </div>

          {showComments && (
            <div
              className={`p-6 rounded-2xl border mb-8 ${
                isLight ? "bg-white border-slate-200 shadow-md" : "bg-[#0c0e14] border-white/10"
              }`}
            >
              <h4 className="text-sm font-bold outfit mb-4">Share your feedback with the author</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={newComment.name}
                  onChange={(e) => setNewComment({ ...newComment, name: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/5 border-white/10 text-white"
                  }`}
                />
                <input
                  type="email"
                  placeholder="Your Email (Optional)"
                  value={newComment.email}
                  onChange={(e) => setNewComment({ ...newComment, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/5 border-white/10 text-white"
                  }`}
                />
                <textarea
                  placeholder="Write your thoughts..."
                  value={newComment.content}
                  onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/5 border-white/10 text-white"
                  }`}
                />
                <button
                  onClick={submitComment}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all outfit"
                >
                  Submit Comment
                </button>
              </div>
            </div>
          )}

          {/* Comment List */}
          {comments.length > 0 && (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-5 rounded-2xl border ${
                    isLight ? "bg-white border-slate-200" : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {comment.reader_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{comment.reader_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 mt-16 py-8 text-center text-xs text-slate-400">
        <p>
          Published on <span className="text-indigo-500 font-bold outfit">Narratia</span> · Creative Publishing Network
        </p>
      </footer>
    </div>
  );
}