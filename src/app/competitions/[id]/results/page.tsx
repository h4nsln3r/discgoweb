// src/app/competitions/[id]/results/page.tsx

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";
import BackLink from "@/components/Buttons/BackLink";

export default async function CompetitionResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const { id } = await params;
  const competitionId = id;

  // 1. Fetch scores with user and course info
  const { data: scores, error } = await supabase
    .from("scores")
    .select(
      `id, score, created_at, course_id, competition_id, user_id,
      courses ( name ),
      profiles ( alias )
    `
    )
    .eq("competition_id", competitionId);

  if (error || !scores) return notFound();

  // 2. Group scores by course_id
  const grouped = scores.reduce((acc: Record<string, typeof scores>, score) => {
    const courseId = score.course_id;
    if (!acc[courseId]) acc[courseId] = [];
    acc[courseId].push(score);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <BackLink href={`/competitions/${competitionId}`}>
          Tillbaka till tävlingen
        </BackLink>
      </div>
      <h1 className="text-2xl font-bold mb-6">Resultat</h1>

      {Object.entries(grouped).map(([courseId, courseScores]) => (
        <div key={courseId} className="mb-8">
          <h2 className="text-lg font-semibold mb-2">
            <Link
              href={`/courses/${courseId}`}
              className="text-retro-accent hover:underline"
            >
              {courseScores[0]?.courses?.name ?? "Okänd bana"}
            </Link>
          </h2>

          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1">Spelare</th>
                <th className="text-left px-2 py-1">Poäng</th>
                <th className="text-left px-2 py-1">Datum</th>
              </tr>
            </thead>
            <tbody>
              {courseScores
                .sort((a, b) => a.score - b.score)
                .map((score) => (
                  <tr key={score.id} className="border-t">
                    <td className="px-2 py-1">
                      {score.profiles?.alias ?? "Okänd spelare"}
                    </td>
                    <td className="px-2 py-1 font-semibold">{score.score}</td>
                    <td className="px-2 py-1">
                      {new Date(score.created_at).toLocaleDateString("sv-SE")}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}

      <Link
        href={`/competitions/${competitionId}/add-score`}
        className="inline-block mt-6 text-blue-600 hover:underline"
      >
        + Lägg till nytt resultat
      </Link>
    </div>
  );
}
