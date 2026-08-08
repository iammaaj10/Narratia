import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Whitelist of allowed model names
const ALLOWED_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-2.5-flash",
]);

export async function POST(req: NextRequest) {
  // 1️⃣ Guard: API key must be present on server
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY environment variable is not set.");
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured in environment variables. Please add GEMINI_API_KEY in your hosting dashboard." },
      { status: 503 }
    );
  }

  try {
    // 2️⃣ Verify user via cookies first, fallback to Authorization Bearer token
    const supabase = await createServerSupabaseClient();
    let { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: userData } = await supabase.auth.getUser(token);
        user = userData.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await req.json();
    let { prompt, model: requestedModel = "gemini-2.5-flash" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid or empty prompt" }, { status: 400 });
    }

    // Default to gemini-2.5-flash if invalid model passed
    let modelName = ALLOWED_MODELS.has(requestedModel) ? requestedModel : "gemini-2.5-flash";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const trimmedPrompt = prompt.slice(0, 25000);

    const result = await model.generateContent(trimmedPrompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("AI API route error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "AI request failed" },
      { status: 500 }
    );
  }
}
