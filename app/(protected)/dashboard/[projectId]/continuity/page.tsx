"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  Shield,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  User,
  Clock,
  MapPin,
  Brain,
  Package,
  Sparkles,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import {
  runContinuityCheck,
  ContinuityReport,
  ContinuityIssue,
  IssueType,
  IssueSeverity,
} from "@/lib/ai/continuityChecker";

// ============================================
// CONFIG
// ============================================

const SEVERITY_CONFIG: Record<
  IssueSeverity,
  { label: string; icon: any; color: string; bg: string; border: string; badge: string }
> = {
  critical: {
    label: "Critical",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  warning: {
    label: "Warning",
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
};

const TYPE_CONFIG: Record<
  IssueType,
  { label: string; icon: any; color: string }
> = {
  character: { label: "Character", icon: User, color: "text-purple-400" },
  timeline: { label: "Timeline", icon: Clock, color: "text-cyan-400" },
  location: { label: "Location", icon: MapPin, color: "text-emerald-400" },
  logic: { label: "Logic", icon: Brain, color: "text-pink-400" },
  object: { label: "Object", icon: Package, color: "text-amber-400" },
};

// ============================================
// COMPONENT
// ============================================

export default function ContinuityCheckerPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [report, setReport] = useState<ContinuityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<IssueSeverity | "all">("all");
  const [filterType, setFilterType] = useState<IssueType | "all">("all");

  const runCheck = async () => {
    setLoading(true);
    setError("");
    setReport(null);
    setExpandedIssues(new Set());

    try {
      const result = await runContinuityCheck(projectId);
      setReport(result);
    } catch (err: any) {
      console.error("Continuity check failed:", err);
      setError(err.message || "Failed to run continuity check");
    } finally {
      setLoading(false);
    }
  };

  const toggleIssue = (index: number) => {
    setExpandedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const filteredIssues = report?.issues.filter((issue) => {
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false;
    if (filterType !== "all" && issue.type !== filterType) return false;
    return true;
  }) || [];

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="relative mb-8">
            <Shield className="w-24 h-24 text-orange-400/20 mx-auto" />
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            Scanning for Plot Holes...
          </h2>
          <p className="text-gray-400 mb-2">
            Reading every chapter and cross-referencing your story&apos;s lore database
          </p>
          <p className="text-gray-500 text-sm">
            This may take 15–30 seconds depending on your story length
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-3">Check Failed</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push(`/dashboard/${projectId}`)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all"
            >
              Back to Project
            </button>
            <button
              onClick={runCheck}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // NO REPORT YET — LANDING STATE
  // ============================================
  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Back Button */}
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-10 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Project</span>
          </button>

          {/* Hero */}
          <div className="text-center mt-12">
            <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 mb-8">
              <Shield className="w-16 h-16 text-orange-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent mb-4">
              Continuity Checker
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto mb-4">
              AI-powered plot hole detection that scans every chapter of your manuscript, cross-references your lore database, and surfaces contradictions.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10 text-sm text-gray-500">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <User className="w-3.5 h-3.5" /> Character details
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Timeline errors
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <MapPin className="w-3.5 h-3.5" /> Location conflicts
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <Brain className="w-3.5 h-3.5" /> Logic gaps
              </span>
            </div>

            <button
              onClick={runCheck}
              className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-orange-500/25 hover:scale-105 transition-all text-white"
            >
              <span className="flex items-center gap-3">
                <FileSearch className="w-5 h-5" />
                Run Continuity Check
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // REPORT VIEW
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/dashboard/${projectId}`)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Project</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                  <Shield className="w-6 h-6 text-orange-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
                  Continuity Report
                </h1>
              </div>
              <p className="text-gray-400">
                <span className="text-white font-medium">&quot;{report.projectTitle}&quot;</span>
                {" · "}{report.chaptersScanned} chapters · {report.entitiesChecked} entities checked
              </p>
            </div>

            <button
              onClick={runCheck}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Re-scan
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-white mb-1">{report.totalIssues}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Issues</div>
          </div>
          <div className={`${SEVERITY_CONFIG.critical.bg} border ${SEVERITY_CONFIG.critical.border} rounded-xl p-4 text-center`}>
            <div className="text-3xl font-bold text-red-400 mb-1">{report.critical}</div>
            <div className="text-xs text-red-400/70 uppercase tracking-wider">Critical</div>
          </div>
          <div className={`${SEVERITY_CONFIG.warning.bg} border ${SEVERITY_CONFIG.warning.border} rounded-xl p-4 text-center`}>
            <div className="text-3xl font-bold text-amber-400 mb-1">{report.warnings}</div>
            <div className="text-xs text-amber-400/70 uppercase tracking-wider">Warnings</div>
          </div>
          <div className={`${SEVERITY_CONFIG.info.bg} border ${SEVERITY_CONFIG.info.border} rounded-xl p-4 text-center`}>
            <div className="text-3xl font-bold text-blue-400 mb-1">{report.info}</div>
            <div className="text-xs text-blue-400/70 uppercase tracking-wider">Info</div>
          </div>
        </div>

        {/* All Clear State */}
        {report.totalIssues === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-10 text-center"
          >
            <ShieldCheck className="w-20 h-20 text-green-400 mx-auto mb-5" />
            <h2 className="text-3xl font-bold text-white mb-3">All Clear!</h2>
            <p className="text-gray-300 text-lg max-w-md mx-auto">
              No continuity issues detected across your manuscript. Your story&apos;s lore is consistent!
            </p>
          </motion.div>
        )}

        {/* Filters */}
        {report.totalIssues > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {/* Severity filter */}
              <div className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-1">
                {(["all", "critical", "warning", "info"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterSeverity === sev
                        ? "bg-white/10 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {sev === "all" ? "All" : SEVERITY_CONFIG[sev].label}
                  </button>
                ))}
              </div>
              {/* Type filter */}
              <div className="flex gap-1 bg-white/[0.03] border border-white/10 rounded-lg p-1">
                {(["all", "character", "timeline", "location", "logic", "object"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === t
                        ? "bg-white/10 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {t === "all" ? "All Types" : TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issue List */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredIssues.map((issue, index) => {
                  const sevConfig = SEVERITY_CONFIG[issue.severity];
                  const typeConfig = TYPE_CONFIG[issue.type] || TYPE_CONFIG.logic;
                  const SevIcon = sevConfig.icon;
                  const TypeIcon = typeConfig.icon;
                  const isExpanded = expandedIssues.has(index);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${sevConfig.bg} border ${sevConfig.border} rounded-xl overflow-hidden hover:border-white/20 transition-colors`}
                    >
                      {/* Issue Header — always visible */}
                      <button
                        onClick={() => toggleIssue(index)}
                        className="w-full flex items-center gap-3 p-4 text-left"
                      >
                        <SevIcon className={`w-5 h-5 flex-shrink-0 ${sevConfig.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${sevConfig.badge}`}>
                              {sevConfig.label}
                            </span>
                            <span className={`flex items-center gap-1 text-xs ${typeConfig.color}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig.label}
                            </span>
                          </div>
                          <h3 className="text-white font-semibold truncate">{issue.title}</h3>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        )}
                      </button>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-5 pt-1 border-t border-white/5 space-y-4">
                              {/* Description */}
                              <p className="text-gray-300 leading-relaxed">
                                {issue.description}
                              </p>

                              {/* Chapters involved */}
                              {issue.chapters.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Chapters Involved
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {issue.chapters.map((ch, i) => (
                                      <span
                                        key={i}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300"
                                      >
                                        <BookOpen className="w-3 h-3" />
                                        {ch}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Evidence */}
                              {issue.evidence.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Evidence
                                  </p>
                                  <div className="space-y-2">
                                    {issue.evidence.map((ev, i) => (
                                      <div
                                        key={i}
                                        className="bg-black/20 border-l-2 border-orange-500/50 rounded-r-lg px-4 py-3 text-sm text-gray-300 italic"
                                      >
                                        &quot;{ev}&quot;
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Suggestion */}
                              {issue.suggestion && (
                                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-green-400" />
                                    <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                                      Suggested Fix
                                    </p>
                                  </div>
                                  <p className="text-green-100 text-sm leading-relaxed">
                                    {issue.suggestion}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredIssues.length === 0 && report.totalIssues > 0 && (
                <div className="text-center py-10 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No issues match the current filters.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer timestamp */}
        {report && (
          <div className="mt-8 text-center text-xs text-gray-600">
            Scanned at {new Date(report.scannedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
