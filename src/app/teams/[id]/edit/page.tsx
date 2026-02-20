"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/BackButton";
import TeamForm from "@/components/Forms/TeamForm";
import { useToast } from "@/components/ui/ToastProvider";

type TeamRow = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
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
        .select("id, name, ort, logga, about")
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

  const handleUpdate = async (data: {
    name: string;
    ort: string;
    logga: string;
    about: string;
  }) => {
    const { error } = await supabase
      .from("teams")
      .update({
        name: data.name,
        ort: data.ort || null,
        logga: data.logga || null,
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
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </main>
  );
}
