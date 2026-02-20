import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, ort, logga, about")
    .order("name");

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-100">Lag</h1>
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
                href={`/teams/${team.id}/edit`}
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
                  <div className="h-12 w-12 rounded-lg bg-retro-card flex items-center justify-center text-retro-muted shrink-0 text-xl">
                    👥
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-100 truncate">{team.name}</p>
                  {team.ort && (
                    <p className="text-sm text-retro-muted truncate">{team.ort}</p>
                  )}
                </div>
                <span className="text-stone-500 text-sm shrink-0">Redigera →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
