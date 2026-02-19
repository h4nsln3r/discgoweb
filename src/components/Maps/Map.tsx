"use client";

import dynamic from "next/dynamic";
import type { Course } from "../CourseList";
import { useEffect, useMemo, useState } from "react";
import CoursePreviewPanel from "./CoursePreviewPanel";
import Link from "next/link";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

type Props = {
  userName: string;
  /** Om satt används dessa istället för att hämta get-courses (t.ex. från dashboard-summary). */
  initialCourses?: Course[] | null;
};

export default function Map({ userName, initialCourses }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialCourses !== undefined && initialCourses !== null) {
      setCourses(initialCourses);
      return;
    }
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };
    fetchCourses();
  }, [initialCourses]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedId) ?? null,
    [courses, selectedId]
  );

  return (
    <>
      {/* Kartan – hela bredden. Välkomstkort med z-index under menyn (z-50). */}
      <div className="relative w-full rounded-xl overflow-hidden border border-retro-border bg-retro-card">
        {/* Välkomstkort (syns under menyn: z-20 < topbar z-30, meny z-50) */}
        {!selectedCourse && (
          <div className="absolute top-3 left-3 right-3 z-20 max-w-sm">
            <div className="bg-retro-surface/95 backdrop-blur border border-retro-border rounded-xl shadow-lg p-4">
              <h3 className="text-lg font-semibold text-stone-100">
                Välkommen {userName}!
              </h3>
              <p className="text-stone-400 text-sm mt-1">
                Tryck på en markör för att välja bana.
              </p>
              <Link
                href="/courses"
                className="inline-flex mt-3 rounded-xl bg-retro-accent text-stone-100 px-4 py-2 text-sm font-medium hover:bg-retro-accent-hover transition"
              >
                Gå till alla banor
              </Link>
            </div>
          </div>
        )}

        <LeafletMap
          courses={courses}
          onSelectCourse={(c) => setSelectedId(c.id)}
          selectedCourseId={selectedId}
        />
      </div>

      {/* Vald bana → hela sidan (overlay under menyn z-50) */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-40 bg-retro-bg overflow-y-auto"
          onClick={() => setSelectedId(null)}
          aria-label="Stäng bana"
        >
          <div
            className="min-h-full max-w-3xl mx-auto p-4 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <CoursePreviewPanel
              course={selectedCourse}
              onClose={() => setSelectedId(null)}
              embedded
            />
          </div>
        </div>
      )}
    </>
  );
}
