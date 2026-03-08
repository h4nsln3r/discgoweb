"use client";

import { useEffect, useMemo, useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import PageLoading from "@/components/PageLoading";
import { formatScorePar } from "@/lib/scoreDisplay";
import { MagnifyingGlassIcon, PlusCircleIcon, ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export type Top3Score = {
  id: string;
  user_id?: string;
  score: number;
  date_played: string | null;
  profiles: { alias: string | null } | null;
};

export type HoleInOne = {
  score_id: string;
  hole_number: number;
  alias: string;
  user_id: string | null;
};

export type Course = {
  id: string;
  name: string;
  location: string;
  city?: string | null;
  country?: string | null;
  landskap?: string | null;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  hole_count?: number;
  created_at?: string | null;
  top3?: Top3Score[];
  holeInOnes?: HoleInOne[];
  lastPlayed?: Top3Score[];
  scores?: { id: string; score: number; date_played: string | null; profiles: { alias: string | null } | null }[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
}

import type { SortValue } from "@/components/Courses/CourseSortDropdown";

const tableBase = "rounded-none bg-retro-card/60 border border-retro-border overflow-hidden";
const tableHeader = "text-xs font-semibold text-retro-muted uppercase tracking-wider px-3 pt-3 pb-2";

const playerNameClass = "font-bebas tracking-wide uppercase text-retro-accent hover:text-amber-300";

function CourseCard({ course }: { course: Course }) {
  const [tablesOpen, setTablesOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasTop3 = course.top3 && course.top3.length > 0;
  const hasHoleInOne = course.holeInOnes && course.holeInOnes.length > 0;
  const hasLastPlayed = course.lastPlayed && course.lastPlayed.length > 0;
  const hasAnyTables = hasTop3 || hasHoleInOne || hasLastPlayed;

  useLayoutEffect(() => {
    if (tablesOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [tablesOpen, hasTop3, hasHoleInOne, hasLastPlayed]);

  return (
    <article
      className="rounded-none border border-retro-border bg-retro-surface shadow-md overflow-hidden hover:border-retro-muted/50 hover:shadow-lg transition-all flex flex-col"
    >
      <div className="relative w-full h-56 sm:h-72 bg-retro-card shrink-0 overflow-hidden group">
        {course.main_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external image URL
          <img
            src={course.main_image_url}
            alt={course.name}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-200"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-retro-muted text-sm">
            Ingen bild
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-stone-200">
          {course.hole_count ? `${course.hole_count} hål` : "—"}
        </div>
        <Link
          href={`/courses/${course.id}`}
          className="absolute inset-0 z-0"
          aria-label={course.name ?? "Visa bana"}
        />
        <Link
          href={`/results/new?course_id=${course.id}`}
          className="absolute bottom-2 right-2 z-10 md:hidden inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-medium text-stone-200 hover:bg-black/80 hover:text-stone-100 transition"
          aria-label="Lägg till resultat"
        >
          <PlusCircleIcon className="w-4 h-4 shrink-0" aria-hidden />
          Lägg till resultat
        </Link>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Link
            href={`/courses/${course.id}`}
            className="min-w-0 group/title"
          >
            <h3 className="text-3xl sm:text-4xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase group-hover/title:text-amber-300 transition-colors">
              {course.name}
            </h3>
          </Link>
          <Link
            href={`/results/new?course_id=${course.id}`}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-retro-border text-stone-300 text-sm font-medium hover:bg-retro-card hover:text-stone-100 transition shrink-0"
            aria-label="Lägg till resultat"
          >
            <PlusCircleIcon className="w-5 h-5 shrink-0" aria-hidden />
            Lägg till resultat
          </Link>
        </div>
        <p className="text-sm text-stone-400 mt-0.5">{course.location || "—"}</p>
      </div>

      {hasAnyTables && (
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => setTablesOpen((v) => !v)}
            className="w-full flex items-center justify-between rounded-none border border-retro-border bg-retro-card/60 px-3 py-2.5 text-sm font-medium text-stone-200 hover:bg-retro-border/30 transition-colors"
            aria-expanded={tablesOpen}
          >
            <span>Senast</span>
            {tablesOpen ? (
              <ChevronUpIcon className="w-4 h-4 shrink-0" aria-hidden />
            ) : (
              <ChevronDownIcon className="w-4 h-4 shrink-0" aria-hidden />
            )}
          </button>
          <motion.div
            initial={false}
            animate={{ height: tablesOpen ? contentHeight : 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div ref={contentRef} className="flex flex-col md:flex-row gap-3 md:gap-2 pt-3">
              {hasTop3 && (
                <div className={`flex-1 min-w-0 ${tableBase}`}>
                  <h4 className={tableHeader}>🏆 Topp 3</h4>
                  <table className="w-full text-sm text-stone-200">
                    <thead>
                      <tr className="border-t border-retro-border text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        <th className="px-3 py-1.5 w-8">#</th>
                        <th className="px-3 py-1.5">Spelare</th>
                        <th className="px-3 py-1.5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.top3!.map((s, idx) => (
                        <tr
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/results/${s.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/results/${s.id}`)}
                          className="border-t border-retro-border/70 cursor-pointer hover:bg-retro-border/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-retro-muted">{idx + 1}</td>
                          <td className="px-3 py-2">
                            {s.user_id ? (
                              <Link href={`/profile/${s.user_id}`} className={playerNameClass} onClick={(e) => e.stopPropagation()}>
                                {s.profiles?.alias ?? "Okänd"}
                              </Link>
                            ) : (
                              <span className={playerNameClass}>{(s.profiles?.alias ?? "Okänd")}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-stone-100">{formatScorePar(s.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {hasHoleInOne && (
                <div className={`flex-1 min-w-0 ${tableBase}`}>
                  <h4 className={tableHeader}>⛳ Hole in one</h4>
                  <table className="w-full text-sm text-stone-200">
                    <thead>
                      <tr className="border-t border-retro-border text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        <th className="px-3 py-1.5">Hål</th>
                        <th className="px-3 py-1.5">Spelare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.holeInOnes!.map((ace, idx) => (
                        <tr
                          key={`${ace.score_id}-${ace.hole_number}-${idx}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/results/${ace.score_id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/results/${ace.score_id}`)}
                          className="border-t border-retro-border/70 cursor-pointer hover:bg-retro-border/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-retro-muted">{ace.hole_number}</td>
                          <td className="px-3 py-2">
                            {ace.user_id ? (
                              <Link href={`/profile/${ace.user_id}`} className={playerNameClass} onClick={(e) => e.stopPropagation()}>
                                {ace.alias}
                              </Link>
                            ) : (
                              <span className={playerNameClass}>{ace.alias}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {hasLastPlayed && (
                <div className={`flex-1 min-w-0 ${tableBase}`}>
                  <h4 className={tableHeader}>Senast spelad</h4>
                  <table className="w-full text-sm text-stone-200">
                    <thead>
                      <tr className="border-t border-retro-border text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                        <th className="px-3 py-1.5 w-8">#</th>
                        <th className="px-3 py-1.5">Spelare</th>
                        <th className="px-3 py-1.5 text-right">Datum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.lastPlayed!.map((s, idx) => (
                        <tr
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/results/${s.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/results/${s.id}`)}
                          className="border-t border-retro-border/70 cursor-pointer hover:bg-retro-border/20 transition-colors"
                        >
                          <td className="px-3 py-2 text-retro-muted">{idx + 1}</td>
                          <td className="px-3 py-2">
                            {s.user_id ? (
                              <Link href={`/profile/${s.user_id}`} className={playerNameClass} onClick={(e) => e.stopPropagation()}>
                                {s.profiles?.alias ?? "Okänd"}
                              </Link>
                            ) : (
                              <span className={playerNameClass}>{(s.profiles?.alias ?? "Okänd")}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-stone-300">{formatDate(s.date_played)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </article>
  );
}

const DEFAULT_SORT: SortValue = "name_asc";

export default function CourseList({
  refresh,
  sortFromUrl,
  searchFromUrl,
}: {
  refresh?: boolean;
  sortFromUrl?: SortValue | null;
  searchFromUrl?: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [landskapFilter, setLandskapFilter] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const effectiveSort = sortFromUrl ?? DEFAULT_SORT;
  const effectiveSearch = (searchFromUrl ?? search).trim();

  const updateSearchUrl = (newSearch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch.trim()) params.set("q", newSearch.trim());
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  };

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

  useEffect(() => {
    if (searchFromUrl !== undefined) setSearch(searchFromUrl);
  }, [searchFromUrl]);

  const availableLandskaps = useMemo(() => {
    const set = new Set<string>();
    for (const c of courses) {
      const L = (c.landskap ?? "").trim();
      if (L) set.add(L);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "sv"));
  }, [courses]);

  const filteredByLandskap = useMemo(() => {
    if (!landskapFilter) return courses;
    return courses.filter((c) => (c.landskap ?? "").trim() === landskapFilter);
  }, [courses, landskapFilter]);

  const filteredBySearch = useMemo(() => {
    const q = effectiveSearch.toLowerCase();
    if (!q) return filteredByLandskap;
    return filteredByLandskap.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [filteredByLandskap, effectiveSearch]);

  const sortedCourses = useMemo(() => {
    const list = [...filteredBySearch];
    const date = (c: Course) => (c.created_at ? new Date(c.created_at).getTime() : 0);
    if (effectiveSort === "date_added_desc") {
      list.sort((a, b) => date(b) - date(a));
    } else if (effectiveSort === "date_added_asc") {
      list.sort((a, b) => date(a) - date(b));
    } else if (effectiveSort === "name_asc") {
      list.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "sv")
      );
    } else if (effectiveSort === "name_desc") {
      list.sort((a, b) =>
        (b.name ?? "").localeCompare(a.name ?? "", "sv")
      );
    }
    return list;
  }, [filteredBySearch, effectiveSort]);

  /** Sidolista för desktop-sidebar (samma ordning som huvudlistan) */
  const sidebarCourseList = useMemo(() => {
    if (effectiveSort === "land_landskap") {
      return [...filteredBySearch].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "sv"));
    }
    return sortedCourses;
  }, [effectiveSort, filteredBySearch, sortedCourses]);

  type GroupKey = { country: string; landskap: string };
  const coursesByLandLandskap = useMemo(() => {
    if (effectiveSort !== "land_landskap") return null;
    const groups = new Map<string, Course[]>();
    const keyOrder: GroupKey[] = [];
    for (const c of filteredBySearch) {
      const country = (c.country ?? "").trim() || "—";
      const landskap = (c.landskap ?? "").trim() || "—";
      const key = `${country}\n${landskap}`;
      if (!groups.has(key)) {
        groups.set(key, []);
        keyOrder.push({ country, landskap });
      }
      groups.get(key)!.push(c);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "sv"));
    }
    const countries = [...new Set(keyOrder.map((k) => k.country))].sort((a, b) => {
      if (a === "—") return 1;
      if (b === "—") return -1;
      return a.localeCompare(b, "sv");
    });
    const result: { country: string; landskap: string; courses: Course[] }[] = [];
    for (const country of countries) {
      const landskaps = [...new Set(keyOrder.filter((k) => k.country === country).map((k) => k.landskap))].sort((a, b) => {
        if (a === "—") return 1;
        if (b === "—") return -1;
        return a.localeCompare(b, "sv");
      });
      for (const landskap of landskaps) {
        const key = `${country}\n${landskap}`;
        const coursesInGroup = groups.get(key)!;
        result.push({ country, landskap, courses: coursesInGroup });
      }
    }
    return result;
  }, [filteredBySearch, effectiveSort]);

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
    <div className="w-full md:grid md:grid-cols-[15vw_1fr] md:min-h-[60vh]">
      {/* Desktop: vänsterkolumn 15% – sök (endast desktop) + lista på alla banor (namn) */}
      <aside className="hidden md:flex md:flex-col md:w-[15vw] md:min-w-0 md:border-r md:border-retro-border md:bg-retro-card/30">
        <div className="md:sticky md:top-24 md:flex md:flex-col md:max-h-[calc(100vh-6rem)] md:overflow-hidden md:p-3">
          <div className="flex items-center gap-2 rounded-lg border border-retro-border bg-retro-surface text-stone-300 focus-within:ring-2 focus-within:ring-retro-accent focus-within:border-transparent mb-3 shrink-0">
            <MagnifyingGlassIcon className="w-4 h-4 shrink-0 ml-2.5 text-retro-muted" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateSearchUrl(e.target.value);
              }}
              placeholder="Sök banor…"
              className="flex-1 min-w-0 py-2 pr-3 bg-transparent text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none"
              aria-label="Sök banor"
            />
          </div>
          <div className="mb-3 shrink-0">
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1">Landskap</label>
            <select
              value={landskapFilter}
              onChange={(e) => setLandskapFilter(e.target.value)}
              className="w-full rounded-lg border border-retro-border bg-retro-surface text-stone-100 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
              aria-label="Filtrera på landskap"
            >
              <option value="">Alla landskap</option>
              {availableLandskaps.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto space-y-0.5" aria-label="Lista banor">
            {sidebarCourseList.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="block py-1.5 px-2 rounded-lg text-sm text-stone-200 hover:bg-retro-surface hover:text-retro-accent truncate"
              >
                {course.name ?? "Okänd bana"}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Huvudinnehåll: landskap endast på mobil + kort */}
      <div className="min-w-0 px-1 pt-0 pb-4 space-y-4 md:px-0 md:pt-0 md:pb-6">
      <div className="w-full md:hidden">
        <select
          value={landskapFilter}
          onChange={(e) => setLandskapFilter(e.target.value)}
          className="w-full rounded-lg border border-retro-border bg-retro-surface text-stone-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
          aria-label="Filtrera på landskap"
        >
          <option value="">Alla landskap</option>
          {availableLandskaps.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {filteredBySearch.length === 0 ? (
        <p className="text-stone-400 py-6">
          {landskapFilter
            ? `Inga banor i ${landskapFilter}.`
            : search.trim()
              ? "Inga banor matchar sökningen."
              : "Inga banor."}
        </p>
      ) : effectiveSort === "land_landskap" && coursesByLandLandskap ? (
        <div className="space-y-8">
          {coursesByLandLandskap.map(({ country, landskap, courses: groupCourses }) => (
            <section key={`${country}-${landskap}`}>
              <h2 className="text-lg font-semibold text-amber-500 mb-3 flex items-center gap-2">
                {country !== "—" && <span>{country}</span>}
                {country !== "—" && landskap !== "—" && <span className="text-stone-500">·</span>}
                {landskap !== "—" && <span>{landskap}</span>}
                {country === "—" && landskap === "—" && <span>Övrigt</span>}
              </h2>
              <div className="grid gap-3 md:gap-0 md:grid-cols-2">
                {groupCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
      <div className="grid gap-3 md:gap-0 md:grid-cols-2">
        {sortedCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      )}
      </div>
    </div>
  );
}
