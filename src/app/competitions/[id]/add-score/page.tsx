// src/app/competitions/[id]/add-score/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export default function AddCompetitionScorePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const params = useParams();
  const competitionId = params?.id as string;

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // ⛳ Hämta tävlingens banor
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("competition_courses")
        .select("course_id, courses ( name )")
        .eq("competition_id", competitionId);

      if (data) {
        const formatted = data.map((entry) => ({
          id: entry.course_id,
          name: entry.courses?.name || "Okänd",
        }));
        setCourses(formatted);
      }
    };
    fetchCourses();
  }, [competitionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Du måste vara inloggad.");
      return;
    }

    const { error } = await supabase.from("scores").insert({
      user_id: user.id,
      course_id: selectedCourse,
      competition_id: competitionId,
      score: score,
    });

    if (error) {
      console.error("[ADD SCORE ERROR]", error);
      alert("Kunde inte spara score.");
    } else {
      alert("Score sparad!");
      router.push(`/competitions/${competitionId}`);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Lägg till score</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          Bana:
          <select
            required
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          >
            <option value="">Välj bana</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          Totalt antal kast:
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            required
            min={1}
            className="w-full border p-2 rounded mt-1"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          {loading ? "Sparar..." : "Spara score"}
        </button>
      </form>
    </div>
  );
}
