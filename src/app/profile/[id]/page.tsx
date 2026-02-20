// Offentlig profilsida – samma layout som min profil, men "Dens resultat" och utan redigera-knapp
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  MapPinIcon,
  PhoneIcon,
  HomeIcon,
  UserGroupIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import BackButton from "@/components/Buttons/BackButton";

type Props = { params: Promise<{ id: string }> };

type HomeCourseRow = {
  id: string;
  name: string;
  main_image_url: string | null;
  city: string | null;
  location: string | null;
};
type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
};
type DiscRow = { id: string; name: string; bild: string | null };

export default async function PublicProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, alias, avatar_url, home_course, team_id, favorite_disc_id, phone, favorite_disc, city, country")
    .eq("id", id)
    .single();

  if (profileError || !profileData) notFound();

  const profile = profileData as {
    id: string;
    alias: string | null;
    avatar_url: string | null;
    home_course: string | null;
    team_id: string | null;
    favorite_disc_id: string | null;
    phone: string | null;
    favorite_disc: string | null;
    city: string | null;
    country: string | null;
  };

  let homeCourse: HomeCourseRow | null = null;
  let bestRoundScore: number | null = null;
  if (profile.home_course) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, name, main_image_url, city, location")
      .eq("id", profile.home_course)
      .single();
    homeCourse = course as HomeCourseRow | null;
    const { data: bestRow } = await supabase
      .from("scores")
      .select("score")
      .eq("user_id", id)
      .eq("course_id", profile.home_course)
      .order("score", { ascending: true })
      .limit(1)
      .maybeSingle();
    bestRoundScore = bestRow?.score ?? null;
  }

  let team: TeamRow | null = null;
  if (profile.team_id) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, ort, logga, bild, about")
      .eq("id", profile.team_id)
      .single();
    team = teamData as TeamRow | null;
  }

  let favoriteDisc: DiscRow | null = null;
  if (profile.favorite_disc_id) {
    const res = await supabase
      .from("discs")
      .select("id, name, bild")
      .eq("id", profile.favorite_disc_id)
      .maybeSingle();
    if (!res.error && res.data) favoriteDisc = res.data as DiscRow;
  }

  type ScoreRow = {
    id: string;
    score: number;
    throws: number | null;
    date_played: string | null;
    created_at: string;
    course_id: string;
    courses: { id: string; name: string } | null;
  };

  const { data: scoresData } = await supabase
    .from("scores")
    .select("id, score, throws, date_played, created_at, course_id, courses ( id, name )")
    .eq("user_id", id)
    .order("date_played", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const scoreList = (scoresData ?? []) as ScoreRow[];

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Profil: mobil = lag flytande vänster, [bild][namn] rad, fav under, info under. Desktop = originalet */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 md:p-6 shadow-sm mb-6 relative">
        {team ? (
          <div
            className="md:hidden absolute top-0 left-0 w-12 h-12 z-20 flex items-center justify-center"
            title={team.name}
          >
            {team.logga ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={team.logga} alt={team.name} className="h-full w-full object-contain drop-shadow-lg" />
            ) : (
              <span className="h-full w-full flex items-center justify-center text-retro-muted text-lg" aria-hidden>👥</span>
            )}
          </div>
        ) : null}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-4 w-full md:w-auto">
            <div className="relative shrink-0 w-32 h-32 md:w-24 md:h-24 lg:w-28 lg:h-28 overflow-visible">
              <div className="w-full h-full rounded-full overflow-hidden bg-retro-card border border-retro-border">
                {profile.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profile.avatar_url} alt="Profilbild" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-retro-muted text-3xl">🥏</div>
                )}
              </div>
              {team ? (
                <div
                  className="hidden md:flex absolute -top-3 -left-3 w-12 h-12 lg:w-14 lg:h-14 z-10 items-center justify-center"
                  title={team.name}
                >
                  {team.logga ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={team.logga} alt={team.name} className="h-full w-full object-contain drop-shadow-lg" />
                  ) : (
                    <span className="h-full w-full flex items-center justify-center text-retro-muted text-lg" aria-hidden>👥</span>
                  )}
                </div>
              ) : null}
            </div>
            <div className="md:hidden min-w-0 flex-1 flex flex-col gap-2 justify-center text-left">
              <h1 className="text-3xl font-bebas tracking-wide text-stone-100 truncate uppercase">
                {profile.alias || "Spelare"}
              </h1>
              <div className="flex flex-col gap-1 text-sm text-stone-400">
                {profile.city ? (
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
                    {profile.city}
                  </span>
                ) : null}
                {profile.country ? (
                  <span className="flex items-center gap-1.5">
                    {profile.country === "Sverige" ? (
                      <span className="leading-none" title="Sverige">🇸🇪</span>
                    ) : null}
                    {profile.country}
                  </span>
                ) : null}
                {profile.phone ? (
                  <span className="flex items-center gap-1.5">
                    <PhoneIcon className="w-4 h-4 text-retro-muted shrink-0" />
                    {profile.phone}
                  </span>
                ) : null}
                {!profile.city && !profile.country && !profile.phone ? (
                  <span className="text-retro-muted">Ingen plats angiven</span>
                ) : null}
              </div>
            </div>
            {(favoriteDisc || profile.favorite_disc) ? (
              <div className="md:hidden absolute top-4 right-4 flex flex-col items-end shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-card border border-retro-border flex items-center justify-center">
                  {favoriteDisc?.bild ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={favoriteDisc.bild} alt={favoriteDisc.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-retro-muted text-lg">🥏</span>
                  )}
                </div>
                <p className="text-xs text-retro-muted mt-1 text-right">Favorit disc</p>
                <p className="text-stone-200 font-medium text-sm">{favoriteDisc?.name ?? profile.favorite_disc ?? "—"}</p>
              </div>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-3 text-left">
            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <h1 className="text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 truncate min-w-0 uppercase">
                {profile.alias || "Spelare"}
              </h1>
              {(favoriteDisc || profile.favorite_disc) ? (
                <div className="flex items-center justify-center md:justify-end gap-3 shrink-0 md:ml-auto">
                  <div className="text-right">
                    <p className="text-xs text-retro-muted uppercase tracking-wide">Favorit disc</p>
                    <p className="text-stone-200 font-medium">{favoriteDisc?.name ?? profile.favorite_disc ?? "—"}</p>
                  </div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-retro-card border border-retro-border shrink-0 flex items-center justify-center">
                    {favoriteDisc?.bild ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={favoriteDisc.bild} alt={favoriteDisc.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-retro-muted text-xl">🥏</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="hidden md:flex flex-col gap-1 text-sm text-stone-400 items-start">
              {profile.city ? (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
                  {profile.city}
                </span>
              ) : null}
              {profile.country ? (
                <span className="flex items-center gap-1.5">
                  {profile.country === "Sverige" ? (
                    <span className="leading-none" title="Sverige">🇸🇪</span>
                  ) : null}
                  {profile.country}
                </span>
              ) : null}
              {profile.phone ? (
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4 text-retro-muted shrink-0" />
                  {profile.phone}
                </span>
              ) : null}
              {!profile.city && !profile.country && !profile.phone ? (
                <span className="text-retro-muted">Ingen plats angiven</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Hemmabana – samma kort som min profil */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        {homeCourse ? (
          <>
            <div className="aspect-video md:aspect-[3/1] max-h-48 md:max-h-52 bg-retro-card relative overflow-visible w-full">
              {homeCourse.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={homeCourse.main_image_url}
                  alt={homeCourse.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ width: "100%", minWidth: "100%" }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-retro-muted">
                  <HomeIcon className="w-12 h-12" />
                </div>
              )}
              <div
                className="absolute bottom-0 left-3 z-10 h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center translate-y-1/2"
                title="Hemmabana"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/homecourse.png"
                  alt="Hemmabana"
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>
            </div>
            <div className="p-4 pt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link
                  href={`/courses/${homeCourse.id}`}
                  className="text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase transition-all duration-200 hover:scale-105 hover:text-amber-300"
                >
                  {homeCourse.name}
                </Link>
                {(homeCourse.location || homeCourse.city) && (
                  <span className="text-stone-400 text-lg flex items-center gap-1.5 shrink-0">
                    <MapPinIcon className="w-5 h-5 text-retro-muted shrink-0" />
                    {homeCourse.location || homeCourse.city}
                  </span>
                )}
              </div>
              {bestRoundScore !== null && (
                <p className="text-stone-400 text-sm mt-2">
                  Bästa runda: {bestRoundScore} slag
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5">
            <p className="text-stone-400">Ingen hemmabana vald</p>
          </div>
        )}
      </div>

      {/* Lag */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        {team ? (
          <>
            <div className="aspect-video md:aspect-[3/1] max-h-48 md:max-h-52 bg-retro-card relative overflow-visible w-full">
              {(team.bild || team.logga) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.bild || team.logga || ""}
                  alt={team.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  style={{ width: "100%", minWidth: "100%" }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-retro-muted">
                  <UserGroupIcon className="w-16 h-16" />
                </div>
              )}
              {team.logga && (
                <div className="absolute bottom-0 left-3 z-10 h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center translate-y-1/2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={team.logga}
                    alt=""
                    className="h-full w-full object-contain drop-shadow-lg"
                  />
                </div>
              )}
            </div>
            <div className="p-4 pt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <Link
                  href={`/teams/${team.id}`}
                  className="inline-block text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase transition-all duration-200 hover:scale-105 hover:text-amber-300"
                >
                  {team.name}
                </Link>
                {team.ort && (
                  <span className="text-stone-400 text-lg flex items-center gap-1.5 shrink-0">
                    <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
                    {team.ort}
                  </span>
                )}
              </div>
              {team.about && (
                <p className="text-stone-400 text-sm mt-2">{team.about}</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5">
            <p className="text-stone-400">Inget lag valt</p>
          </div>
        )}
      </div>

      {/* Resultat – rubrik med spelarens namn */}
      {scoreList.length > 0 ? (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
            <TrophyIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
            {(profile.alias?.trim() || "Spelaren")}s resultat
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
                {scoreList.map((s) => (
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
      ) : (
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
          <p className="text-stone-400 text-sm">Inga resultat inlagda än.</p>
        </div>
      )}
    </main>
  );
}
