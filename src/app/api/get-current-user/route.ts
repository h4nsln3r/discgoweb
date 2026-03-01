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

  // Hämta alias och is_admin från profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, alias, is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const p = profile as { id: string; alias: string; is_admin?: boolean };
  return NextResponse.json({ id: p.id, alias: p.alias, is_admin: p.is_admin === true });
}
