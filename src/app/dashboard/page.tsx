import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Map from "@/components/Maps/Map";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="">
      {/* <h1 className="text-3xl font-bold mb-2">Välkommen {user.email} 👋</h1> */}
      <Map />
    </div>
  );
}
