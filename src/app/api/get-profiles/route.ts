import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });

  // Hämta id och alias för alla profiler
  const { data, error } = await supabase
    .from("profiles")
    .select("id, alias")
    .order("alias", { ascending: true });

  if (error) {
    console.error("[GET-PROFILES ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
