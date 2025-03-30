import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AddCourseClientWrapper from "@/components/AddCourseClientWrapper";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Välkommen {user.email} 👋</h1>
      <AddCourseClientWrapper />
    </div>
  );
}
