"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toasts/ToastProvider";

type Props = {
  competitionId: string;
  competitionTitle: string;
  className?: string;
  variant?: "button" | "danger";
};

export default function DeleteCompetitionButton({
  competitionId,
  competitionTitle,
  className = "",
  variant = "danger",
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      `Vill du ta bort tävlingen "${competitionTitle}"? All kopplad data (deltagare, bilder, banor) tas bort. Detta kan inte ångras.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { error?: string }).error || "Kunde inte ta bort tävlingen.", "error");
        setLoading(false);
        return;
      }
      showToast("Tävlingen har tagits bort.", "success");
      router.push("/competitions");
      router.refresh();
    } catch (e) {
      console.error(e);
      showToast("Något gick fel.", "error");
    } finally {
      setLoading(false);
    }
  };

  const baseClass =
    variant === "danger"
      ? "text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/50 hover:border-red-500"
      : "text-stone-400 hover:text-stone-200 border-retro-border hover:border-stone-500";

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      aria-label="Ta bort tävlingen"
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition disabled:opacity-50 ${baseClass} ${className}`}
    >
      {loading ? "Tar bort..." : "Ta bort tävling"}
    </button>
  );
}
