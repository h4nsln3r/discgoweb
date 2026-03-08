import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase-server";
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

  // Parse body (competition_id endast när man lägger till via en tävling; for_user_id = registrera resultat åt en medspelare)
  const body = await req.json();
  const { course_id, score, throws, date_played, with_friends, hole_scores, competition_id, for_user_id } = body;

  const targetUserId = typeof for_user_id === "string" && for_user_id.trim() ? for_user_id.trim() : user.id;
  const isForAnotherUser = targetUserId !== user.id;

  let client: ReturnType<typeof createRouteHandlerClient<Database>> | ReturnType<typeof createSupabaseAdminClient> = supabase;
  if (isForAnotherUser) {
    try {
      client = createSupabaseAdminClient();
    } catch (e) {
      console.error("[ADD-SCORE] Admin client required for for_user_id but not configured", e);
      return NextResponse.json(
        { error: "Serverkonfiguration saknas för att spara andras resultat. Kontakta administratören." },
        { status: 503 }
      );
    }
  }

  const { data: inserted, error } = await client
    .from("scores")
    .insert([
      {
        course_id,
        score,
        throws: throws ?? null,
        date_played,
        with_friends,
        user_id: targetUserId,
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
    await client.from("score_holes").insert(
      hole_scores.map((h: { hole_number: number; throws: number }) => ({
        score_id: inserted.id,
        hole_number: h.hole_number,
        throws: h.throws,
      }))
    );
  }

  return NextResponse.json(inserted, { status: 200 });
}
