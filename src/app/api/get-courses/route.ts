// app/api/get-courses/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });

  const { data, error } = await supabase.from("courses").select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
