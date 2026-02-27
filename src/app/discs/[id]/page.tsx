import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BackButton from "@/components/Buttons/BackButton";
import DiscCommentForm from "@/components/Disc/DiscCommentForm";
import DiscCommentList from "@/components/Disc/DiscCommentList";

type DiscRow = {
  id: string;
  name: string;
  bild: string | null;
  speed: number | null;
  glide: number | null;
  turn: number | null;
  fade: number | null;
  created_by: string | null;
};

export default async function DiscPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: disc, error } = await supabase
    .from("discs")
    .select("id, name, bild, speed, glide, turn, fade, created_by")
    .eq("id", id)
    .single();

  if (error || !disc) notFound();

  const discRow = disc as DiscRow;
  let creatorAlias: string | null = null;
  if (discRow.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", discRow.created_by)
      .maybeSingle();
    creatorAlias = (profile as { alias?: string } | null)?.alias ?? null;
  }

  const { data: commentsData } = await supabase
    .from("disc_comments")
    .select("id, disc_id, user_id, body, media_type, media_url, created_at")
    .eq("disc_id", id)
    .order("created_at", { ascending: true });

  const comments = commentsData ?? [];
  const authorIds = [...new Set(comments.map((c) => c.user_id))];
  const authorMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, alias")
      .in("id", authorIds);
    for (const p of profiles ?? []) {
      authorMap[p.id] = (p as { alias?: string }).alias?.trim() ?? "—";
    }
  }

  const parts = [discRow.speed, discRow.glide, discRow.turn, discRow.fade].filter(
    (n) => n != null
  );
  const flightStr = parts.length > 0 ? parts.join(" · ") : null;

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Disc-kort */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 mb-6">
        <div className="flex items-center gap-4">
          {discRow.bild ? (
            <div className="h-16 w-16 rounded-full overflow-hidden bg-retro-card shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={discRow.bild}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-retro-card flex items-center justify-center text-retro-muted shrink-0 text-2xl">
              🥏
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-stone-100 truncate">
              {discRow.name}
            </h1>
            {flightStr && (
              <p className="text-sm text-stone-500 mt-0.5">{flightStr}</p>
            )}
            {discRow.created_by && (
              <p className="text-xs text-stone-500 mt-1">
                Tillagd av{" "}
                <Link
                  href={`/profile/${discRow.created_by}`}
                  className="text-retro-accent hover:underline"
                >
                  {creatorAlias ?? "—"}
                </Link>
              </p>
            )}
          </div>
          {user && discRow.created_by === user.id && (
            <Link
              href={`/discs/${id}/edit`}
              className="px-3 py-1.5 rounded-lg text-amber-500 border border-amber-500/50 hover:bg-amber-500/10 text-sm shrink-0"
            >
              Redigera
            </Link>
          )}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-stone-200 mb-3">
        Diskussion & inlägg
      </h2>
      <p className="text-sm text-stone-500 mb-4">
        Skriv en kommentar, dela en bild från kastet eller ladda upp en kort video.
      </p>

      {user ? (
        <DiscCommentForm discId={id} />
      ) : (
        <p className="rounded-xl border border-retro-border bg-retro-surface p-4 text-center text-stone-400 text-sm mb-6">
          <Link href="/auth" className="text-retro-accent hover:underline">
            Logga in
          </Link>{" "}
          för att kommentera eller ladda upp bild/video.
        </p>
      )}

      <DiscCommentList comments={comments} authorMap={authorMap} />
    </main>
  );
}
