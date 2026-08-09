import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // Use anon key to simulate unauthenticated client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Query project members
  const { data: members, error: memErr } = await supabase
    .from("project_members")
    .select("*");

  // 2. Query projects
  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select("*");

  // 3. Profiles
  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("*");

  return NextResponse.json({
    members,
    memErr,
    projects,
    projErr,
    profiles,
    profErr
  });
}
