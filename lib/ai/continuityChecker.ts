"use client";

import { supabase } from "@/lib/supabase/client";

// ============================================
// TYPES
// ============================================

export type IssueSeverity = "critical" | "warning" | "info";
export type IssueType = "character" | "timeline" | "location" | "logic" | "object";

export type ContinuityIssue = {
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  chapters: string[];
  evidence: string[];
  suggestion: string;
};

export type ContinuityReport = {
  projectTitle: string;
  totalIssues: number;
  critical: number;
  warnings: number;
  info: number;
  issues: ContinuityIssue[];
  scannedAt: string;
  chaptersScanned: number;
  entitiesChecked: number;
};

// ============================================
// HELPERS
// ============================================

function stripHTML(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n\n\n+/g, "\n\n")
    .trim();
}

async function callAI(prompt: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, model: "gemini-2.5-flash" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `AI request failed (${res.status})`);
  }
  const data = await res.json();
  return data.text as string;
}

// ============================================
// MAIN: Run Continuity Check
// ============================================

export async function runContinuityCheck(projectId: string): Promise<ContinuityReport> {
  // 1. Load project info
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  if (!project) throw new Error("Project not found");

  // 2. Load ALL modules for this project
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (!modules || modules.length === 0) {
    return emptyReport(project.title);
  }

  // 3. Load ALL phases across all modules
  const moduleIds = modules.map((m) => m.id);
  const { data: phases } = await supabase
    .from("phases")
    .select("id, title, content, module_id")
    .in("module_id", moduleIds)
    .order("created_at", { ascending: true });

  if (!phases || phases.length === 0) {
    return emptyReport(project.title);
  }

  // 4. Load ALL story entities
  const { data: entities } = await supabase
    .from("story_entities")
    .select("entity_type, name, description, first_mentioned_in")
    .eq("project_id", projectId);

  // 5. Build chapter summaries with plain text
  const chapters = phases
    .map((phase) => {
      const moduleName = modules.find((m) => m.id === phase.module_id)?.title || "Unknown Module";
      const plainText = stripHTML(phase.content || "");
      return {
        title: `${moduleName} → ${phase.title}`,
        content: plainText,
        wordCount: plainText.split(/\s+/).length,
      };
    })
    .filter((ch) => ch.content.length > 50); // Skip empty chapters

  if (chapters.length === 0) {
    return emptyReport(project.title);
  }

  // 6. Build entity catalog
  const entityCatalog = (entities || [])
    .map((e) => `• [${e.entity_type.toUpperCase()}] ${e.name}: ${e.description || "No description"}`)
    .join("\n");

  // 7. Calculate total word count for batching decision
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  let allIssues: ContinuityIssue[] = [];

  if (totalWords <= 30000) {
    // Single pass — entire project fits in one prompt
    allIssues = await analyzeBatch(chapters, entityCatalog);
  } else {
    // Smart batching — overlapping windows
    const batchSize = 5;
    const overlap = 2;
    for (let i = 0; i < chapters.length; i += batchSize - overlap) {
      const batch = chapters.slice(i, i + batchSize);
      if (batch.length < 2) break; // Need at least 2 chapters to compare
      const batchIssues = await analyzeBatch(batch, entityCatalog);
      allIssues.push(...batchIssues);
    }

    // Deduplicate issues with similar titles
    allIssues = deduplicateIssues(allIssues);
  }

  // 8. Build final report
  const critical = allIssues.filter((i) => i.severity === "critical").length;
  const warnings = allIssues.filter((i) => i.severity === "warning").length;
  const info = allIssues.filter((i) => i.severity === "info").length;

  return {
    projectTitle: project.title,
    totalIssues: allIssues.length,
    critical,
    warnings,
    info,
    issues: allIssues,
    scannedAt: new Date().toISOString(),
    chaptersScanned: chapters.length,
    entitiesChecked: entities?.length || 0,
  };
}

// ============================================
// ANALYZE A BATCH OF CHAPTERS
// ============================================

async function analyzeBatch(
  chapters: { title: string; content: string }[],
  entityCatalog: string
): Promise<ContinuityIssue[]> {
  const chapterBlock = chapters
    .map(
      (ch, i) =>
        `=== CHAPTER ${i + 1}: "${ch.title}" ===\n${ch.content.slice(0, 5000)}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are a meticulous continuity editor for a novel manuscript. Your job is to find plot holes, contradictions, and inconsistencies across chapters.

ENTITY CATALOG (known characters, locations, items from the story):
${entityCatalog || "No entities extracted yet."}

CHAPTERS TO ANALYZE:
${chapterBlock}

INSTRUCTIONS:
1. Cross-reference character descriptions across chapters (eye color, hair, age, traits, abilities)
2. Check timeline consistency (events referenced in the right order, no anachronisms)
3. Check location details (descriptions don't contradict between chapters)
4. Check logical consistency (plot events don't contradict each other)
5. Check object/item consistency (items described differently, items appearing/disappearing)
6. Compare against the entity catalog for contradictions

IMPORTANT:
- Only flag REAL contradictions you can point to with specific evidence from the text
- Do NOT flag stylistic choices or intentional ambiguity
- Do NOT invent issues that aren't clearly in the text
- If you find NO issues, return an empty array
- Be specific — quote the exact conflicting phrases

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "issues": [
    {
      "type": "character|timeline|location|logic|object",
      "severity": "critical|warning|info",
      "title": "Short issue title",
      "description": "Detailed explanation of the contradiction",
      "chapters": ["Chapter title 1", "Chapter title 2"],
      "evidence": ["Direct quote from chapter 1 showing X", "Direct quote from chapter 2 showing Y"],
      "suggestion": "How to fix this inconsistency"
    }
  ]
}

Severity guide:
- critical: Direct contradiction that breaks the story (wrong name, impossible timeline)
- warning: Inconsistency that attentive readers would notice (changing details)
- info: Minor potential issue worth reviewing (vague references, unclear timelines)`;

  try {
    let response = (await callAI(prompt)).trim();
    // Clean markdown wrappers
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(response);
    const issues: ContinuityIssue[] = (parsed.issues || []).map((issue: any) => ({
      type: issue.type || "logic",
      severity: issue.severity || "info",
      title: issue.title || "Unnamed issue",
      description: issue.description || "",
      chapters: issue.chapters || [],
      evidence: issue.evidence || [],
      suggestion: issue.suggestion || "",
    }));

    return issues;
  } catch (err) {
    console.error("❌ Continuity analysis failed:", err);
    return [];
  }
}

// ============================================
// DEDUPLICATE SIMILAR ISSUES
// ============================================

function deduplicateIssues(issues: ContinuityIssue[]): ContinuityIssue[] {
  const seen = new Map<string, ContinuityIssue>();
  for (const issue of issues) {
    const key = issue.title.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.set(key, issue);
    } else {
      // Merge chapters and evidence from duplicate
      const existing = seen.get(key)!;
      const mergedChapters = [...new Set([...existing.chapters, ...issue.chapters])];
      const mergedEvidence = [...new Set([...existing.evidence, ...issue.evidence])];
      seen.set(key, { ...existing, chapters: mergedChapters, evidence: mergedEvidence });
    }
  }
  return Array.from(seen.values());
}

// ============================================
// EMPTY REPORT HELPER
// ============================================

function emptyReport(projectTitle: string): ContinuityReport {
  return {
    projectTitle,
    totalIssues: 0,
    critical: 0,
    warnings: 0,
    info: 0,
    issues: [],
    scannedAt: new Date().toISOString(),
    chaptersScanned: 0,
    entitiesChecked: 0,
  };
}
