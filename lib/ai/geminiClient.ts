import { GoogleGenerativeAI } from "@google/generative-ai";

// Check if API key exists
if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  console.error("❌ GEMINI API KEY NOT FOUND!");
  console.error("Add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

// Get the model - UPDATED MODEL NAME
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash"  
});

// ============================================
// AI FEATURE 1: Context-Aware Writing Suggestions
// ============================================
export async function generateWritingSuggestion(
  context: string,
  currentText: string
): Promise<string> {
  console.log("🤖 Generating AI suggestion...");

  const prompt = `You are a creative writing assistant. Based on the story context and current text, suggest the next 2-3 sentences that would naturally continue the narrative.

Story Context (what happened before):
${context}

Current text being written:
${currentText}

Instructions:
- Write 2-3 sentences that flow naturally
- Match the tone and style of the existing text
- Continue the plot logically
- Be creative but coherent
- DO NOT include any explanations, just the continuation

Your suggestion:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log("✅ AI suggestion generated");
    return text.trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    
    // More helpful error messages
    if (error.message?.includes("API key")) {
      throw new Error("Invalid API key. Check your .env.local file");
    }
    if (error.message?.includes("quota")) {
      throw new Error("API quota exceeded. Try again later");
    }
    if (error.message?.includes("blocked")) {
      throw new Error("Content was blocked by safety filters");
    }
    
    throw new Error(`AI Error: ${error.message || "Unknown error"}`);
  }
}

// ============================================
// AI FEATURE 2: Grammar & Style Fix
// ============================================
export async function fixGrammarAndStyle(text: string): Promise<string> {
  const prompt = `You are a professional editor. Fix any grammar, spelling, and style issues in the following text. Keep the meaning and tone the same, just improve clarity and correctness.

Text to fix:
${text}

Instructions:
- Fix grammar and spelling errors
- Improve sentence structure if needed
- Keep the same meaning and tone
- Make it more readable
- DO NOT add explanations, just return the corrected text

Corrected text:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Failed to fix grammar: ${error.message}`);
  }
}

// ============================================
// AI FEATURE 3: Expand Text
// ============================================
export async function expandText(text: string): Promise<string> {
  const prompt = `You are a creative writing assistant. Expand the following text by adding more detail, description, and depth. Make it 2-3 times longer while keeping the same meaning.

Text to expand:
${text}

Instructions:
- Add sensory details (sights, sounds, feelings)
- Expand descriptions
- Add internal thoughts or emotions if appropriate
- Keep the same tone and style
- Make it vivid and engaging
- DO NOT add explanations, just return the expanded text

Expanded text:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Failed to expand text: ${error.message}`);
  }
}

// ============================================
// AI FEATURE 4: Shorten Text
// ============================================
export async function shortenText(text: string): Promise<string> {
  const prompt = `You are a professional editor. Shorten the following text by removing unnecessary words and making it more concise, while keeping the core meaning.

Text to shorten:
${text}

Instructions:
- Remove redundant words and phrases
- Make it more concise
- Keep the essential meaning
- Maintain the tone
- DO NOT add explanations, just return the shortened text

Shortened text:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Failed to shorten text: ${error.message}`);
  }
}

// ============================================
// AI FEATURE 5: Generate Story Outline
// ============================================
export async function generateStoryOutline(idea: string): Promise<string> {
  const prompt = `You are a professional story consultant. Based on the story idea provided, create a detailed chapter-by-chapter outline. Do NOT write the full story, only create an outline with chapter titles and what should happen in each chapter.

Story Idea:
${idea}

Instructions:
- Create 8-12 chapter outlines
- Each chapter should have:
  * Chapter number and title
  * 3-5 bullet points of what happens
  * Key plot points and character moments
- Follow a clear story structure (beginning, middle, end)
- Make it compelling and well-paced
- Format as markdown

Story Outline:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Failed to generate outline: ${error.message}`);
  }
}

// ============================================
// AI FEATURE 6: Convert to Screenplay
// ============================================
export async function convertToScreenplay(
  moduleTitle: string,
  phases: { title: string; content: string }[]
): Promise<string> {
  const fullText = phases
    .map((phase) => `\n\n=== ${phase.title} ===\n\n${phase.content}`)
    .join("\n");

  const prompt = `You are a professional screenwriter. Convert the following prose story into proper screenplay format.

Story Title: ${moduleTitle}

Story Content:
${fullText}

Instructions:
- Convert to industry-standard screenplay format
- Use proper scene headings (INT./EXT., LOCATION, TIME)
- Format dialogue correctly with character names
- Add action lines and descriptions
- Include visual scene descriptions
- Use proper screenplay conventions
- Make it professional and production-ready

Screenplay:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("❌ Gemini API error:", error);
    throw new Error(`Failed to convert to screenplay: ${error.message}`);
  }
}