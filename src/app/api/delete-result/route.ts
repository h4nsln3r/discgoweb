// src/app/api/delete-result/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import type { PostgrestError } from "@supabase/supabase-js";

async function createSupabase() {
  // Next 14.2+/15: cookies() is async – resolve it once
  const cookieStore = await cookies();

  // auth-helpers expects: cookies: () => Promise<ReadonlyRequestCookies>
  return createRouteHandlerClient<Database>({
    cookies: async () => cookieStore,
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

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    const payload = toErrorPayload(error);
    console.error("[DELETE-RESULT ERROR]", payload);
    return NextResponse.json(payload, { status: 500 });
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
