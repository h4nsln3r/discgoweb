import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import TeamCard from "@/components/Teams/TeamCard";

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, city, country, landskap, logga, bild, about")
    .order("name");

  const { data: { user } } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("team_id").eq("id", user.id).single()
    : { data: null };
  const canCreateTeam = !myProfile?.team_id;

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
          <UserGroupIcon className="w-7 h-7 text-retro-accent shrink-0" aria-hidden />
          Lag
        </h1>
        {canCreateTeam && (
          <Link
            href="/teams/new"
            className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
          >
            Lägg till lag
          </Link>
        )}
      </div>

      {!teams?.length ? (
        <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
          <p className="text-stone-300 text-lg">Inga lag än.</p>
          <p className="text-stone-500 text-sm mt-2">
            Lägg till ett lag för att se det här.
          </p>
          {canCreateTeam && (
            <Link
              href="/teams/new"
              className="inline-block mt-4 px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
            >
              Lägg till lag
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {teams.map((team) => (
            <li key={team.id}>
              <TeamCard team={team} asLink />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
