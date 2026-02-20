import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET(req: NextRequest) {
  const scoreId = req.nextUrl.searchParams.get("score_id");
  const courseId = req.nextUrl.searchParams.get("course_id");
  if (!scoreId) {
    return NextResponse.json({ error: "score_id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data, error } = await supabase
    .from("score_holes")
    .select("id, score_id, hole_number, throws")
    .eq("score_id", scoreId)
    .order("hole_number");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as { hole_number: number; throws: number }[];
  if (!courseId) {
    return NextResponse.json(rows);
  }

  const { data: courseHoles } = await supabase
    .from("course_holes")
    .select("hole_number, par")
    .eq("course_id", courseId)
    .order("hole_number");

  const parByHole: Record<number, number> = {};
  for (const ch of (courseHoles ?? []) as { hole_number: number; par: number }[]) {
    parByHole[ch.hole_number] = Number(ch.par);
  }

  const withPar = rows.map((r) => ({
    hole_number: r.hole_number,
    throws: r.throws,
    par: parByHole[r.hole_number] as number | undefined,
  }));

  return NextResponse.json(withPar);
}
