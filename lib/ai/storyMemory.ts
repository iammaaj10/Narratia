import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase/client";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

// We use PostgreSQL full-text search (tsvector) instead of vector embeddings.
// This avoids needing any embedding API and works entirely within Supabase free tier.

// ============================================
// 1. SAVE PHASE MEMORY
// Splits content into chunks and stores them
// as plain text with a tsvector search index.
// ============================================
export async function savePhaseMemory(
  projectId: string,
  phaseId: string,
  phaseTitle: string,
  content: string
): Promise<void> {
  if (!content || content.trim().length < 50) return;

  // Convert HTML to plain text
  const plainText = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\n\n+/g, "\n\n")
    .trim();

  if (plainText.length < 50) return;

  // Split into ~500-word chunks
  const chunks = splitIntoChunks(plainText, 500);

  // Delete old memory for this phase before re-saving
  await supabase.from("story_memory").delete().eq("phase_id", phaseId);

  // Save each chunk as plain text (PostgreSQL will index it with tsvector)
  const rows = chunks
    .filter((c) => c.trim().length >= 20)
    .map((chunk, i) => ({
      project_id: projectId,
      phase_id: phaseId,
      content: chunk,
      metadata: {
        phase_title: phaseTitle,
        chunk_index: i,
        total_chunks: chunks.length,
      },
    }));

  if (rows.length > 0) {
    const { error } = await supabase.from("story_memory").insert(rows);
    if (error) console.error("❌ Failed to save memory chunks:", error);
    else console.log(`✅ Saved ${rows.length} memory chunks for: ${phaseTitle}`);
  }
}

// ============================================
// 2. SEARCH STORY MEMORY (Full-Text Search)
// Uses PostgreSQL ilike + ranking to find the
// most relevant chunks for a given query.
// ============================================
export async function searchStoryMemory(
  projectId: string,
  query: string,
  limit: number = 5
): Promise<{ content: string; metadata: any }[]> {
  if (!query.trim()) return [];

  // Extract meaningful keywords from the query (skip stopwords)
  const stopwords = new Set([
    "a","an","the","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could",
    "should","may","might","shall","can","need","dare","ought",
    "to","of","in","on","at","by","for","with","about","against",
    "between","into","through","during","before","after","above",
    "below","from","up","down","out","off","over","under","again",
    "further","then","once","and","but","or","so","yet","both",
    "either","neither","not","only","own","same","than","too",
    "very","just","i","me","my","we","our","you","your","he",
    "she","it","they","them","their","what","which","who","this","that",
  ]);

  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  if (keywords.length === 0) return [];

  // Search using ilike for each keyword, score by how many match
  const { data, error } = await supabase
    .from("story_memory")
    .select("content, metadata")
    .eq("project_id", projectId)
    .or(keywords.map((k) => `content.ilike.%${k}%`).join(","))
    .limit(limit * 3); // fetch extra, we'll score and pick the best

  if (error || !data) return [];

  // Score each chunk by how many keywords it contains
  const scored = data.map((row) => {
    const lower = row.content.toLowerCase();
    const score = keywords.filter((k) => lower.includes(k)).length;
    return { ...row, score };
  });

  // Sort by score descending, return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter((r) => r.score > 0);
}

// ============================================
// 3. EXTRACT AND SAVE ENTITIES
// Uses Gemini text generation (not embeddings)
// to extract characters, locations, etc.
// ============================================
export async function extractAndSaveEntities(
  projectId: string,
  phaseId: string,
  phaseTitle: string,
  content: string
): Promise<void> {
  const plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  if (plainText.length < 100) return;

  const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Extract all named entities from this story excerpt. Return ONLY valid JSON, no markdown.

Story excerpt from "${phaseTitle}":
${plainText}

Return JSON in this exact format:
{
  "entities": [
    {
      "type": "character|location|item|event|concept",
      "name": "Entity Name",
      "description": "Brief 1-sentence description based on context"
    }
  ]
}

Rules:
- Only extract entities explicitly named in the text
- Skip generic things like "a man" or "the city"
- Maximum 15 entities
- Return ONLY the JSON object`;

  try {
    const result = await textModel.generateContent(prompt);
    let response = result.response.text().trim();
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(response);
    const entities = parsed.entities || [];

    for (const entity of entities) {
      if (!entity.name || !entity.type) continue;
      await supabase.from("story_entities").upsert(
        {
          project_id: projectId,
          phase_id: phaseId,
          entity_type: entity.type,
          name: entity.name,
          description: entity.description || null,
          first_mentioned_in: phaseTitle,
        },
        { onConflict: "project_id,entity_type,name", ignoreDuplicates: false }
      );
    }
    console.log(`✅ Extracted ${entities.length} entities from "${phaseTitle}"`);
  } catch (err) {
    console.error("❌ Entity extraction failed:", err);
  }
}

// ============================================
// 4. BUILD MEMORY-AUGMENTED CONTEXT
// Retrieves relevant memory and formats it as
// context to inject before the AI prompt.
// ============================================
export async function buildMemoryContext(
  projectId: string,
  userQuery: string
): Promise<string> {
  const memories = await searchStoryMemory(projectId, userQuery, 4);
  if (memories.length === 0) return "";

  const contextBlock = memories
    .map((m, i) => `[Relevant Story Passage ${i + 1}]:\n${m.content}`)
    .join("\n\n---\n\n");

  return `The following are the most relevant passages from this story's history. Use them to maintain consistency:\n\n${contextBlock}\n\n---\n\nNow respond to the user's request:`;
}

// ============================================
// HELPER: Split text into word-count chunks
// ============================================
function splitIntoChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" "));
  }
  return chunks;
}
