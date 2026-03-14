import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/** GET: Lista arrangörer (created_by + competition_organizers) och deltagare (för att bjuda in). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const { data: competition, error: compErr } = await supabase
    .from("competitions")
    .select("id, created_by")
    .eq("id", competitionId)
    .single();

  if (compErr || !competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const creatorId = (competition as { created_by?: string | null }).created_by ?? null;

  const organizerIds = new Set<string>();
  if (creatorId) organizerIds.add(creatorId);
  try {
    const { data: extraOrganizers } = await supabase
      .from("competition_organizers")
      .select("user_id")
      .eq("competition_id", competitionId);
    (extraOrganizers ?? []).forEach((r) => organizerIds.add(r.user_id));
  } catch {
    // Tabellen competition_organizers kanske inte finns än
  }

  const { data: participantsData } = await supabase
    .from("competition_participants")
    .select("user_id, profiles(alias, avatar_url)")
    .eq("competition_id", competitionId);

  type Prof = { alias: string | null; avatar_url: string | null };
  const participants = (participantsData ?? []).map((p: { user_id: string; profiles: Prof | null }) => ({
    user_id: p.user_id,
    alias: p.profiles?.alias ?? null,
    avatar_url: p.profiles?.avatar_url ?? null,
  }));

  return NextResponse.json({
    creatorId,
    organizerIds: Array.from(organizerIds),
    participants,
  });
}

/** POST: Lägg till en arrangör (användaren måste vara skapare eller befintlig arrangör). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: competitionId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.trim() : null;
  if (!userId) {
    return NextResponse.json({ error: "userId krävs." }, { status: 400 });
  }

  const { data: competition, error: compErr } = await supabase
    .from("competitions")
    .select("id, created_by")
    .eq("id", competitionId)
    .single();

  if (compErr || !competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const creatorId = (competition as { created_by?: string | null }).created_by ?? null;
  const isCreator = creatorId === user.id;
  const { data: existing } = await supabase
    .from("competition_organizers")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("user_id", user.id)
    .maybeSingle();
  const isOrganizer = Boolean(existing);
  if (!isCreator && !isOrganizer) {
    return NextResponse.json(
      { error: "Endast arrangörer kan bjuda in andra arrangörer." },
      { status: 403 }
    );
  }

  if (userId === creatorId) {
    return NextResponse.json(
      { error: "Skaparen är redan arrangör." },
      { status: 400 }
    );
  }

  const { data: isParticipant } = await supabase
    .from("competition_participants")
    .select("user_id")
    .eq("competition_id", competitionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!isParticipant) {
    return NextResponse.json(
      { error: "Endast deltagare i tävlingen kan läggas till som arrangör." },
      { status: 400 }
    );
  }

  const { error: insertErr } = await supabase
    .from("competition_organizers")
    .insert({ competition_id: competitionId, user_id: userId });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "Personen är redan arrangör." }, { status: 400 });
    }
    return NextResponse.json(
      { error: insertErr.message || "Kunde inte lägga till arrangör." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/** DELETE: Ta bort en arrangör (kan inte ta bort skaparen). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await params;
  const userIdParam = new URL(req.url).searchParams.get("userId");
  if (!userIdParam) {
    return NextResponse.json({ error: "userId krävs." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const { data: competition, error: compErr } = await supabase
    .from("competitions")
    .select("id, created_by")
    .eq("id", competitionId)
    .single();

  if (compErr || !competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const creatorId = (competition as { created_by?: string | null }).created_by ?? null;
  if (userIdParam === creatorId) {
    return NextResponse.json(
      { error: "Skaparen kan inte tas bort som arrangör." },
      { status: 400 }
    );
  }

  const isCreator = creatorId === user.id;
  const { data: existing } = await supabase
    .from("competition_organizers")
    .select("id")
    .eq("competition_id", competitionId)
    .eq("user_id", user.id)
    .maybeSingle();
  const isOrganizer = Boolean(existing);
  if (!isCreator && !isOrganizer) {
    return NextResponse.json(
      { error: "Endast arrangörer kan ta bort andra arrangörer." },
      { status: 403 }
    );
  }

  const { error: delErr } = await supabase
    .from("competition_organizers")
    .delete()
    .eq("competition_id", competitionId)
    .eq("user_id", userIdParam);

  if (delErr) {
    return NextResponse.json(
      { error: delErr.message || "Kunde inte ta bort arrangör." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
