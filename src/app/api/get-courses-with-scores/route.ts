// app/api/get-courses-with-scores/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  // Hämta alla banor
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("*");

  if (coursesError) {
    console.error("[GET COURSES WITH SCORES] courses error", coursesError);
    return NextResponse.json(
      { error: coursesError.message },
      { status: 500 }
    );
  }

  // Hämta alla scores för dessa banor, inklusive course_id för gruppering
  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, score, date_played, with_friends, user_id, course_id, profiles(alias)");

  if (scoresError) {
    console.error("[GET COURSES WITH SCORES] scores error", scoresError);
    return NextResponse.json(
      { error: scoresError.message },
      { status: 500 }
    );
  }

  const scoresByCourse: Record<string, unknown[]> = {};

  for (const score of scores ?? []) {
    const courseId = (score as { course_id: string | null }).course_id;
    if (!courseId) continue;
    if (!scoresByCourse[courseId]) scoresByCourse[courseId] = [];
    scoresByCourse[courseId].push(score);
  }

  const result = (courses ?? []).map((course) => ({
    ...course,
    scores: scoresByCourse[course.id as string] ?? [],
  }));

  return NextResponse.json(result);
}

