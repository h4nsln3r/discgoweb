// src/app/api/delete-result/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

async function createSupabase() {
  // Next 14.2+/15: cookies() is async – resolve it once
  const cookieStore = await cookies();

  // Your auth-helpers typing expects () => Promise<ReadonlyRequestCookies>
  return createRouteHandlerClient<Database>({
    cookies: async () => cookieStore, // <- important: returns a Promise
  });
}

async function doDelete(id: string) {
  const supabase = await createSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    const payload = {
      error: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    };
    console.error("[DELETE-RESULT ERROR]", payload);
    // Returnera vettig status om du vill:
    return NextResponse.json(payload, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/delete-result?id=UUID
export async function DELETE(req: Request) {
  // <-- async
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return doDelete(id);
}

// (valfritt) POST /api/delete-result { id: "UUID" }
export async function POST(req: Request) {
  // <-- async
  const { id } = await req.json().catch(() => ({} as any));
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  return doDelete(id);
}
