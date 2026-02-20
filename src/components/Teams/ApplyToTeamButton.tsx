"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";

type Props = {
  teamId: string;
  teamName: string;
};

export default function ApplyToTeamButton({ teamId, teamName }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Logga in för att ansöka.", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("team_applications").insert({
      team_id: teamId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") showToast("Du har redan ansökt till detta lag.", "error");
      else showToast(error.message || "Kunde inte skicka ansökan.", "error");
    } else {
      showToast("Ansökan skickad till " + teamName + ". Du får besked när admin eller kapten godkänner.", "success");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleApply}
      disabled={loading}
      className="w-full sm:w-auto rounded-xl bg-retro-accent text-stone-100 py-2.5 px-4 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
    >
      {loading ? "Skickar..." : "Ansök till laget"}
    </button>
  );
}
