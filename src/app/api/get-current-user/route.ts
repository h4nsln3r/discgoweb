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
    return NextResponse.json({ error: "No user found" }, { status: 401 });
  }

  // Hämta alias, avatar_url och is_admin från profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, alias, avatar_url, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const p = profile as { id: string; alias: string; avatar_url?: string | null; is_admin?: boolean };
  return NextResponse.json({
    id: p.id,
    alias: p.alias,
    avatar_url: p.avatar_url ?? null,
    is_admin: p.is_admin === true,
  });
}
