import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: bagRows, error } = await supabase
    .from("player_bag")
    .select("id, disc_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bagRows?.length) {
    return NextResponse.json({ bag: [] });
  }

  const discIds = bagRows.map((r) => r.disc_id);
  const { data: discs, error: discsError } = await supabase
    .from("discs")
    .select("id, name, bild, speed, glide, turn, fade")
    .in("id", discIds);

  if (discsError) {
    return NextResponse.json({ error: discsError.message }, { status: 500 });
  }

  const discMap = new Map((discs ?? []).map((d) => [d.id, d]));
  const bag = bagRows.map((r) => ({
    id: r.id,
    disc_id: r.disc_id,
    created_at: r.created_at,
    disc: discMap.get(r.disc_id) ?? null,
  }));

  return NextResponse.json({ bag });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const disc_id = body.disc_id as string | undefined;
  if (!disc_id) {
    return NextResponse.json({ error: "disc_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("player_bag")
    .insert({ user_id: user.id, disc_id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Discen finns redan i bagen" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let disc_id = searchParams.get("disc_id");
  if (!disc_id) {
    const body = await req.json().catch(() => ({}));
    disc_id = body.disc_id ?? null;
  }
  if (!disc_id) {
    return NextResponse.json({ error: "disc_id required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("player_bag")
    .delete()
    .eq("user_id", user.id)
    .eq("disc_id", disc_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
