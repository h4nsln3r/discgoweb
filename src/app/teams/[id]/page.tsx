import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { UserGroupIcon, PencilSquareIcon, MapPinIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import BackButton from "@/components/Buttons/BackButton";
import { getMyRoleInTeam, canEditTeam, canManageRoles } from "@/lib/team-roles";
import TeamMembersSection from "@/components/Teams/TeamMembersSection";
import TeamApplicationsSection, { type ApplicantRow } from "@/components/Teams/TeamApplicationsSection";
import ApplyToTeamButton from "@/components/Teams/ApplyToTeamButton";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
  created_by: string | null;
  created_at: string | null;
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
    .select("id, name, ort, logga, bild, about, created_by, created_at")
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

  let applicants: ApplicantRow[] = [];
  if (showEditLink) {
    const { data: applicantsData } = await supabase.rpc("get_team_applicants", { p_team_id: id });
    applicants = (applicantsData ?? []).map((row: { id: string; user_id: string; alias: string | null; avatar_url: string | null }) => ({
      id: row.id,
      user_id: row.user_id,
      alias: row.alias ?? null,
      avatar_url: row.avatar_url ?? null,
    }));
  }

  const { data: myApplication } = user
    ? await supabase.from("team_applications").select("id").eq("team_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };
  const hasApplied = !!myApplication;
  const isMember = !!user && (members.some((m) => m.id === user.id) || team.created_by === user.id);
  let myProfileTeamId: string | null = null;
  if (user) {
    const { data: myProfile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
    myProfileTeamId = myProfile?.team_id ?? null;
  }
  const showApplyButton = !!user && !isMember && !hasApplied && myProfileTeamId == null;

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

      {/* Lagbild – stort längst upp (utan logga på bilden) */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        <div className="aspect-video w-full max-h-80 bg-retro-card relative flex items-center justify-center overflow-hidden">
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

      {/* Logga + namn på samma rad – loggan utanför bilden, lite större */}
      <div className="mb-6 flex items-center gap-4 sm:gap-5 flex-wrap">
        {team.logga && (
          <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.logga}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-5xl sm:text-6xl font-bebas tracking-wide text-stone-100 uppercase text-center sm:text-left">
            {team.name}
          </h1>
        {team.ort && (
          <p className="flex items-center justify-center sm:justify-start gap-1.5 text-stone-400 text-lg mt-2">
            <MapPinIcon className="w-5 h-5 text-retro-muted shrink-0" />
            {team.ort}
          </p>
        )}
        {team.created_at && (
          <p className="text-stone-500 text-sm mt-1">
            Laget skapades {new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "long", day: "numeric" }).format(new Date(team.created_at))}
          </p>
        )}
        {showApplyButton && (
          <div className="mt-4">
            <ApplyToTeamButton teamId={id} teamName={team.name} />
          </div>
        )}
        {hasApplied && !isMember && (
          <p className="mt-4 text-sm text-amber-200">
            Du har ansökt till detta lag. Väntar på godkännande från admin eller kapten.
          </p>
        )}
        </div>
      </div>

      {/* Om laget – eget card med ikon */}
      {team.about && (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
            <InformationCircleIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
            Om laget
          </h2>
          <p className="text-stone-300 whitespace-pre-wrap">{team.about}</p>
        </div>
      )}

      <TeamMembersSection
        teamId={id}
        members={members}
        currentUserId={user?.id ?? null}
        myRole={myRole}
        isMember={isMember}
        canManageRoles={showRoleManagement}
        canRemoveMembers={showEditLink}
      />

      {showEditLink && (
        <TeamApplicationsSection teamId={id} applicants={applicants} />
      )}
    </main>
  );
}
