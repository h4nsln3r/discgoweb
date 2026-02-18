"use client";

import { useEffect, useMemo, useState } from "react";
import AddScoreForm from "./AddScoreForm";
import CourseScores, { CourseScore } from "./CourseScores";
import Link from "next/link";
import PageLoading from "./ui/PageLoading";

export type Course = {
  id: string;
  name: string;
  location: string;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  scores?: CourseScore[];
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
      <p className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center text-retro-muted shadow-sm">
        Inga banor tillagda än.
      </p>
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

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {sortedCourses.map((course) => (
        <div
          key={course.id}
          className="rounded-xl border border-retro-border bg-retro-surface shadow-sm overflow-hidden hover:border-retro-muted/50 transition"
        >
          {course.main_image_url ? (
            <img
              src={course.main_image_url}
              alt={course.name}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="w-full h-40 bg-retro-card flex items-center justify-center text-retro-muted text-sm">
              Ingen bild
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-stone-100">{course.name}</h3>
            <p className="text-sm text-stone-400 mt-1">{course.location || "—"}</p>
            {course.latitude && course.longitude && (
              <p className="text-xs text-retro-muted mt-1">
                📍 {course.latitude}, {course.longitude}
              </p>
            )}
            <Link
              href={`/courses/${course.id}`}
              className="inline-block mt-2 text-sm text-retro-accent font-medium hover:underline"
            >
              Visa detaljer
            </Link>
            <button
              onClick={() => toggleForm(course.id)}
              className="mt-3 block w-full text-left text-sm text-retro-accent font-medium hover:underline"
            >
              {openForms[course.id] ? "Stäng formulär" : "Lägg till resultat"}
            </button>
            {openForms[course.id] && (
              <div className="mt-3">
                <AddScoreForm
                  courseId={course.id}
                  onClose={() => toggleForm(course.id)}
                />
              </div>
            )}
            <CourseScores scores={course.scores ?? []} />
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
