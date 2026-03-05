import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import BackLink from "@/components/Buttons/BackLink";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

type DiscRow = {
  id: string;
  name: string;
  bild: string | null;
  speed?: number | null;
  glide?: number | null;
  turn?: number | null;
  fade?: number | null;
  created_by: string | null;
};

export default async function DiscsPage() {
  const supabase = await createServerSupabaseClient();
  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  const { data: discsData } = await supabase.from("discs").select("id, name, bild, speed, glide, turn, fade, created_by").order("name");
  const discs = (discsData ?? []) as DiscRow[];
  const canEditDisc = (createdBy: string | null) => user && (createdBy === user.id || isAdmin);

  const creatorIds = [...new Set(discs.map((d) => d.created_by).filter(Boolean))] as string[];
  const creatorMap: Record<string, { alias: string | null }> = {};
  if (creatorIds.length > 0) {
    const { data: profilesData } = await supabase.from("profiles").select("id, alias").in("id", creatorIds);
    for (const p of profilesData ?? []) {
      creatorMap[p.id] = { alias: (p as { alias: string | null }).alias ?? null };
    }
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Discar</h1>
        <Link
          href="/discs/new"
          className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          Lägg till disc
        </Link>
      </div>

      {!discs?.length ? (
        <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
          <p className="text-stone-300 text-lg">Inga discar än.</p>
          <p className="text-stone-500 text-sm mt-2">
            Lägg till discar för att se dem här och välja favorit disc i profilen.
          </p>
          <Link
            href="/discs/new"
            className="inline-block mt-4 px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
          >
            Lägg till disc
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {discs.map((disc) => (
            <li
              key={disc.id}
              className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-stretch"
            >
              <Link
                href={`/discs/${disc.id}`}
                className="w-full sm:w-28 sm:h-28 sm:min-w-[7rem] sm:min-h-[7rem] aspect-square sm:flex-shrink-0 overflow-hidden bg-retro-card/50 relative rounded-full group block sm:ml-4 sm:my-4 sm:self-center"
              >
                {disc.bild ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={disc.bild}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200 sm:min-h-full"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-retro-muted text-4xl">
                    🥏
                  </div>
                )}
              </Link>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-1 items-center min-w-0 py-4 pr-4 pl-4 sm:pl-4">
                  <Link
                    href={`/discs/${disc.id}`}
                    className="flex-1 min-w-0 hover:bg-retro-card/20 transition group -m-2 p-2 rounded-lg"
                  >
                    <span className="text-2xl sm:text-4xl font-bebas tracking-wide text-stone-100 group-hover:text-retro-accent uppercase block truncate transition-colors">
                      {disc.name}
                    </span>
                    {(() => {
                      const parts = [disc.speed, disc.glide, disc.turn, disc.fade].filter((n) => n != null);
                      return parts.length > 0 ? (
                        <p className="text-sm text-stone-400 font-medium tabular-nums mt-0.5">{parts.join(" · ")}</p>
                      ) : null;
                    })()}
                  </Link>
                  {canEditDisc(disc.created_by) && (
                    <Link
                      href={`/discs/${disc.id}/edit`}
                      className="p-2 rounded-xl text-amber-500/90 hover:bg-amber-500/10 hover:text-amber-400 transition shrink-0 ml-1"
                      aria-label="Redigera disc"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>
                {disc.created_by && (
                  <div className="px-4 pb-3 text-right">
                    <p className="text-xs text-stone-500">
                      Tillagd av{" "}
                      <Link
                        href={`/profile/${disc.created_by}`}
                        className="text-retro-accent/90 hover:text-retro-accent hover:underline"
                      >
                        {creatorMap[disc.created_by]?.alias?.trim() || "—"}
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6">
        <BackLink />
      </p>
    </main>
  );
}
