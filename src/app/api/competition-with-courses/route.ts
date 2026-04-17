import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { sortCompetitionCourseLinks } from "@/lib/competition-courses-sort";

export async function GET(req: NextRequest) {
  const competitionId = req.nextUrl.searchParams.get("competition_id");
  if (!competitionId) {
    return NextResponse.json({ error: "competition_id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: competition, error: compError } = await supabase
    .from("competitions")
    .select("id, title")
    .eq("id", competitionId)
    .single();

  if (compError || !competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte" }, { status: 404 });
  }

  const { data: cc, error: ccError } = await supabase
    .from("competition_courses")
    .select("course_id, created_at, courses ( id, name )")
    .eq("competition_id", competitionId);

  if (ccError) {
    return NextResponse.json({ error: ccError.message }, { status: 500 });
  }

  const sorted = sortCompetitionCourseLinks(
    (cc ?? []) as {
      course_id: string | null;
      sort_order?: number | null;
      created_at: string | null;
      courses: { id: string; name: string } | null;
    }[]
  );

  const courses = sorted
    .filter(
      (row): row is typeof row & { course_id: string; courses: { id: string; name: string } } =>
        row.course_id != null && row.courses != null
    )
    .map((row) => ({ id: row.courses.id, name: row.courses.name }));

  return NextResponse.json({
    id: competition.id,
    title: competition.title,
    courses,
  });
}
