import { notFound } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth-server";
import { createServerSupabaseClient, createSupabaseAdminClient } from "@/lib/supabase-server";
import Link from "next/link";
import { CalendarDaysIcon, TrophyIcon } from "@heroicons/react/24/outline";
import AuthAwareLink from "@/components/AuthAwareLink";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import CompetitionCoursesMapClient from "@/components/Competitions/CompetitionCoursesMapClient";
import JoinToCompetitionButton from "@/components/Competitions/JoinToCompetitionButton";
import CompetitionParticipantsSection from "@/components/Competitions/CompetitionParticipantsSection";
import ScrollToDeltagareOnJoin from "@/components/Competitions/ScrollToDeltagareOnJoin";
import DeleteCompetitionButton from "@/components/Competitions/DeleteCompetitionButton";
import CompetitionBanorResultatSection from "@/components/Competitions/CompetitionBanorResultatSection";
import CompetitionStabilitySection from "@/components/Competitions/CompetitionStabilitySection";
import CompetitionRoundCharts from "@/components/Competitions/CompetitionRoundCharts";

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

  const supabase = await createServerSupabaseClient();
  // Admin-klient för publik data så gäster (utan inloggning) också ser tävling + banor + deltagare + resultat
  const admin = createSupabaseAdminClient();

  const { data: rawCompetition, error } = await admin
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
    .single();

  const competition = rawCompetition as CompetitionWithCourses | null;

  if (!competition || error) {
    console.error("[FETCH COMPETITION ERROR]", error);
    notFound();
  }

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);

  const { data: participantsData } = await admin
    .from("competition_participants")
    .select("user_id, profiles(alias, avatar_url)")
    .eq("competition_id", id);

  const { data: creatorProfile } = competition.created_by
    ? await admin
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

  const organizerIds = new Set<string>();
  if (competition.created_by) organizerIds.add(competition.created_by);
  try {
    const { data: extraOrganizersData } = await admin
      .from("competition_organizers")
      .select("user_id")
      .eq("competition_id", id);
    (extraOrganizersData ?? []).forEach((r) => organizerIds.add(r.user_id));
  } catch {
    // Tabellen competition_organizers kanske inte finns än
  }

  const canEditCompetition = Boolean(
    user?.id && (competition.created_by === user.id || isAdmin || organizerIds.has(user.id))
  );

  const hasJoined = Boolean(
    user?.id && (participantIds.has(user.id) || competition.created_by === user.id)
  );

  const { data: competitionScores } = await admin
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

  const scoreEntriesForHoles = (competitionScores ?? []).map((row) => {
    const r = row as ScoreRow;
    return {
      scoreId: r.id,
      userId: r.user_id ?? "",
      alias: r.profiles?.alias ?? null,
      courseId: r.course_id,
      courseName: r.courses?.name ?? "Okänd bana",
    };
  });

  const isGuest = !user;

  return (
    <div className={isGuest ? "" : "pt-2 md:pt-7"}>
      <SetTopbarActions
        backHref="/competitions"
        editHref={canEditCompetition ? `/competitions/${id}/edit` : null}
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
            className="absolute bottom-0 left-0 right-0 pt-16 pb-4 px-4 md:px-6 md:pt-10 md:pb-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            aria-hidden
          >
            <h1 className="font-bebas text-7xl sm:text-8xl md:text-[5.5rem] lg:text-[7rem] xl:text-[8.5rem] tracking-wide uppercase text-white drop-shadow-lg max-w-5xl md:max-w-4xl leading-none md:mt-2 md:leading-tight">
              {competition.title}
            </h1>
            {competition.start_date && competition.end_date && (
              <p className="mt-2 md:mt-1 md:mb-3 text-white/95 text-lg md:text-xl font-medium drop-shadow-md uppercase tracking-wide">
                {formatDateWithWeekday(competition.start_date)} – {formatDateWithWeekday(competition.end_date)}
              </p>
            )}
          </div>
          {!hasJoined && (
            <div className="absolute bottom-28 right-4 left-4 md:bottom-20 md:left-auto md:right-8 z-10 flex justify-end">
              <JoinToCompetitionButton
                competitionId={id}
                competitionTitle={competition.title}
                className="font-bebas text-xl md:text-3xl tracking-wide uppercase text-white drop-shadow-lg px-5 py-2.5 md:px-8 md:py-4 rounded-lg bg-black/50 backdrop-blur-sm border border-amber-400/60 transition-all duration-300 hover:text-amber-100 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(251,191,36,0.9),0_0_40px_rgba(251,191,36,0.5),0_0_60px_rgba(251,191,36,0.25)] hover:scale-[1.02] animate-pulse"
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
            organizerIds={Array.from(organizerIds)}
            participants={participants}
            currentUserId={user?.id ?? null}
            justJoined={justJoined}
            isGuest={isGuest}
          />
        </aside>
        <main className="min-w-0 space-y-6 md:pl-4 md:pr-6">
      <CompetitionCoursesMapClient
        competitionId={id}
        courses={competition.competition_courses
          .map((e) => e.courses)
          .filter((c): c is NonNullable<typeof c> => c != null)}
      />

      <div className="flex flex-wrap items-center gap-3">
        {!hasJoined && (
          <JoinToCompetitionButton
            competitionId={id}
            competitionTitle={competition.title}
            className="md:text-lg md:px-6 md:py-3"
          />
        )}
      </div>
        </main>
      </div>

      {/* Banor och resultat – egen container, full bredd */}
      <section className="w-full px-4 py-8 md:px-6 md:py-10">
      <CompetitionBanorResultatSection
        competitionId={id}
        entries={competition.competition_courses.map((entry) => ({
          course_id: entry.course_id,
          courseName: entry.courses?.name ?? "Okänd bana",
          main_image_url: entry.courses?.main_image_url ?? null,
        }))}
        scoresByCourse={scoresByCourse}
        isGuest={isGuest}
      />
      </section>

      {/* Statistik och grafer – använder samma resultat som under Banor, hämtar hål via /api/score-holes */}
      <section className="w-full px-4 py-6 md:px-6 md:py-8 space-y-6">
        <CompetitionStabilitySection
          competitionId={id}
          scoreEntries={scoreEntriesForHoles}
          isGuest={isGuest}
        />
        <CompetitionRoundCharts
          competitionId={id}
          scoreEntries={scoreEntriesForHoles}
        />
      </section>

      <div className="w-full px-4 md:px-6 pb-8">
      {totalRows.length > 0 && (
        <div>
          <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 leading-none mb-0 pb-0 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden />
            Totalt resultat (hela tävlingen)
          </h2>
          <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden -mt-px">
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
                      <AuthAwareLink href={`/profile/${userId}`} isGuest={isGuest} className="text-retro-accent hover:underline">
                        {tot.alias}
                      </AuthAwareLink>
                    </td>
                    <td className="py-2 text-stone-200">{tot.throws}</td>
                    <td className="py-2 font-semibold text-stone-100">{tot.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      <div className="pt-4 flex flex-wrap items-center gap-3">
        <AuthAwareLink
          href={`/results/new?competition_id=${id}`}
          isGuest={isGuest}
          className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-3 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
        >
          🥏 Lägg till resultat
        </AuthAwareLink>
        <AuthAwareLink
          href={`/competitions/${id}/photos`}
          isGuest={isGuest}
          className="inline-flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-3 rounded-xl border border-retro-border bg-retro-surface text-stone-200 text-sm font-medium hover:border-retro-accent hover:text-retro-accent transition"
        >
          📷 Tävlingsbilder
        </AuthAwareLink>
        {canEditCompetition && (competition.created_by === user?.id || isAdmin) && (
          <DeleteCompetitionButton
            competitionId={id}
            competitionTitle={competition.title}
            className="sm:ml-auto"
          />
        )}
      </div>
      </div>
      </div>
    </div>
  );
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
    <div>
      <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 leading-none mb-0 pb-0 flex items-center gap-2">
        <CalendarDaysIcon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden />
        Datum
      </h2>
      <div className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden -mt-px">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
            <span className="text-stone-400 text-sm">{weekLabel}</span>
            <span className="text-stone-400 text-sm">{monthLabel} {year}</span>
          </div>
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
    </div>
  );
}
