// src/app/api/add-competition-courses/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type Database } from "@/types/supabase";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies });
  const { competitionId, courseIds } = await request.json();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!competitionId || !Array.isArray(courseIds)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const inserts = courseIds.map((courseId) => ({
    competition_id: competitionId,
    course_id: courseId,
  }));

  const { error } = await supabase.from("competition_courses").insert(inserts);

  if (error) {
    console.error("[ADD COMPETITION COURSES ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
