"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  MessageSquare,
  Send,
  Reply,
  Check,
  Trash2,
  MoreVertical,
  User as UserIcon,
} from "lucide-react";

type Comment = {
  id: string;
  phase_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  resolved: boolean;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
};

type CommentsPanelProps = {
  phaseId: string;
  currentUserId: string;
  isOwner: boolean;
};

export default function CommentsPanel({
  phaseId,
  currentUserId,
  isOwner,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    loadComments();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`comments:${phaseId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `phase_id=eq.${phaseId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [phaseId]);

  const loadComments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          phase_id,
          user_id,
          content,
          parent_id,
          resolved,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `
        )
        .eq("phase_id", phaseId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("❌ Comments error:", error);
        return;
      }

      // Organize comments into threads
      const topLevel: Comment[] = [];
      const repliesMap = new Map<string, Comment[]>();

      (data as unknown as Comment[]).forEach((comment) => {
        if (!comment.parent_id) {
          topLevel.push({ ...comment, replies: [] });
        } else {
          if (!repliesMap.has(comment.parent_id)) {
            repliesMap.set(comment.parent_id, []);
          }
          repliesMap.get(comment.parent_id)!.push(comment);
        }
      });

      // Attach replies to parent comments
      topLevel.forEach((comment) => {
        comment.replies = repliesMap.get(comment.id) || [];
      });

      setComments(topLevel);
    } catch (err) {
      console.error("❌ Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      phase_id: phaseId,
      user_id: currentUserId,
      content: newComment.trim(),
      parent_id: null,
      resolved: false,
    });

    if (error) {
      console.error("❌ Error adding comment:", error);
      alert("Failed to add comment");
      return;
    }

    setNewComment("");
    loadComments();
  };

  const addReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const { error } = await supabase.from("comments").insert({
      phase_id: phaseId,
      user_id: currentUserId,
      content: replyContent.trim(),
      parent_id: parentId,
      resolved: false,
    });

    if (error) {
      console.error("❌ Error adding reply:", error);
      alert("Failed to add reply");
      return;
    }

    setReplyContent("");
    setReplyTo(null);
    loadComments();
  };

  const toggleResolved = async (commentId: string, currentResolved: boolean) => {
    const { error } = await supabase
      .from("comments")
      .update({ resolved: !currentResolved })
      .eq("id", commentId);

    if (error) {
      console.error("❌ Error updating comment:", error);
      alert("Failed to update comment");
      return;
    }

    loadComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("❌ Error deleting comment:", error);
      alert("Failed to delete comment");
      return;
    }

    loadComments();
  };

  const filteredComments = showResolved
    ? comments
    : comments.filter((c) => !c.resolved);

  return (
    <div className="h-full flex flex-col bg-white/[0.02] border-l border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Comments</h3>
            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold">
              {filteredComments.length}
            </span>
          </div>

          <button
            onClick={() => setShowResolved(!showResolved)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {showResolved ? "Hide" : "Show"} resolved
          </button>
        </div>

        {/* New comment input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addComment()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim()}
            className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Loading comments...
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No comments yet</p>
            <p className="text-xs mt-1">Be the first to add feedback!</p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isOwner={isOwner}
              replyTo={replyTo}
              replyContent={replyContent}
              onReply={(id) => setReplyTo(id)}
              onReplyChange={setReplyContent}
              onSubmitReply={addReply}
              onCancelReply={() => setReplyTo(null)}
              onToggleResolved={toggleResolved}
              onDelete={deleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Comment Item Component
function CommentItem({
  comment,
  currentUserId,
  isOwner,
  replyTo,
  replyContent,
  onReply,
  onReplyChange,
  onSubmitReply,
  onCancelReply,
  onToggleResolved,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string;
  isOwner: boolean;
  replyTo: string | null;
  replyContent: string;
  onReply: (id: string) => void;
  onReplyChange: (content: string) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  onToggleResolved: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = comment.user_id === currentUserId;
  const canDelete = isOwn || isOwner;

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        comment.resolved
          ? "bg-green-500/5 border-green-500/20 opacity-60"
          : "bg-white/5 border-white/10"
      }`}
    >
      {/* Comment header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {comment.profiles.avatar_url ? (
            <img
              src={comment.profiles.avatar_url}
              className="w-6 h-6 rounded-full"
              alt={comment.profiles.username}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <UserIcon className="w-3 h-3 text-purple-300" />
            </div>
          )}
          <span className="text-sm font-medium text-white">
            {comment.profiles.username}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(comment.created_at).toLocaleDateString()} at{" "}
            {new Date(comment.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-xl z-10 min-w-[120px]">
              <button
                onClick={() => {
                  onToggleResolved(comment.id, comment.resolved);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/5 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {comment.resolved ? "Unresolve" : "Resolve"}
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    onDelete(comment.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment content */}
      <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">
        {comment.content}
      </p>

      {/* Reply button */}
      {!comment.resolved && (
        <button
          onClick={() => onReply(comment.id)}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <Reply className="w-3 h-3" />
          Reply
        </button>
      )}

      {/* Reply input */}
      {replyTo === comment.id && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => onReplyChange(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSubmitReply(comment.id)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            autoFocus
          />
          <button
            onClick={() => onSubmitReply(comment.id)}
            disabled={!replyContent.trim()}
            className="p-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
          <button
            onClick={onCancelReply}
            className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 pl-6 space-y-2 border-l-2 border-purple-500/20">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="p-2 rounded bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                {reply.profiles.avatar_url ? (
                  <img
                    src={reply.profiles.avatar_url}
                    className="w-5 h-5 rounded-full"
                    alt={reply.profiles.username}
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-purple-300" />
                  </div>
                )}
                <span className="text-xs font-medium text-white">
                  {reply.profiles.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(reply.created_at).toLocaleDateString()}
                </span>
                {(reply.user_id === currentUserId || isOwner) && (
                  <button
                    onClick={() => onDelete(reply.id)}
                    className="ml-auto p-1 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-300 whitespace-pre-wrap">
                {reply.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}