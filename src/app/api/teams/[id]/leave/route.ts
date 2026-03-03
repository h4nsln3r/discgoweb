import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { getMyRoleInTeam } from "@/lib/team-roles";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  }

  const myRole = await getMyRoleInTeam(supabase, teamId, user.id);
  if (!myRole) {
    return NextResponse.json({ error: "Du är inte medlem i detta lag." }, { status: 403 });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  const { data: rolesRows } = await supabase
    .from("team_member_roles")
    .select("user_id, role")
    .eq("team_id", teamId);

  const admins = new Set<string>();
  if (team?.created_by) admins.add(team.created_by);
  (rolesRows ?? []).forEach((r: { user_id: string; role: string }) => {
    if (r.role === "admin") admins.add(r.user_id);
  });

  const isOnlyAdmin = myRole === "admin" && admins.size === 1 && admins.has(user.id);
  if (isOnlyAdmin) {
    return NextResponse.json(
      { error: "Du måste först ge admin till någon annan i laget innan du kan lämna." },
      { status: 400 }
    );
  }

  const { error: errProfile } = await supabase
    .from("profiles")
    .update({ team_id: null })
    .eq("id", user.id)
    .eq("team_id", teamId);

  if (errProfile) {
    return NextResponse.json(
      { error: errProfile.message || "Kunde inte lämna laget." },
      { status: 500 }
    );
  }

  await supabase
    .from("team_member_roles")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);

  if (team?.created_by === user.id) {
    const otherAdmin = [...admins].find((id) => id !== user.id);
    const { data: members } = await supabase
      .from("profiles")
      .select("id")
      .eq("team_id", teamId)
      .limit(1);
    const newOwner = otherAdmin || members?.[0]?.id;
    if (newOwner) {
      await supabase.from("teams").update({ created_by: newOwner }).eq("id", teamId);
      await supabase
        .from("team_member_roles")
        .upsert({ team_id: teamId, user_id: newOwner, role: "admin" }, { onConflict: "team_id,user_id" });
    } else {
      await supabase.from("teams").update({ created_by: null }).eq("id", teamId);
    }
  }

  return NextResponse.json({ ok: true });
}
