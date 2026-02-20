import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function DiscsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: discsData } = await supabase.from("discs").select("id, name, bild").order("name");
  const discs = discsData ?? [];

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
        <p className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center text-retro-muted">
          Inga discar tillagda än. Lägg till för att kunna välja favorit disc i profilen.
        </p>
      ) : (
        <ul className="space-y-3">
          {discs.map((disc) => (
            <li
              key={disc.id}
              className="flex items-center gap-4 rounded-xl border border-retro-border bg-retro-surface p-4"
            >
              {disc.bild ? (
                <div className="h-12 w-12 rounded-full overflow-hidden bg-retro-card shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={disc.bild} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-12 w-12 rounded-full bg-retro-card flex items-center justify-center text-retro-muted shrink-0 text-xl">
                  🥏
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-stone-100 truncate">{disc.name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-stone-500">
        <Link href="/profile/edit" className="text-retro-accent hover:underline">
          Tillbaka till redigera profil
        </Link>
      </p>
    </main>
  );
}
