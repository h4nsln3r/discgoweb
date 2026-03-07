import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BackLink from "@/components/Buttons/BackLink";

type StatusRow = {
  id: string;
  disc_id: string;
  user_id: string;
  created_at: string;
  discs: { id: string; name: string; bild: string | null; disc_type: string | null; brand: string | null } | null;
  profiles: { id: string; alias: string | null } | null;
};

const DISC_TYPE_LABELS: Record<string, string> = {
  driver: "Driver",
  fairway: "Fairway",
  midrange: "Midrange",
  putter: "Putter",
  other: "Annan",
};

export default async function DiscsDiscardedPage() {
  const supabase = await createServerSupabaseClient();

  const { data: rows, error } = await supabase
    .from("player_bag")
    .select("id, disc_id, user_id, created_at, discs(id, name, bild, disc_type, brand), profiles(id, alias)")
    .eq("status", "discarded")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-4 sm:p-6 max-w-3xl mx-auto">
        <p className="text-amber-400">Kunde inte hämta listan: {error.message}</p>
        <p className="mt-4">
          <BackLink />
        </p>
      </main>
    );
  }

  const items = (rows ?? []) as StatusRow[];

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Bortkastade discar</h1>
          <p className="text-stone-400 text-sm mt-1">
            Discar som användare har markerat som bortkastade. Klicka på en disc eller profil för att se mer.
          </p>
        </div>
        <Link
          href="/discs"
          className="text-sm text-retro-accent hover:underline font-medium shrink-0"
        >
          ← Tillbaka till alla discar
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-8 text-center">
          <p className="text-stone-400">Inga discar markerade som bortkastade just nu.</p>
          <p className="text-stone-500 text-sm mt-2">
            Du kan sätta status på discar i din bag under Profil → Min bag.
          </p>
          <Link href="/profile/bag" className="inline-block mt-4 text-retro-accent hover:underline font-medium">
            Gå till Min bag
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <Link
                href={`/discs/${row.disc_id}`}
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-retro-card flex items-center justify-center shrink-0">
                  {row.discs?.bild ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={row.discs.bild} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-retro-muted text-2xl">🥏</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-stone-100 font-semibold block truncate">{row.discs?.name ?? "—"}</span>
                  <div className="flex flex-col gap-0.5 text-xs mt-0.5">
                    {row.discs?.brand && <span className="font-semibold text-stone-400">{row.discs.brand}</span>}
                    {row.discs?.disc_type && <span className="text-amber-400/90">{DISC_TYPE_LABELS[row.discs.disc_type] ?? row.discs.disc_type}</span>}
                  </div>
                </div>
              </Link>
              <Link
                href={`/profile/${row.user_id}`}
                className="flex items-center gap-2 text-stone-400 hover:text-retro-accent transition text-sm shrink-0"
              >
                <span>Bortkastad av: {row.profiles?.alias?.trim() || "Anonym"}</span>
                <span aria-hidden>→</span>
              </Link>
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
