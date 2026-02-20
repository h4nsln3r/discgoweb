import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = await cookies();
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
        user_id?: string;
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
          .select("id, user_id, score, date_played, profiles!scores_user_id_fkey(alias)")
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

    // Alla banor för kartan
    const { data: mapCourses, error: mapCoursesError } = await supabase
      .from("courses")
      .select("id, name, location, latitude, longitude, main_image_url");

    if (mapCoursesError) {
      console.error("[dashboard-summary] mapCourses error", mapCoursesError);
    }

    // Nya/senast aktiva medlemmar: unika user_id från senaste scores, sedan profiler
    const { data: recentScores } = await supabase
      .from("scores")
      .select("user_id")
      .order("created_at", { ascending: false })
      .limit(80);

    const seen = new Set<string>();
    const recentUserIds: string[] = [];
    for (const row of recentScores ?? []) {
      const uid = (row as { user_id?: string }).user_id;
      if (uid && !seen.has(uid)) {
        seen.add(uid);
        recentUserIds.push(uid);
      }
      if (recentUserIds.length >= 16) break;
    }

    let newMembers: { id: string; alias: string; avatar_url: string | null }[] = [];
    if (recentUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, alias, avatar_url")
        .in("id", recentUserIds);

      const byId = new Map((profiles ?? []).map((p) => [(p as { id: string }).id, p]));
      newMembers = recentUserIds
        .map((id) => byId.get(id) as { id: string; alias: string; avatar_url: string | null } | undefined)
        .filter(Boolean) as { id: string; alias: string; avatar_url: string | null }[];
    }

    return NextResponse.json({
      courses: courses ?? [],
      latestScores,
      competitions: competitions ?? [],
      mapCourses: mapCourses ?? [],
      newMembers,
    });
  } catch (err: unknown) {
    const msg = `[dashboard-summary] unhandled: ${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

