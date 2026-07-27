import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// The key is private (no NEXT_PUBLIC_) — safe on the server
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
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
