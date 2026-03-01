"use client";

import dynamic from "next/dynamic";
import type { Course } from "../Lists/CourseList";
import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import CoursePreviewPanel from "./CoursePreviewPanel";
import Link from "next/link";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

type Props = {
  userName: string;
  /** Om satt används dessa istället för att hämta get-courses (t.ex. från dashboard-summary). */
  initialCourses?: Course[] | null;
  /** Anropas när användaren väljer eller avmarkerar en bana på kartan (för t.ex. att lyfta fram i Nya banor). */
  onSelectionChange?: (courseId: string | null) => void;
  /** Om true, länkar till bana får ?from=dashboard så tillbaka på bansidan går till dashboard. */
  fromDashboard?: boolean;
};

export default function Map({ userName, initialCourses, onSelectionChange, fromDashboard }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const setSelectedAndNotify = (id: string | null) => {
    setSelectedId(id);
    onSelectionChange?.(id);
  };

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q)
    );
  }, [courses, courseSearch]);

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

  const mapHeight = isMobile ? "320px" : "500px";

  return (
    <>
      {/* Kartan – full storlek. På desktop ligger banpanelen ovanpå till vänster (overlay). */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-retro-border bg-retro-card"
        style={{ height: mapHeight }}
      >
        {/* Desktop: overlay till vänster – antingen banlista (sök + lista) eller vald banpanel */}
        <div className="hidden md:flex absolute inset-y-0 left-0 z-20 w-96 shrink-0 flex-col overflow-hidden rounded-l-xl border-r border-retro-border bg-retro-surface shadow-lg">
          {selectedCourse ? (
            <div className="flex-1 overflow-y-auto">
              <CoursePreviewPanel
                course={selectedCourse}
                onClose={() => setSelectedAndNotify(null)}
                embedded
                fromDashboard={fromDashboard}
              />
            </div>
          ) : (
            <>
              {!welcomeDismissed && (
                <div className="shrink-0 p-3 border-b border-retro-border flex items-center justify-between gap-2 bg-retro-card/50">
                  <p className="text-sm text-stone-300">
                    Välkommen, <span className="font-medium text-stone-100">{userName}</span>!
                  </p>
                  <button
                    type="button"
                    onClick={() => setWelcomeDismissed(true)}
                    className="p-1 rounded-md text-stone-500 hover:text-stone-300 hover:bg-retro-border/50 transition"
                    aria-label="Stäng välkomstmeddelande"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="p-3 border-b border-retro-border shrink-0">
                <h3 className="text-lg font-semibold text-stone-100 mb-2 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5 text-retro-accent shrink-0" aria-hidden />
                  Välj bana
                </h3>
                <p className="text-stone-400 text-sm mb-3">
                  Sök eller klicka på en bana – den markeras på kartan.
                </p>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <input
                    type="search"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Sök bana eller plats..."
                    className="w-full rounded-lg border border-retro-border bg-retro-card pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent"
                    aria-label="Sök banor"
                  />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <ul className="p-2">
                  {filteredCourses.length === 0 ? (
                    <li className="px-3 py-4 text-sm text-stone-500 text-center">
                      {courseSearch.trim() ? "Ingen bana matchar sökningen." : "Inga banor att visa."}
                    </li>
                  ) : (
                    filteredCourses.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedAndNotify(c.id)}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-stone-200 hover:bg-retro-card transition"
                          >
                            <span className="block truncate font-medium">{c.name}</span>
                            {c.location && (
                              <span className="block truncate text-xs text-stone-500 mt-0.5">
                                {c.location}
                              </span>
                            )}
                          </button>
                        </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="p-2 border-t border-retro-border shrink-0">
                <Link
                  href="/courses"
                  className="block text-center py-2 text-sm text-retro-accent hover:underline"
                >
                  Visa alla banor på egen sida
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Kartan – på dashboard zoomas den så att alla banor syns */}
        <div className="relative z-0 h-full w-full">
          <LeafletMap
            courses={courses}
            onSelectCourse={(c) => setSelectedAndNotify(c.id)}
            selectedCourseId={selectedId}
            centerOffsetPx={isMobile ? undefined : 180}
            fitToCourses={fromDashboard === true}
          />
        </div>
      </div>

      {/* Mobil: vald bana → fullskärms-overlay med kort + inzoomed karta under */}
      {selectedCourse && (
        <div
          className="fixed inset-0 z-40 bg-retro-bg overflow-y-auto md:hidden"
          onClick={() => setSelectedAndNotify(null)}
          aria-label="Stäng bana"
        >
          <div
            className="min-h-full max-w-3xl mx-auto p-4 md:p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <CoursePreviewPanel
              course={selectedCourse}
              onClose={() => setSelectedAndNotify(null)}
              embedded
              fromDashboard={fromDashboard}
            />
            {isMobile &&
              selectedCourse.latitude != null &&
              selectedCourse.longitude != null && (
                <div className="mt-4 rounded-xl overflow-hidden border border-retro-border bg-retro-card">
                  <p className="sr-only">Karta – vald bana</p>
                  <LeafletMap
                    key="mobile-overlay-map"
                    courses={[selectedCourse]}
                    selectedCourseId={selectedCourse.id}
                    height="280px"
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </>
  );
}
