"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import BackButton from "@/components/Buttons/BackButton";
import TeamForm from "@/components/Forms/TeamForm";
import { useToast } from "@/components/Toasts/ToastProvider";

export default function NewTeamPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { showToast } = useToast();

  const handleCreate = async (data: {
    name: string;
    ort: string;
    logga: string;
    about: string;
  }) => {
    const { error } = await supabase.from("teams").insert({
      name: data.name,
      ort: data.ort || null,
      logga: data.logga || null,
      about: data.about || null,
    });

    if (error) {
      console.error(error);
      showToast("Kunde inte skapa laget.", "error");
    } else {
      showToast("Laget har skapats!", "success");
      router.push("/teams");
      router.refresh();
    }
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
