// src/app/courses/[id]/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";

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

  // Hämta relaterade tävlingar
  const { data: competitions } = await supabase
    .from("competition_courses")
    .select("competition_id, competitions ( id, title, start_date, end_date )")
    .eq("course_id", params.id);

  // Hämta toppresultat
  const { data: topScores } = await supabase
    .from("scores")
    .select("score, created_at, profiles ( alias )")
    .eq("course_id", params.id)
    .order("score", { ascending: true })
    .limit(5);

  console.log("topScores", topScores);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{course.name}</h1>
      <p className="text-gray-600">{course.location}</p>

      {course.image_url && (
        <img
          src={course.image_url}
          alt={course.name}
          className="rounded w-full h-60 object-cover"
        />
      )}

      {/* 🏆 Tävlingar */}
      {competitions && competitions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">
            🏆 Tävlingar på denna bana
          </h2>
          <ul className="list-disc pl-5 text-gray-800">
            {competitions.map((c) => (
              <li key={c.competition_id}>
                {c.competitions?.title} (
                {formatDate(c.competitions?.start_date)} –{" "}
                {formatDate(c.competitions?.end_date)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🥇 Toppscore */}
      {topScores && topScores.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">🥇 Toppscore</h2>
          <ul className="divide-y">
            {topScores.map((score, i) => (
              <li key={i} className="py-2 text-sm">
                {score.profiles?.alias ?? "Okänd"} – {score.score} kast (
                {formatDate(score.created_at)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
