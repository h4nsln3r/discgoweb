"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import AddScoreForm from "@/components/AddScoreForm";

type ScoreFromDb = {
  id: string;
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

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<ScoreFromDb | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 1) Load score by id
  useEffect(() => {
    const fetchScore = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scores")
        .select(
          "id, score, throws, date_played, with_friends, courses ( id, name )"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("[EDIT-SCORE LOAD ERROR]", error);
        alert("Kunde inte hämta resultatet.");
      } else {
        setScore(data as ScoreFromDb);
      }
      setLoading(false);
    };

    if (id) fetchScore();
  }, [id, supabase]);

  // 2) Handlers
  const handleSuccess = () => {
    router.push("/results");
  };

  const handleClose = () => {
    router.back();
  };

  const handleDelete = async () => {
    console.log("[DELETE] clicked"); // debug 1
    if (!id) {
      console.warn("[DELETE] no id");
      alert("Saknar id för resultatet.");
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
        alert(j?.error || "Kunde inte ta bort resultatet.");
        return;
      }

      // succé
      router.push("/results");
    } catch (e) {
      console.error("[DELETE] fetch error", e);
      alert("Nätverksfel vid borttagning.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-6">Laddar resultat...</div>;
  if (!score) return <div className="p-6">Hittade inte resultat.</div>;

  // 3) Render AddScoreForm in "edit mode" + Delete button
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">✏️ Redigera resultat</h1>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`px-3 py-2 rounded ${
            deleting ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
          } text-white`}
          title="Ta bort resultat"
        >
          {deleting ? "Tar bort..." : "Ta bort resultat"}
        </button>
      </div>

      <button
        onClick={() => router.push("/results")}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Tillbaka till alla resultat
      </button>

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
    </main>
  );
}
