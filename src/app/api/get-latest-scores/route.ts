// src/app/api/get-latest-scores/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  // 1. Hämta alla banor
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name");

  if (coursesError) {
    return NextResponse.json({ error: coursesError.message }, { status: 500 });
  }

  // 2. Hämta senaste score per bana (joinar med profiles för spelarnamn)
  const results = [];

  for (const course of courses) {
    const { data: scores, error: scoreError } = await supabase
      .from("scores")
      .select("id, score, date_played, profiles(alias)")
      .eq("course_id", course.id)
      .order("date_played", { ascending: true })
      .limit(1);

    if (scoreError) {
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
    }

    results.push({
      courseId: course.id,
      courseName: course.name,
      latestScore: scores?.[0] || null,
    });
  }

  return NextResponse.json(results);
}
