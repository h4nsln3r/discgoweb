import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import Link from "next/link";
import CompetitionCoursesMap from "@/components/Maps/CompetitionCoursesMap";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import JoinToCompetitionButton from "@/components/Competitions/JoinToCompetitionButton";
import CompetitionParticipantsSection from "@/components/Competitions/CompetitionParticipantsSection";
import ScrollToDeltagareOnJoin from "@/components/Competitions/ScrollToDeltagareOnJoin";
import DeleteCompetitionButton from "@/components/Competitions/DeleteCompetitionButton";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ joined?: string }>;
};

type CompetitionWithCourses = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  created_by: string | null;
  competition_courses: {
    course_id: string;
    courses: { id: string; name: string; latitude: number | null; longitude: number | null; location: string | null; main_image_url: string | null } | null;
  }[];
};

export default async function CompetitionDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const justJoined = resolvedSearchParams?.joined === "1";

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
      created_by,
      competition_courses (
        course_id,
        courses ( id, name, latitude, longitude, location, main_image_url )
      )
    `
    )
    .eq("id", id as string)
    .single<CompetitionWithCourses>();

  if (!competition || error) {
    console.error("[FETCH COMPETITION ERROR]", error);
    notFound();
  }

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  const isCreator = Boolean(
    competition.created_by && user?.id && (competition.created_by === user.id || isAdmin)
  );

  const { data: participantsData } = await supabase
    .from("competition_participants")
    .select("user_id, profiles(alias, avatar_url)")
    .eq("competition_id", id);

  const { data: creatorProfile } = competition.created_by
    ? await supabase
        .from("profiles")
        .select("id, alias, avatar_url")
        .eq("id", competition.created_by)
        .single()
    : { data: null };

  type ParticipantRow = { user_id: string; alias: string | null; avatar_url: string | null };
  const participantsFromJoin = (participantsData ?? []).map((p) => {
    const prof = (p as { profiles: { alias: string | null; avatar_url: string | null } | null }).profiles;
    return {
      user_id: (p as { user_id: string }).user_id,
      alias: prof?.alias ?? null,
      avatar_url: prof?.avatar_url ?? null,
    };
  });
  const participantIds = new Set(participantsFromJoin.map((p) => p.user_id));
  if (creatorProfile && competition.created_by && !participantIds.has(competition.created_by)) {
    participantsFromJoin.unshift({
      user_id: creatorProfile.id,
      alias: creatorProfile.alias ?? null,
      avatar_url: creatorProfile.avatar_url ?? null,
    });
  }
  const participants = participantsFromJoin as ParticipantRow[];

  const hasJoined = Boolean(
    user?.id && (participantIds.has(user.id) || competition.created_by === user.id)
  );

  const { data: competitionScores } = await supabase
    .from("scores")
    .select("id, score, throws, date_played, created_at, course_id, user_id, courses ( name ), profiles!scores_user_id_fkey( alias )")
    .eq("competition_id", id)
    .order("score", { ascending: true });

  type ScoreRow = {
    id: string;
    score: number;
    throws: number | null;
    date_played: string | null;
    created_at: string;
    course_id: string;
    user_id?: string;
    courses: { name?: string } | null;
    profiles: { alias?: string } | null;
  };

  const scoresByCourse = (competitionScores ?? []).reduce(
    (acc: Record<string, ScoreRow[]>,
     row) => {
      const courseId = (row as ScoreRow).course_id;
      if (!acc[courseId]) acc[courseId] = [];
      acc[courseId].push(row as ScoreRow);
      return acc;
    },
    {}
  );

  const totalsByUser = (competitionScores ?? []).reduce(
    (acc: Record<string, { alias: string; throws: number; score: number }>,
     row) => {
      const r = row as ScoreRow;
      const uid = r.user_id ?? "unknown";
      if (!acc[uid]) {
        acc[uid] = {
          alias: (r.profiles?.alias ?? "Okänd").trim() || "Okänd",
          throws: 0,
          score: 0,
        };
      }
      acc[uid].throws += r.throws ?? r.score ?? 0;
      acc[uid].score += r.score ?? 0;
      return acc;
    },
    {}
  );
  const totalRows = Object.entries(totalsByUser).sort(
    (a, b) => a[1].score - b[1].score
  );

  return (
    <div>
      <SetTopbarActions
        backHref="/competitions"
        editHref={isCreator ? `/competitions/${id}/edit` : null}
        editLabel="Redigera tävling"
        pageTitle={competition.title}
      />
      {competition.image_url && (
        <div className="w-full overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamisk tävlingsbild-URL */}
          <img
            src={competition.image_url}
            alt={competition.title}
            className="w-full min-h-[50vh] h-[55vh] object-cover object-center md:min-h-[90vh] md:h-[95vh]"
          />
          {/* Tävlingsnamn + datum nere till vänster på bilden */}
          <div
            className="absolute bottom-0 left-0 right-0 pt-16 pb-4 px-4 md:px-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            aria-hidden
          >
            <h1 className="font-bebas text-7xl sm:text-8xl md:text-[10rem] lg:text-[14rem] xl:text-[18rem] tracking-wide uppercase text-white drop-shadow-lg max-w-5xl leading-none">
              {competition.title}
            </h1>
            {competition.start_date && competition.end_date && (
              <p className="mt-5 md:mt-8 text-white/95 text-lg md:text-xl font-medium drop-shadow-md uppercase tracking-wide">
                {formatDateWithWeekday(competition.start_date)} – {formatDateWithWeekday(competition.end_date)}
              </p>
            )}
          </div>
          {user && !hasJoined && (
            <div className="absolute bottom-16 right-4 md:bottom-6 md:right-6 z-10">
              <JoinToCompetitionButton
                competitionId={id}
                competitionTitle={competition.title}
                className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-white drop-shadow-lg px-5 py-2.5 rounded-lg bg-black/50 backdrop-blur-sm border border-amber-400/60 transition-all duration-300 hover:text-amber-100 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.9),0_0_40px_rgba(251,191,36,0.5),0_0_60px_rgba(251,191,36,0.25)] hover:scale-[1.02] animate-pulse"
              />
            </div>
          )}
        </div>
      )}
      <div className="w-full px-4 py-8 md:px-0 md:py-8">
      <ScrollToDeltagareOnJoin justJoined={justJoined} />
      {/* Desktop: 100vw, 25% beskrivning | 20% datum+deltagare | 55% banor. Mobil: staplad. */}
      <div
        className={`grid gap-4 md:gap-0 items-start
          grid-cols-1
          ${competition.description
            ? "md:w-screen md:relative md:left-1/2 md:-translate-x-1/2 md:grid-cols-[25vw_20vw_55vw]"
            : "md:w-screen md:relative md:left-1/2 md:-translate-x-1/2 md:grid-cols-[20vw_80vw]"
          }`}
      >
        {competition.description && (
          <section className="min-w-0 w-full pl-4 md:pl-5 md:pr-2">
            <div className="md:sticky md:top-24">
              <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 mb-2 md:mb-3">
                {competition.title}
              </h2>
              <p className="text-stone-200 whitespace-pre-line text-sm md:text-base">
                {competition.description}
              </p>
            </div>
          </section>
        )}
        <aside className="min-w-0 space-y-6 md:px-2 md:pr-2">
          {competition.start_date && competition.end_date && (
            <CompetitionDateCard
              startDate={competition.start_date}
              endDate={competition.end_date}
            />
          )}
          <CompetitionParticipantsSection
            id="deltagare"
            competitionId={id}
            competitionTitle={competition.title}
            createdBy={competition.created_by}
            participants={participants}
            currentUserId={user?.id ?? null}
            justJoined={justJoined}
          />
        </aside>
        <main className="min-w-0 space-y-6 md:pl-4 md:pr-6">
      <CompetitionCoursesMap
        competitionId={id}
        courses={competition.competition_courses
          .map((e) => e.courses)
          .filter((c): c is NonNullable<typeof c> => c != null)}
      />

      <div className="flex flex-wrap items-center gap-3">
        {user && !hasJoined && (
          <JoinToCompetitionButton
            competitionId={id}
            competitionTitle={competition.title}
          />
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3 text-stone-100">🏞️ Banor och resultat</h2>
        <div className="space-y-6">
          {competition.competition_courses.map((entry) => {
            const courseScores = scoresByCourse[entry.course_id] ?? [];
            const sorted = [...courseScores].sort(
              (a, b) => (a.score ?? 0) - (b.score ?? 0)
            );
            return (
              <div
                key={entry.course_id}
                className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-retro-border bg-retro-card">
                  <Link
                    href={`/courses/${entry.course_id}?from=competition&competitionId=${id}`}
                    className="inline-block text-lg font-semibold text-retro-accent transition-all duration-200 origin-left hover:scale-105 hover:text-amber-400"
                  >
                    {entry.courses?.name ?? "Okänd bana"}
                  </Link>
                </div>
                <div className="p-4">
                  {sorted.length === 0 ? (
                    <p className="text-stone-400 text-sm">Inga resultat än.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="text-stone-400 border-b border-retro-border">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Spelare</th>
                          <th className="pb-2 font-medium">Kast</th>
                          <th className="pb-2 font-medium">Poäng</th>
                          <th className="pb-2 font-medium">Datum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((score, idx) => (
                          <tr
                            key={score.id}
                            className="border-b border-retro-border/50 last:border-0"
                          >
                            <td className="py-2 text-stone-500">{idx + 1}</td>
                            <td className="py-2 text-stone-100">
                              {score.user_id ? (
                                <Link href={`/profile/${score.user_id}`} className="text-retro-accent hover:underline">
                                  {score.profiles?.alias ?? "—"}
                                </Link>
                              ) : (
                                (score.profiles?.alias ?? "—")
                              )}
                            </td>
                            <td className="py-2 text-stone-200">
                              {score.throws ?? score.score ?? "—"}
                            </td>
                            <td className="py-2 font-semibold text-stone-100">
                              {score.score}
                            </td>
                            <td className="py-2 text-stone-400">
                              {score.date_played
                                ? formatDate(score.date_played)
                                : formatDate(score.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {totalRows.length > 0 && (
        <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
          <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100">
            📊 Totalt resultat (hela tävlingen)
          </h2>
          <div className="p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-stone-400 border-b border-retro-border">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Spelare</th>
                  <th className="pb-2 font-medium">Totalt antal kast</th>
                  <th className="pb-2 font-medium">Totalt poäng</th>
                </tr>
              </thead>
              <tbody>
                {totalRows.map(([userId, tot], idx) => (
                  <tr
                    key={userId}
                    className="border-b border-retro-border/50 last:border-0"
                  >
                    <td className="py-2 text-stone-500">{idx + 1}</td>
                    <td className="py-2 font-medium text-stone-100">
                      <Link href={`/profile/${userId}`} className="text-retro-accent hover:underline">
                        {tot.alias}
                      </Link>
                    </td>
                    <td className="py-2 text-stone-200">{tot.throws}</td>
                    <td className="py-2 font-semibold text-stone-100">{tot.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/results/new?competition_id=${id}`}
          className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-3 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          🥏 Lägg till resultat
        </Link>
        <Link
          href={`/competitions/${id}/photos`}
          className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-3 rounded-xl border border-retro-border bg-retro-surface text-stone-200 text-sm font-medium hover:border-retro-accent hover:text-retro-accent transition"
        >
          📷 Tävlingsbilder
        </Link>
        {isCreator && (
          <DeleteCompetitionButton
            competitionId={id}
            competitionTitle={competition.title}
            className="sm:ml-auto"
          />
        )}
      </div>
        </main>
      </div>
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

