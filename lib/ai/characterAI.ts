import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase/client";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ============================================
// Character Profile Type
// ============================================
export type CharacterProfile = {
  id?: string;
  project_id: string;
  entity_id?: string | null;
  name: string;
  role: string;
  age: string;
  gender: string;
  portrait_url: string | null;
  portrait_prompt: string | null;
  appearance: string;
  personality: string;
  backstory: string;
  desire: string;
  internal_flaw: string;
  external_goal: string;
  secrets: string;
  arc: string;
  voice_style: string;
  relationships: { character_name: string; relationship: string }[];
  created_at?: string;
  updated_at?: string;
};

// ============================================
// 1. GENERATE CHARACTER PROFILE FROM MANUSCRIPT
// Reads all story memory for the project and
// asks Gemini to build a full character profile.
// ============================================
export async function generateCharacterProfile(
  projectId: string,
  characterName: string,
  existingDescription?: string
): Promise<Partial<CharacterProfile>> {
  // Gather all story memory chunks that mention this character
  const { data: memoryChunks } = await supabase
    .from("story_memory")
    .select("content, metadata")
    .eq("project_id", projectId)
    .ilike("content", `%${characterName}%`)
    .limit(10);

  // Also get existing entity description if available
  const { data: entities } = await supabase
    .from("story_entities")
    .select("description, first_mentioned_in")
    .eq("project_id", projectId)
    .eq("name", characterName)
    .limit(1);

  const entityDesc = entities?.[0]?.description || existingDescription || "";
  const passages = memoryChunks?.map((c) => c.content).join("\n\n---\n\n") || "";

  if (!passages && !entityDesc) {
    // No data about this character — return minimal defaults
    return {
      name: characterName,
      role: "supporting",
      personality: "",
      desire: "",
      internal_flaw: "",
      external_goal: "",
      backstory: "",
      secrets: "",
      arc: "",
      voice_style: "",
      appearance: "",
      relationships: [],
    };
  }

  const prompt = `You are a literary analyst. Based on the following story passages that mention the character "${characterName}", build a detailed character profile.

Known description: ${entityDesc}

Story passages mentioning "${characterName}":
${passages.slice(0, 6000)}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "role": "protagonist|antagonist|supporting|minor",
  "age": "estimated age or range like '30s' or 'teenager'",
  "gender": "inferred gender or 'unknown'",
  "appearance": "2-3 sentences describing their physical appearance based on context clues",
  "personality": "2-3 sentences describing personality traits shown in the text",
  "backstory": "2-3 sentences inferring their background from the text",
  "desire": "What does this character want most? 1-2 sentences",
  "internal_flaw": "What personal weakness or fear holds them back? 1-2 sentences",
  "external_goal": "What concrete objective are they pursuing? 1-2 sentences",
  "secrets": "What might they be hiding? 1-2 sentences (infer from subtext)",
  "arc": "How does this character change through the story? 1-2 sentences",
  "voice_style": "How does this character speak? Formal, casual, poetic, terse? 1 sentence",
  "portrait_prompt": "A detailed visual description for generating a portrait image. Include physical features, clothing, expression, and style. 2-3 sentences.",
  "relationships": [
    { "character_name": "OtherCharacterName", "relationship": "Description of relationship" }
  ]
}

Rules:
- Base everything on what the text actually shows, not assumptions
- If something can't be determined, write "Not yet revealed in the story"
- Maximum 3 relationships
- Return ONLY the JSON object`;

  try {
    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();
    response = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const parsed = JSON.parse(response);

    return {
      name: characterName,
      role: parsed.role || "supporting",
      age: parsed.age || "",
      gender: parsed.gender || "",
      appearance: parsed.appearance || "",
      personality: parsed.personality || "",
      backstory: parsed.backstory || "",
      desire: parsed.desire || "",
      internal_flaw: parsed.internal_flaw || "",
      external_goal: parsed.external_goal || "",
      secrets: parsed.secrets || "",
      arc: parsed.arc || "",
      voice_style: parsed.voice_style || "",
      portrait_prompt: parsed.portrait_prompt || "",
      relationships: parsed.relationships || [],
    };
  } catch (err) {
    console.error("❌ Character profile generation failed:", err);
    return {
      name: characterName,
      role: "supporting",
    };
  }
}

// ============================================
// 2. SAVE CHARACTER PROFILE
// ============================================
export async function saveCharacterProfile(
  profile: Partial<CharacterProfile> & { project_id: string; name: string }
): Promise<{ data: CharacterProfile | null; error: any }> {
  const payload = {
    ...profile,
    relationships: JSON.stringify(profile.relationships || []),
    updated_at: new Date().toISOString(),
  };

  // Use upsert with project_id + name as the unique constraint
  const { data, error } = await supabase
    .from("character_profiles")
    .upsert(payload, { onConflict: "project_id,name" })
    .select()
    .single();

  if (data && data.relationships && typeof data.relationships === "string") {
    data.relationships = JSON.parse(data.relationships);
  }

  return { data, error };
}

// ============================================
// 3. LOAD ALL CHARACTER PROFILES FOR A PROJECT
// ============================================
export async function loadCharacterProfiles(
  projectId: string
): Promise<CharacterProfile[]> {
  const { data, error } = await supabase
    .from("character_profiles")
    .select("*")
    .eq("project_id", projectId)
    .order("role", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Failed to load character profiles:", error);
    return [];
  }

  return (data || []).map((d: any) => ({
    ...d,
    relationships:
      typeof d.relationships === "string"
        ? JSON.parse(d.relationships)
        : d.relationships || [],
  }));
}

// ============================================
// 4. DELETE CHARACTER PROFILE
// ============================================
export async function deleteCharacterProfile(
  profileId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("character_profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("❌ Failed to delete character:", error);
    return false;
  }
  return true;
}

// ============================================
// 5. IMPORT CHARACTERS FROM STORY WIKI
// Pulls all character entities from story_entities
// and creates character_profiles for any that
// don't already exist.
// ============================================
export async function importCharactersFromWiki(
  projectId: string
): Promise<number> {
  // Get all character entities for this project
  const { data: entities } = await supabase
    .from("story_entities")
    .select("id, name, description")
    .eq("project_id", projectId)
    .eq("entity_type", "character")
    .order("name");

  if (!entities || entities.length === 0) return 0;

  // Get existing character profiles to avoid duplicates
  const { data: existing } = await supabase
    .from("character_profiles")
    .select("name")
    .eq("project_id", projectId);

  const existingNames = new Set((existing || []).map((e: any) => e.name.toLowerCase()));

  let importedCount = 0;

  for (const entity of entities) {
    if (existingNames.has(entity.name.toLowerCase())) continue;

    const { error } = await supabase.from("character_profiles").insert({
      project_id: projectId,
      entity_id: entity.id,
      name: entity.name,
      role: "supporting",
      personality: entity.description || "",
      relationships: "[]",
    });

    if (!error) importedCount++;
  }

  return importedCount;
}

// ============================================
// 6. GENERATE INITIALS AVATAR COLOR
// Deterministic color from character name
// ============================================
export function getAvatarColor(name: string): string {
  const colors = [
    "from-purple-500 to-indigo-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-cyan-600",
    "from-violet-500 to-purple-600",
    "from-fuchsia-500 to-pink-600",
    "from-sky-500 to-blue-600",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
