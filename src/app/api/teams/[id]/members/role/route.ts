import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { NextResponse } from "next/server";
import { getMyRoleInTeam, canManageRoles } from "@/lib/team-roles";

type Role = "admin" | "editor" | "viewer";

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

  const myRole = await getMyRoleInTeam(supabase, teamId, user.id);
  if (!canManageRoles(myRole)) {
    return NextResponse.json({ error: "Endast admin kan ändra roller." }, { status: 403 });
  }

  let body: { userId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON." }, { status: 400 });
  }

  const { userId, role } = body;
  if (!userId || typeof role !== "string" || !["admin", "editor", "viewer"].includes(role)) {
    return NextResponse.json({ error: "userId och role (admin/editor/viewer) krävs." }, { status: 400 });
  }

  const { error } = await supabase
    .from("team_member_roles")
    .upsert(
      { team_id: teamId, user_id: userId, role: role as Role },
      { onConflict: "team_id,user_id" }
    );

  if (error) {
    console.error("[API teams/members/role] Supabase error:", error.message, error.code);
    return NextResponse.json(
      { error: error.message || "Kunde inte uppdatera roll." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
