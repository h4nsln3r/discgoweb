import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { getMyRoleInTeam } from "@/lib/team-roles";
import { createSupabaseAdminClient } from "@/lib/supabase-server";

/**
 * Ta bort en medlem från laget.
 * Endast admin får ta bort admin eller kapten. Kapten får bara ta bort spelare.
 */
export async function POST(
  request: Request,
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

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }
  const targetUserId = body.userId;
  if (!targetUserId) {
    return NextResponse.json({ error: "userId krävs." }, { status: 400 });
  }
  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "Använd Lämna laget för att lämna själv." },
      { status: 400 }
    );
  }

  const myRole = await getMyRoleInTeam(supabase, teamId, user.id);
  if (myRole !== "admin" && myRole !== "editor") {
    return NextResponse.json(
      { error: "Endast admin eller kapten kan ta bort medlemmar." },
      { status: 403 }
    );
  }

  const { data: targetRow } = await supabase
    .from("team_member_roles")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  const { data: team } = await supabase.from("teams").select("created_by").eq("id", teamId).single();
  const targetRole: "admin" | "editor" | "viewer" =
    (targetRow?.role as "admin" | "editor" | "viewer") ??
    (team?.created_by === targetUserId ? "admin" : "viewer");

  if (myRole === "editor") {
    if (targetRole === "admin" || targetRole === "editor") {
      return NextResponse.json(
        { error: "Endast admin kan ta bort en admin eller kapten." },
        { status: 403 }
      );
    }
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("remove_team_member", {
    p_team_id: teamId,
    p_user_id: targetUserId,
  });

  if (error) {
    console.error("[API teams/members/remove] RPC error:", error.message);
    return NextResponse.json(
      { error: error.message || "Kunde inte ta bort medlem." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
