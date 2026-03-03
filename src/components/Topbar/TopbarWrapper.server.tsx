// src/components/TopbarWrapper.server.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Topbar from "./Topbar";

/** Anropar getUser utan att kasta – vid ogiltig/utgången refresh token kastar Supabase AuthApiError. */
async function getSafeUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return { user: null as { id: string; email?: string } | null, supabase };
    return { user: data?.user ?? null, supabase };
  } catch {
    return { user: null as { id: string; email?: string } | null, supabase: null };
  }
}

export default async function TopbarWrapper() {
  const { user: rawUser, supabase } = await getSafeUser();
  const user = rawUser;

  let displayName: string | null = null;
  let avatarUrl: string | null = null;

  if (user?.id && supabase) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("alias, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (profile && typeof profile === "object") {
        if ("alias" in profile) displayName = (profile as { alias: string }).alias;
        if ("avatar_url" in profile && profile.avatar_url)
          avatarUrl = (profile as { avatar_url: string }).avatar_url;
      }
    } catch {
      // Profilfel – visa användare utan alias/avatar
    }
  }

  return <Topbar user={user} displayName={displayName} avatarUrl={avatarUrl} />;
}
