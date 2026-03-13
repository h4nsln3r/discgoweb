"use client";

import { useState, useCallback, Fragment, useRef } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon, HashtagIcon, TrophyIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
import HoleByHoleList from "@/components/HoleByHoleList";

export type ScoreRow = {
  id: string;
  score: number;
  throws: number | null;
  date_played: string | null;
  created_at: string;
  course_id: string;
  user_id?: string;
  profiles: { alias?: string } | null;
};

type CourseEntry = {
  course_id: string;
  courseName: string;
  main_image_url?: string | null;
};

type Props = {
  competitionId: string;
  entries: CourseEntry[];
  scoresByCourse: Record<string, ScoreRow[]>;
};

type HoleInfo = { hole_number: number; throws: number; par?: number };

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function CompetitionBanorResultatSection({
  competitionId,
  entries,
  scoresByCourse,
}: Props) {
  const [expandedHolesId, setExpandedHolesId] = useState<string | null>(null);
  const [holesByScoreId, setHolesByScoreId] = useState<
    Record<string, HoleInfo[] | null>
  >({});
  const requestedHolesRef = useRef<Set<string>>(new Set());

  const fetchHolesForScore = useCallback((scoreId: string, courseId: string) => {
    if (requestedHolesRef.current.has(scoreId)) return;
    requestedHolesRef.current.add(scoreId);
    setHolesByScoreId((prev) => ({ ...prev, [scoreId]: null }));
    const url = `/api/score-holes?score_id=${encodeURIComponent(scoreId)}&course_id=${encodeURIComponent(courseId)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        setHolesByScoreId((prev) => ({
          ...prev,
          [scoreId]: Array.isArray(data) ? data : [],
        }))
      )
      .catch(() =>
        setHolesByScoreId((prev) => ({ ...prev, [scoreId]: [] }))
      );
  }, []);

  const toggleHoles = (scoreId: string, courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedHolesId((prev) => (prev === scoreId ? null : scoreId));
    if (expandedHolesId !== scoreId) fetchHolesForScore(scoreId, courseId);
  };

  return (
    <div>
      <h2 className="font-bebas text-xl md:text-2xl tracking-wide uppercase text-stone-100 leading-none mb-0 pb-0 flex items-center gap-2">
        <TrophyIcon className="w-5 h-5 text-stone-500 shrink-0" aria-hidden />
        Banor och resultat
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 -mt-px">
        {entries.map((entry) => {
          const courseScores = scoresByCourse[entry.course_id] ?? [];
          const sorted = [...courseScores].sort(
            (a, b) => (a.score ?? 0) - (b.score ?? 0)
          );
          return (
            <article
              key={entry.course_id}
              className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden flex flex-col shadow-md hover:border-retro-muted/50 hover:shadow-lg transition-all"
            >
              {/* Banbild – samma design som på Alla banor */}
              <div className="relative w-full h-56 sm:h-72 bg-retro-card shrink-0 overflow-hidden group">
                {entry.main_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external image URL
                  <img
                    src={entry.main_image_url}
                    alt={entry.courseName}
                    className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-200"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-retro-muted text-sm">
                    Ingen bild
                  </div>
                )}
                <Link
                  href={`/courses/${entry.course_id}?from=competition&competitionId=${competitionId}`}
                  className="absolute inset-0 z-0"
                  aria-label={`Visa ${entry.courseName}`}
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <Link
                    href={`/courses/${entry.course_id}?from=competition&competitionId=${competitionId}`}
                    className="font-bebas text-2xl sm:text-3xl tracking-wide text-stone-100 text-retro-accent uppercase transition-colors hover:text-amber-400"
                  >
                    {entry.courseName}
                  </Link>
                  <Link
                    href={`/results/new?competition_id=${competitionId}&course_id=${entry.course_id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-retro-border text-stone-300 text-sm font-medium hover:bg-retro-card hover:text-stone-100 transition shrink-0"
                    aria-label={`Lägg till resultat för ${entry.courseName}`}
                  >
                    <PlusCircleIcon className="w-5 h-5 shrink-0" aria-hidden />
                    Lägg till resultat
                  </Link>
                </div>
              <div className="flex-1 min-w-0">
                {sorted.length === 0 ? (
                  <p className="text-stone-400 text-sm">Inga resultat än.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-stone-400 border-b border-retro-border">
                        <th className="pb-2 font-medium">#</th>
                        <th className="pb-2 font-medium">Spelare</th>
                        <th className="pb-2 font-medium">Kast</th>
                        <th className="pb-2 font-medium">Poäng</th>
                        <th className="pb-2 font-medium">Datum</th>
                        <th className="pb-2 font-medium w-10" aria-label="Visa hål" />
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((score, idx) => {
                        const isExpanded = expandedHolesId === score.id;
                        const rowHoles = holesByScoreId[score.id];
                        return (
                          <Fragment key={score.id}>
                            <tr
                              key={score.id}
                              className="border-b border-retro-border/50 last:border-0"
                            >
                              <td className="py-2 text-stone-500">{idx + 1}</td>
                              <td className="py-2 text-stone-100">
                                {score.user_id ? (
                                  <Link
                                    href={`/profile/${score.user_id}`}
                                    className="text-retro-accent hover:underline"
                                  >
                                    {score.profiles?.alias ?? "—"}
                                  </Link>
                                ) : (
                                  (score.profiles?.alias ?? "—")
                                )}
                              </td>
                              <td className="py-2 text-stone-200">
                                {score.throws ?? score.score ?? "—"}
                              </td>
                              <td className="py-2 font-semibold text-stone-100">
                                {score.score}
                              </td>
                              <td className="py-2 text-stone-400">
                                {score.date_played
                                  ? formatDate(score.date_played)
                                  : formatDate(score.created_at)}
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    toggleHoles(score.id, entry.course_id, e)
                                  }
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-retro-accent hover:bg-retro-border/30 transition"
                                  title={isExpanded ? "Dölj hål" : "Visa hål"}
                                  aria-expanded={isExpanded}
                                >
                                  {isExpanded ? (
                                    <ChevronUpIcon className="w-4 h-4" aria-hidden />
                                  ) : (
                                    <ChevronDownIcon className="w-4 h-4" aria-hidden />
                                  )}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr
                                key={`${score.id}-holes`}
                                className="bg-retro-card/50 border-b border-retro-border/50"
                              >
                                <td colSpan={6} className="px-4 py-3">
                                  <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
                                    <HashtagIcon className="w-4 h-4" aria-hidden />
                                    Hål per hål
                                  </div>
                                  {rowHoles === undefined ? (
                                    <p className="text-sm text-stone-400">
                                      Laddar hål…
                                    </p>
                                  ) : rowHoles === null ? (
                                    <p className="text-sm text-stone-400">
                                      Laddar hål…
                                    </p>
                                  ) : rowHoles.length === 0 ? (
                                    <p className="text-sm text-stone-400">
                                      Ingen hålfördelning sparad för detta resultat.
                                    </p>
                                  ) : (
                                    <HoleByHoleList holes={rowHoles} />
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
