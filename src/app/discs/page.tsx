import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import BackLink from "@/components/Buttons/BackLink";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import DiscTypeFilter from "@/components/Disc/DiscTypeFilter";
import DiscBagStatusFilter from "@/components/Disc/DiscBagStatusFilter";

type DiscRow = {
  id: string;
  name: string;
  bild: string | null;
  disc_type: string | null;
  brand: string | null;
  speed?: number | null;
  glide?: number | null;
  turn?: number | null;
  fade?: number | null;
  created_by: string | null;
};

type BagStatus = "for_trade" | "discarded" | "worthless";

type BagListRow = {
  id: string;
  disc_id: string;
  user_id: string;
  created_at: string;
  discs: {
    id: string;
    name: string;
    bild: string | null;
    disc_type: string | null;
    brand: string | null;
    speed?: number | null;
    glide?: number | null;
    turn?: number | null;
    fade?: number | null;
    created_by: string | null;
  } | null;
  profiles: { id: string; alias: string | null } | null;
};

const DISC_TYPE_LABELS: Record<string, string> = {
  driver: "Driver",
  fairway: "Fairway",
  midrange: "Midrange",
  putter: "Putter",
  other: "Annan",
};

const BAG_PROFILE_PREFIX: Record<BagStatus, string> = {
  for_trade: "Vill byta",
  discarded: "Bortkastad av",
  worthless: "Värdelös enligt",
};

const BAG_EMPTY_TITLE: Record<BagStatus, string> = {
  for_trade: "Inga discar utlagda för byte just nu.",
  discarded: "Inga discar markerade som bortkastade just nu.",
  worthless: "Inga discar markerade som värdelösa just nu.",
};

const BAG_EMPTY_HINT =
  "Du kan sätta status på discar i din bag under Profil → Min bag.";

type PageProps = { searchParams?: Promise<{ type?: string; bag?: string }> };

function parseBagStatus(raw: string | null | undefined): BagStatus | null {
  if (raw === "for_trade" || raw === "discarded" || raw === "worthless") return raw;
  return null;
}

