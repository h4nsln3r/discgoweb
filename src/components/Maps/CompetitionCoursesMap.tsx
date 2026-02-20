"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import CoursePreviewPanel from "./CoursePreviewPanel";
import type { Course } from "../Lists/CourseList";

type CourseInput = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  main_image_url?: string | null;
};

const LeafletMap = dynamic(
  () => import("@/components/Maps/LeafletMap").then((m) => m.default),
  { ssr: false }
);

type Props = {
  courses: CourseInput[];
};

export default function CompetitionCoursesMap({ courses }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const validCourses: Course[] = courses
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude!,
      longitude: c.longitude!,
      location: c.location ?? "",
      main_image_url: c.main_image_url ?? undefined,
    }));

  const selectedCourse = validCourses.find((c) => c.id === selectedId) ?? null;

  if (validCourses.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-retro-border overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100">
          🗺️ Banor i tävlingen
        </h2>
        <div className="relative h-80 md:h-64">
          {/* Desktop: panel till höger som overlay på kartan */}
          {selectedCourse && (
            <div className="hidden md:flex absolute inset-y-0 right-0 z-20 w-72 shrink-0 flex-col overflow-hidden rounded-r-xl border-l border-retro-border bg-retro-surface shadow-lg">
              <div className="flex-1 overflow-y-auto">
                <CoursePreviewPanel
                  course={selectedCourse}
                  onClose={() => setSelectedId(null)}
                  embedded
                  compact
                />
              </div>
            </div>
          )}
          {/* Mobil: panel i nedre delen av kartan */}
          {selectedCourse && (
            <div className="md:hidden absolute inset-x-0 bottom-0 z-20 max-h-[55%] flex flex-col overflow-hidden rounded-t-xl border-t border-retro-border bg-retro-surface shadow-lg">
              <div className="flex-1 min-h-0 overflow-y-auto">
                <CoursePreviewPanel
                  course={selectedCourse}
                  onClose={() => setSelectedId(null)}
                  embedded
                  compact
                  compactImageSmall
                />
              </div>
            </div>
          )}
          <LeafletMap
            courses={validCourses}
            selectedCourseId={selectedId}
            onSelectCourse={(c) => setSelectedId(c.id)}
            height="100%"
            fitToCourses
            centerOffsetPx={isMobile ? undefined : -144}
            centerOffsetPxY={isMobile && selectedId ? 60 : undefined}
          />
        </div>
      </div>
    </>
  );
}
