import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";
import { uploadCompetitionParticipantPhoto } from "@/lib/competition-uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: competitionId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: photos, error } = await supabase
    .from("competition_photos")
    .select("id, image_url, created_at, uploaded_by")
    .eq("competition_id", competitionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[competition-photos GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(photos ?? []);
}

export async function POST(
  req: Request,
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
    return NextResponse.json({ error: "Du måste vara inloggad för att ladda upp bilder." }, { status: 401 });
  }

  // Kontrollera att användaren är deltagare eller skapare av tävlingen
  const { data: competition } = await supabase
    .from("competitions")
    .select("id, created_by")
    .eq("id", competitionId)
    .single();

  if (!competition) {
    return NextResponse.json({ error: "Tävlingen hittades inte." }, { status: 404 });
  }

  const isCreator = competition.created_by === user.id;
  const { data: participant } = await supabase
    .from("competition_participants")
    .select("user_id")
    .eq("competition_id", competitionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isCreator && !participant) {
    return NextResponse.json(
      { error: "Endast deltagare i tävlingen kan ladda upp bilder." },
      { status: 403 }
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];
  const singleFile = formData.get("file") as File | null;
  const toUpload = files.length ? files : singleFile ? [singleFile] : [];

  if (toUpload.length === 0) {
    return NextResponse.json({ error: "Ingen bild vald." }, { status: 400 });
  }

  const maxSize = 10 * 1024 * 1024; // 10 MB
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const inserted: { id: string; image_url: string }[] = [];

  for (const file of toUpload) {
    if (!file?.size || file.size > maxSize) {
      continue;
    }
    if (!allowedTypes.includes(file.type)) {
      continue;
    }
    const imageUrl = await uploadCompetitionParticipantPhoto(supabase, competitionId, file);
    if (!imageUrl) continue;

    const { data: row, error } = await supabase
      .from("competition_photos")
      .insert({
        competition_id: competitionId,
        uploaded_by: user.id,
        image_url: imageUrl,
      })
      .select("id, image_url")
      .single();

    if (!error && row) inserted.push(row);
  }

  return NextResponse.json({ uploaded: inserted.length, photos: inserted });
}
