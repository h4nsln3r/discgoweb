"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";

type Props = {
  competitionId: string;
  competitionTitle: string;
};

export default function LeaveCompetitionButton({ competitionId, competitionTitle }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Logga in för att lämna tävlingen.", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("competition_participants")
      .delete()
      .eq("competition_id", competitionId)
      .eq("user_id", user.id);
    if (error) {
      showToast(error.message || "Kunde inte lämna tävlingen.", "error");
    } else {
      showToast("Du har lämnat " + competitionTitle + ".", "success");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleLeave}
      disabled={loading}
      aria-label="Lämna tävlingen"
      className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 disabled:opacity-50"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </svg>
    </button>
  );
}
