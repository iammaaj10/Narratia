"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Wand2,
  Loader2,
  User,
  Heart,
  Shield,
  Target,
  Lock,
  TrendingUp,
  MessageCircle,
  Palette,
  BookOpen,
  Users,
  Crown,
  Swords,
  UserCheck,
  UserMinus,
} from "lucide-react";
import {
  CharacterProfile,
  generateCharacterProfile,
  saveCharacterProfile,
  deleteCharacterProfile,
  getAvatarColor,
  getInitials,
} from "@/lib/ai/characterAI";

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  protagonist: { label: "Protagonist", icon: Crown, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/20" },
  antagonist: { label: "Antagonist", icon: Swords, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-500/20" },
  supporting: { label: "Supporting", icon: UserCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  minor: { label: "Minor", icon: UserMinus, color: "text-slate-600 dark:text-gray-400", bg: "bg-slate-100 dark:bg-white/5" },
};

type Props = {
  character: CharacterProfile;
  projectId: string;
  onClose: () => void;
  onSave: (updated: CharacterProfile) => void;
  onDelete: (id: string) => void;
};

export default function CharacterDetailModal({
  character,
  projectId,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<CharacterProfile>({ ...character });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("identity");

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateField = (field: keyof CharacterProfile, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await saveCharacterProfile({
      ...form,
      project_id: projectId,
    });
    setSaving(false);

    if (error) {
      alert("Failed to save character: " + error.message);
      return;
    }

    if (data) onSave(data);
    onClose();
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm(`Are you sure you want to delete "${form.name}"? This cannot be undone.`)) return;

    const success = await deleteCharacterProfile(form.id);
    if (success) {
      onDelete(form.id);
      onClose();
    } else {
      alert("Failed to delete character");
    }
  };

  const handleAutoFill = async () => {
    setGenerating(true);
    try {
      const profile = await generateCharacterProfile(
        projectId,
        form.name,
        form.personality || form.appearance
      );

      // Merge AI results into form, keeping any existing user edits
      setForm((prev) => ({
        ...prev,
        role: prev.role && prev.role !== "supporting" ? prev.role : profile.role || prev.role,
        age: prev.age || profile.age || "",
        gender: prev.gender || profile.gender || "",
        appearance: prev.appearance || profile.appearance || "",
        personality: prev.personality || profile.personality || "",
        backstory: prev.backstory || profile.backstory || "",
        desire: prev.desire || profile.desire || "",
        internal_flaw: prev.internal_flaw || profile.internal_flaw || "",
        external_goal: prev.external_goal || profile.external_goal || "",
        secrets: prev.secrets || profile.secrets || "",
        arc: prev.arc || profile.arc || "",
        voice_style: prev.voice_style || profile.voice_style || "",
        portrait_prompt: prev.portrait_prompt || profile.portrait_prompt || "",
        relationships:
          prev.relationships && prev.relationships.length > 0
            ? prev.relationships
            : profile.relationships || [],
      }));
    } catch (err) {
      console.error("Auto-fill failed:", err);
      alert("AI auto-fill failed. Make sure you've run Memory Sync first.");
    }
    setGenerating(false);
  };

  const sections = [
    { id: "identity", label: "Identity", icon: User },
    { id: "psyche", label: "Psyche", icon: Heart },
    { id: "story", label: "Story Arc", icon: BookOpen },
    { id: "relationships", label: "Relationships", icon: Users },
  ];

  const initials = getInitials(form.name);
  const avatarGradient = getAvatarColor(form.name);
  const roleConfig = ROLE_CONFIG[form.role] || ROLE_CONFIG.supporting;
  const RoleIcon = roleConfig.icon;

  if (!mounted) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0c0c1b] rounded-3xl border border-slate-200 dark:border-white/10 max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>

            <div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 w-full"
                placeholder="Character Name"
              />
              <div className="flex items-center gap-2 mt-1">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleConfig.bg} ${roleConfig.color}`}>
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </div>
                {form.age && (
                  <span className="text-xs text-slate-500 dark:text-gray-500">Age: {form.age}</span>
                )}
                {form.gender && (
                  <span className="text-xs text-slate-500 dark:text-gray-500">• {form.gender}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {generating ? "Generating..." : "Auto-Fill with AI"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] overflow-x-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
                    : "text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeSection === "identity" && (
              <motion.div
                key="identity"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => updateField("role", key)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            form.role === key
                              ? `${config.bg} ${config.color} border-current`
                              : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <FieldInput label="Age" icon={User} value={form.age || ""} onChange={(v) => updateField("age", v)} placeholder="e.g., 28, late 30s, teenager" />
                  <FieldInput label="Gender" icon={User} value={form.gender || ""} onChange={(v) => updateField("gender", v)} placeholder="e.g., Male, Female, Non-binary" />
                </div>

                {/* Appearance */}
                <FieldTextarea label="Appearance" icon={Palette} value={form.appearance || ""} onChange={(v) => updateField("appearance", v)} placeholder="Physical appearance, clothing, distinguishing features..." rows={3} />

                {/* Voice Style */}
                <FieldTextarea label="Voice & Speech Style" icon={MessageCircle} value={form.voice_style || ""} onChange={(v) => updateField("voice_style", v)} placeholder="How does this character speak? Formal, witty, terse, poetic..." rows={2} />
              </motion.div>
            )}

            {activeSection === "psyche" && (
              <motion.div
                key="psyche"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <FieldTextarea label="Personality" icon={Heart} value={form.personality || ""} onChange={(v) => updateField("personality", v)} placeholder="Core personality traits, temperament, quirks..." rows={3} />
                <FieldTextarea label="Deepest Desire" icon={Heart} value={form.desire || ""} onChange={(v) => updateField("desire", v)} placeholder="What does this character want more than anything?" rows={2} />
                <FieldTextarea label="Internal Flaw" icon={Shield} value={form.internal_flaw || ""} onChange={(v) => updateField("internal_flaw", v)} placeholder="What personal weakness or fear holds them back?" rows={2} />
                <FieldTextarea label="External Goal" icon={Target} value={form.external_goal || ""} onChange={(v) => updateField("external_goal", v)} placeholder="What concrete objective are they pursuing?" rows={2} />
                <FieldTextarea label="Secrets" icon={Lock} value={form.secrets || ""} onChange={(v) => updateField("secrets", v)} placeholder="What are they hiding from other characters?" rows={2} />
              </motion.div>
            )}

            {activeSection === "story" && (
              <motion.div
                key="story"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <FieldTextarea label="Backstory" icon={BookOpen} value={form.backstory || ""} onChange={(v) => updateField("backstory", v)} placeholder="Where did this character come from? Key events that shaped them..." rows={4} />
                <FieldTextarea label="Character Arc" icon={TrendingUp} value={form.arc || ""} onChange={(v) => updateField("arc", v)} placeholder="How does this character change through the story? What do they learn?" rows={3} />
              </motion.div>
            )}

            {activeSection === "relationships" && (
              <motion.div
                key="relationships"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    Relationships
                  </label>
                  <button
                    onClick={() =>
                      updateField("relationships", [
                        ...(form.relationships || []),
                        { character_name: "", relationship: "" },
                      ])
                    }
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                  >
                    + Add Relationship
                  </button>
                </div>

                {(!form.relationships || form.relationships.length === 0) ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-gray-600" />
                    <p className="text-sm text-slate-500 dark:text-gray-400">No relationships added yet</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Click &quot;Auto-Fill with AI&quot; to detect relationships from your manuscript</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.relationships.map((rel, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={rel.character_name}
                            onChange={(e) => {
                              const updated = [...form.relationships];
                              updated[index] = { ...updated[index], character_name: e.target.value };
                              updateField("relationships", updated);
                            }}
                            className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            placeholder="Character name"
                          />
                          <input
                            type="text"
                            value={rel.relationship}
                            onChange={(e) => {
                              const updated = [...form.relationships];
                              updated[index] = { ...updated[index], relationship: e.target.value };
                              updateField("relationships", updated);
                            }}
                            className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                            placeholder="e.g., Best friend, rival, mentor..."
                          />
                        </div>
                        <button
                          onClick={() => {
                            const updated = form.relationships.filter((_, i) => i !== index);
                            updateField("relationships", updated);
                          }}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={handleDelete}
            disabled={!form.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Character"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
}

// ============================================
// REUSABLE FIELD COMPONENTS
// ============================================
function FieldInput({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-purple-500" />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldTextarea({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
        <Icon className="w-4 h-4 text-purple-500" />
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none transition-all leading-relaxed"
        placeholder={placeholder}
      />
    </div>
  );
}
