// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Välkommen {user.email} 👋</h1>
      <p className="mt-2 text-gray-600">
        Du är inloggad och kan se denna sida.
      </p>
    </div>
  );
}
