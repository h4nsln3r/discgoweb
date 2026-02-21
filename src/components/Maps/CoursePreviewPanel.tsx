// src/components/Maps/CoursePreviewPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Course } from "../CourseList";
import { XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

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
  const [scoreError, setScoreError] = useState<string | null>(null);

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
      setScoreError(null);

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
            setScoreError("Kunde inte hämta banrekord.");
            setBestScore(null);
          } else {
            setBestScore((data && data[0]) ?? null);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[COURSE RECORD ERROR]", e);
          setScoreError("Kunde inte hämta banrekord.");
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

  // Early return placed AFTER all hooks are declared
  if (!course) return null;

  const recordValue =
    typeof bestScore?.throws === "number"
      ? bestScore?.throws
      : bestScore?.score ?? null;

  const panelContent = (
    <div
      className={`overflow-hidden bg-retro-surface ${embedded ? "rounded-xl border border-retro-border" : "rounded-t-3xl border-t border-retro-border"}`}
    >
          {/* Header image */}
          {course.main_image_url ? (
            <div className={`relative w-full overflow-hidden md:rounded-t-2xl ${compact ? (compactImageSmall ? "aspect-[3/2] max-h-14" : "aspect-[3/2] max-h-28") : "aspect-[16/9]"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.main_image_url}
                alt={course.name}
                className="h-full w-full object-cover"
              />
              {/* Close btn over image */}
              <button
                className="absolute top-3 right-3 p-2 rounded-full bg-retro-surface/90 hover:bg-retro-card border border-retro-border shadow"
                onClick={onClose}
                aria-label="Stäng"
              >
                <XMarkIcon className="h-5 w-5 text-stone-200" />
              </button>
            </div>
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
            {/* Title & location */}
            <div className="mb-2">
              <h3 className="text-xl font-semibold text-stone-100">
                {compact ? (
                  <Link href={courseHref} onClick={onClose} className="text-retro-accent hover:underline">
                    Gå till: {course.name}
                  </Link>
                ) : (
                  <Link href={courseHref} onClick={onClose} className="text-retro-accent hover:underline">
                    {course.name}
                  </Link>
                )}
              </h3>
              {course.location && (
                <p className="mt-1 text-sm text-stone-400 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{course.location}</span>
                </p>
              )}
              {!compact && course.latitude && course.longitude && (
                <p className="text-xs text-retro-muted mt-1">
                  📍 {course.latitude}, {course.longitude}
                </p>
              )}
            </div>

            {/* Course record – klickbar rad till resultatet – döljs i compact-läge */}
            {!compact && (
            <div className="mt-2">
              <h4 className="text-xs font-medium text-stone-400 mb-1">Banrekord</h4>
              <div className="rounded-lg border border-retro-border bg-retro-card">
                {loadingScore ? (
                  <div className="p-2 animate-pulse">
                    <div className="h-3 w-20 bg-retro-border rounded" />
                    <div className="mt-1.5 h-3 w-14 bg-retro-border rounded" />
                  </div>
                ) : scoreError ? (
                  <div className="p-2 text-xs text-amber-400">{scoreError}</div>
                ) : bestScore ? (
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
                      <div className="text-sm font-semibold text-stone-100">{recordValue ?? "—"}</div>
                      <div className="text-xs text-retro-muted">kast</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 text-xs text-stone-400">
                    Inga registrerade rundor ännu.
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Actions in one row – döljs i compact-läge */}
            {!compact && (
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={courseHref}
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-lg border border-retro-border bg-retro-card px-4 py-2 text-sm font-medium text-stone-200 hover:bg-retro-border/50 transition"
                >
                  Visa detaljer
                </Link>
                <Link
                  href={`/results/new?course_id=${course.id}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-lg border border-retro-accent bg-retro-accent/20 px-4 py-2 text-sm font-medium text-retro-accent hover:bg-retro-accent/30 transition"
                >
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
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <div
        className="fixed z-40 bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {panelContent}
      </div>
    </>
  );
}
