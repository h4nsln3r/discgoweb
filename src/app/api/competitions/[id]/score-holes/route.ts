import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export type RoundHoleDatum = {
  hole_number: number;
  throws: number;
  par?: number;
};

export type CompetitionScoreWithHoles = {
  score_id: string;
  user_id: string;
  alias: string | null;
  course_id: string;
  course_name: string;
  holes: RoundHoleDatum[];
};

/** Lista med resultat att hämta håldata för (samma som visas under banorna). */
export type ScoreEntryForHoles = {
  scoreId: string;
  userId: string;
  alias: string | null;
  courseId: string;
  courseName: string;
};

type PageParams = { params: Promise<{ id: string }> };

/**
 * GET /api/competitions/[id]/score-holes
 * Returnerar alla resultat i tävlingen med hål-för-hål-data (och par) för statistik/grafer.
 * Använder samma Route Handler-klient som /api/score-holes så att RLS/session matchar.
 */
export async function GET(_req: Request, { params }: PageParams) {
  const { id: competitionId } = await params;
  if (!competitionId) {
    return NextResponse.json({ error: "competition id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, user_id, course_id, courses(name), profiles(alias)")
    .eq("competition_id", competitionId);

  if (scoresError || !scores?.length) {
    return NextResponse.json([] as CompetitionScoreWithHoles[]);
  }

  const scoreIds = (scores as { id: string }[]).map((s) => s.id);
  const { data: scoreHolesRows } = await supabase
    .from("score_holes")
    .select("score_id, hole_number, throws")
    .in("score_id", scoreIds)
    .order("hole_number");

  const courseIds = [...new Set((scores as { course_id: string }[]).map((s) => s.course_id))];
  const { data: courseHolesRows } = await supabase
    .from("course_holes")
    .select("course_id, hole_number, par")
    .in("course_id", courseIds)
    .order("hole_number");

  const parByCourseHole: Record<string, Record<number, number>> = {};
  for (const row of (courseHolesRows ?? []) as { course_id: string; hole_number: number; par: number }[]) {
    if (!parByCourseHole[row.course_id]) parByCourseHole[row.course_id] = {};
    parByCourseHole[row.course_id][row.hole_number] = row.par;
  }

  const holesByScoreId: Record<string, { hole_number: number; throws: number; par?: number }[]> = {};
  for (const row of (scoreHolesRows ?? []) as { score_id: string; hole_number: number; throws: number }[]) {
    if (!holesByScoreId[row.score_id]) holesByScoreId[row.score_id] = [];
    holesByScoreId[row.score_id].push({
      hole_number: row.hole_number,
      throws: row.throws,
      par: undefined,
    });
  }

  const result: CompetitionScoreWithHoles[] = [];
  for (const s of scores as (typeof scores)[0] & { id: string; user_id: string; course_id: string; courses: { name?: string } | null; profiles: { alias?: string } | null }) {
    const holes = holesByScoreId[s.id] ?? [];
    const parMap = parByCourseHole[s.course_id];
    if (parMap) {
      for (const h of holes) {
        h.par = parMap[h.hole_number];
      }
    }
    result.push({
      score_id: s.id,
      user_id: s.user_id,
      alias: s.profiles?.alias ?? null,
      course_id: s.course_id,
      course_name: s.courses?.name ?? "Okänd bana",
      holes,
    });
  }

  return NextResponse.json(result);
}
