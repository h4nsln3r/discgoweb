import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import BackButton from "@/components/Buttons/BackButton";
import DiscCommentForm from "@/components/Disc/DiscCommentForm";
import DiscCommentList from "@/components/Disc/DiscCommentList";
import DiscImageModal from "@/components/Disc/DiscImageModal";
import BagStatusCircle from "@/components/Bag/BagStatusCircle";

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
  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);

  const { data: disc, error } = await supabase
    .from("discs")
    .select("id, name, bild, speed, glide, turn, fade, created_by")
    .eq("id", id)
    .single();

  if (error || !disc) notFound();

  const discRow = disc as DiscRow;
  const canEdit = user && (discRow.created_by === user.id || isAdmin);
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

  type BagUserRow = {
    id: string;
    user_id: string;
    status: string;
    profiles: { id: string; alias: string | null; avatar_url: string | null } | null;
  };
  const { data: bagUsersData } = await supabase
    .from("player_bag")
    .select("id, user_id, status, profiles(id, alias, avatar_url)")
    .eq("disc_id", id)
    .order("user_id");
  const bagUsers = (bagUsersData ?? []) as BagUserRow[];

  const BAG_STATUS_LABELS: Record<string, string> = {
    active: "Aktiv",
    discarded: "Bortkastad",
    worthless: "Värdelös",
    for_trade: "Vill byta/sälja",
  };

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Disc: stor bild (klick = fullskärm), namn i Lag-stil, flygsiffror separat */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <DiscImageModal
            imageUrl={discRow.bild}
            discName={discRow.name}
            className="w-56 h-56 sm:w-64 sm:h-64 shrink-0"
          />
          <div className="min-w-0 flex-1 flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase truncate">
                {discRow.name}
              </h1>
              {canEdit && (
                <Link
                  href={`/discs/${id}/edit`}
                  className="px-3 py-1.5 rounded-lg text-amber-500 border border-amber-500/50 hover:bg-amber-500/10 text-sm shrink-0"
                >
                  Redigera
                </Link>
              )}
            </div>
            {discRow.created_by && (
              <p className="text-sm text-stone-500">
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
        </div>

        {/* Flygsiffror med förklarande etiketter – alltid alla fyra */}
        <div className="mt-6 pt-4 border-t border-retro-border">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
              Flygstabiliseringssiffror
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Speed (1–14)</p>
                <p className="text-xl font-semibold text-stone-200">{discRow.speed != null ? discRow.speed : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Glide (1–7)</p>
                <p className="text-xl font-semibold text-stone-200">{discRow.glide != null ? discRow.glide : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Turn (-5–1)</p>
                <p className="text-xl font-semibold text-stone-200">{discRow.turn != null ? discRow.turn : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Fade (0–5)</p>
                <p className="text-xl font-semibold text-stone-200">{discRow.fade != null ? discRow.fade : "—"}</p>
              </div>
            </div>
          </div>
      </div>

      {/* Användare som har denna disc */}
      {bagUsers.length > 0 && (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-stone-200 mb-3">
            Användare som har denna disc
          </h2>
          <p className="text-sm text-stone-500 mb-4">
            {bagUsers.length} {bagUsers.length === 1 ? "användare har" : "användare har"} denna disc i sin bag. Status visar hur de använder den.
          </p>
          <ul className="space-y-2">
            {bagUsers.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/profile/${row.user_id}`}
                  className="flex items-center gap-3 rounded-xl bg-retro-card/50 border border-retro-border px-3 py-2 hover:bg-retro-card transition"
                >
                  <BagStatusCircle status={row.status ?? "active"} />
                  <span className="text-stone-200 font-medium truncate">
                    {row.profiles?.alias?.trim() || "Anonym"}
                  </span>
                  <span className="text-stone-500 text-sm ml-auto shrink-0">
                    {BAG_STATUS_LABELS[row.status] ?? row.status ?? "Aktiv"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

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
