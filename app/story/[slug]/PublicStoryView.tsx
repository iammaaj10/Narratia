"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState({
    name: "",
    email: "",
    content: "",
  });

  useEffect(() => {
    // Track view
    trackView();
    loadComments();
  }, []);

  const trackView = async () => {
    await supabase.from("story_views").insert({
      project_id: project.id,
      viewer_ip: null, // We could use an IP API here
      viewer_country: null,
    });

    // Increment view count
    await supabase.rpc("increment_view_count", {
      project_id: project.id,
    });
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("reader_comments")
      .select("*")
      .eq("project_id", project.id)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    setComments(data || []);
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
      approved: false, // Needs owner approval
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
    const text = `Check out "${project.title}" by ${project.profiles.username}`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareOnFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      "_blank"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const totalWords = modules.reduce(
    (sum, module) =>
      sum +
      module.phases.reduce((phaseSum, phase) => {
        return (
          phaseSum +
          (phase.content?.trim().split(/\s+/).filter((w) => w.length > 0)
            .length || 0)
        );
      }, 0),
    0
  );

  const readingTime = Math.ceil(totalWords / 200); // 200 words per minute

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-950 via-purple-950/20 to-slate-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <span className="font-semibold text-white">Narratia</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <button
                  onClick={shareOnTwitter}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-white transition-colors"
                >
                  <Twitter className="w-4 h-4 text-blue-400" />
                  Share on Twitter
                </button>
                <button
                  onClick={shareOnFacebook}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-white transition-colors"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Share on Facebook
                </button>
                <button
                  onClick={copyLink}
                  className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center gap-3 text-white transition-colors"
                >
                  <LinkIcon className="w-4 h-4 text-gray-400" />
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            {project.title}
          </h1>
          {project.description && (
            <p className="text-xl text-gray-400 mb-6">{project.description}</p>
          )}

          {/* Author & Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              {project.profiles.avatar_url ? (
                <img
                  src={project.profiles.avatar_url}
                  className="w-8 h-8 rounded-full"
                  alt={project.profiles.username}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-300" />
                </div>
              )}
              <span className="font-medium text-white">
                {project.profiles.username}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{project.view_count} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
            <div>
              {totalWords.toLocaleString()} words · {readingTime} min read
            </div>
          </div>
        </div>

        {/* Story Modules */}
        <div className="space-y-16">
          {modules.map((module, moduleIndex) => (
            <div key={module.id}>
              {/* Module Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {module.title}
                </h2>
                {module.description && (
                  <p className="text-gray-400">{module.description}</p>
                )}
              </div>

              {/* Phases */}
              <div className="space-y-12">
                {module.phases.map((phase, phaseIndex) => (
                  <article
                    key={phase.id}
                    className="prose prose-invert prose-lg max-w-none"
                  >
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      {phase.title}
                    </h3>
                    {phase.description && (
                      <p className="text-gray-400 italic mb-4">
                        {phase.description}
                      </p>
                    )}
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-serif">
                      {phase.content}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments Section */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all mb-8"
          >
            <MessageCircle className="w-5 h-5" />
            {showComments ? "Hide" : "Leave a"} Comment
          </button>

          {showComments && (
            <div className="space-y-6 mb-8">
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Share Your Thoughts
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your name *"
                    value={newComment.name}
                    onChange={(e) =>
                      setNewComment({ ...newComment, name: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={newComment.email}
                    onChange={(e) =>
                      setNewComment({ ...newComment, email: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                  <textarea
                    placeholder="Your comment *"
                    value={newComment.content}
                    onChange={(e) =>
                      setNewComment({ ...newComment, content: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 min-h-[120px] resize-none"
                  />
                  <button
                    onClick={submitComment}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    Submit Comment
                  </button>
                  <p className="text-xs text-gray-500">
                    Comments are moderated and will appear after approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Display Comments */}
          {comments.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">
                Reader Comments ({comments.length})
              </h3>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-6 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {comment.reader_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-300">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16 py-8 text-center text-gray-500 text-sm">
        <p>
          Powered by <span className="text-purple-400 font-semibold">Narratia</span> 
          {" "}· A collaborative storytelling platform
        </p>
      </footer>
    </div>
  );
}