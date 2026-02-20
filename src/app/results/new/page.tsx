"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/Buttons/BackLink";
import AddScoreForm from "@/components/Forms/AddScoreForm";

interface Score {
  id: string;
  throws: number | null;
  score: number;
  date_played: string;
  competition_id: string | null;
  courses: { id: string; name: string };
  profiles: { alias: string } | null;
  competitions: { title: string } | null;
  with_friends?: string[]; // 👈 add here
}

type CompetitionData = { id: string; title: string; courses: { id: string; name: string }[] } | null;

export default function AddResultPage() {
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get("course_id");
  const competitionIdFromUrl = searchParams.get("competition_id");

  const [scores, setScores] = useState<Score[]>([]);
  const [editingScore, setEditingScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);
  const [competitionData, setCompetitionData] = useState<CompetitionData>(null);
  const [coursesForForm, setCoursesForForm] = useState<{ id: string; name: string }[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(!!courseIdFromUrl);
  const [competitionLoading, setCompetitionLoading] = useState(!!competitionIdFromUrl);

  // När användaren kom från en bana: hämta banlista så att banan finns i listan innan formuläret visas
  useEffect(() => {
    if (!courseIdFromUrl) {
      setCoursesLoading(false);
      setCoursesForForm(null);
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    fetch("/api/get-courses")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setCoursesForForm(Array.isArray(data) ? data : []);
          setCoursesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoursesForForm([]);
          setCoursesLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [courseIdFromUrl]);

  useEffect(() => {
    if (!competitionIdFromUrl) {
      setCompetitionData(null);
      setCompetitionLoading(false);
      return;
    }
    let cancelled = false;
    setCompetitionLoading(true);
    fetch(`/api/competition-with-courses?competition_id=${competitionIdFromUrl}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCompetitionData(data ? { id: data.id, title: data.title, courses: data.courses ?? [] } : null);
          setCompetitionLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompetitionData(null);
          setCompetitionLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [competitionIdFromUrl]);

  // Hämta senaste resultat
  const fetchScores = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-all-scores");
      const json = await res.json();
      // Visa bara senaste 5
      setScores(json.slice(0, 5));
    } catch (error) {
      console.error("Error fetching scores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  // Starta redigering
  const handleEdit = (score: Score) => {
    console.log("handleEdit score", score);
    setEditingScore(score);
  };

  // Avbryt redigering
  const handleResetForm = () => {
    setEditingScore(null);
  };

  // Efter sparat/uppdaterat resultat
  const handleSuccess = () => {
    fetchScores(); // Ladda om listan
    setEditingScore(null); // Avbryt redigering
  };

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <BackLink
          href={
            competitionIdFromUrl
              ? `/competitions/${competitionIdFromUrl}`
              : "/results"
          }
        >
          {competitionIdFromUrl ? "Tillbaka till tävlingen" : "Tillbaka till resultat"}
        </BackLink>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Vänster kolumn: Add/Edit form */}
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-4">
            {editingScore ? "✏️ Redigera resultat" : "🥏 Lägg till resultat"}
          </h1>
          {(courseIdFromUrl && coursesLoading) || (competitionIdFromUrl && competitionLoading) ? (
            <AddResultFormSkeleton />
          ) : (
            <AddScoreForm
              editingScore={
                editingScore
                  ? {
                      id: editingScore.id,
                      score: editingScore.score,
                      throws: editingScore.throws,
                      date_played: editingScore.date_played,
                      with_friends: editingScore.with_friends ?? [],
                      courses: {
                        id: editingScore.courses.id,
                        name: editingScore.courses.name,
                      },
                    }
                  : null
              }
              initialCourseId={courseIdFromUrl}
              initialCompetitionId={competitionData?.id ?? null}
              competitionTitle={competitionData?.title ?? null}
              competitionCourses={competitionData?.courses ?? null}
              preloadedCourses={coursesForForm ?? undefined}
              onClose={handleResetForm}
              onSuccess={handleSuccess}
            />
          )}
        </div>

        {/* Höger kolumn: Senaste resultat */}
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-4">
            🥏 Senast tillagda resultat
          </h1>

          {loading ? (
            <p>Laddar resultat...</p>
          ) : (
            <ul className="space-y-2">
              {scores.map((score) => (
                <li
                  key={score.id}
                  className="flex justify-between items-center border p-2 rounded hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold">
                      {score.courses?.id ? (
                        <Link
                          href={`/courses/${score.courses.id}`}
                          className="text-retro-accent hover:underline"
                        >
                          {score.courses.name ?? "Okänd bana"}
                        </Link>
                      ) : (
                        (score.courses?.name ?? "Okänd bana")
                      )}
                    </p>
                    <p>
                      {score.user_id ? (
                        <Link href={`/profile/${score.user_id}`} className="text-retro-accent hover:underline">
                          {score.profiles?.alias ?? "Okänd spelare"}
                        </Link>
                      ) : (
                        (score.profiles?.alias ?? "Okänd spelare")
                      )}{" "}
                      – {score.score}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(score.date_played).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEdit(score)}
                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Redigera
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}

function AddResultFormSkeleton() {
  return (
    <div className="rounded-xl border border-retro-border bg-retro-surface p-6 space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-retro-border/60" />
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-retro-border/60" />
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-retro-border/60" />
        <div className="h-10 w-32 rounded-lg bg-retro-border/60" />
      </div>
      <div className="pt-2">
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
    </div>
  );
}
