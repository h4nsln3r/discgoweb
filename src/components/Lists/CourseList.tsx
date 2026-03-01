"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageLoading from "@/components/PageLoading";
import { MagnifyingGlassIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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
  const [sort, setSort] = useState<SortValue>("name_asc");
  const [search, setSearch] = useState("");

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
      list.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "sv")
      );
    } else {
      list.sort((a, b) =>
        (b.name ?? "").localeCompare(a.name ?? "", "sv")
      );
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [courses, sort, search]);

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
        <div className="flex items-center gap-2 rounded-lg border border-retro-border bg-retro-surface text-stone-300 focus-within:ring-2 focus-within:ring-retro-accent focus-within:border-transparent min-w-[180px]">
          <MagnifyingGlassIcon className="w-4 h-4 shrink-0 ml-2.5 text-retro-muted" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök på banans namn..."
            className="flex-1 min-w-0 py-1.5 pr-3 bg-transparent text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none"
            aria-label="Sök banor efter namn"
          />
        </div>
      </div>

      {sortedCourses.length === 0 && search.trim() ? (
        <p className="text-stone-400 py-6">Inga banor matchar sökningen.</p>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        {sortedCourses.map((course) => (
          <article
            key={course.id}
            className="rounded-2xl border border-retro-border bg-retro-surface shadow-md overflow-hidden hover:border-retro-muted/50 hover:shadow-lg transition-all flex flex-col"
          >
            <Link
              href={`/courses/${course.id}`}
              className="block flex flex-col flex-1 group"
            >
              <div className="relative aspect-[16/10] bg-retro-card shrink-0">
                {course.main_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external image URL
                  <img
                    src={course.main_image_url}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
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
                <h3 className="text-3xl sm:text-4xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase group-hover:text-amber-300 transition-colors">
                  {course.name}
                </h3>
                <p className="text-sm text-stone-400 mt-0.5">{course.location || "—"}</p>
              </div>
            </Link>

            {course.top3 && course.top3.length > 0 && (
              <div className="px-5 pb-2">
                <div className="rounded-xl bg-retro-card/60 border border-retro-border p-3">
                  <h4 className="text-xs font-semibold text-retro-muted uppercase tracking-wider mb-2">
                    🏆 Topp 3
                  </h4>
                  <ul className="space-y-1.5 text-sm text-stone-200">
                    {course.top3.map((s, idx) => (
                      <li key={s.id} className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <span className="text-retro-muted w-5">{idx + 1}.</span>
                          {s.user_id ? (
                            <Link href={`/profile/${s.user_id}`} className="text-retro-accent hover:underline" onClick={(e) => e.stopPropagation()}>
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
              </div>
            )}

            <div className="p-5 pt-0 flex justify-end">
              <Link
                href={`/results/new?course_id=${course.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-retro-border text-stone-300 text-sm font-medium hover:bg-retro-card hover:text-stone-100 transition"
                aria-label="Lägg till resultat"
              >
                <PlusCircleIcon className="w-5 h-5 shrink-0" aria-hidden />
                Lägg till resultat
              </Link>
            </div>
          </article>
        ))}
      </div>
      )}
    </div>
  );
}
