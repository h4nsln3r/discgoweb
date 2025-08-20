"use client";

import dynamic from "next/dynamic";
import type { Course } from "../CourseList";
import { useEffect, useMemo, useState } from "react";
import CoursePreviewPanel from "./CoursePreviewPanel";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function Map() {
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
        <CoursePreviewPanel
          course={selectedCourse}
          onClose={() => setSelectedId(null)}
        />
      </div>

      {/* Map area */}
      <div className="relative">
        <LeafletMap
          courses={courses}
          onSelectCourse={(c) => setSelectedId(c.id)}
        />

        {/* Mobile overlay panel */}
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
