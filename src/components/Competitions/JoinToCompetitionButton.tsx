"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";

type Props = {
  competitionId: string;
  competitionTitle: string;
  className?: string;
};

export default function JoinToCompetitionButton({ competitionId, competitionTitle, className }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/auth?redirect=${encodeURIComponent(`/competitions/${competitionId}`)}`);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("competition_participants").insert({
      competition_id: competitionId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") {
        showToast("Du har redan gått med i denna tävling.", "error");
      } else {
        showToast(error.message || "Kunde inte gå med.", "error");
      }
    } else {
      showToast("Du har gått med i " + competitionTitle + "!", "success");
      await router.push(`/competitions/${competitionId}?joined=1`);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
      }
    >
      {loading ? "Går med..." : "Gå med i tävlingen"}
    </button>
  );
}
