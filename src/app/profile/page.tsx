// app/profile/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import {
  MapPinIcon,
  PhoneIcon,
  HomeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import ProfileWelcomeToast from "@/components/Toasts/ProfileWelcomeToast";

type ProfileRow = {
  id: string;
  alias: string | null;
  avatar_url: string | null;
  home_course: string | null;
  team_id: string | null;
  phone: string | null;
  favorite_disc: string | null;
  city: string | null;
  country: string | null;
};

type HomeCourseRow = {
  id: string;
  name: string;
  main_image_url: string | null;
};

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  about: string | null;
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
      "id, alias, avatar_url, home_course, team_id, phone, favorite_disc, city, country"
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
      .select("id, name, main_image_url")
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
      .select("id, name, ort, logga, about")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", profile.team_id as any)
      .single();
    team = teamData as TeamRow | null;
  }

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Suspense fallback={null}>
        <ProfileWelcomeToast displayName={profile?.alias ?? null} />
      </Suspense>

      {/* Profil: rund bild + namn (inga ikoner i rubriker) */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-retro-card border border-retro-border">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-retro-muted text-3xl">
                🥏
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-100 truncate">
              {profile?.alias || "Anonym kastare"}
            </h1>
            {profile?.favorite_disc && (
              <p className="text-stone-400 text-sm mt-0.5">
                Favorit disc: {profile.favorite_disc}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stad, Land, Telefon – ett kort med ikoner */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-5 shadow-sm mb-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {profile?.city ? (
            <span className="flex items-center gap-2 text-stone-200">
              <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
              {profile.city}
            </span>
          ) : null}
          {profile?.country ? (
            <span className="flex items-center gap-2 text-stone-200">
              {profile.country === "Sverige" ? (
                <span className="text-lg leading-none" title="Sverige">🇸🇪</span>
              ) : null}
              {profile.country}
            </span>
          ) : null}
          {profile?.phone ? (
            <span className="flex items-center gap-2 text-stone-200">
              <PhoneIcon className="w-4 h-4 text-retro-muted shrink-0" />
              {profile.phone}
            </span>
          ) : null}
          {!profile?.city && !profile?.country && !profile?.phone ? (
            <span className="text-retro-muted text-sm">Ingen plats eller telefon angiven</span>
          ) : null}
        </div>
      </div>

      {/* Hemmabana – eget kort med bild + bästa runda */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        {homeCourse ? (
          <>
            <div className="aspect-video bg-retro-card relative">
              {homeCourse.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={homeCourse.main_image_url}
                  alt={homeCourse.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-retro-muted">
                  <HomeIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-retro-muted">Hemmabana</p>
              <p className="font-semibold text-stone-100">{homeCourse.name}</p>
              {bestRoundScore !== null && (
                <p className="text-stone-400 text-sm mt-1">
                  Bästa runda: {bestRoundScore} slag
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5">
            <p className="text-sm text-retro-muted">Hemmabana</p>
            <p className="text-stone-400">Ingen hemmabana vald</p>
          </div>
        )}
      </div>

      {/* Lag – eget kort (som hemmabana) */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm mb-6">
        {team ? (
          <>
            <div className="aspect-video bg-retro-card relative flex items-center justify-center">
              {team.logga ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={team.logga}
                  alt={team.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <UserGroupIcon className="w-16 h-16 text-retro-muted" />
              )}
            </div>
            <div className="p-4">
              <p className="text-sm text-retro-muted">Lag</p>
              <p className="font-semibold text-stone-100">{team.name}</p>
              {team.ort && (
                <p className="text-stone-400 text-sm mt-0.5">{team.ort}</p>
              )}
              {team.about && (
                <p className="text-stone-400 text-sm mt-2">{team.about}</p>
              )}
            </div>
          </>
        ) : (
          <div className="p-5">
            <p className="text-sm text-retro-muted">Lag</p>
            <p className="text-stone-400">Inget lag valt</p>
          </div>
        )}
      </div>

      {/* Redigera profil längst ner */}
      <div className="pt-2">
        <Link
          href="/profile/edit"
          className="block w-full text-center py-3 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition"
        >
          Redigera profil
        </Link>
      </div>
    </main>
  );
}
