import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  if (!user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const { data: competition, error: fetchError } = await supabase
    .from("competitions")
    .select("id, created_by")
    .eq("id", competitionId)
    .single();

  if (fetchError || !competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const isCreator = competition.created_by === user.id;
  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Endast skaparen eller en administratör kan ta bort tävlingen." },
      { status: 403 }
    );
  }

  // Ta bort kopplade data (RLS tillåter där det behövs)
  await supabase.from("competition_photos").delete().eq("competition_id", competitionId);
  await supabase.from("competition_organizers").delete().eq("competition_id", competitionId);
  await supabase.from("competition_participants").delete().eq("competition_id", competitionId);
  await supabase.from("competition_courses").delete().eq("competition_id", competitionId);
  await supabase.from("scores").update({ competition_id: null }).eq("competition_id", competitionId);

  const { error: deleteError } = await supabase
    .from("competitions")
    .delete()
    .eq("id", competitionId);

  if (deleteError) {
    console.error("[DELETE COMPETITION]", deleteError);
    return NextResponse.json(
      { error: deleteError.message || "Kunde inte ta bort tävlingen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
