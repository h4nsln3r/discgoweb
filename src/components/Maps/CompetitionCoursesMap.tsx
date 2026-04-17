"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { MapIcon, MapPinIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import CoursePreviewPanel from "./CoursePreviewPanel";
import type { Course } from "../Lists/CourseList";

type CourseInput = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  main_image_url?: string | null;
  hole_count?: number;
};

const LeafletMap = dynamic(
  () => import("@/components/Maps/LeafletMap").then((m) => m.default),
  { ssr: false }
);

type Props = {
  courses: CourseInput[];
  competitionId?: string;
  /** Kompakt karta för heron (desktop), samma UX som mobil (flikar + karta) */
  variant?: "default" | "hero";
};

export default function CompetitionCoursesMap({ courses, competitionId, variant = "default" }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Spelordning (samma som `courses` från servern). */
  const orderedCourses = courses;

  const validCourses: Course[] = orderedCourses
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.id,
      name: c.name,
      latitude: c.latitude!,
      longitude: c.longitude!,
      location: c.location ?? "",
      main_image_url: c.main_image_url ?? undefined,
    }));

  const selectedCourse =
    orderedCourses.find((c) => c.id === selectedId) ??
    validCourses.find((c) => c.id === selectedId) ??
    null;

  if (validCourses.length === 0) return null;

  const isHero = variant === "hero";
  const mapHeight = "min-h-[320px] h-[28rem]";
  const mapHeightMobile = isHero ? "h-[min(32rem,52vh)] min-h-[28rem]" : "h-80";

  return (
    <div>
      {!isHero ? (
        <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 leading-none mb-0 pb-0 flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden />
          Banor i tävlingen
        </h2>
      ) : null}
      <div
        className={
          isHero
            ? "overflow-hidden"
            : "rounded-xl border border-retro-border overflow-hidden -mt-px"
        }
      >
        {/* Desktop: lista till vänster – när man väljer bana visas kortet istället i samma kolumn */}
        {!isHero ? (
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
                  <ul className="space-y-1">
                    {orderedCourses.map((course) => (
                      <li key={course.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(course.id)}
                          className={`group w-full text-left px-2.5 py-2 rounded-lg font-bebas text-base tracking-wide uppercase transition duration-200 border border-transparent truncate block
                            ${
                              selectedId === course.id
                                ? "bg-gradient-to-r from-amber-500/25 to-retro-accent/20 text-amber-200 ring-1 ring-amber-400/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                                : "text-stone-200/95 hover:text-amber-100 hover:border-amber-400/35 hover:bg-gradient-to-r hover:from-amber-500/12 hover:to-retro-accent/10 hover:shadow-[0_0_16px_rgba(251,191,36,0.12)] hover:-translate-y-px active:translate-y-0"
                            }`}
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
        ) : null}

        {/* Mobil: flikar ovanför kartan. Hero (desktop-instick): spelordning + accordion vänster, karta höger. */}
        <div className={isHero ? "block" : "md:hidden"}>
          {!isHero ? (
            <>
              <div className="px-2 py-2 border-b border-amber-500/15 bg-retro-card overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  {orderedCourses.map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setSelectedId((prev) => (prev === course.id ? null : course.id))}
                      className={`shrink-0 font-bebas text-sm tracking-wide uppercase px-3 py-2 rounded-lg border transition duration-200
                        ${
                          selectedId === course.id
                            ? "border-amber-400/50 bg-gradient-to-b from-amber-500/25 to-retro-accent/20 text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.2)]"
                            : "border-retro-border/60 text-stone-300 hover:border-amber-400/40 hover:text-amber-200 hover:bg-gradient-to-b hover:from-amber-500/15 hover:to-retro-accent/10 hover:shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 active:translate-y-0"
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
                        course={selectedCourse as Course}
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
            </>
          ) : (
            <div className="flex flex-row items-stretch min-h-[28rem]">
              <aside
                className="shrink-0 flex flex-col min-h-0 w-[min(56%,24rem)] min-w-[13rem] max-w-[26rem] border-r border-amber-500/20 bg-gradient-to-b from-retro-card to-retro-surface/90"
                aria-label="Spelordning och banor"
              >
                <div className="px-2 py-2 border-b border-amber-400/20 bg-retro-surface/50 shrink-0">
                  <span className="font-bebas text-sm tracking-wide uppercase text-amber-400/95 leading-none">
                    Spelordning
                  </span>
                </div>
                <ul className="flex-1 min-h-0 overflow-y-auto py-2 space-y-1 list-none m-0 px-0">
                  {orderedCourses.map((course, idx) => {
                    const onMap = course.latitude != null && course.longitude != null;
                    const open = selectedId === course.id;
                    return (
                      <li key={course.id} className="flex flex-col">
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setSelectedId((prev) => (prev === course.id ? null : course.id))}
                          className={`group flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition duration-200 border border-transparent
                            ${
                              open
                                ? "border-amber-400/50 bg-gradient-to-r from-amber-500/30 to-retro-accent/25 text-amber-50 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
                                : "border-transparent text-stone-200 hover:border-amber-400/30 hover:bg-gradient-to-r hover:from-amber-500/14 hover:to-retro-accent/8 hover:text-amber-100"
                            }
                            ${!onMap ? "opacity-75" : ""}`}
                          title={!onMap ? "Saknar position på kartan" : undefined}
                        >
                          <span className="flex min-w-0 items-baseline gap-1.5">
                            <span className="font-bebas tabular-nums text-amber-500/90 shrink-0 text-sm leading-none">
                              {idx + 1}
                            </span>
                            <span className="min-w-0 break-words font-bebas text-sm sm:text-base tracking-wide uppercase leading-snug">
                              {course.name}
                            </span>
                          </span>
                          <ChevronDownIcon
                            className={`h-4 w-4 shrink-0 text-amber-400/80 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        <AnimatePresence>
                          {open ? (
                            <motion.div
                              key={`accordion-${course.id}`}
                              initial={{ height: 0, opacity: 0.98 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0.98 }}
                              transition={{
                                height: { duration: 0.4, ease: [0.33, 1, 0.68, 1] },
                                opacity: { duration: 0.22, ease: "easeOut" },
                              }}
                              style={{ overflow: "hidden" }}
                              className="border-t border-amber-400/25 bg-retro-surface/95"
                            >
                              <div className="max-h-[min(55vh,28rem)] overflow-y-auto overscroll-contain">
                                <CoursePreviewPanel
                                  course={
                                    {
                                      id: course.id,
                                      name: course.name,
                                      location: course.location ?? "",
                                      main_image_url: course.main_image_url ?? undefined,
                                      latitude: course.latitude ?? undefined,
                                      longitude: course.longitude ?? undefined,
                                      hole_count: course.hole_count,
                                    } as Course
                                  }
                                  onClose={() => setSelectedId(null)}
                                  embedded
                                  compact
                                  hideAddResult
                                  hideImageCloseButton
                                  accordionFlush
                                  competitionId={competitionId}
                                />
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </aside>
              <div className={`relative min-w-0 flex-1 ${mapHeightMobile}`}>
                <LeafletMap
                  courses={validCourses}
                  selectedCourseId={validCourses.some((c) => c.id === selectedId) ? selectedId : null}
                  onSelectCourse={(c) => setSelectedId(c.id)}
                  height="100%"
                  fitToCourses
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
