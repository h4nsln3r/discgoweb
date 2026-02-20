// src/components/Maps/CoursePreviewPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Course } from "../CourseList";
import Link from "next/link";
import { XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

type Props = {
  course: Course | null;
  onClose: () => void;
  /** Inbäddad i fullsidsoverlay (ingen egen backdrop/fixed), bara innehåll. */
  embedded?: boolean;
};

type BestScore = {
  id: string;
  throws: number | null; // primary metric (casts)
  score: number | null; // secondary metric (points)
  date_played: string | null;
  profiles: { alias: string | null } | null;
};

export default function CoursePreviewPanel({ course, onClose, embedded }: Props) {
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
            <div className="relative w-full aspect-[16/9] md:rounded-t-2xl overflow-hidden">
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
              <h3 className="text-xl font-semibold text-stone-100">{course.name}</h3>
              {course.location && (
                <p className="mt-1 text-sm text-stone-400 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{course.location}</span>
                </p>
              )}
              {course.latitude && course.longitude && (
                <p className="text-xs text-retro-muted mt-1">
                  📍 {course.latitude}, {course.longitude}
                </p>
              )}
            </div>

            {/* Course record (single row) */}
            <div className="mt-3">
              <h4 className="text-sm font-medium text-stone-300">Banrekord</h4>
              <div className="mt-2 rounded-xl border border-retro-border bg-retro-card">
                {loadingScore ? (
                  <div className="p-3 animate-pulse">
                    <div className="h-3 w-24 bg-retro-border rounded" />
                    <div className="mt-2 h-3 w-16 bg-retro-border rounded" />
                  </div>
                ) : scoreError ? (
                  <div className="p-3 text-sm text-amber-400">{scoreError}</div>
                ) : bestScore ? (
                  <div className="p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium text-stone-200">
                        {(bestScore as { user_id?: string }).user_id ? (
                          <Link
                            href={`/profile/${(bestScore as { user_id: string }).user_id}`}
                            className="text-retro-accent hover:underline"
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
                    <div className="text-right">
                      <div className="text-lg font-semibold text-stone-100">
                        {recordValue ?? "—"}
                      </div>
                      <div className="text-xs text-retro-muted">kast</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-stone-400">
                    Inga registrerade rundor ännu.
                  </div>
                )}
              </div>
            </div>

            {/* Actions in one row */}
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/courses/${course.id}`}
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
