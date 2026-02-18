import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import DashboardContent from "./DashboardContent";

export default async function Dashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "vän";

  return <DashboardContent userName={displayName} />;
}
