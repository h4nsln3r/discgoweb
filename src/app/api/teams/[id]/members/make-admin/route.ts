import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { getMyRoleInTeam, canManageRoles } from "@/lib/team-roles";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    if (!canManageRoles(myRole)) {
      return NextResponse.json({ error: "Endast admin kan byta admin." }, { status: 403 });
    }

    let body: { newAdminUserId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
    }

    const newAdminUserId = body.newAdminUserId;
    if (!newAdminUserId || newAdminUserId === user.id) {
      return NextResponse.json({ error: "Välj en annan medlem som admin." }, { status: 400 });
    }

    const { error: e1 } = await supabase
      .from("team_member_roles")
      .upsert(
        { team_id: teamId, user_id: newAdminUserId, role: "admin" },
        { onConflict: "team_id,user_id" }
      );
    if (e1) {
      console.error("[API teams/members/make-admin] Supabase e1 (upsert new admin):", e1.message, e1.code);
      return NextResponse.json(
        { error: e1.message || "Kunde inte ge admin-roll." },
        { status: 500 }
      );
    }

    const { error: e2 } = await supabase
      .from("team_member_roles")
      .upsert(
        { team_id: teamId, user_id: user.id, role: "editor" },
        { onConflict: "team_id,user_id" }
      );
    if (e2) {
      console.error("[API teams/members/make-admin] Supabase e2 (upsert current user):", e2.message, e2.code);
      return NextResponse.json(
        { error: e2.message || "Kunde inte uppdatera din roll." },
        { status: 500 }
      );
    }

    const { error: e3 } = await supabase
      .from("teams")
      .update({ created_by: newAdminUserId })
      .eq("id", teamId);
    if (e3) {
      console.error("[API teams/members/make-admin] Supabase e3 (teams update):", e3.message, e3.code);
      return NextResponse.json(
        { error: e3.message || "Admin bytt, men created_by kunde inte uppdateras." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ett oväntat fel inträffade.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
