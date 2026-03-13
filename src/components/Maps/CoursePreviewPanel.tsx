// src/components/Maps/CoursePreviewPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Course } from "../CourseList";
import { XMarkIcon, MapPinIcon, TrophyIcon, PlusCircleIcon, HomeIcon } from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import { formatScorePar } from "@/lib/scoreDisplay";

type Props = {
  course: Course | null;
  onClose: () => void;
  /** Inbäddad i fullsidsoverlay (ingen egen backdrop/fixed), bara innehåll. */
  embedded?: boolean;
  /** Om true, länk till banan inkluderar ?from=dashboard så tillbaka går till dashboard. */
  fromDashboard?: boolean;
  /** Om satt, länk till banan inkluderar ?from=competition&competitionId=... så tillbaka går till tävlingen. */
  competitionId?: string;
  /** Kompakt vy: mindre bild, utan koordinater och utan knapparna Visa detaljer/Lägg till resultat. */
  compact?: boolean;
  /** Extra kompakt bild (halv höjd) – för mobil-bottenpanel. */
  compactImageSmall?: boolean;
};

type BestScore = {
  id: string;
  throws: number | null; // primary metric (casts)
  score: number | null; // secondary metric (points)
  date_played: string | null;
  profiles: { alias: string | null } | null;
};