function formatDateWithWeekday(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/** ISO-veckonummer (1–53) */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Måndag = 1
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDatesInRange(start: string, end: string): { date: Date; day: number; shortWeekday: string }[] {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const out: { date: Date; day: number; shortWeekday: string }[] = [];
  const curr = new Date(startDate);
  curr.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  while (curr <= endDate) {
    out.push({
      date: new Date(curr),
      day: curr.getDate(),
      shortWeekday: new Intl.DateTimeFormat("sv-SE", { weekday: "short" }).format(curr).replace(".", ""),
    });
    curr.setDate(curr.getDate() + 1);
  }
  return out;
}

function CompetitionDateCard({ startDate, endDate }: { startDate: string; endDate: string }) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weekStart = getWeekNumber(start);
  const weekEnd = getWeekNumber(end);
  const year = start.getFullYear();
  const weekLabel = weekStart === weekEnd ? `Vecka ${weekStart}` : `Vecka ${weekStart}–${weekEnd}`;
  const days = getDatesInRange(startDate, endDate);
  const monthLabel = new Intl.DateTimeFormat("sv-SE", { month: "long" }).format(start);
  return (
    <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-retro-border bg-retro-card flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-semibold text-stone-100">🗓️ Datum</span>
        <span className="text-stone-400 text-sm">{weekLabel}</span>
        <span className="text-stone-400 text-sm">{monthLabel} {year}</span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {days.map(({ date, day, shortWeekday }) => (
            <div
              key={date.toISOString()}
              className="flex flex-col items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-lg bg-retro-accent/20 border-2 border-retro-accent text-center"
            >
              <span className="text-[10px] md:text-xs font-medium text-stone-400 uppercase tracking-wide">
                {shortWeekday}
              </span>
              <span className="text-lg md:text-xl font-bebas font-bold text-stone-100 leading-none mt-0.5">
                {day}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-stone-400">
          {formatDateWithWeekday(startDate)} – {formatDateWithWeekday(endDate)}
        </p>
      </div>
    </div>
  );
}
