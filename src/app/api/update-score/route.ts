import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { id, course_id, score, throws, date_played, with_friends, hole_scores } = body;

  const updateQuery = supabase
    .from("scores")
    .update({
      course_id,
      score,
      date_played,
      with_friends,
      throws: throws ?? null,
    })
    .eq("id", id);
  const { error } = await (isAdmin ? updateQuery : updateQuery.eq("user_id", user.id));

  if (error) {
    console.error("[UPDATE-SCORE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("score_holes").delete().eq("score_id", id);
  if (Array.isArray(hole_scores) && hole_scores.length > 0) {
    await supabase.from("score_holes").insert(
      hole_scores.map((h: { hole_number: number; throws: number }) => ({
        score_id: id,
        hole_number: h.hole_number,
        throws: h.throws,
      }))
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
