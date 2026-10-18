"use client";

import { CollaboratorPresence } from "./useRealtimeCollab";

type CollaboratorAvatarsProps = {
  collaborators: CollaboratorPresence[];
};

export default function CollaboratorAvatars({ collaborators }: CollaboratorAvatarsProps) {
  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 border border-emerald-500/30">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Live
        </span>
      </div>

      {/* Collaborator avatars */}
      <div className="flex -space-x-2">
        {collaborators.map((collab) => (
          <div
            key={collab.userId}
            className="relative group"
            title={`${collab.username} is editing`}
          >
            {collab.avatarUrl ? (
              <img
                src={collab.avatarUrl}
                alt={collab.username}
                className="w-7 h-7 rounded-full border-2 object-cover ring-1 ring-white dark:ring-[#13121a]"
                style={{ borderColor: collab.color }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-white dark:ring-[#13121a]"
                style={{
                  borderColor: collab.color,
                  backgroundColor: collab.color,
                }}
              >
                {collab.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-[#1e1d2d] text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 z-50">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: collab.color }}
              ></span>
              {collab.username} — editing
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-slate-900 dark:bg-[#1e1d2d] border-l border-t border-white/10"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Count label */}
      <span className="text-[10px] font-semibold text-slate-500 dark:text-gray-500 ml-1">
        {collaborators.length} online
      </span>
    </div>
  );
}
