"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import TeamForm, { type TeamFormData } from "@/components/Forms/TeamForm";
import { useToast } from "@/components/Toasts/ToastProvider";
import { uploadTeamAssets } from "@/lib/team-uploads";

export default function NewTeamPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { showToast } = useToast();

  const handleCreate = async (data: TeamFormData) => {
    const { data: inserted, error: insertError } = await supabase
      .from("teams")
      .insert({
        name: data.name,
        ort: data.ort || null,
        logga: data.logga || null,
        bild: data.bild || null,
        about: data.about || null,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      showToast("Kunde inte skapa laget.", "error");
      return;
    }

    const teamId = inserted?.id;
    if (teamId && (data.loggaFile || data.bildFile)) {
      const result = await uploadTeamAssets(
        supabase,
        teamId,
        data.loggaFile,
        data.bildFile
      );
      if (result.error) {
        showToast(
          "Laget skapades men bilderna kunde inte laddas upp. Skapa bucket \"teams\" i Supabase (Storage) med public läsning och tillåt upload för inloggade.",
          "error"
        );
      }
      if (result.loggaUrl !== null || result.bildUrl !== null) {
        await supabase
          .from("teams")
          .update({
            ...(result.loggaUrl !== null && { logga: result.loggaUrl }),
            ...(result.bildUrl !== null && { bild: result.bildUrl }),
          })
          .eq("id", teamId);
      }
    }

    showToast("Laget har skapats!", "success");
    router.push("/teams");
    router.refresh();
  };

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Lägg till lag</h1>
      <TeamForm onSubmit={handleCreate} submitText="Skapa lag" />
    </main>
  );
}
