"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Sword,
  Zap,
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  BookMarked,
} from "lucide-react";

type Entity = {
  id: string;
  entity_type: "character" | "location" | "item" | "event" | "concept";
  name: string;
  description: string | null;
  first_mentioned_in: string | null;
};

type Props = {
  projectId: string;
};

const ENTITY_CONFIG = {
  character: { icon: User, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", label: "Characters" },
  location: { icon: MapPin, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Locations" },
  item: { icon: Sword, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Items" },
  event: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", label: "Events" },
  concept: { icon: Brain, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", label: "Concepts" },
};

export default function StoryWiki({ projectId }: Props) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["character", "location"])
  );

  useEffect(() => {
    loadEntities();
  }, [projectId]);

  const loadEntities = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("story_entities")
      .select("*")
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    setEntities(data || []);
    setLoading(false);
  };

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  // Group entities by type
  const grouped = Object.keys(ENTITY_CONFIG).reduce(
    (acc, type) => {
      acc[type] = entities.filter((e) => e.entity_type === type);
      return acc;
    },
    {} as Record<string, Entity[]>
  );

  const totalEntities = entities.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
          <BookMarked className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Story Wiki</h3>
          <p className="text-[11px] text-gray-500">
            {loading ? "Loading..." : `${totalEntities} entities auto-extracted`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
        </div>
      ) : totalEntities === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <BookMarked className="w-6 h-6 text-gray-600" />
          </div>
          <p className="text-sm text-gray-400 font-medium">No entities yet</p>
          <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
            Write at least 100 words and run a Memory Sync to auto-extract
            characters, locations, and more.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {Object.entries(ENTITY_CONFIG).map(([type, config]) => {
            const group = grouped[type] || [];
            if (group.length === 0) return null;

            const Icon = config.icon;
            const isExpanded = expandedGroups.has(type);

            return (
              <div
                key={type}
                className={`rounded-xl border ${config.border} overflow-hidden`}
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(type)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 ${config.bg} hover:brightness-110 transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className={`text-[12px] font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="text-[11px] text-white/30 font-medium">
                      {group.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-white/30" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  )}
                </button>

                {/* Entity List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="divide-y divide-white/5">
                        {group.map((entity) => (
                          <div
                            key={entity.id}
                            className="px-3 py-2.5 hover:bg-white/3 transition-colors"
                          >
                            <p className="text-[13px] font-medium text-white/90">
                              {entity.name}
                            </p>
                            {entity.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                                {entity.description}
                              </p>
                            )}
                            {entity.first_mentioned_in && (
                              <p className="text-[10px] text-white/20 mt-1">
                                First in: {entity.first_mentioned_in}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
