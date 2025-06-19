// src/components/TopbarWrapper.server.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Topbar from "./Topbar";

export default async function TopbarWrapper() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Topbar user={user} />;
}
