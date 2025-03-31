// app/profile/page.tsx
import ProfileForm from "@/components/ProfileForm";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: courses } = await supabase.from("courses").select("id, name");

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Min profil</h1>
      <ProfileForm profile={profile} courses={courses || []} />
    </div>
  );
}
