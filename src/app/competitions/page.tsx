// src/app/competitions/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import CompetitionList from "@/components/CompetitionList";

export default async function CompetitionsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, title, start_date, end_date, image_url");

  if (error) {
    console.error("[FETCH COMPETITIONS ERROR]", error);
    return <p className="text-red-500">Kunde inte ladda tävlingar.</p>;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">🏆 Alla tävlingar</h1>
        <Link
          href="/competitions/new"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          Lägg till tävling
        </Link>
      </div>

      <CompetitionList competitions={competitions ?? []} />
    </main>
  );
}
