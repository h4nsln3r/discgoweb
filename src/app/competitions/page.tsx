// src/app/competitions/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import CompetitionsPageClient from "./CompetitionsPageClient";

export default async function CompetitionsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, title, start_date, end_date, image_url");

  if (error) {
    console.error("[FETCH COMPETITIONS ERROR]", error);
    return <p className="text-amber-400">Kunde inte ladda tävlingar.</p>;
  }

  return <CompetitionsPageClient competitions={competitions ?? []} />;
}
