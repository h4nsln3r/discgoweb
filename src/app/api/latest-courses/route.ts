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
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, location, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      const msg = `[latest-courses] error primary query: ${error.message}`;
      console.warn(msg);

      const needsFallback =
        /column .* created_at .* does not exist/i.test(error.message) ||
        /invalid input/i.test(error.message);

      if (!needsFallback) {
        const authLike = /JWT|permission|policy|RLS|not authorized/i.test(
          error.message
        );
        return NextResponse.json(
          { error: msg },
          { status: authLike ? 403 : 500 }
        );
      }

      const fb = await supabase
        .from("courses")
        .select("id, name, location")
        .order("id", { ascending: false })
        .limit(5);

      if (fb.error) {
        const fbMsg = `[latest-courses] fallback error: ${fb.error.message}`;
        console.error(fbMsg);
        const authLike = /JWT|permission|policy|RLS|not authorized/i.test(
          fb.error.message
        );
        return NextResponse.json(
          { error: fbMsg },
          { status: authLike ? 403 : 500 }
        );
      }

      return NextResponse.json(fb.data ?? []);
    }

    return NextResponse.json(data ?? []);
  } catch (err: unknown) {
    const msg = `[latest-courses] unhandled: ${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