export default async function DiscsPage({ searchParams }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  const resolvedSearch = searchParams ? await searchParams : {};
  const typeFilter = resolvedSearch.type ?? null;
  const bagStatus = parseBagStatus(resolvedSearch.bag ?? null);

  const { data: discsData } = await supabase
    .from("discs")
    .select("id, name, bild, disc_type, brand, speed, glide, turn, fade, created_by")
    .order("name");
  const allDiscs = (discsData ?? []) as DiscRow[];
  const discs = typeFilter ? allDiscs.filter((d) => d.disc_type === typeFilter) : allDiscs;
  const canEditDisc = (createdBy: string | null) => user && (createdBy === user.id || isAdmin);

  const creatorIds = [...new Set(discs.map((d) => d.created_by).filter(Boolean))] as string[];
  const creatorMap: Record<string, { alias: string | null }> = {};
  if (creatorIds.length > 0) {
    const { data: profilesData } = await supabase.from("profiles").select("id, alias").in("id", creatorIds);
    for (const p of profilesData ?? []) {
      creatorMap[p.id] = { alias: (p as { alias: string | null }).alias ?? null };
    }
  }

  let bagRows: BagListRow[] = [];
  let bagError: { message: string } | null = null;
  if (bagStatus) {
    const { data: rows, error } = await supabase
      .from("player_bag")
      .select(
        "id, disc_id, user_id, created_at, discs(id, name, bild, disc_type, brand, speed, glide, turn, fade, created_by), profiles(id, alias)"
      )
      .eq("status", bagStatus)
      .order("created_at", { ascending: false });
    if (error) {
      bagError = { message: error.message };
    } else {
      bagRows = (rows ?? []) as unknown as BagListRow[];
    }
  }

  const bagItemsFiltered = bagStatus
    ? typeFilter
      ? bagRows.filter((r) => r.discs?.disc_type === typeFilter)
      : bagRows
    : [];

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <SetTopbarActions pageTitle="Discar" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <DiscBagStatusFilter currentBag={bagStatus} />
          <DiscTypeFilter currentType={typeFilter} />
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user ? (
            <Link
              href="/profile/bag"
              className="px-4 py-2 rounded-xl border border-retro-border bg-retro-surface text-stone-200 text-sm font-medium hover:border-stone-500 hover:bg-retro-card/50 transition shrink-0"
            >
              Min bag
            </Link>
          ) : null}
          <Link
            href="/discs/new"
            className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition shrink-0"
          >
            Lägg till disc
          </Link>
        </div>
      </div>

      {bagStatus ? (
        bagError ? (
          <p className="text-amber-400">Kunde inte hämta listan: {bagError.message}</p>
        ) : bagItemsFiltered.length === 0 ? (
          <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
            <p className="text-stone-400">{bagRows.length === 0 ? BAG_EMPTY_TITLE[bagStatus] : "Inga discar av denna typ."}</p>
            <p className="text-stone-500 text-sm mt-2">
              {bagRows.length === 0 ? (
                <>
                  {bagStatus === "for_trade" ? (
                    <>Markera discar som &quot;Vill byta/sälja&quot; i din bag under Profil → Min bag.</>
                  ) : (
                    BAG_EMPTY_HINT
                  )}
                </>
              ) : (
                <>Välj &quot;Alla typer&quot; i menyn ovan för att se alla träffar.</>
              )}
            </p>
            {user ? (
              <Link href="/profile/bag" className="inline-block mt-4 text-retro-accent hover:underline font-medium">
                Gå till Min bag
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-4">
            {bagItemsFiltered.map((row) => {
              const disc = row.discs;
              if (!disc) return null;
              return (
                <li
                  key={row.id}
                  className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm flex flex-col sm:flex-row sm:items-stretch"
                >
                  <Link
                    href={`/discs/${row.disc_id}`}
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
                        href={`/discs/${row.disc_id}`}
                        className="flex-1 min-w-0 hover:bg-retro-card/20 transition group -m-2 p-2 rounded-lg"
                      >
                        <span className="text-2xl sm:text-4xl font-bebas tracking-wide text-stone-100 group-hover:text-retro-accent uppercase block truncate transition-colors">
                          {disc.name}
                        </span>
                        <div className="flex flex-col gap-0.5 text-sm mt-0.5">
                          {disc.brand && <span className="font-semibold text-stone-300">{disc.brand}</span>}
                          {disc.disc_type && (
                            <span className="text-amber-400/90 font-medium">
                              {DISC_TYPE_LABELS[disc.disc_type] ?? disc.disc_type}
                            </span>
                          )}
                          {[disc.speed, disc.glide, disc.turn, disc.fade].filter((n) => n != null).length > 0 && (
                            <span className="text-stone-500 tabular-nums">
                              {[disc.speed, disc.glide, disc.turn, disc.fade].filter((n) => n != null).join(" · ")}
                            </span>
                          )}
                        </div>
                      </Link>
                      {canEditDisc(disc.created_by) && (
                        <Link
                          href={`/discs/${row.disc_id}/edit`}
                          className="p-2 rounded-xl text-amber-500/90 hover:bg-amber-500/10 hover:text-amber-400 transition shrink-0 ml-1"
                          aria-label="Redigera disc"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                    <div className="px-4 pb-3 text-right">
                      <Link
                        href={`/profile/${row.user_id}`}
                        className="text-xs text-retro-accent/90 hover:text-retro-accent hover:underline"
                      >
                        {BAG_PROFILE_PREFIX[bagStatus]}: {row.profiles?.alias?.trim() || "Anonym"}
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : !allDiscs.length ? (
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
      ) : !discs.length ? (
        <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
          <p className="text-stone-400">Inga discar av denna typ.</p>
          <p className="text-stone-500 text-sm mt-2">Välj &quot;Alla typer&quot; i menyn ovan för att se alla discar.</p>
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
                    <div className="flex flex-col gap-0.5 text-sm mt-0.5">
                      {disc.brand && <span className="font-semibold text-stone-300">{disc.brand}</span>}
                      {disc.disc_type && <span className="text-amber-400/90 font-medium">{DISC_TYPE_LABELS[disc.disc_type] ?? disc.disc_type}</span>}
                      {[disc.speed, disc.glide, disc.turn, disc.fade].filter((n) => n != null).length > 0 && (
                        <span className="text-stone-500 tabular-nums">{[disc.speed, disc.glide, disc.turn, disc.fade].filter((n) => n != null).join(" · ")}</span>
                      )}
                    </div>
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
