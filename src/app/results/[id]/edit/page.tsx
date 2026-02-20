"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import BackLink from "@/components/Buttons/BackLink";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import AddScoreForm from "@/components/Forms/AddScoreForm";
import { useToast } from "@/components/Toasts/ToastProvider";

type ScoreFromDb = {
  id: string;
  user_id: string;
  score: number | null;
  throws: number | null;
  date_played: string | null;
  with_friends: string[] | null;
  courses: { id: string; name: string } | null;
};

export default function EditScorePage() {
  const supabase = createClientComponentClient<Database>();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<ScoreFromDb | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userChecked, setUserChecked] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      setUserChecked(true);
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    const fetchScore = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scores")
        .select(
          "id, user_id, score, throws, date_played, with_friends, courses ( id, name )"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("[EDIT-SCORE LOAD ERROR]", error);
        showToast("Kunde inte hämta resultatet.", "error");
      } else {
        setScore(data as ScoreFromDb);
      }
      setLoading(false);
    };

    if (id) fetchScore();
  }, [id, supabase, showToast]);

  // 2) Handlers
  const handleSuccess = () => {
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  const handleDelete = async () => {
    console.log("[DELETE] clicked"); // debug 1
    if (!id) {
      console.warn("[DELETE] no id");
      showToast("Saknar id för resultatet.", "error");
      return;
    }

    const ok = window.confirm(
      "Är du säker på att du vill ta bort detta resultat?"
    );
    if (!ok) {
      console.log("[DELETE] cancelled confirm"); // debug 2
      return;
    }

    try {
      setDeleting(true);
      console.log("[DELETE] calling /api/delete-result", id); // debug 3

      // Rekommenderat: DELETE med query param
      const res = await fetch(`/api/delete-result?id=${id}`, {
        method: "DELETE",
      });

      console.log("[DELETE] response status", res.status); // debug 4

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        console.error("[DELETE] server error", j);
        showToast(j?.error || "Kunde inte ta bort resultatet.", "error");
        return;
      }

      // succé
      showToast("Resultatet har tagits bort.", "success");
      router.push("/results");
    } catch (e) {
      console.error("[DELETE] fetch error", e);
      showToast("Nätverksfel vid borttagning.", "error");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !userChecked) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        <div className="h-5 w-48 rounded bg-stone-600/50 animate-pulse" aria-hidden />
        <div className="h-8 w-56 rounded bg-stone-600/50 animate-pulse" aria-hidden />
        <div className="space-y-4 rounded-xl border border-retro-border bg-retro-surface p-4 md:p-6">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-stone-600/40 animate-pulse" aria-hidden />
            <div className="h-10 w-full rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-stone-600/40 animate-pulse" aria-hidden />
              <div className="h-10 w-full rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-stone-600/40 animate-pulse" aria-hidden />
              <div className="h-10 w-full rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-14 rounded bg-stone-600/40 animate-pulse" aria-hidden />
            <div className="h-10 w-full rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-stone-600/40 animate-pulse" aria-hidden />
            <div className="h-24 w-full rounded-lg bg-stone-600/20 animate-pulse" aria-hidden />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-10 w-28 rounded-lg bg-stone-600/40 animate-pulse" aria-hidden />
            <div className="h-10 w-36 rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
          </div>
        </div>
        <div className="pt-4 border-t border-retro-border">
          <div className="h-10 w-40 rounded-lg bg-stone-600/30 animate-pulse" aria-hidden />
        </div>
      </main>
    );
  }
  if (!score) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        <p className="text-stone-400">Hittade inte resultat.</p>
        <BackLink href="/results" className="mt-3 inline-flex items-center gap-2 text-retro-accent hover:text-stone-200" />
      </main>
    );
  }

  const notOwner = userChecked && currentUserId != null && score.user_id !== currentUserId;
  if (notOwner) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <p className="text-stone-400">Du kan bara redigera och ta bort resultat som du själv lagt in.</p>
        <BackLink href={`/results/${id}`} className="inline-flex items-center gap-2 text-retro-accent hover:text-stone-200" />
      </main>
    );
  }

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <BackLink href={id ? `/results/${id}` : "/results"} />
      </div>

      <h1 className="text-2xl font-bold text-stone-100">Redigera resultat</h1>

      <AddScoreForm
        editingScore={{
          id: score.id,
          score: score.score ?? 0,
          throws: score.throws ?? 0,
          date_played: score.date_played ?? "",
          with_friends: score.with_friends ?? [],
          courses: {
            id: score.courses?.id ?? "",
            name: score.courses?.name ?? "",
          },
        }}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />

      <div className="pt-4 border-t border-retro-border">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/15 hover:border-red-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-retro-bg"
          title="Ta bort resultat"
        >
          <TrashIcon className="h-4 w-4" />
          {deleting ? "Tar bort..." : "Ta bort resultat"}
        </button>
      </div>
    </main>
  );
}
