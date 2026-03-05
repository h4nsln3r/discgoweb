// src/app/api/delete-course/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";

async function createSupabase() {
  const cookieStore = await cookies();
  return createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });
}

// DELETE /api/delete-course?id=UUID
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createSupabase();
  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: course, error: fetchError } = await supabase
    .from("courses")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (fetchError || !course) {
    return NextResponse.json({ error: "Banan hittades inte." }, { status: 404 });
  }

  const createdBy = (course as { created_by?: string | null }).created_by;
  const canDelete = isAdmin || (createdBy != null && createdBy === user.id);
  if (!canDelete) {
    return NextResponse.json({ error: "Du får inte ta bort denna bana." }, { status: 403 });
  }

  const cid = id;

  await supabase.from("course_holes").delete().eq("course_id", cid);
  await supabase.from("competition_courses").delete().eq("course_id", cid);
  await supabase.from("scores").delete().eq("course_id", cid);
  const { error: deleteError } = await supabase.from("courses").delete().eq("id", cid);

  if (deleteError) {
    console.error("[DELETE-COURSE ERROR]", deleteError);
    return NextResponse.json(
      { error: "Kunde inte ta bort banan. Kontrollera att RLS tillåter borttagning (ägare eller admin)." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
