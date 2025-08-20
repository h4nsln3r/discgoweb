"use client";

import dynamic from "next/dynamic";
import type { Course } from "../CourseList";
import { useEffect, useMemo, useState } from "react";
import CoursePreviewPanel from "./CoursePreviewPanel";
import Link from "next/link";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

type Props = {
  userName: string;
};

export default function Map({ userName }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };
    fetchCourses();
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedId) ?? null,
    [courses, selectedId]
  );

  return (
    <div className="md:grid md:grid-cols-[420px_1fr] gap-4">
      {/* Left side panel on desktop */}
      <div className="hidden md:block">
        {selectedCourse ? (
          <CoursePreviewPanel
            course={selectedCourse}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          // Welcome card when nothing is selected
          <div className="bg-white border rounded-2xl shadow-sm p-6">
            <h3 className="text-xl font-semibold">Välkommen {userName}!</h3>
            <p className="text-gray-700 mt-2">
              Tryck på kartan för att välja din bana.
            </p>
            <Link
              href="/courses"
              className="inline-flex mt-4 rounded-xl bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 transition"
            >
              Gå till alla banor
            </Link>
          </div>
        )}
      </div>

      {/* Map area */}
      <div className="relative">
        {/* Small hint on mobile when nothing is selected */}
        {!selectedCourse && (
          <div className="md:hidden absolute z-[400] top-3 left-3 right-3">
            <div className="bg-white/95 backdrop-blur border rounded-xl shadow p-3">
              <p className="text-sm">
                Välkommen {userName}! Tryck på en markör för att visa banan.
              </p>
              <Link
                href="/courses"
                className="text-sm text-emerald-700 underline mt-1 inline-block"
              >
                Eller visa alla banor
              </Link>
            </div>
          </div>
        )}

        <LeafletMap
          courses={courses}
          onSelectCourse={(c) => setSelectedId(c.id)}
          selectedCourseId={selectedId}
        />

        {/* Mobile overlay panel → only on small screens */}
        <div className="md:hidden">
          <CoursePreviewPanel
            course={selectedCourse}
            onClose={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  );
}
