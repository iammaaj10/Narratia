"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  PlusCircle,
  Download,
  Loader2,
  Crown,
  Swords,
  UserCheck,
  UserMinus,
  Search,
  Filter,
} from "lucide-react";
import {
  CharacterProfile,
  loadCharacterProfiles,
  importCharactersFromWiki,
  getAvatarColor,
  getInitials,
} from "@/lib/ai/characterAI";
import CharacterDetailModal from "./CharacterDetailModal";

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; borderColor: string }> = {
  protagonist: { label: "Protagonist", icon: Crown, color: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-300 dark:border-amber-500/30" },
  antagonist: { label: "Antagonist", icon: Swords, color: "text-red-600 dark:text-red-400", borderColor: "border-red-300 dark:border-red-500/30" },
  supporting: { label: "Supporting", icon: UserCheck, color: "text-blue-600 dark:text-blue-400", borderColor: "border-blue-300 dark:border-blue-500/30" },
  minor: { label: "Minor", icon: UserMinus, color: "text-slate-500 dark:text-gray-500", borderColor: "border-slate-300 dark:border-white/10" },
};

export default function CharactersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterProfile | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [projectId]);

  const loadCharacters = async () => {
    setLoading(true);
    const data = await loadCharacterProfiles(projectId);
    setCharacters(data);
    setLoading(false);
  };

  const handleImportFromWiki = async () => {
    setImporting(true);
    try {
      const count = await importCharactersFromWiki(projectId);
      if (count > 0) {
        await loadCharacters();
        alert(`Imported ${count} character${count > 1 ? "s" : ""} from Story Wiki!`);
      } else {
        alert(
          "No new characters to import. Either all characters are already imported, or you need to run Memory Sync first in your editor."
        );
      }
    } catch (err) {
      console.error("Import failed:", err);
      alert("Failed to import characters.");
    }
    setImporting(false);
  };

  const handleSaveCharacter = (updated: CharacterProfile) => {
    setCharacters((prev) => {
      const existing = prev.findIndex((c) => c.id === updated.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCreateNew = () => {
    const newCharacter: CharacterProfile = {
      project_id: projectId,
      name: "",
      role: "supporting",
      age: "",
      gender: "",
      portrait_url: null,
      portrait_prompt: null,
      appearance: "",
      personality: "",
      backstory: "",
      desire: "",
      internal_flaw: "",
      external_goal: "",
      secrets: "",
      arc: "",
      voice_style: "",
      relationships: [],
    };
    setSelectedCharacter(newCharacter);
  };

  // Filter characters
  const filtered = characters.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || c.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Group by role
  const protagonists = filtered.filter((c) => c.role === "protagonist");
  const antagonists = filtered.filter((c) => c.role === "antagonist");
  const supporting = filtered.filter((c) => c.role === "supporting");
  const minor = filtered.filter((c) => c.role === "minor");

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/dashboard/${projectId}`)}
          className="flex items-center gap-2 text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white transition-colors mb-4 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Characters
              </h1>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                {characters.length} character{characters.length !== 1 ? "s" : ""} in this story
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleImportFromWiki}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {importing ? "Importing..." : "Import from Wiki"}
            </button>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all text-sm font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              New Character
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setRoleFilter(null)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              !roleFilter
                ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            All
          </button>
          {Object.entries(ROLE_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setRoleFilter(roleFilter === key ? null : key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                roleFilter === key
                  ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                  : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-gray-400">Loading characters...</p>
          </div>
        </div>
      ) : characters.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="w-20 h-20 rounded-3xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-purple-500 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Characters Yet</h3>
          <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            Create your first character manually, or write some story content and run
            Memory Sync to auto-extract characters from your manuscript.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleImportFromWiki}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all font-medium disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Import from Wiki
            </button>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold"
            >
              <PlusCircle className="w-4 h-4" />
              Create Character
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Character Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((character, index) => (
                <CharacterCard
                  key={character.id || character.name}
                  character={character}
                  index={index}
                  onClick={() => setSelectedCharacter(character)}
                />
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && characters.length > 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-gray-400">No characters match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Character Detail Modal */}
      <AnimatePresence>
        {selectedCharacter && (
          <CharacterDetailModal
            character={selectedCharacter}
            projectId={projectId}
            onClose={() => setSelectedCharacter(null)}
            onSave={handleSaveCharacter}
            onDelete={handleDeleteCharacter}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// CHARACTER CARD COMPONENT
// ============================================
function CharacterCard({
  character,
  index,
  onClick,
}: {
  character: CharacterProfile;
  index: number;
  onClick: () => void;
}) {
  const initials = getInitials(character.name);
  const avatarGradient = getAvatarColor(character.name);
  const roleConfig = ROLE_CONFIG[character.role] || ROLE_CONFIG.supporting;
  const RoleIcon = roleConfig.icon;

  // Count filled fields for completeness indicator
  const fields = [
    character.appearance,
    character.personality,
    character.backstory,
    character.desire,
    character.internal_flaw,
    character.external_goal,
    character.secrets,
    character.arc,
    character.voice_style,
  ];
  const filledCount = fields.filter((f) => f && f.trim()).length;
  const completeness = Math.round((filledCount / fields.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group cursor-pointer p-5 rounded-2xl bg-white dark:bg-[#0d0c1d] border ${roleConfig.borderColor} hover:border-purple-400 dark:hover:border-purple-500/40 shadow-sm hover:shadow-xl dark:shadow-none transition-all relative overflow-hidden`}
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-start gap-4 relative z-10">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <span className="text-white font-bold text-lg">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors truncate">
            {character.name}
          </h3>

          <div className="flex items-center gap-2 mt-1">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${roleConfig.color} bg-slate-50 dark:bg-white/5`}>
              <RoleIcon className="w-3 h-3" />
              {roleConfig.label}
            </div>
            {character.age && (
              <span className="text-[11px] text-slate-400 dark:text-gray-500">{character.age}</span>
            )}
          </div>

          {/* Personality preview */}
          {character.personality && (
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
              {character.personality}
            </p>
          )}

          {/* Completeness bar */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">{completeness}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
