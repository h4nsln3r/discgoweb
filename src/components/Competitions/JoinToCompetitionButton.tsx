"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toasts/ToastProvider";

type Props = {
  competitionId: string;
  competitionTitle: string;
  className?: string;
};

export default function JoinToCompetitionButton({ competitionId, competitionTitle, className }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/join`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };

      if (res.status === 401) {
        router.push(`/auth?redirect=${encodeURIComponent(`/competitions/${competitionId}`)}`);
        return;
      }
      if (!res.ok) {
        showToast(body.error || "Kunde inte gå med.", "error");
        return;
      }

      showToast("Du har gått med i " + competitionTitle + "!", "success");
      await router.push(`/competitions/${competitionId}?joined=1`);
      router.refresh();
    } finally {
      setLoading(false);
    }
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
