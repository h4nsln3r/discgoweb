import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserGroupIcon, PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/Buttons/BackButton";

type Props = { params: Promise<{ id: string }> };

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
};

type MemberRow = {
  id: string;
  alias: string | null;
  avatar_url: string | null;
};

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name, ort, logga, bild, about")
    .eq("id", id)
    .single();

  if (teamError || !teamData) notFound();
  const team = teamData as TeamRow;

  const { data: membersData } = await supabase
    .from("profiles")
    .select("id, alias, avatar_url")
    .eq("team_id", id)
    .order("alias", { nullsFirst: false });

  const members = (membersData ?? []) as MemberRow[];

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <BackButton />
        <Link
          href={`/teams/${id}/edit`}
          className="inline-flex items-center gap-2 text-amber-400 font-medium hover:text-amber-300 transition shrink-0"
        >
          <PencilSquareIcon className="w-5 h-5 shrink-0" />
          Redigera lag
        </Link>
      </div>

      {/* Lagbild – stort längst upp */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        <div className="aspect-video w-full max-h-80 bg-retro-card relative flex items-center justify-center">
          {(team.bild || team.logga) ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={team.bild || team.logga || ""}
              alt={team.name}
              className={`w-full h-full ${team.bild ? "object-cover" : "object-contain p-4"}`}
            />
          ) : (
            <UserGroupIcon className="w-24 h-24 text-retro-muted" />
          )}
        </div>
      </div>

      {/* Namn + logga stort */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {team.logga ? (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-retro-card border border-retro-border shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.logga}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-retro-card border border-retro-border flex items-center justify-center shrink-0">
              <UserGroupIcon className="w-12 h-12 text-retro-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-100">{team.name}</h1>
            {team.ort && (
              <p className="flex items-center justify-center sm:justify-start gap-1.5 text-stone-400 mt-1">
                <MapPinIcon className="w-5 h-5 text-retro-muted shrink-0" />
                {team.ort}
              </p>
            )}
          </div>
        </div>
        {team.about && (
          <div className="mt-4 pt-4 border-t border-retro-border">
            <h2 className="text-sm font-medium text-retro-muted uppercase tracking-wide mb-2">Om laget</h2>
            <p className="text-stone-300 whitespace-pre-wrap">{team.about}</p>
          </div>
        )}
      </div>

      {/* Medlemmar */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-4">
          <UserGroupIcon className="w-5 h-5 text-retro-muted shrink-0" />
          Medlemmar
        </h2>
        {members.length === 0 ? (
          <p className="text-stone-400 text-sm">Inga medlemmar i laget än.</p>
        ) : (
          <ul className="space-y-3">
            {members.map((member) => (
              <li key={member.id}>
                <Link
                  href={`/profile/${member.id}`}
                  className="flex items-center gap-3 rounded-xl border border-retro-border bg-retro-card p-3 hover:bg-retro-surface transition"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-surface border border-retro-border shrink-0 flex items-center justify-center">
                    {member.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-retro-muted text-xl">🥏</span>
                    )}
                  </div>
                  <span className="font-medium text-stone-100">
                    {member.alias || "Spelare"}
                  </span>
                  <span className="ml-auto text-sm text-retro-accent">Visa profil →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
