import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Map from "@/components/Maps/Map";
import DashboardFeeds from "./DashboardFeeds";

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

  return (
    <div className="p-4 space-y-6">
      <Map userName={displayName} />
      <DashboardFeeds />
    </div>
  );
}
