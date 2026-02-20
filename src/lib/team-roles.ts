import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamRole = "admin" | "editor" | "viewer";

/** Returnerar användarens roll i laget: från team_member_roles, eller admin om created_by. */
export async function getMyRoleInTeam(
  supabase: SupabaseClient,
  teamId: string,
  userId: string
): Promise<TeamRole | null> {
  const { data: row } = await supabase
    .from("team_member_roles")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (row) return row.role as TeamRole;

  const { data: team } = await supabase
    .from("teams")
    .select("created_by")
    .eq("id", teamId)
    .single();

  if (team?.created_by === userId) return "admin";
  return null;
}

/** Kan användaren redigera laget (admin eller editor)? */
export function canEditTeam(role: TeamRole | null): boolean {
  return role === "admin" || role === "editor";
}

/** Kan användaren hantera roller (bara admin)? */
export function canManageRoles(role: TeamRole | null): boolean {
  return role === "admin";
}
