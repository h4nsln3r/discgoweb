"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import TeamForm, { type TeamFormData } from "@/components/Forms/TeamForm";
import { useToast } from "@/components/Toasts/ToastProvider";
import { uploadTeamAssets } from "@/lib/team-uploads";
import { getMyRoleInTeam, canEditTeam } from "@/lib/team-roles";

type TeamRow = {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  landskap: string | null;
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
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTeamAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const [currentUserRes, { data, error }] = await Promise.all([
        fetch("/api/get-current-user").then((r) => (r.ok ? r.json() : null)),
        supabase.from("teams").select("id, name, city, country, landskap, logga, bild, about").eq("id", id).single(),
      ]);

      if (error || !data) {
        showToast("Kunde inte hämta laget.", "error");
        setLoading(false);
        return;
      }
      const isAdmin = (currentUserRes as { is_admin?: boolean } | null)?.is_admin === true;
      setTeam(data as TeamRow);
      const role = await getMyRoleInTeam(supabase, id, user.id);
      setCanEdit(canEditTeam(role) || isAdmin);
      setLoading(false);
    };

    fetchTeamAndRole();
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
        city: data.city || null,
        country: data.country || null,
        landskap: data.landskap || null,
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
      router.refresh();
      router.push(`/teams/${id}`);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-stone-400">Laddar...</div>;
  if (!team) return <div className="max-w-2xl mx-auto p-6 text-amber-400">Laget hittades inte.</div>;
  if (!canEdit) {
    return (
      <main className="p-4 sm:p-6 max-w-2xl mx-auto">
        <BackButton />
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 text-amber-200 mt-4">
          <p className="font-medium">Du har inte rättighet att redigera detta lag.</p>
          <p className="text-sm mt-2">Endast admin och redaktörer kan redigera laget.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton />
      </div>
      <h1 className="text-2xl font-bold text-stone-100 mb-6">Redigera lag</h1>
      <TeamForm
        initialName={team.name}
        initialCity={team.city ?? ""}
        initialCountry={team.country ?? ""}
        initialLandskap={team.landskap ?? ""}
        initialLogga={team.logga ?? ""}
        initialAbout={team.about ?? ""}
        initialBild={team.bild ?? ""}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </main>
  );
}
