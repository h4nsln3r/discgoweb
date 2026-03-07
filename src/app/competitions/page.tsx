// src/app/competitions/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import CompetitionList from "@/components/Lists/CompetitionList";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";

export default async function CompetitionsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, title, start_date, end_date, image_url");

  if (error) {
    console.error("[FETCH COMPETITIONS ERROR]", error);
    return <p className="text-amber-400">Kunde inte ladda tävlingar.</p>;
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <SetTopbarActions
        pageTitle="Alla tävlingar"
        primaryActionHref="/competitions/new"
        primaryActionLabel="Lägg till tävling"
      />
      <CompetitionList competitions={competitions ?? []} />
    </main>
  );
}
