import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserGroupIcon, PencilSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/Buttons/BackButton";
import { getMyRoleInTeam, canEditTeam, canManageRoles } from "@/lib/team-roles";
import TeamMembersSection from "@/components/Teams/TeamMembersSection";

type Props = { params: Promise<{ id: string }> };

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
  created_by: string | null;
};

type MemberWithRole = {
  id: string;
  alias: string | null;
  avatar_url: string | null;
  role: "admin" | "editor" | "viewer";
};

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name, ort, logga, bild, about, created_by")
    .eq("id", id)
    .single();

  if (teamError || !teamData) notFound();
  const team = teamData as TeamRow;

  const { data: { user } } = await supabase.auth.getUser();
  const myRole = user ? await getMyRoleInTeam(supabase, id, user.id) : null;
  const showEditLink = canEditTeam(myRole);
  const showRoleManagement = canManageRoles(myRole);

  const { data: membersData } = await supabase
    .from("profiles")
    .select("id, alias, avatar_url")
    .eq("team_id", id)
    .order("alias", { nullsFirst: false });

  const { data: rolesData } = await supabase
    .from("team_member_roles")
    .select("user_id, role")
    .eq("team_id", id);

  const roleByUser = new Map<string, string>();
  (rolesData ?? []).forEach((r: { user_id: string; role: string }) => roleByUser.set(r.user_id, r.role));

  const members: MemberWithRole[] = (membersData ?? []).map((m: { id: string; alias: string | null; avatar_url: string | null }) => ({
    ...m,
    role: (roleByUser.get(m.id) as "admin" | "editor" | "viewer") ?? (team.created_by === m.id ? "admin" : "viewer"),
  }));

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-4">
        <BackButton />
        {showEditLink && (
          <Link
            href={`/teams/${id}/edit`}
            className="inline-flex items-center gap-2 text-amber-400 font-medium hover:text-amber-300 transition shrink-0"
          >
            <PencilSquareIcon className="w-5 h-5 shrink-0" />
            Redigera lag
          </Link>
        )}
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
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={team.logga}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl flex items-center justify-center shrink-0">
              <UserGroupIcon className="w-14 h-14 text-retro-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-100">{team.name}</h1>
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

      <TeamMembersSection
        teamId={id}
        members={members}
        currentUserId={user?.id ?? null}
        canManageRoles={showRoleManagement}
      />
    </main>
  );
}
