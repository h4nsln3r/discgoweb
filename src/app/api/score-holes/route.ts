import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET(req: NextRequest) {
  const scoreId = req.nextUrl.searchParams.get("score_id");
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

  return NextResponse.json(data ?? []);
}
