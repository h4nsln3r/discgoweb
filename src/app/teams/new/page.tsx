"use client";

import { useEffect, useState } from "react";
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
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAllowed(false);
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
      setAllowed(!profile?.team_id);
    };
    check();
  }, [supabase]);

  const handleCreate = async (data: TeamFormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Du måste vara inloggad för att skapa ett lag.", "error");
      return;
    }
    const { data: profile } = await supabase.from("profiles").select("team_id").eq("id", user.id).single();
    if (profile?.team_id) {
      showToast("Du är redan med i ett lag. Lämna det först om du vill skapa ett nytt.", "error");
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("teams")
      .insert({
        name: data.name,
        city: data.city || null,
        country: data.country || null,
        landskap: data.landskap || null,
        logga: data.logga || null,
        bild: data.bild || null,
        about: data.about || null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      showToast("Kunde inte skapa laget.", "error");
      return;
    }

    const teamId = inserted?.id;
    if (teamId) {
      await supabase.from("team_member_roles").upsert({ team_id: teamId, user_id: user.id, role: "admin" }, { onConflict: "team_id,user_id" });
      await supabase.from("profiles").update({ team_id: teamId }).eq("id", user.id);
    }
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

  if (allowed === null) {
    return (
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        <BackButton />
        <p className="text-stone-400 mt-4">Kontrollerar...</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 text-amber-200">
          <p className="font-medium">Du kan bara skapa ett nytt lag om du inte är med i något lag.</p>
          <p className="text-sm mt-2 text-amber-200/80">Gå till din profil och ta bort ditt nuvarande lag om du vill skapa ett nytt.</p>
        </div>
      </main>
    );
  }

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
