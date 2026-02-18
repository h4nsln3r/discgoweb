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
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
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
      {allImages.length > 0 && <ImageGallery images={allImages} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <MapEmbed
            course={{
              name: course.name,
              location: course.location ?? "",
              latitude: course.latitude,
              longitude: course.longitude,
              description: course.description ?? "",
              city: course.city ?? "",
              country: course.country ?? "",
              imageUrls: parseImageUrls(course.image_urls),
              mainImageUrl: course.main_image_url ?? "",
            }}
          />

          {top3.length > 0 && (
            <div className="rounded-xl border border-retro-border bg-retro-surface p-4">
              <h2 className="font-semibold text-lg mb-2 text-stone-100">🏆 Topp 3 resultat</h2>
              <ul className="space-y-1 text-stone-200">
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

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-stone-100">{course.name}</h1>
            <Link
              href={`/courses/${course.id}/edit`}
              className="text-sm text-retro-accent hover:underline"
            >
              ✏️ Redigera denna bana
            </Link>
          </div>

          {(course.city || course.country) && (
            <p className="text-stone-400">
              {course.city && <span>{course.city}</span>}
              {course.city && course.country && <span>, </span>}
              {course.country && <span>{course.country}</span>}
            </p>
          )}

          {course.location && (
            <p className="text-retro-muted text-sm">{course.location}</p>
          )}

          {course.description && (
            <div className="border-t border-retro-border pt-4">
              <h2 className="text-xl font-semibold mb-2 text-stone-100">Beskrivning</h2>
              <p className="whitespace-pre-line text-stone-200">{course.description}</p>
            </div>
          )}
        </div>
      </div>

      {allScores && allScores.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-stone-100">Alla resultat</h2>
          <ScoresTable scores={allScores} />
        </div>
      )}

      {competitions && competitions.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-stone-100">Tävlingar på banan</h2>
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
