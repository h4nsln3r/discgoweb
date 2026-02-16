import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // Hämta senaste banor
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, location, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (coursesError) {
      console.error("[dashboard-summary] latest courses error", coursesError);
    }

    // Hämta alla banor (för scores)
    const { data: allCourses, error: allCoursesError } = await supabase
      .from("courses")
      .select("id, name");

    if (allCoursesError) {
      console.error("[dashboard-summary] all courses error", allCoursesError);
    }

    const latestScores: {
      courseId: string;
      courseName: string;
      latestScore: {
        id: string;
        score: number;
        date_played: string | null;
        profiles?: { alias: string } | null;
      } | null;
    }[] = [];

    if (allCourses) {
      // Hämta senaste score per bana (en query per bana – samma logik som befintlig route)
      for (const course of allCourses) {
        const { data: scores, error: scoreError } = await supabase
          .from("scores")
          .select("id, score, date_played, profiles(alias)")
          .eq("course_id", course.id)
          .order("date_played", { ascending: false })
          .limit(1);

        if (scoreError) {
          console.error(
            "[dashboard-summary] latest score error",
            scoreError.message
          );
          continue;
        }

        latestScores.push({
          courseId: course.id as string,
          courseName: course.name,
          latestScore: scores?.[0] || null,
        });
      }
    }

    // Hämta senaste tävlingar
    const { data: competitions, error: competitionsError } = await supabase
      .from("competitions")
      .select("id, title, start_date, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (competitionsError) {
      console.error(
        "[dashboard-summary] latest competitions error",
        competitionsError
      );
    }

    return NextResponse.json({
      courses: courses ?? [],
      latestScores,
      competitions: competitions ?? [],
    });
  } catch (err: unknown) {
    const msg = `[dashboard-summary] unhandled: ${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

