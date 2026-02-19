// src/components/TopbarWrapper.server.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Topbar from "./Topbar";

export default async function TopbarWrapper() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user?.id) {
    const userId = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("alias")
      .eq("id", userId)
      .maybeSingle();
    displayName =
      profile && typeof profile === "object" && "alias" in profile
        ? (profile as { alias: string }).alias
        : null;
  }

  return <Topbar user={user} displayName={displayName} />;
}
