import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { createOptionalSupabaseAdminClient } from "@/lib/supabase-server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const admin = createOptionalSupabaseAdminClient();
  const accessClient = admin ?? supabase;

  const { data: competition, error: competitionError } = await accessClient
    .from("competitions")
    .select("id")
    .eq("id", competitionId)
    .maybeSingle();

  if (competitionError) {
    console.error("[JOIN COMPETITION] competition lookup failed", competitionError);
    return NextResponse.json({ error: "Kunde inte verifiera tävlingen." }, { status: 500 });
  }
  if (!competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const { error: joinError } = await accessClient.from("competition_participants").insert({
    competition_id: competitionId,
    user_id: user.id,
  });

  if (joinError) {
    if (joinError.code === "23505") {
      return NextResponse.json({ error: "Du har redan gått med i denna tävling." }, { status: 409 });
    }
    console.error("[JOIN COMPETITION] insert failed", joinError);
    return NextResponse.json({ error: "Kunde inte gå med i tävlingen." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
