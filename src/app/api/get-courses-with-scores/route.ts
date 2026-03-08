// app/api/get-courses-with-scores/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

type ScoreRow = {
  id: string;
  score: number;
  date_played: string | null;
  course_id: string;
  user_id: string;
  profiles: { alias: string | null } | null;
};

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

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

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("id, score, date_played, with_friends, user_id, course_id, profiles!scores_user_id_fkey(alias)");

  if (scoresError) {
    console.error("[GET COURSES WITH SCORES] scores error", scoresError);
    return NextResponse.json(
      { error: scoresError.message },
      { status: 500 }
    );
  }

  const { data: holesData } = await supabase
    .from("course_holes")
    .select("course_id");

  const holeCountByCourse: Record<string, number> = {};
  for (const row of holesData ?? []) {
    const cid = (row as { course_id: string }).course_id;
    holeCountByCourse[cid] = (holeCountByCourse[cid] ?? 0) + 1;
  }

  const scoresByCourse: Record<string, ScoreRow[]> = {};
  for (const score of (scores ?? []) as ScoreRow[]) {
    if (!score.course_id) continue;
    if (!scoresByCourse[score.course_id]) scoresByCourse[score.course_id] = [];
    scoresByCourse[score.course_id].push(score);
  }

  const allScoreIds = (scores ?? [])
    .map((s) => (s as ScoreRow).id)
    .filter(Boolean);
  const scoreById = new Map(
    (scores ?? []).map((s) => [(s as ScoreRow).id, s as ScoreRow])
  );
  let acesByCourse: Record<string, { score_id: string; hole_number: number; alias: string; user_id: string | null }[]> = {};
  if (allScoreIds.length > 0) {
    const { data: acesData } = await supabase
      .from("score_holes")
      .select("score_id, hole_number")
      .in("score_id", allScoreIds)
      .eq("throws", 1);
    for (const a of acesData ?? []) {
      const row = a as { score_id: string; hole_number: number };
      const score = scoreById.get(row.score_id);
      if (!score?.course_id) continue;
      if (!acesByCourse[score.course_id]) acesByCourse[score.course_id] = [];
      acesByCourse[score.course_id].push({
        score_id: row.score_id,
        hole_number: row.hole_number,
        alias: score.profiles?.alias ?? "Okänd",
        user_id: score.user_id ?? null,
      });
    }
  }

  const result = (courses ?? []).map((course) => {
    const courseScores = scoresByCourse[course.id as string] ?? [];
    const bestPerUser = new Map<string, ScoreRow>();
    for (const s of courseScores) {
      const existing = bestPerUser.get(s.user_id);
      if (!existing || s.score < existing.score) bestPerUser.set(s.user_id, s);
    }
    const top3 = [...bestPerUser.values()]
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
    const lastPlayed = [...courseScores]
      .sort((a, b) => {
        const da = a.date_played ? new Date(a.date_played).getTime() : 0;
        const db = b.date_played ? new Date(b.date_played).getTime() : 0;
        return db - da;
      })
      .slice(0, 3);
    return {
      ...course,
      hole_count: holeCountByCourse[course.id as string] ?? 0,
      scores: courseScores,
      top3,
      holeInOnes: acesByCourse[course.id as string] ?? [],
      lastPlayed,
    };
  });

  return NextResponse.json(result);
}

