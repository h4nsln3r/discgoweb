// app/profile/edit/page.tsx
import ProfileForm from "@/components/Forms/ProfileForm";
import BackButton from "@/components/Buttons/BackButton";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function EditProfilePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name");

  let pendingApplication: { team_id: string; team_name: string } | null = null;
  const { data: application } = await supabase
    .from("team_applications")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (application?.team_id) {
    const { data: teamRow } = await supabase.from("teams").select("name").eq("id", application.team_id).single();
    if (teamRow?.name) pendingApplication = { team_id: application.team_id, team_name: teamRow.name };
  }

  let discs: { id: string; name: string }[] = [];
  const { data: discsData } = await supabase.from("discs").select("id, name");
  if (discsData) discs = discsData as { id: string; name: string }[];

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold mb-4 text-stone-100">Redigera profil</h1>
      <ProfileForm
        profile={profile}
        courses={courses || []}
        teams={teams || []}
        discs={discs || []}
        pendingApplication={pendingApplication}
      />
    </main>
  );
}

