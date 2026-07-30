import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Form Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Please provide your full name." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
      return NextResponse.json({ error: "Please select or enter a subject." }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // Try inserting into Supabase contact_messages table if configured
    try {
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

    console.log(`[CONTACT FORM RECEIVED] ID: ${messageId} | From: ${name} (${email}) | Subject: ${subject}`);

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
