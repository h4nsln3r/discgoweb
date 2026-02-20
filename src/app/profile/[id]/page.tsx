// Offentlig profilsida för en användare (t.ex. från resultatlistan)
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeftIcon, MapPinIcon, TrophyIcon } from "@heroicons/react/24/outline";

type Props = { params: Promise<{ id: string }> };

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, alias, avatar_url, city, team_id, favorite_disc, home_course")
    .eq("id", id)
    .single();

  if (error || !profile) notFound();

  let homeCourseName: string | null = null;
  if (profile.home_course) {
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", profile.home_course)
      .single();
    homeCourseName = course?.name ?? null;
  }

  let teamName: string | null = null;
  if (profile.team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("name")
      .eq("id", profile.team_id)
      .single();
    teamName = team?.name ?? null;
  }

  const { data: scores } = await supabase
    .from("scores")
    .select("id, score, throws, date_played, created_at, course_id, courses ( id, name )")
    .eq("user_id", id)
    .order("date_played", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  type ScoreRow = {
    id: string;
    score: number;
    throws: number | null;
    date_played: string | null;
    created_at: string;
    course_id: string;
    courses: { id: string; name: string } | null;
  };

  const scoreList = (scores ?? []) as ScoreRow[];
  const coursesPlayed = Array.from(
    new Map(scoreList.map((s) => [s.course_id, { id: s.course_id, name: s.courses?.name ?? "Okänd bana" }])).values()
  );
  const recentScores = scoreList.slice(0, 20);

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
  }

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <Link
        href="/results"
        className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200 transition"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Tillbaka
      </Link>

      <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-retro-card border border-retro-border overflow-hidden flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-retro-muted">—</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-100">
              {profile.alias || "Spelare"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {homeCourseName && profile.home_course && (
            <div>
              <p className="text-stone-500">Hemmabana</p>
              <Link
                href={`/courses/${profile.home_course}`}
                className="font-medium text-stone-200 text-retro-accent hover:underline"
              >
                {homeCourseName}
              </Link>
            </div>
          )}
          {profile.city && (
            <div>
              <p className="text-stone-500">Stad</p>
              <p className="font-medium text-stone-200">{profile.city}</p>
            </div>
          )}
          {teamName && (
            <div>
              <p className="text-stone-500">Lag</p>
              <p className="font-medium text-stone-200">{teamName}</p>
            </div>
          )}
          {profile.favorite_disc && (
            <div>
              <p className="text-stone-500">Favoritdisc</p>
              <p className="font-medium text-stone-200">{profile.favorite_disc}</p>
            </div>
          )}
        </div>
      </div>

      {coursesPlayed.length > 0 && (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
            <MapPinIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
            Spelade banor
          </h2>
          <ul className="space-y-2">
            {coursesPlayed.map((c) => {
              const onCourse = scoreList.filter((s) => s.course_id === c.id);
              const best = onCourse.reduce((a, b) => (a.score < b.score ? a : b), onCourse[0]);
              return (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-retro-border last:border-0">
                  <Link
                    href={`/courses/${c.id}`}
                    className="font-medium text-retro-accent hover:underline"
                  >
                    {c.name}
                  </Link>
                  <span className="text-sm text-stone-400">
                    {onCourse.length} rund{onCourse.length === 1 ? "a" : "or"}
                    {best && (
                      <> · Bästa: {best.throws ?? best.score} kast</>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {recentScores.length > 0 && (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
            <TrophyIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
            Senaste resultat
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-stone-400 border-b border-retro-border">
                  <th className="pb-2 pr-3 font-medium">Bana</th>
                  <th className="pb-2 pr-3 font-medium">Kast</th>
                  <th className="pb-2 pr-3 font-medium">Poäng</th>
                  <th className="pb-2 pr-3 font-medium">Datum</th>
                  <th className="pb-2 font-medium w-14"></th>
                </tr>
              </thead>
              <tbody>
                {recentScores.map((s) => (
                  <tr key={s.id} className="border-b border-retro-border/50 last:border-0">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/courses/${s.courses?.id ?? s.course_id}`}
                        className="text-retro-accent hover:underline"
                      >
                        {s.courses?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-stone-200">{s.throws ?? s.score}</td>
                    <td className="py-2 pr-3 font-medium text-stone-100">{s.score}</td>
                    <td className="py-2 text-stone-400">
                      {formatDate(s.date_played ?? s.created_at)}
                    </td>
                    <td className="py-2 pl-2">
                      <Link
                        href={`/results/${s.id}`}
                        className="text-retro-accent hover:underline text-xs"
                      >
                        Visa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scoreList.length === 0 && (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6">
          <p className="text-stone-400 text-sm">Inga resultat inlagda än.</p>
        </div>
      )}
    </main>
  );
}
