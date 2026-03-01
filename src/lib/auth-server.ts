import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { User } from "@supabase/supabase-js";

export type CurrentUserWithAdmin = {
  user: User | null;
  isAdmin: boolean;
};

/**
 * Hämtar inloggad användare och om profilen har is_admin.
 * Använd i API-routes och server components.
 */
export async function getCurrentUserWithAdmin(
  supabase: SupabaseClient<Database>
): Promise<CurrentUserWithAdmin> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin === true;
  return { user, isAdmin };
}

/** Returnerar true om användaren får redigera/radera resursen (ägare eller admin). */
export function canEditAsOwnerOrAdmin(
  userId: string | null,
  isAdmin: boolean,
  ownerId: string | null | undefined
): boolean {
  if (!userId) return false;
  if (isAdmin) return true;
  return ownerId != null && ownerId === userId;
}
