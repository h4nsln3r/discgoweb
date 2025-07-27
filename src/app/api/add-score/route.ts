import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(req: Request) {
  const cookieStore = cookies();
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

  // Parse body
  const body = await req.json();
  const { course_id, score, date_played, with_friends } = body;

  // Insert med user_id
  const { data, error } = await supabase.from("scores").insert([
    {
      course_id,
      score,
      date_played,
      with_friends,
      user_id: user.id,
    },
  ]);

  if (error) {
    console.error("[ADD-SCORE ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
