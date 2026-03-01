import type { SupabaseClient } from "@supabase/supabase-js";

/** Bucket "competitions" i Supabase Storage. Kräver RLS-policy som tillåter INSERT för autentiserade användare (och SELECT för public om bucket är public). */
const BUCKET = "competitions";

export async function uploadCompetitionImage(
  supabase: SupabaseClient,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    const msg = (error as { message?: string }).message ?? String(error);
    console.error("[competition-uploads] error:", msg);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
