// src/app/courses/[id]/page.tsx

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";
import ImageGallery from "@/components/ImageGallery";
import ScoresTable from "@/components/Tables/ScoresTable";
import CompetitionsTable from "@/components/Tables/CompetitionsTable";

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Hämta kursen
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course || error) notFound();

  // Hämta tävlingar
  const { data: competitions } = await supabase
    .from("competition_courses")
    .select("competition_id, competitions ( id, title, start_date, end_date )")
    .eq("course_id", params.id);

  // Hämta alla scores
  const { data: allScores } = await supabase
    .from("scores")
    .select("score, created_at, profiles ( alias )")
    .eq("course_id", params.id);

  // Robust parsing av image_urls
  const parsedImageUrls = parseImageUrls(course.image_urls);

  // Main_image först
  const allImages = [
    ...(course.main_image_url ? [course.main_image_url] : []),
    ...parsedImageUrls,
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
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

      <ImageGallery images={allImages} />

      {competitions && competitions.length > 0 && (
        <CompetitionsTable competitions={competitions} />
      )}

      {allScores && allScores.length > 0 && <ScoresTable scores={allScores} />}
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
