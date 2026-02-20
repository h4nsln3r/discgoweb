"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import TeamForm, { type TeamFormData } from "@/components/Forms/TeamForm";
import { useToast } from "@/components/Toasts/ToastProvider";
import { uploadTeamAssets } from "@/lib/team-uploads";

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
};

export default function EditTeamPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamRow | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTeam = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, ort, logga, bild, about")
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        showToast("Kunde inte hämta laget.", "error");
      } else if (data) {
        setTeam(data as TeamRow);
      }
      setLoading(false);
    };

    fetchTeam();
  }, [id, supabase, showToast]);

  const handleUpdate = async (data: TeamFormData) => {
    let loggaUrl = data.logga || null;
    let bildUrl = data.bild || null;

    if (id && (data.loggaFile || data.bildFile)) {
      const uploaded = await uploadTeamAssets(
        supabase,
        id,
        data.loggaFile,
        data.bildFile
      );
      if (uploaded.error) {
        showToast(
          "Bilderna kunde inte laddas upp. Skapa bucket \"teams\" i Supabase (Storage) med public läsning och tillåt upload för inloggade.",
          "error"
        );
      }
      if (uploaded.loggaUrl !== null) loggaUrl = uploaded.loggaUrl;
      if (uploaded.bildUrl !== null) bildUrl = uploaded.bildUrl;
    }

    const { error } = await supabase
      .from("teams")
      .update({
        name: data.name,
        ort: data.ort || null,
        logga: loggaUrl,
        bild: bildUrl,
        about: data.about || null,
      })
      .eq("id", id as string);

    if (error) {
      console.error(error);
      showToast("Kunde inte spara laget.", "error");
    } else {
      showToast("Laget har uppdaterats!", "success");
      router.push("/teams");
      router.refresh();
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-stone-400">Laddar...</div>;
  if (!team) return <div className="max-w-2xl mx-auto p-6 text-amber-400">Laget hittades inte.</div>;

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Redigera lag</h1>
      <TeamForm
        initialName={team.name}
        initialOrt={team.ort ?? ""}
        initialLogga={team.logga ?? ""}
        initialAbout={team.about ?? ""}
        initialBild={team.bild ?? ""}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </main>
  );
}
