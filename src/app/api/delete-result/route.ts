// src/app/api/delete-result/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

async function createSupabase() {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });
}

type DeleteResultBody = {
  id?: string;
};

type ErrorPayload = {
  error: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

function toErrorPayload(error: PostgrestError): ErrorPayload {
  return {
    error: error.message,
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  };
}

async function readJsonBody<T extends object>(req: Request): Promise<T | null> {
  try {
    const data: unknown = await req.json();
    if (data && typeof data === "object") return data as T;
    return null;
  } catch {
    return null;
  }
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

  // .select() so we get back deleted row(s) – if empty, nothing was deleted (e.g. RLS or wrong user)
  const { data: deleted, error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    const payload = toErrorPayload(error);
    console.error("[DELETE-RESULT ERROR]", payload);
    return NextResponse.json(payload, { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    console.warn("[DELETE-RESULT] No row deleted for id=%s user_id=%s (RLS or row not found)", id, user.id);
    return NextResponse.json(
      { error: "Resultatet kunde inte tas bort. Kontrollera att du äger resultatet och att RLS tillåter borttagning." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/delete-result?id=UUID
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return doDelete(id);
}

// (valfritt) POST /api/delete-result { id: "UUID" }
export async function POST(req: Request) {
  const body = await readJsonBody<DeleteResultBody>(req);
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return doDelete(id);
}
