"use client";

import { useState } from "react";
import { sendCollabRequest } from "@/lib/social/socialClient";
import { useTheme } from "@/components/ThemeProvider";

interface CollabRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  recipientId: string;
  senderId: string;
}

export default function CollabRequestModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  recipientId,
  senderId,
}: CollabRequestModalProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [proposedRole, setProposedRole] = useState("Co-Writer");
  const [pitchMessage, setPitchMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResultMessage(null);

    const res = await sendCollabRequest({
      projectId,
      senderId,
      recipientId,
      proposedRole,
      pitchMessage,
    });

    setSubmitting(false);
    setResultMessage({ success: res.success, text: res.message });

    if (res.success) {
      setTimeout(() => {
        onClose();
        setResultMessage(null);
        setPitchMessage("");
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl transition-colors ${
        isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0c0d12] border-white/10 text-white"
      }`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Collaboration Pitch</span>
            <h2 className="text-xl font-extrabold outfit mt-0.5">Request to Collaborate</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {resultMessage ? (
          <div className={`p-4 rounded-xl border text-xs font-medium text-center space-y-2 ${
            resultMessage.success
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}>
            <div className="text-lg font-bold">{resultMessage.success ? "✓ Proposal Sent!" : "⚠️ Error"}</div>
            <p>{resultMessage.text}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Project</label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs font-semibold font-mono text-indigo-400 truncate">
                {projectTitle}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Proposed Role</label>
              <select
                value={proposedRole}
                onChange={(e) => setProposedRole(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-[#121319] border-white/10 text-white"
                }`}
              >
                <option value="Co-Writer">Co-Writer (Equal Co-Authoring & Writing)</option>
                <option value="Line Editor">Line Editor (Prose Polish & Grammar)</option>
                <option value="World-Building Specialist">World-Building Specialist (Lore & Wiki)</option>
                <option value="Beta Reader">Beta Reader (Feedback & Inline Comments)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Pitch / Note</label>
                <span className="text-[10px] font-mono text-slate-400">{pitchMessage.length} / 500</span>
              </div>
              <textarea
                required
                rows={4}
                maxLength={500}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                placeholder="Introduce yourself and explain why you'd like to collaborate on this story..."
                className={`w-full px-4 py-3 rounded-xl border text-xs leading-relaxed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-white/[0.03] border-white/10 text-white"
                }`}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:border-slate-300 dark:hover:border-white/20 transition-all outfit"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || pitchMessage.trim().length === 0}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all outfit"
              >
                {submitting ? "Sending..." : "Submit Pitch Proposal"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
