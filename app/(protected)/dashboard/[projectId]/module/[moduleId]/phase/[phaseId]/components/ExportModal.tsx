"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { supabase } from "@/lib/supabase/client";
import { Download, FileText, X, Loader2 } from "lucide-react";
import { exportAsPDF, exportAsDOCX, exportAsTXT } from "../../../../../../../../../lib/export/exportUtils";

type ExportModalProps = {
  projectId: string;
  projectTitle: string;
  onClose: () => void;
};

type ExportFormat = "pdf" | "docx" | "txt";
type ExportScope = "project" | "module" | "phase";

export default function ExportModal({
  projectId,
  projectTitle,
  onClose,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>("project");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [modules, setModules] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // ✅ CORRECT: Use useEffect for side effects
  useEffect(() => {
    loadModules();
  }, []); // Empty dependency array means run once when component mounts

  const loadModules = async () => {
    const { data } = await supabase
      .from("modules")
      .select("id, title")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    setModules(data || []);
  };

  const loadPhases = async (moduleId: string) => {
    const { data } = await supabase
      .from("phases")
      .select("id, title")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });

    setPhases(data || []);
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModule(moduleId);
    setSelectedPhase("");
    if (moduleId) {
      loadPhases(moduleId);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setLoadingData(true);

    try {
      let exportData: any = {
        projectTitle,
        projectDescription: null,
        modules: [],
      };

      // Get project description
      const { data: projectData } = await supabase
        .from("projects")
        .select("description")
        .eq("id", projectId)
        .single();

      exportData.projectDescription = projectData?.description;

      if (scope === "project") {
        // Export entire project
        const { data: modulesData } = await supabase
          .from("modules")
          .select("id, title, description")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });

        for (const module of modulesData || []) {
          const { data: phasesData } = await supabase
            .from("phases")
            .select("title, description, content")
            .eq("module_id", module.id)
            .order("created_at", { ascending: true });

          exportData.modules.push({
            title: module.title,
            description: module.description,
            phases: phasesData || [],
          });
        }
      } else if (scope === "module" && selectedModule) {
        // Export single module
        const { data: moduleData } = await supabase
          .from("modules")
          .select("title, description")
          .eq("id", selectedModule)
          .single();

        const { data: phasesData } = await supabase
          .from("phases")
          .select("title, description, content")
          .eq("module_id", selectedModule)
          .order("created_at", { ascending: true });

        exportData.modules.push({
          title: moduleData?.title || "Module",
          description: moduleData?.description,
          phases: phasesData || [],
        });
      } else if (scope === "phase" && selectedPhase) {
        // Export single phase
        const { data: phaseData } = await supabase
          .from("phases")
          .select("title, description, content, module_id")
          .eq("id", selectedPhase)
          .single();

        const { data: moduleData } = await supabase
          .from("modules")
          .select("title")
          .eq("id", phaseData?.module_id)
          .single();

        exportData.modules.push({
          title: moduleData?.title || "Module",
          description: null,
          phases: [phaseData],
        });
      }

      setLoadingData(false);

      // Export based on format
      if (format === "pdf") {
        exportAsPDF(exportData);
      } else if (format === "docx") {
        await exportAsDOCX(exportData);
      } else if (format === "txt") {
        exportAsTXT(exportData);
      }

      onClose();
    } catch (err) {
      console.error("❌ Export error:", err);
      alert("Failed to export. Please try again.");
    } finally {
      setLoading(false);
      setLoadingData(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 p-8 max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Export Story</h2>
              <p className="text-sm text-gray-400">{projectTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormat("pdf")}
                className={`p-4 rounded-xl border transition-all ${
                  format === "pdf"
                    ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/50 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-semibold">PDF</div>
              </button>

              <button
                onClick={() => setFormat("docx")}
                className={`p-4 rounded-xl border transition-all ${
                  format === "docx"
                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/50 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-semibold">DOCX</div>
              </button>

              <button
                onClick={() => setFormat("txt")}
                className={`p-4 rounded-xl border transition-all ${
                  format === "txt"
                    ? "bg-gradient-to-br from-gray-500/20 to-slate-500/20 border-gray-500/50 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <FileText className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-semibold">TXT</div>
              </button>
            </div>
          </div>

          {/* Scope selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              What to Export
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as ExportScope)}
              className="w-full bg-gray-600 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
            >
              <option value="project">Entire Project</option>
              <option value="module">Single Module</option>
              <option value="phase">Single Phase</option>
            </select>
          </div>

          {/* Module selection */}
          {scope !== "project" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Module
              </label>
              <select
                value={selectedModule}
                onChange={(e) => handleModuleChange(e.target.value)}
                className="w-full bg-gray-700 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Choose a module...</option>
                {modules.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Phase selection */}
          {scope === "phase" && selectedModule && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select Phase
              </label>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value)}
                className="w-full bg-gray-700 border border-white/10 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-purple-500/50"
              >
                <option value="">Choose a phase...</option>
                {phases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export button */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={
                loading ||
                (scope === "module" && !selectedModule) ||
                (scope === "phase" && !selectedPhase)
              }
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {loadingData ? "Loading..." : "Exporting..."}
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}