"use client";

import { useEffect, useMemo, useState } from "react";
import AddScoreForm from "@/components/Forms/AddScoreForm";
import Link from "next/link";
import PageLoading from "@/components/PageLoading";

export type Top3Score = {
  id: string;
  user_id?: string;
  score: number;
  date_played: string | null;
  profiles: { alias: string | null } | null;
};

export type Course = {
  id: string;
  name: string;
  location: string;
  city?: string | null;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  hole_count?: number;
  top3?: Top3Score[];
  scores?: { id: string; score: number; date_played: string | null; profiles: { alias: string | null } | null }[];
};

const SORT_OPTIONS = [
  { value: "name_asc", label: "Namn (A–Ö)" },
  { value: "name_desc", label: "Namn (Ö–A)" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default function CourseList({ refresh }: { refresh?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForms, setOpenForms] = useState<Record<string, boolean>>({});
  const [sort, setSort] = useState<SortValue>("name_asc");

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const res = await fetch("/api/get-courses-with-scores");
      const data = await res.json();
      setCourses(data);
      setLoading(false);
    };

    fetchCourses();
  }, [refresh]);

  const sortedCourses = useMemo(() => {
    const list = [...courses];
    if (sort === "name_asc") {
      return list.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "sv")
      );
    }
    return list.sort((a, b) =>
      (b.name ?? "").localeCompare(a.name ?? "", "sv")
    );
  }, [courses, sort]);

  const toggleForm = (courseId: string) => {
    setOpenForms((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  if (loading) return <PageLoading variant="courses" />;
  if (!courses.length)
    return (
      <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
        <p className="text-stone-300 text-lg">Inga banor än.</p>
        <p className="text-stone-500 text-sm mt-2">
          Lägg till en bana för att se den här.
        </p>
        <Link
          href="/courses/new"
          className="inline-block mt-4 px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
        >
          Lägg till bana
        </Link>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <label className="text-sm font-medium text-stone-300">Sortering:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sortedCourses.map((course) => (
          <article
            key={course.id}
            className="rounded-2xl border border-retro-border bg-retro-surface shadow-md overflow-hidden hover:border-retro-muted/50 hover:shadow-lg transition-all flex flex-col"
          >
            <div className="relative aspect-[16/10] bg-retro-card shrink-0">
              {course.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- external image URL
                <img
                  src={course.main_image_url}
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-retro-muted text-sm">
                  Ingen bild
                </div>
              )}
              <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-stone-200">
                {course.hole_count ? `${course.hole_count} hål` : "—"}
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-xl font-semibold text-stone-100">{course.name}</h3>
              <p className="text-sm text-stone-400 mt-0.5">{course.location || "—"}</p>

              {course.top3 && course.top3.length > 0 && (
                <div className="mt-4 rounded-xl bg-retro-card/60 border border-retro-border p-3">
                  <h4 className="text-xs font-semibold text-retro-muted uppercase tracking-wider mb-2">
                    🏆 Topp 3
                  </h4>
                  <ul className="space-y-1.5 text-sm text-stone-200">
                    {course.top3.map((s, idx) => (
                      <li key={s.id} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="text-retro-muted w-5">{idx + 1}.</span>
                          {s.user_id ? (
                            <Link href={`/profile/${s.user_id}`} className="text-retro-accent hover:underline">
                              {s.profiles?.alias ?? "Okänd"}
                            </Link>
                          ) : (
                            (s.profiles?.alias ?? "Okänd")
                          )}
                        </span>
                        <span className="font-medium text-stone-100">{s.score} kast</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition"
                >
                  Visa detaljer
                </Link>
                <button
                  type="button"
                  onClick={() => toggleForm(course.id)}
                  className="inline-flex items-center px-4 py-2 rounded-xl border border-retro-border text-stone-300 text-sm font-medium hover:bg-retro-card hover:text-stone-100 transition"
                >
                  {openForms[course.id] ? "Stäng" : "Lägg till resultat"}
                </button>
              </div>
              {openForms[course.id] && (
                <div className="mt-4 pt-4 border-t border-retro-border">
                  <AddScoreForm
                    courseId={course.id}
                    onClose={() => toggleForm(course.id)}
                  />
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
