import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Map from "@/components/Maps/Map";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Prefer full_name from user metadata, otherwise email
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "vän";

  return (
    <div className="p-4">
      <Map userName={displayName} />
      <h2 className="mt-6 text-xl font-semibold">Nya banor</h2>
      <h2 className="mt-2 text-xl font-semibold">Senaste resultat</h2>
      <h2 className="mt-2 text-xl font-semibold">Senaste tävlingar</h2>
    </div>
  );
}
