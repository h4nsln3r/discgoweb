import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";
import BackLink from "@/components/Buttons/BackLink";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CompetitionWithCourses = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  competition_courses: {
    course_id: string;
    courses: { name: string } | null;
  }[];
};

export default async function CompetitionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: competition, error } = await supabase
    .from("competitions")
    .select(
      `
      id,
      title,
      description,
      start_date,
      end_date,
      image_url,
      competition_courses (
        course_id,
        courses ( name )
      )
    `
    )
    .eq("id", id as string) // Cast till rätt typ
    .single<CompetitionWithCourses>(); // Typfix

  if (!competition || error) {
    console.error("[FETCH COMPETITION ERROR]", error);
    notFound();
  }

  const { data: competitionScores } = await supabase
    .from("scores")
    .select("id, score, throws, date_played, created_at, course_id, courses ( name ), profiles ( alias )")
    .eq("competition_id", id)
    .order("score", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <BackLink href="/competitions">Tillbaka till tävlingar</BackLink>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-stone-100">{competition.title}</h1>
        <Link
          href={`/results/new?competition_id=${id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          🥏 Lägg till resultat
        </Link>
        <Link
          href={`/competitions/${id}/edit`}
          className="text-sm text-retro-accent hover:underline"
        >
          ✏️ Redigera tävling
        </Link>
      </div>
      {competition.image_url && (
        // eslint-disable-next-line @next/next/no-img-element -- dynamisk tävlingsbild-URL
        <img
          src={competition.image_url}
          alt={competition.title}
          className="w-full h-60 object-cover rounded-lg border border-retro-border"
        />
      )}

      <p className="text-stone-400">
        🗓️ {formatDate(competition.start_date)} –{" "}
        {formatDate(competition.end_date)}
      </p>

      {competition.description && (
        <p className="text-stone-200 whitespace-pre-line">
          {competition.description}
        </p>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2 text-stone-100">🏞️ Banor</h2>
        <ul className="list-disc pl-5 text-stone-300 space-y-1">
          {competition.competition_courses.map((entry) => (
            <li key={entry.course_id}>
              <Link
                href={`/courses/${entry.course_id}`}
                className="text-retro-accent hover:underline"
              >
                {entry.courses?.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-stone-100">📋 Resultat</h2>
        {!competitionScores?.length ? (
          <p className="text-stone-400 rounded-xl border border-retro-border bg-retro-surface p-4">
            Inga resultat inlagda än. Lägg till resultat med knappen ovan.
          </p>
        ) : (
          <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-retro-card border-b border-retro-border">
                  <th className="px-4 py-3 font-medium text-stone-300">#</th>
                  <th className="px-4 py-3 font-medium text-stone-300">Spelare</th>
                  <th className="px-4 py-3 font-medium text-stone-300">Bana</th>
                  <th className="px-4 py-3 font-medium text-stone-300">Poäng</th>
                  <th className="px-4 py-3 font-medium text-stone-300">Datum</th>
                </tr>
              </thead>
              <tbody>
                {competitionScores.map((score, idx) => (
                  <tr key={score.id} className="border-b border-retro-border last:border-0 hover:bg-retro-card/50">
                    <td className="px-4 py-2.5 text-stone-400">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-stone-100">
                      {(score.profiles as { alias?: string } | null)?.alias ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-stone-200">
                      {(score as { course_id?: string }).course_id ? (
                        <Link
                          href={`/courses/${(score as { course_id: string }).course_id}`}
                          className="text-retro-accent hover:underline"
                        >
                          {(score.courses as { name?: string } | null)?.name ?? "—"}
                        </Link>
                      ) : (
                        (score.courses as { name?: string } | null)?.name ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-stone-100">{score.score}</td>
                    <td className="px-4 py-2.5 text-stone-400">
                      {score.date_played
                        ? formatDate(score.date_played)
                        : formatDate(score.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
