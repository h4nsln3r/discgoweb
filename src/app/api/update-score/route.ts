import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function PUT(req: Request) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });

  const body = await req.json();
  const { id, score, date_played, course_id, competition_id } = body;

  const { data, error } = await supabase
    .from("scores")
    .update({
      score,
      date_played,
      course_id,
      competition_id,
    })
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
