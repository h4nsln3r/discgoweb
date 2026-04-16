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
    .select("id, disc_id, created_at, status, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true, nullsFirst: false })
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
    .select("id, name, bild, speed, glide, turn, fade, disc_type, brand")
    .in("id", discIds);

  if (discsError) {
    return NextResponse.json({ error: discsError.message }, { status: 500 });
  }

  const discMap = new Map((discs ?? []).map((d) => [d.id, d]));
  const bag = bagRows.map((r) => ({
    id: r.id,
    disc_id: r.disc_id,
    created_at: r.created_at,
    status: r.status ?? "active",
    sort_order: r.sort_order ?? null,
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

  const { data: lastBagItem } = await supabase
    .from("player_bag")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (lastBagItem?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("player_bag")
    .insert({ user_id: user.id, disc_id, sort_order: nextSortOrder })
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

const BAG_STATUSES = ["active", "discarded", "worthless", "for_trade"] as const;

export async function PATCH(req: Request) {
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
  const action = body.action as string | undefined;
  const bagItemId = body.bag_item_id as string | undefined;
  const status = body.status as string | undefined;

  if (action === "reorder") {
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const bagItemIds = items
      .map((item) => item?.id)
      .filter((id): id is string => typeof id === "string");

    if (bagItemIds.length !== items.length) {
      return NextResponse.json({ error: "Each item must include id" }, { status: 400 });
    }

    const { data: existingItems, error: existingError } = await supabase
      .from("player_bag")
      .select("id")
      .eq("user_id", user.id)
      .in("id", bagItemIds);

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if ((existingItems ?? []).length !== bagItemIds.length) {
      return NextResponse.json({ error: "One or more bag items were not found" }, { status: 404 });
    }

    const updates = items.map((item, index) =>
      supabase
        .from("player_bag")
        .update({ sort_order: index })
        .eq("id", item.id)
        .eq("user_id", user.id)
    );

    const results = await Promise.all(updates);
    const updateError = results.find((result) => result.error)?.error;
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  if (!bagItemId || !status || !BAG_STATUSES.includes(status as (typeof BAG_STATUSES)[number])) {
    return NextResponse.json(
      { error: "bag_item_id and status (active|discarded|worthless|for_trade) required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("player_bag")
    .update({ status })
    .eq("id", bagItemId)
    .eq("user_id", user.id)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Bag item not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
