"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Globe, Lock, Copy, Check, X } from "lucide-react";

type Props = {
  projectId: string;
  project: any;
  onClose: () => void;
  onUpdate: () => void;
};

export default function ShareSettingsModal({
  projectId,
  project,
  onClose,
  onUpdate,
}: Props) {
  const [isPublic, setIsPublic] = useState(project?.is_public || false);
  const [slug, setSlug] = useState(project?.slug || "");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSlug = async () => {
    const { data, error } = await supabase.rpc("generate_slug", {
      title: project.title,
    });

    if (!error && data) {
      setSlug(data);
    }
  };

  const saveSettings = async () => {
    setLoading(true);

    let finalSlug = slug;
    if (isPublic && !slug) {
      // Generate slug if making public without one
      const { data } = await supabase.rpc("generate_slug", {
        title: project.title,
      });
      finalSlug = data || "";
    }

    const { error } = await supabase
      .from("projects")
      .update({
        is_public: isPublic,
        slug: isPublic ? finalSlug : null,
      })
      .eq("id", projectId);

    if (error) {
      console.error("❌ Error updating:", error);
      alert("Failed to update settings");
      setLoading(false);
      return;
    }

    setLoading(false);
    onUpdate();
    onClose();
    alert(isPublic ? "Story is now public!" : "Story is now private");
  };

  const publicUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/story/${slug}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-lg w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Share Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Public Toggle */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <p className="font-semibold text-white">
                    {isPublic ? "Public" : "Private"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isPublic
                      ? "Anyone with the link can read"
                      : "Only team members can access"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isPublic ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Slug Input */}
          {isPublic && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Story URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="my-awesome-story"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={generateSlug}
                  className="px-4 py-3 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-all whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {typeof window !== "undefined" && `${window.location.origin}/story/${slug || "your-slug"}`}
              </p>
            </div>
          )}

          {/* Public URL (if already public) */}
          {isPublic && project.is_public && project.slug && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-sm text-green-300 mb-2 font-medium">
                Your story is live!
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={publicUrl}
                  readOnly
                  className="flex-1 bg-black/20 border border-green-500/20 rounded-lg px-3 py-2 text-sm text-green-200"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {project.is_public && (
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-gray-400 mb-2">Analytics</p>
              <p className="text-2xl font-bold text-white">
                {project.view_count || 0} views
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={loading || (isPublic && !slug)}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}