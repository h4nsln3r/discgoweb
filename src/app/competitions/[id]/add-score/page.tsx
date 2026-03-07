"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";

export default function AddCompetitionScorePage() {
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const router = useRouter();
  const params = useParams();
  const competitionId = params?.id as string;
  const { showToast } = useToast();

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const courseRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from("competition_courses")
        .select("course_id, courses ( name )")
        .eq("competition_id", competitionId);

      if (data) {
        const formatted = data
          .filter(
            (
              entry
            ): entry is { course_id: string; courses: { name: string } } =>
              !!entry.course_id
          )
          .map((entry) => ({
            id: entry.course_id,
            name: entry.courses?.name || "Okänd",
          }));

        setCourses(formatted);
      }

      if (error) console.log("error", error);
    };

    fetchCourses();
  }, [competitionId, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = new Set<string>();
    if (!selectedCourse?.trim()) invalid.add("course");
    if (score < 1 || Number.isNaN(score)) invalid.add("score");
    if (invalid.size > 0) {
      setInvalidFields(invalid);
      const first = invalid.has("course") ? courseRef.current : scoreRef.current;
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast(!selectedCourse?.trim() ? "Välj en bana." : "Fyll i antal kast (minst 1).", "error");
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      showToast("Du måste vara inloggad.", "error");
      return;
    }

    const { error } = await supabase.from("scores").insert({
      user_id: user.id,
      course_id: selectedCourse,
      competition_id: competitionId,
      score,
    });

    if (error) {
      console.error("[ADD SCORE ERROR]", error);
      showToast("Kunde inte spara score.", "error");
    } else {
      showToast("Score sparad!", "success");
      router.back();
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <SetTopbarActions backHref={competitionId ? `/competitions/${competitionId}` : null} />
      <h1 className="text-2xl font-bold mb-4">Lägg till score</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={courseRef}>
          <label className="block">
            Bana:
            <select
              required
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setInvalidFields((p) => { const n = new Set(p); n.delete("course"); return n; });
              }}
              className={`w-full border p-2 rounded mt-1 ${invalidFields.has("course") ? "border-red-500 ring-2 ring-red-500/50" : ""}`}
            >
              <option value="">Välj bana</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div ref={scoreRef}>
          <label className="block">
            Totalt antal kast:
            <input
              type="number"
              value={score}
              onChange={(e) => {
                setScore(Number(e.target.value));
                setInvalidFields((p) => { const n = new Set(p); n.delete("score"); return n; });
              }}
              required
              min={1}
              className={`w-full border p-2 rounded mt-1 ${invalidFields.has("score") ? "border-red-500 ring-2 ring-red-500/50" : ""}`}
            />
          </label>
        </div>

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
