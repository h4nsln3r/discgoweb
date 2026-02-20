import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  // Hämta inloggad användare
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Parse body (competition_id endast när man lägger till via en tävling)
  const body = await req.json();
  const { course_id, score, throws, date_played, with_friends, hole_scores, competition_id } = body;

  const { data: inserted, error } = await supabase
    .from("scores")
    .insert([
      {
        course_id,
        score,
        throws: throws ?? null,
        date_played,
        with_friends,
        user_id: user.id,
        competition_id: competition_id ?? null,
      },
    ])
    .select("id")
    .single();

  if (error) {
    console.error("[ADD-SCORE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (inserted?.id && Array.isArray(hole_scores) && hole_scores.length > 0) {
    await supabase.from("score_holes").insert(
      hole_scores.map((h: { hole_number: number; throws: number }) => ({
        score_id: inserted.id,
        hole_number: h.hole_number,
        throws: h.throws,
      }))
    );
  }

  return NextResponse.json(inserted, { status: 200 });
}
