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

  // score_confirmations kan saknas i genererade Database-typer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase as any)
    .from("score_confirmations")
    .select("user_id, profiles(alias)")
    .eq("score_id", scoreId);

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ confirmed: [] });
    }
    console.error("[score-confirmations]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const confirmed = (rows ?? []).map((r: { user_id: string; profiles: { alias: string | null } | null }) => ({
    user_id: r.user_id,
    alias: (r.profiles?.alias ?? "").trim() || "Okänd",
  }));

  return NextResponse.json({ confirmed });
}
