// src/app/competitions/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function CompetitionsPage() {
  const supabase = createServerSupabaseClient();

  const { data: competitions, error } = await supabase
    .from("competitions")
    .select("id, title, start_date, end_date, image_url")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("[FETCH COMPETITIONS ERROR]", error);
    return <p className="text-red-500">Kunde inte ladda tävlingar.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold mb-6">🏆 Alla tävlingar</h1>
        <Link
          href="/competitions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lägg till tävling
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {competitions?.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.id}`}
            className="border rounded shadow hover:shadow-md transition overflow-hidden"
          >
            {comp.image_url && (
              <img
                src={comp.image_url}
                alt={comp.title}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold">{comp.title}</h2>
              <p className="text-sm text-gray-600">
                {formatDate(comp.start_date)} – {formatDate(comp.end_date)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
