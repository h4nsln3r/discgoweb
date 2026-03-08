import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("alias, city")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (profile as { alias?: string } | null)?.alias?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    "vän";

  const userCity = (profile as { city?: string | null } | null)?.city?.trim() || null;

  return <DashboardContent userName={displayName} userCity={userCity} />;
}