export default function CoursePreviewPanel({ course, onClose, embedded, fromDashboard, competitionId, compact, compactImageSmall }: Props) {
  const courseHref = course
    ? `/courses/${course.id}${fromDashboard ? "?from=dashboard" : competitionId ? `?from=competition&competitionId=${competitionId}` : ""}`
    : "#";
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const [bestScore, setBestScore] = useState<BestScore | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [homeCourseProfiles, setHomeCourseProfiles] = useState<{ id: string; alias: string }[]>([]);

  // Always declare hooks in the same order; guard *inside* the effect.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Guard inside the effect to keep hooks order stable
      if (!course?.id) {
        setBestScore(null);
        return;
      }

      setLoadingScore(true);

      try {
        const { data, error } = await supabase
          .from("scores")
          // Need throws + score + player alias
          .select("id, user_id, throws, score, date_played, profiles!scores_user_id_fkey(alias)")
          .eq("course_id", course.id)
          // Primary: lowest throws first (nulls last), then lowest score
          .order("throws", { ascending: true, nullsFirst: false })
          .order("score", { ascending: true, nullsFirst: false })
          .limit(1);

        if (!cancelled) {
          if (error) {
            console.error("[COURSE RECORD ERROR]", error);
            setBestScore(null);
          } else {
            setBestScore((data && data[0]) ?? null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[COURSE RECORD ERROR]", e);
          setBestScore(null);
        }
      } finally {
        if (!cancelled) setLoadingScore(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [course?.id, supabase]);

  // Hemmabana – vilka som har denna bana som hemmabana
  useEffect(() => {
    if (!course?.id) {
      setHomeCourseProfiles([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("id, alias")
      .eq("home_course", course.id)
      .then(({ data }) => {
        if (!cancelled && Array.isArray(data)) {
          const list = data
            .map((p) => {
              const alias = (p as { alias: string | null }).alias?.trim();
              return alias ? { id: (p as { id: string }).id, alias } : null;
            })
            .filter((x): x is { id: string; alias: string } => x != null);
          setHomeCourseProfiles(list);
        }
      })
      .catch(() => {
        if (!cancelled) setHomeCourseProfiles([]);
      });
    return () => { cancelled = true; };
  }, [course?.id, supabase]);

  // Early return placed AFTER all hooks are declared
  if (!course) return null;

  const panelContent = (
    <div
      className={`overflow-hidden bg-retro-surface ${embedded ? "rounded-xl border border-retro-border" : "rounded-t-3xl border-t border-retro-border"}`}
      style={{ height: "100%" }}
    >
          {/* Header image – klickbar, går till bansidan */}
          {course.main_image_url ? (
            <Link
              href={courseHref}
              onClick={onClose}
              className={`relative block w-full overflow-hidden md:rounded-t-2xl cursor-pointer ${compact ? (compactImageSmall ? "aspect-[3/2] max-h-14" : "aspect-[3/2] max-h-28") : "aspect-[16/9]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.main_image_url}
                alt={course.name}
                className="h-full w-full object-cover transition-opacity hover:opacity-95"
              />
              {/* Close btn over image – stoppar propagation så X bara stänger */}
              <button
                type="button"
                className="absolute top-3 right-3 p-2 rounded-full bg-retro-surface/90 hover:bg-retro-card border border-retro-border shadow"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                aria-label="Stäng"
              >
                <XMarkIcon className="h-5 w-5 text-stone-200" />
              </button>
              {/* Antal hål – samma badge som på alla-banor-sidan */}
              {course.hole_count != null && course.hole_count > 0 && (
                <div className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-stone-200">
                  {course.hole_count} hål
                </div>
              )}
            </Link>
          ) : (
            <div className="flex justify-end p-3 border-b border-retro-border">
              <button
                className="p-2 rounded-lg hover:bg-retro-card text-stone-300"
                onClick={onClose}
                aria-label="Stäng"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {/* Title & location – samma stil som lagnamn på lagsidan, mindre storlek + hover */}
            <div className="mb-2">
              <h3 className="text-xl font-bebas tracking-wide text-stone-100 uppercase">
                {compact ? (
                  <Link href={courseHref} onClick={onClose} className="inline-block text-retro-accent transition-all duration-200 hover:scale-105 hover:text-amber-300">
                    Gå till: {course.name}
                  </Link>
                ) : (
                  <Link href={courseHref} onClick={onClose} className="inline-block text-retro-accent transition-all duration-200 hover:scale-105 hover:text-amber-300">
                    {course.name}
                  </Link>
                )}
              </h3>
              {(course.location || course.city) && (
                <p className="mt-1 text-sm text-stone-400 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4 shrink-0" />
                  <span>
                    {[course.location, course.city].filter(Boolean).join(" · ")}
                  </span>
                </p>
              )}
            </div>

            {/* Banrekord + Hemmabana för – samma rad */}
            {!compact && ((!loadingScore && bestScore) || homeCourseProfiles.length > 0) && (
              <div className="mt-2 flex flex-row gap-2">
                {/* Banrekord */}
                {!loadingScore && bestScore && (
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-stone-400 mb-1 flex items-center gap-1.5">
                      <TrophyIcon className="h-4 w-4 text-retro-accent shrink-0" aria-hidden />
                      Banrekord
                    </h4>
                    <div className="rounded-lg border border-retro-border bg-retro-card">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          onClose();
                          router.push(`/results/${bestScore.id}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onClose();
                            router.push(`/results/${bestScore.id}`);
                          }
                        }}
                        className="block p-2 flex items-center justify-between gap-2 hover:bg-retro-border/30 rounded-lg transition cursor-pointer"
                      >
                        <div className="text-xs min-w-0">
                          <div className="font-medium text-stone-200 truncate">
                            {(bestScore as { user_id?: string }).user_id ? (
                              <Link
                                href={`/profile/${(bestScore as { user_id: string }).user_id}`}
                                className="text-retro-accent hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {bestScore.profiles?.alias ?? "Okänd spelare"}
                              </Link>
                            ) : (
                              (bestScore.profiles?.alias ?? "Okänd spelare")
                            )}
                          </div>
                          <div className="text-stone-400">
                            {bestScore.date_played
                              ? new Date(bestScore.date_played).toLocaleDateString("sv-SE")
                              : "Okänt datum"}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold text-stone-100">{formatScorePar(bestScore?.score ?? null)}</div>
                          <div className="text-xs text-retro-muted">mot par</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Hemmabana för */}
                {homeCourseProfiles.length > 0 && (
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-stone-400 mb-1 flex items-center gap-1.5">
                      <HomeIcon className="h-4 w-4 text-retro-accent shrink-0" aria-hidden />
                      Hemmabana för
                    </h4>
                    <ul className="list-disc list-inside text-sm text-stone-200 space-y-0.5">
                      {homeCourseProfiles.map((prof) => (
                        <li key={prof.id}>
                          <Link href={`/profile/${prof.id}`} className="text-retro-accent hover:underline" onClick={(e) => e.stopPropagation()}>
                            {prof.alias}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions – Lägg till resultat (visas alltid vid tävling, annars bara när inte compact) */}
            {(!compact || competitionId) && (
              <div className="mt-4">
                <Link
                  href={competitionId ? `/results/new?competition_id=${competitionId}&course_id=${course.id}` : `/results/new?course_id=${course.id}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-retro-accent bg-retro-accent/20 px-4 py-2 text-sm font-medium text-retro-accent hover:bg-retro-accent/30 transition"
                >
                  <PlusCircleIcon className="h-5 w-5 shrink-0" aria-hidden />
                  Lägg till resultat
                </Link>
              </div>
            )}
          </div>
    </div>
  );

  if (embedded) return panelContent;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 "
        onClick={onClose}
      />
      <div
        className="fixed z-40 bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto md:rounded"
        onClick={(e) => e.stopPropagation()}
      >
        {panelContent}
      </div>
    </>
  );
}
