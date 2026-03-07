// app/profile/bag/page.tsx
import BackButton from "@/components/Buttons/BackButton";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import BagManager from "./BagManager";

export default async function ProfileBagPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("favorite_disc_id")
    .eq("id", user.id)
    .single();

  const { data: discsData } = await supabase
    .from("discs")
    .select("id, name, bild, disc_type")
    .order("name");
  const discs = discsData ?? [];

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-2">Min bag</h1>
      <p className="text-stone-400 text-sm mb-6">
        Lägg till discar från listan nedan. Du kan plocka discar från alla discar som finns i systemet. Du kan också välja favorit disc direkt här.
      </p>
      <BagManager discs={discs} favoriteDiscId={(profile as { favorite_disc_id?: string | null } | null)?.favorite_disc_id ?? null} />
    </main>
  );
}
