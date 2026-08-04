import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Whitelist of allowed model names to prevent model injection / billing abuse
const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
]);

// Fail fast if the API key is not configured
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  // Guard: API key must be present
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI service is not configured" },
      { status: 503 }
    );
  }

  try {
    // Verify the caller is an authenticated user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, model: modelName = "gemini-2.5-flash" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    // Guard: Only allow whitelisted model names (prevent billing abuse / model injection)
    if (!ALLOWED_MODELS.has(modelName)) {
      return NextResponse.json({ error: "Invalid model name" }, { status: 400 });
    }

    // Limit prompt length to prevent abuse
    const trimmedPrompt = prompt.slice(0, 20000);

    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(trimmedPrompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI API route error:", error?.message || "Unknown error");
    return NextResponse.json(
      { error: "AI request failed" },
      { status: 500 }
    );
  }
}
