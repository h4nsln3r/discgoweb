import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import BackLink from "@/components/Buttons/BackLink";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default async function DiscsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: discsData } = await supabase.from("discs").select("id, name, bild, speed, glide, turn, fade, created_by").order("name");
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
                {(() => {
                  const d = disc as { speed?: number | null; glide?: number | null; turn?: number | null; fade?: number | null };
                  const parts = [d.speed, d.glide, d.turn, d.fade].filter((n) => n != null);
                  return parts.length > 0 ? (
                    <p className="text-xs text-stone-500 mt-0.5">{parts.join(" · ")}</p>
                  ) : null;
                })()}
              </div>
              {user && (disc as { created_by?: string | null }).created_by === user.id && (
                <Link
                  href={`/discs/${disc.id}/edit`}
                  className="p-2 rounded-lg text-amber-500 hover:bg-retro-card hover:text-amber-400 transition shrink-0"
                  aria-label="Redigera disc"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6">
        <BackLink href="/profile/edit" />
      </p>
    </main>
  );
}
