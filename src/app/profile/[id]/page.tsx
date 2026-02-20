// Offentlig profilsida för en användare (t.ex. från resultatlistan)
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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
          {homeCourseName && (
            <div>
              <p className="text-stone-500">Hemmabana</p>
              <p className="font-medium text-stone-200">{homeCourseName}</p>
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
    </main>
  );
}
