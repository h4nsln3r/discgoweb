// src/components/TopbarWrapper.server.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Topbar from "./Topbar";

export default async function TopbarWrapper() {
  let user: { id: string; email?: string } | null = null;
  let displayName: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;

    if (user?.id) {
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
    }
  } catch (err: unknown) {
    // Ogiltig refresh token eller annat auth-fel – visa som utloggad så användaren kan logga in igen
    user = null;
    displayName = null;
    avatarUrl = null;
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // ignorerar
    }
  }

  return <Topbar user={user} displayName={displayName} avatarUrl={avatarUrl} />;
}
