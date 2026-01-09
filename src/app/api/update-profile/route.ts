import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextRequest, NextResponse } from "next/server";

async function createSupabase() {
  const cookieStore = await cookies();

  return createRouteHandlerClient<Database>({
    // ✅ din auth-helpers version vill ha Promise här
    cookies: async () => cookieStore,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabase();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // ✅ exakt typ enligt din generated Database
  type ProfilesUpsert = Database["public"]["Tables"]["profiles"]["Insert"];

  const payload: ProfilesUpsert = {
    id: user.id,
    alias: body.alias ?? user.email?.split("@")[0] ?? "user",
    avatar_url: body.avatar_url ?? "",
    home_course: body.home_course ?? null,
    phone: body.phone ?? null,
    favorite_disc: body.favorite_disc ?? null,
    city: body.city ?? null,
    team: body.team ?? null,
  };

  // ⚠️ Typings kan bli "never" i vissa setups -> cast för att unblocka TS
  const { error } = await (supabase as any).from("profiles").upsert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
