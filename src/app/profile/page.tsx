// app/profile/page.tsx
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

type ProfileRow = {
  id: string;
  alias: string | null;
  avatar_url: string | null;
  home_course: string | null;
  phone: string | null;
  favorite_disc: string | null;
  city: string | null;
  team: string | null;
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
      "id, alias, avatar_url, home_course, phone, favorite_disc, city, team"
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq("id", user.id as any)
    .single();

  const profile: ProfileRow | null =
    profileError || !profileData ? null : (profileData as ProfileRow);

  let homeCourseName: string | null = null;

  if (profile?.home_course) {
    const { data: homeCourse } = await supabase
      .from("courses")
      .select("id, name")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .eq("id", profile.home_course as any)
      .single();

    homeCourseName =
      homeCourse && typeof homeCourse === "object" && "name" in homeCourse
        ? (homeCourse.name as string) ?? null
        : null;
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Min profil</h1>
        <a
          href="/profile/edit"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          Redigera profil
        </a>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-gray-500">Ingen bild</span>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-500">Namn</p>
            <p className="text-lg font-semibold">
              {profile?.alias || "Inte angivet"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Hemmabana</p>
            <p className="font-medium">
              {homeCourseName || "Ingen hemmabana vald"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Telefon</p>
            <p className="font-medium">
              {profile?.phone || "Inte angivet"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Favorit disc</p>
            <p className="font-medium">
              {profile?.favorite_disc || "Inte angivet"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Stad</p>
            <p className="font-medium">
              {profile?.city || "Inte angivet"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Lag</p>
            <p className="font-medium">
              {profile?.team || "Inte angivet"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
