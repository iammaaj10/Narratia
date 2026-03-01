"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  MessageCircle,
  Check,
  X,
  Trash2,
  Clock,
  User,
  ArrowLeft,
} from "lucide-react";

type ReaderComment = {
  id: string;
  reader_name: string;
  reader_email: string | null;
  content: string;
  approved: boolean;
  created_at: string;
};

export default function CommentsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [comments, setComments] = useState<ReaderComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");

  useEffect(() => {
    loadComments();
  }, [projectId, filter]);

  const loadComments = async () => {
    setLoading(true);

    let query = supabase
      .from("reader_comments")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (filter === "pending") {
      query = query.eq("approved", false);
    } else if (filter === "approved") {
      query = query.eq("approved", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Error loading comments:", error);
    } else {
      setComments(data || []);
    }

    setLoading(false);
  };

  const approveComment = async (commentId: string) => {
    const { error } = await supabase
      .from("reader_comments")
      .update({ approved: true })
      .eq("id", commentId);

    if (error) {
      console.error("❌ Error approving:", error);
      alert("Failed to approve comment");
      return;
    }

    loadComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const { error } = await supabase
      .from("reader_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("❌ Error deleting:", error);
      alert("Failed to delete comment");
      return;
    }

    loadComments();
  };

  const pendingCount = comments.filter((c) => !c.approved).length;

  return (
    <div className="p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Reader Comments
              </h1>
              <p className="text-gray-400">
                Manage feedback from your readers
              </p>
            </div>

            {pendingCount > 0 && (
              <div className="px-4 py-2 bg-orange-500/20 border border-orange-500/50 rounded-full">
                <span className="text-orange-300 font-semibold">
                  {pendingCount} pending
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium transition-all ${
              filter === "pending"
                ? "text-orange-300 border-b-2 border-orange-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
              {comments.filter((c) => !c.approved).length > 0 && (
                <span className="px-2 py-0.5 bg-orange-500/20 rounded-full text-xs">
                  {comments.filter((c) => !c.approved).length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 font-medium transition-all ${
              filter === "approved"
                ? "text-green-300 border-b-2 border-green-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Approved
            </div>
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-all ${
              filter === "all"
                ? "text-purple-300 border-b-2 border-purple-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            All Comments
          </button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-500">
              {filter === "pending"
                ? "No pending comments to review"
                : "No reader comments yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-6 rounded-xl border transition-all ${
                  comment.approved
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-orange-500/5 border-orange-500/20"
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {comment.reader_name}
                      </p>
                      {comment.reader_email && (
                        <p className="text-xs text-gray-500">
                          {comment.reader_email}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {comment.approved ? (
                    <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Approved
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </div>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {!comment.approved && (
                    <button
                      onClick={() => approveComment(comment.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}