"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapIcon, MapPinIcon } from "@heroicons/react/24/outline";
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
  competitionId?: string;
};

export default function CompetitionCoursesMap({ courses, competitionId }: Props) {
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

  const mapHeight = "min-h-[320px] h-[28rem]";
  const mapHeightMobile = "h-80";

  return (
    <div>
      <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 leading-none mb-0 pb-0 flex items-center gap-2">
        <MapIcon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden />
        Banor i tävlingen
      </h2>
      <div className="rounded-xl border border-retro-border overflow-hidden -mt-px">
        {/* Desktop: lista till vänster – när man väljer bana visas kortet istället i samma kolumn */}
        <div className={`hidden md:flex ${mapHeight}`}>
          <aside className="w-72 shrink-0 flex flex-col border-r border-retro-border bg-retro-surface overflow-hidden">
            {selectedCourse ? (
              <>
                <div className="p-2 border-b border-retro-border shrink-0 flex items-center justify-between gap-2">
                  <span className="text-xs text-stone-500 truncate">Banor i tävlingen</span>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="text-xs text-retro-accent hover:underline shrink-0"
                  >
                    Visa lista
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <CoursePreviewPanel
                    course={selectedCourse}
                    onClose={() => setSelectedId(null)}
                    embedded
                    compact
                    competitionId={competitionId}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="p-3 border-b border-retro-border shrink-0">
                  <h3 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-retro-accent shrink-0" aria-hidden />
                    Välj bana
                  </h3>
                  <p className="text-stone-500 text-xs mt-1">
                    Klicka på en bana – kortet visas här till vänster.
                  </p>
                </div>
                <nav className="flex-1 min-h-0 overflow-y-auto p-2" aria-label="Banor i tävlingen">
                  <ul className="space-y-0.5">
                    {validCourses.map((course) => (
                      <li key={course.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(course.id)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-stone-200 hover:bg-retro-card hover:text-retro-accent transition truncate block"
                        >
                          {course.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </>
            )}
          </aside>
          <div className="flex-1 min-w-0 relative">
            <LeafletMap
              courses={validCourses}
              selectedCourseId={selectedId}
              onSelectCourse={(c) => setSelectedId(c.id)}
              height="100%"
              fitToCourses
            />
          </div>
        </div>

        {/* Mobil: kompakt lista (mindre plats) + karta */}
        <div className="md:hidden">
          <div className="px-3 py-2 border-b border-retro-border bg-retro-card overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {validCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedId((prev) => (prev === course.id ? null : course.id))}
                  className={`shrink-0 text-sm font-medium px-2.5 py-1.5 rounded-md transition ${
                    selectedId === course.id
                      ? "bg-retro-accent/25 text-amber-400 ring-1 ring-retro-accent/50"
                      : "text-stone-300 hover:text-retro-accent hover:bg-retro-accent/10"
                  }`}
                >
                  {course.name}
                </button>
              ))}
            </div>
          </div>
          <div className={`relative ${mapHeightMobile}`}>
            {selectedCourse && (
              <div className="absolute inset-x-0 bottom-0 z-20 max-h-[55%] flex flex-col overflow-hidden rounded-t-xl border-t border-retro-border bg-retro-surface shadow-lg">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <CoursePreviewPanel
                    course={selectedCourse}
                    onClose={() => setSelectedId(null)}
                    embedded
                    compact
                    compactImageSmall
                    competitionId={competitionId}
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
              centerOffsetPxY={selectedId ? 60 : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
