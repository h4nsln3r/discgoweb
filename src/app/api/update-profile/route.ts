import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // ✅ Adapter: auth-helpers förväntar sig ett objekt med get/set/remove
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => ({
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) =>
          cookieStore.set({ name, value, ...options }),
        remove: (name: string, options: any) =>
          cookieStore.set({ name, value: "", ...options }),
      }),
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Unauthorized", details: userErr?.message ?? null },
        { status: 401 }
      );
    }

    const body = await req.json();

    const home_course =
      body.home_course === "" || body.home_course == null
        ? null
        : body.home_course;

    type ProfilesInsert = Database["public"]["Tables"]["profiles"]["Insert"];

    const payload: ProfilesInsert = {
      id: userData.user.id,
      alias: body.alias ?? userData.user.email?.split("@")[0] ?? "user",
      avatar_url: body.avatar_url ?? "",
      home_course,
      phone: body.phone ?? null,
      favorite_disc: body.favorite_disc ?? null,
      city: body.city ?? null,
      team: body.team ?? null,
    };

    const { data, error } = await (supabase as any)
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code ?? null,
          details: (error as any).details ?? null,
          hint: (error as any).hint ?? null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", details: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
