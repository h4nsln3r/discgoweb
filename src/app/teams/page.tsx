import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, ort, logga, bild, about")
    .order("name");

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
          <UserGroupIcon className="w-7 h-7 text-retro-accent shrink-0" aria-hidden />
          Lag
        </h1>
        <Link
          href="/teams/new"
          className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          Lägg till lag
        </Link>
      </div>

      {!teams?.length ? (
        <p className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center text-retro-muted">
          Inga lag tillagda än.
        </p>
      ) : (
        <ul className="space-y-3">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/teams/${team.id}`}
                className="flex items-center gap-4 rounded-xl border border-retro-border bg-retro-surface p-4 hover:bg-retro-card transition"
              >
                {team.logga ? (
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-retro-card shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={team.logga}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-retro-card flex items-center justify-center text-retro-muted shrink-0">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-100 truncate">{team.name}</p>
                  {team.ort && (
                    <p className="text-sm text-retro-muted truncate">{team.ort}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-sm text-stone-400">
                    Klicka för att visa laget
                  </span>
                </div>
                <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-lg overflow-hidden bg-retro-card shrink-0 flex items-center justify-center">
                  {(team.bild || team.logga) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={team.bild || team.logga || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserGroupIcon className="w-8 h-8 text-retro-muted" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
