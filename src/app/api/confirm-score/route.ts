import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

function normalizeFriends(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);
  if (typeof input === "string") {
    const t = input.trim();
    if (!t) return [];
    try {
      const p = JSON.parse(t);
      return Array.isArray(p) ? p.map(String).filter(Boolean) : [t];
    } catch {
      return [t];
    }
  }
  return [];
}

export async function POST(req: NextRequest) {
  let body: { score_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scoreId = body.score_id;
  if (!scoreId) {
    return NextResponse.json({ error: "score_id required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: score, error: scoreError } = await supabase
    .from("scores")
    .select("with_friends")
    .eq("id", scoreId)
    .single();

  if (scoreError || !score) {
    return NextResponse.json({ error: "Score not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("alias")
    .eq("id", user.id)
    .maybeSingle();

  const myAlias = (profile as { alias?: string } | null)?.alias?.trim() ?? "";
  const friends = normalizeFriends((score as { with_friends: unknown }).with_friends);
  const isInList = friends.some((f) => f === myAlias || f.replace(/^Gäst:/, "").trim() === myAlias);
  if (!isInList) {
    return NextResponse.json(
      { error: "Du finns inte i listan Spelade med för detta resultat." },
      { status: 403 }
    );
  }

  // score_confirmations kan saknas i genererade Database-typer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from("score_confirmations")
    .upsert({ score_id: scoreId, user_id: user.id }, { onConflict: "score_id,user_id" });

  if (insertError) {
    if (insertError.code === "42P01") {
      return NextResponse.json(
        { error: "Tabellen score_confirmations finns inte. Kör migrationen i Supabase." },
        { status: 503 }
      );
    }
    console.error("[confirm-score]", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
