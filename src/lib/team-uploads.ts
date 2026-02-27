import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "teams";

export type UploadTeamAssetsResult = {
  loggaUrl: string | null;
  bildUrl: string | null;
  /** Felmeddelande om någon uppladdning misslyckades (t.ex. bucket saknas). */
  error?: string;
};

export async function uploadTeamAssets(
  supabase: SupabaseClient,
  teamId: string,
  loggaFile?: File,
  bildFile?: File
): Promise<UploadTeamAssetsResult> {
  let loggaUrl: string | null = null;
  let bildUrl: string | null = null;
  let errorMessage: string | undefined;

  const cacheBust = () => `v=${Date.now()}`;

  if (loggaFile) {
    const ext = loggaFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${teamId}/logga.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, loggaFile, { upsert: true });
    if (error) {
      console.error("[team-uploads] logga upload error:", error);
      errorMessage = errorMessage ?? error.message;
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const sep = data.publicUrl.includes("?") ? "&" : "?";
      loggaUrl = `${data.publicUrl}${sep}${cacheBust()}`;
    }
  }

  if (bildFile) {
    const ext = bildFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${teamId}/bild.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bildFile, { upsert: true });
    if (error) {
      console.error("[team-uploads] bild upload error:", error);
      errorMessage = errorMessage ?? error.message;
    } else {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const sep = data.publicUrl.includes("?") ? "&" : "?";
      bildUrl = `${data.publicUrl}${sep}${cacheBust()}`;
    }
  }

  return { loggaUrl, bildUrl, error: errorMessage };
}
