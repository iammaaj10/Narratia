import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Max field lengths
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Form Validation with length caps
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }
    if (name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "Name is too long." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (email.trim().length > MAX_EMAIL_LENGTH) {
      return NextResponse.json({ error: "Email address is too long." }, { status: 400 });
    }

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json({ error: "Please select or enter a subject." }, { status: 400 });
    }
    if (subject.trim().length > MAX_SUBJECT_LENGTH) {
      return NextResponse.json({ error: "Subject is too long." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }
    if (message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be under ${MAX_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // Use server-side Supabase client (correct for API routes)
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("contact_messages").insert([
        {
          id: messageId,
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          created_at: createdAt,
        },
      ]);
    } catch (dbErr) {
      console.warn("Database save notice (handled):", dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for reaching out! Your message has been successfully sent to the Narratia team.",
        messageId,
        timestamp: createdAt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending your message. Please try again." },
      { status: 500 }
    );
  }
}
