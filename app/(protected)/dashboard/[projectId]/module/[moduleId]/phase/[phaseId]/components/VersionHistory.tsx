"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  History,
  Clock,
  User,
  RotateCcw,
  Trash2,
  X,
  ChevronRight,
  FileText,
} from "lucide-react";

type Version = {
  id: string;
  content: string;
  word_count: number;
  created_by: string;
  created_at: string;
  version_note: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
};

type VersionHistoryProps = {
  phaseId: string;
  currentUserId: string;
  isOwner: boolean;
  onRestore: (content: string) => void;
  onClose: () => void;
};

export default function VersionHistory({
  phaseId,
  currentUserId,
  isOwner,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [phaseId]);

  const loadVersions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("phase_versions")
        .select(
          `
          id,
          content,
          word_count,
          created_by,
          created_at,
          version_note,
          profiles (
            username,
            avatar_url
          )
        `
        )
        .eq("phase_id", phaseId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Versions error:", error);
        return;
      }

      setVersions((data as unknown as Version[]) || []);
    } catch (err) {
      console.error("❌ Error loading versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: Version) => {
    if (
      confirm(
        `Are you sure you want to restore this version from ${new Date(
          version.created_at
        ).toLocaleString()}? Your current work will be replaced.`
      )
    ) {
      onRestore(version.content);
      onClose();
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm("Are you sure you want to delete this version?")) return;

    const { error } = await supabase
      .from("phase_versions")
      .delete()
      .eq("id", versionId);

    if (error) {
      console.error("❌ Delete error:", error);
      alert("Failed to delete version");
      return;
    }

    setVersions(versions.filter((v) => v.id !== versionId));
    if (selectedVersion?.id === versionId) {
      setSelectedVersion(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 max-w-6xl w-full h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Version History</h2>
              <p className="text-sm text-gray-400">
                {versions.length} saved version{versions.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Versions List */}
          <div className="w-80 border-r border-white/10 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">
                Loading versions...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-sm">No versions saved yet</p>
                <p className="text-gray-500 text-xs mt-2">
                  Versions are saved automatically when you make significant changes
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedVersion?.id === version.id
                        ? "bg-blue-500/20 border-blue-500/50"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {version.profiles.avatar_url ? (
                          <img
                            src={version.profiles.avatar_url}
                            className="w-6 h-6 rounded-full"
                            alt={version.profiles.username}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <User className="w-3 h-3 text-purple-300" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">
                          {version.profiles.username}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <Clock className="w-3 h-3" />
                      {new Date(version.created_at).toLocaleString()}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      {version.word_count} words
                    </div>

                    {version.version_note && (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        "{version.version_note}"
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedVersion ? (
              <>
                {/* Preview Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Version from{" "}
                        {new Date(selectedVersion.created_at).toLocaleDateString()}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {selectedVersion.word_count} words • Saved by{" "}
                        {selectedVersion.profiles.username}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(selectedVersion)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => handleDelete(selectedVersion.id)}
                          className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-gray-300 text-base leading-relaxed font-serif">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}