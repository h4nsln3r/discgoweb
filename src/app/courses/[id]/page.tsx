import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";
import ImageGallery from "@/components/ImageGallery";
import ScoresTable from "@/components/Tables/ScoresTable";
import CompetitionsTable from "@/components/Tables/CompetitionsTable";
import MapEmbed from "@/components/Maps/MapEmbed";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { id } = await params;

  // Hämta kursen
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course || error) notFound();

  // Hämta tävlingar
  const { data: competitions } = await supabase
    .from("competition_courses")
    .select("competition_id, competitions ( id, title, start_date, end_date )")
    .eq("course_id", id);

  // Hämta alla scores
  const { data: allScores } = await supabase
    .from("scores")
    .select("score, created_at, profiles ( alias )")
    .eq("course_id", id);

  // Robust parsing av image_urls
  const parsedImageUrls = parseImageUrls(course.image_urls);

  // Main_image först
  const allImages = [
    ...(course.main_image_url ? [course.main_image_url] : []),
    ...parsedImageUrls,
  ];

  // Sortera scores för topp 3
  const top3 = allScores
    ? [...allScores].sort((a, b) => a.score - b.score).slice(0, 3)
    : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Huvudbild + galleri */}
      {allImages.length > 0 && <ImageGallery images={allImages} />}

      {/* Kart- och infosektion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MapEmbed course={course} />
        {/* Info och topp 3 till höger */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{course.name}</h1>
            <Link
              href={`/courses/${course.id}/edit`}
              className="text-sm text-blue-600 underline"
            >
              ✏️ Redigera denna bana
            </Link>
          </div>
          <p className="text-gray-600">{course.location}</p>

          {/* Topp 3 resultat */}
          {top3.length > 0 && (
            <div>
              <h2 className="font-semibold text-lg mb-2">🏆 Topp 3 resultat</h2>
              <ul className="space-y-1">
                {top3.map((score, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{score.profiles?.alias ?? "Okänd spelare"}</span>
                    <span>{score.score}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Alla resultat */}
      {allScores && allScores.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Alla resultat</h2>
          <ScoresTable scores={allScores} />
        </div>
      )}

      {/* Tävlingar */}
      {competitions && competitions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Tävlingar på banan</h2>
          <CompetitionsTable competitions={competitions} />
        </div>
      )}
    </div>
  );
}

function parseImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s) => typeof s === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => typeof s === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}
