// app/profile/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  MapPinIcon,
  PhoneIcon,
  HomeIcon,
  UserGroupIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import ProfileWelcomeToast from "@/components/Toasts/ProfileWelcomeToast";
import TeamCard from "@/components/Teams/TeamCard";
import ProfileAvatarModal from "@/components/profile/ProfileAvatarModal";
import ProfileResultsTable from "./ProfileResultsTable";
import BagStatusCircle from "@/components/Bag/BagStatusCircle";

type ProfileRow = {
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
  created_at: string | null;
};

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

type DiscRow = {
  id: string;
  name: string;
  bild: string | null;
};

export default async function ProfileHomePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, alias, avatar_url, home_course, team_id, favorite_disc_id, phone, favorite_disc, city, country, created_at"
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("id", user.id as any)
    .single();

  const profile: ProfileRow | null =
    profileError || !profileData ? null : (profileData as ProfileRow);

  let homeCourse: HomeCourseRow | null = null;
  let bestRoundScore: number | null = null;

  if (profile?.home_course) {
    const { data: course } = await supabase
      .from("courses")
      .select("id, name, main_image_url, city, location")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", profile.home_course as any)
      .single();
    homeCourse = course as HomeCourseRow | null;

    const { data: bestScoreRow } = await supabase
      .from("scores")
      .select("score")
      .eq("user_id", user.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("course_id", profile.home_course as any)
      .order("score", { ascending: true })
      .limit(1)
      .maybeSingle();
    bestRoundScore = bestScoreRow?.score ?? null;
  }

  let team: TeamRow | null = null;
  if (profile?.team_id) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, city, country, landskap, logga, bild, about")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", profile.team_id as any)
      .single();
    team = teamData as TeamRow | null;
  }

  let favoriteDisc: DiscRow | null = null;
  if (profile?.favorite_disc_id) {
    const res = await supabase
      .from("discs")
      .select("id, name, bild")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", profile.favorite_disc_id as any)
      .maybeSingle();
    if (!res.error && res.data) favoriteDisc = res.data as DiscRow;
  }

  type BagDiscRow = {
    id: string;
    disc_id: string;
    created_at: string;
    status: string;
    discs: { id: string; name: string; bild: string | null; disc_type: string | null; brand: string | null } | null;
  };
  const { data: bagData } = await supabase
    .from("player_bag")
    .select("id, disc_id, created_at, status, discs(id, name, bild, disc_type, brand)")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("user_id", user.id as any)
    .order("created_at", { ascending: true });
  const bagDiscs = (bagData ?? []) as BagDiscRow[];

  type ScoreRow = {
    id: string;
    score: number;
    throws: number | null;
    date_played: string | null;
    created_at: string;
    course_id: string;
    courses: { id: string; name: string } | null;
  };

  const { data: myScores } = await supabase
    .from("scores")
    .select("id, score, throws, date_played, created_at, course_id, courses ( id, name )")
    .eq("user_id", user.id)
    .order("date_played", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const scoreList = (myScores ?? []) as ScoreRow[];

  function formatDate(date: string | null) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <SetTopbarActions editHref="/profile/edit" editLabel="Redigera profil" pageTitle="Min profil" />
      <Suspense fallback={null}>
        <ProfileWelcomeToast displayName={profile?.alias ?? null} />
      </Suspense>

      {/* Profil: mobil = lag flytande vänster, [bild][namn] rad, fav under, info under. Desktop = originalet */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 md:p-6 shadow-sm mb-6 relative">
        {/* Mobil: lag-ikon flytande uppe till vänster i hörnet */}
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
          {/* Mobil: rad [bild][namn+info], sedan favorit disc på egen rad under. Desktop: bild med lag-overlay */}
          <div className="flex flex-col md:flex-col items-start w-full md:w-auto gap-3 md:gap-4">
            <div className="flex flex-row items-start gap-3 w-full md:contents">
              <ProfileAvatarModal
                avatarUrl={profile?.avatar_url ?? null}
                displayName={profile?.alias ?? null}
                className="w-32 h-32 md:w-24 md:h-24 lg:w-28 lg:h-28 order-1 md:order-none shrink-0"
              >
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
              </ProfileAvatarModal>
              {/* Mobil: namn + info bredvid bilden */}
              <div className="md:hidden min-w-0 flex-1 flex flex-col gap-2 justify-center text-left order-2">
                <h1 className="text-3xl font-bebas tracking-wide text-stone-100 truncate uppercase">
                  {profile?.alias || "Anonym kastare"}
                </h1>
                <div className="flex flex-col gap-1 text-sm text-stone-400">
                  {profile?.city ? (
                    <span className="flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
                      {profile.city}
                    </span>
                  ) : null}
                  {profile?.country ? (
                    <span className="flex items-center gap-1.5">
                      {profile.country === "Sverige" ? (
                        <span className="leading-none" title="Sverige">🇸🇪</span>
                      ) : null}
                      {profile.country}
                    </span>
                  ) : null}
                  {profile?.phone ? (
                    <span className="flex items-center gap-1.5">
                      <PhoneIcon className="w-4 h-4 text-retro-muted shrink-0" />
                      {profile.phone}
                    </span>
                  ) : null}
                  {!profile?.city && !profile?.country && !profile?.phone ? (
                    <span className="text-retro-muted">Ingen plats eller telefon angiven</span>
                  ) : null}
                  {profile?.created_at && (
                    <span className="text-retro-muted text-xs mt-1">
                      Medlem sedan {formatDate(profile.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Mobil: favorit disc på egen rad under namn + info */}
            {(favoriteDisc || profile?.favorite_disc) ? (
              profile?.favorite_disc_id ? (
                <Link
                  href={`/discs/${profile.favorite_disc_id}`}
                  className="md:hidden flex flex-row items-center gap-3 w-full pt-1 border-t border-retro-border/60 hover:opacity-90 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-card border border-retro-border flex items-center justify-center shrink-0">
                    {favoriteDisc?.bild ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={favoriteDisc.bild} alt={favoriteDisc.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-retro-muted text-lg">🥏</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-retro-muted uppercase tracking-wide">Favorit disc</p>
                    <p className="text-stone-200 font-medium text-sm truncate">{favoriteDisc?.name ?? profile?.favorite_disc ?? "—"}</p>
                  </div>
                </Link>
              ) : (
                <div className="md:hidden flex flex-row items-center gap-3 w-full pt-1 border-t border-retro-border/60">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-card border border-retro-border flex items-center justify-center shrink-0">
                    {favoriteDisc?.bild ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={favoriteDisc.bild} alt={favoriteDisc.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-retro-muted text-lg">🥏</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-retro-muted uppercase tracking-wide">Favorit disc</p>
                    <p className="text-stone-200 font-medium text-sm truncate">{favoriteDisc?.name ?? profile?.favorite_disc ?? "—"}</p>
                  </div>
                </div>
              )
            ) : null}
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-3 text-left">
            <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <h1 className="text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 truncate min-w-0 uppercase">
                {profile?.alias || "Anonym kastare"}
              </h1>
              {(favoriteDisc || profile?.favorite_disc) ? (
                profile?.favorite_disc_id ? (
                  <Link
                    href={`/discs/${profile.favorite_disc_id}`}
                    className="flex items-center justify-center md:justify-end gap-3 shrink-0 md:ml-auto hover:opacity-90 transition-opacity"
                  >
                    <div className="text-right">
                      <p className="text-xs text-retro-muted uppercase tracking-wide">Favorit disc</p>
                      <p className="text-stone-200 font-medium">{favoriteDisc?.name ?? profile?.favorite_disc ?? "—"}</p>
                    </div>
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-retro-card border border-retro-border shrink-0 flex items-center justify-center">
                      {favoriteDisc?.bild ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={favoriteDisc.bild} alt={favoriteDisc.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-retro-muted text-xl">🥏</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center justify-center md:justify-end gap-3 shrink-0 md:ml-auto">
                    <div className="text-right">
                      <p className="text-xs text-retro-muted uppercase tracking-wide">Favorit disc</p>
                      <p className="text-stone-200 font-medium">{favoriteDisc?.name ?? profile?.favorite_disc ?? "—"}</p>
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
                )
              ) : null}
            </div>
            <div className="hidden md:flex flex-col gap-1 text-sm text-stone-400 items-start">
              {profile?.city ? (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
                  {profile.city}
                </span>
              ) : null}
              {profile?.country ? (
                <span className="flex items-center gap-1.5">
                  {profile.country === "Sverige" ? (
                    <span className="leading-none" title="Sverige">🇸🇪</span>
                  ) : null}
                  {profile.country}
                </span>
              ) : null}
              {profile?.phone ? (
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="w-4 h-4 text-retro-muted shrink-0" />
                  {profile.phone}
                </span>
              ) : null}
              {!profile?.city && !profile?.country && !profile?.phone ? (
                <span className="text-retro-muted">Ingen plats eller telefon angiven</span>
              ) : null}
              {profile?.created_at && (
                <span className="text-retro-muted text-xs">
                  Medlem sedan {formatDate(profile.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Kort hjälptext när allt är tomt efter t.ex. rensning */}
      {!homeCourse && !team && scoreList.length === 0 && (
        <div className="rounded-xl border border-retro-border bg-retro-card/50 p-4 mb-6 text-center text-stone-400 text-sm">
          Ingen hemmabana, lag eller resultat valda. Gå till{" "}
          <Link href="/profile/edit" className="text-retro-accent hover:underline">
            Redigera profil
          </Link>{" "}
          för att välja hemmabana och favorit disc när du lagt till banor och discar igen.
        </div>
      )}

      {/* Hemmabana – eget kort med bild (lägre på desktop) + bästa runda */}
      <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-500 mb-2">
        <HomeIcon className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
        Hemmabana
      </h2>
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

      {/* Min bag */}
      <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-500 mb-2">
        <BriefcaseIcon className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
        Min bag
      </h2>
      <div className="mb-6">
        <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
          {bagDiscs.length > 0 ? (
            <div className="flex flex-wrap gap-3 items-center">
              {bagDiscs.slice(0, 12).map((b) => (
                <Link
                  key={b.id}
                  href={`/discs/${b.disc_id}`}
                  className="flex items-center gap-2 rounded-xl bg-retro-card/50 border border-retro-border px-3 py-2 hover:bg-retro-card transition"
                >
                  <BagStatusCircle status={b.status ?? "active"} className="shrink-0" />
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-retro-surface flex items-center justify-center shrink-0">
                    {b.discs?.bild ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={b.discs.bild} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-retro-muted text-lg">🥏</span>
                    )}
                  </div>
                  <span className="text-stone-200 text-sm font-medium truncate max-w-[120px]">{b.discs?.name ?? "—"}</span>
                </Link>
              ))}
              {bagDiscs.length > 12 && (
                <span className="text-stone-500 text-sm">+{bagDiscs.length - 12} till</span>
              )}
            </div>
          ) : (
            <p className="text-stone-400 text-sm">Inga discar i bagen än.</p>
          )}
          <Link
            href="/profile/bag"
            className="inline-block mt-3 text-sm text-retro-accent hover:underline font-medium"
          >
            {bagDiscs.length > 0 ? "Hantera bag" : "Lägg till discar i bagen"}
          </Link>
        </div>
      </div>

      {/* Lag */}
      <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-500 mb-2">
        <UserGroupIcon className="w-5 h-5 text-amber-500 shrink-0" aria-hidden />
        Lag
      </h2>
      <div className="mb-6">
        {team ? (
          <TeamCard team={team} />
        ) : (
          <div className="rounded-2xl border border-retro-border bg-retro-surface p-5 shadow-sm">
            <p className="text-stone-400">Inget lag valt</p>
          </div>
        )}
      </div>

      {/* Alla resultat – klick på hela raden går till resultatet */}
      <ProfileResultsTable scoreList={scoreList} />
    </main>
  );
}
