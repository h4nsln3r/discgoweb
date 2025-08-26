"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import AddScoreForm from "@/components/AddScoreForm";

type ScoreFromDb = {
  id: string;
  score: number;
  throws: number;
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

  // 2) Handlers for form actions
  const handleSuccess = () => {
    // After successful update, go back to results list (or wherever you want)
    router.push("/results");
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return <div className="p-6">Laddar resultat...</div>;
  }

  if (!score) {
    return <div className="p-6">Hittade inte resultat.</div>;
  }

  // 3) Render AddScoreForm in "edit mode"
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✏️ Redigera resultat</h1>
      <button
        onClick={() => router.push("/results")}
        className="mb-4 text-sm text-blue-600 hover:underline"
      >
        ← Tillbaka till alla resultat
      </button>
      <AddScoreForm
        editingScore={{
          id: score.id,
          score: score.score,
          throws: score.throws,
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
