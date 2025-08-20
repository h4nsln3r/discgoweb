// src/app/api/latest-courses/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // Start super-minimal to avoid column mismatches.
    // If this works, add more columns step-by-step.
    const { data, error, status } = await supabase
      .from("courses")
      .select("id, name") // add ", location, created_at" when this works
      .order("created_at", { ascending: false }) // safe to keep even if created_at exists
      .limit(5);

    if (error) {
      // Map common auth/RLS errors to 401/403 for clarity
      const msg = `[latest-courses] Supabase error (${status}): ${error.message}`;
      console.error(msg);
      const authLike = /JWT|permission|policy|RLS|authenticated/i.test(
        error.message
      );
      return NextResponse.json(
        { error: msg },
        { status: authLike ? 403 : 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    const msg = `[latest-courses] Unhandled error: ${e?.message ?? e}`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
