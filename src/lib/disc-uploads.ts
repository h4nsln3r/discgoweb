import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "discs";

const COMMENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const COMMENT_VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function uploadDiscImage(
  supabase: SupabaseClient,
  file: File
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    console.error("[disc-uploads] error:", error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Ladda upp bild eller video till en discs kommentar. Path: comments/{discId}/{uuid}.ext */
export async function uploadDiscCommentMedia(
  supabase: SupabaseClient,
  discId: string,
  file: File
): Promise<{ url: string; mediaType: "image" | "video" } | null> {
  const mime = file.type?.toLowerCase();
  const isImage = COMMENT_IMAGE_TYPES.includes(mime);
  const isVideo = COMMENT_VIDEO_TYPES.includes(mime);
  if (!isImage && !isVideo) {
    console.error("[disc-uploads] comment media: unsupported type", file.type);
    return null;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || (isImage ? "jpg" : "mp4");
  const path = `comments/${discId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });

  if (error) {
    console.error("[disc-uploads] comment media error:", error);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, mediaType: isImage ? "image" : "video" };
}

export function isCommentImageType(type: string): boolean {
  return COMMENT_IMAGE_TYPES.includes(type.toLowerCase());
}

export function isCommentVideoType(type: string): boolean {
  return COMMENT_VIDEO_TYPES.includes(type.toLowerCase());
}
