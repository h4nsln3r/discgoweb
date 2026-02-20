// src/app/competitions/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import CompetitionList from "@/components/Lists/CompetitionList";

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
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-stone-100">🏆 Alla tävlingar</h1>
        <Link
          href="/competitions/new"
          className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          Lägg till tävling
        </Link>
      </div>

      <CompetitionList competitions={competitions ?? []} />
    </main>
  );
}
