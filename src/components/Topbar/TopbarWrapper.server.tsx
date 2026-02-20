// src/components/TopbarWrapper.server.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Topbar from "./Topbar";

export default async function TopbarWrapper() {
  const supabase = await createServerSupabaseClient();

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err: unknown) {
    // Ogiltig/utgången refresh token i cookies – rensa session så nästa request inte kraschar
    const code = err && typeof err === "object" && "code" in err ? (err as { code: string }).code : "";
    if (code === "refresh_token_not_found" || code === "invalid_refresh_token") {
      await supabase.auth.signOut();
    }
    user = null;
  }

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  if (user?.id) {
    const userId = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("alias, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (profile && typeof profile === "object") {
      if ("alias" in profile) displayName = (profile as { alias: string }).alias;
      if ("avatar_url" in profile && profile.avatar_url)
        avatarUrl = (profile as { avatar_url: string }).avatar_url;
    }
  }

  return <Topbar user={user} displayName={displayName} avatarUrl={avatarUrl} />;
}
