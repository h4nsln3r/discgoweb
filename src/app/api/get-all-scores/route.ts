import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });

  const { data, error } = await supabase
    .from("scores")
    .select(
      "id, score, date_played, competition_id, courses(name), profiles(alias), competitions(title)"
    )
    .order("date_played", { ascending: false });

  if (error) {
    console.error("[GET-ALL-SCORES ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
