// src/components/Maps/CoursePreviewPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Course } from "../CourseList";
import Link from "next/link";
import { XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import AddScoreForm from "@/components/AddScoreForm";

type Props = {
  course: Course | null;
  onClose: () => void;
};

type BestScore = {
  id: string;
  throws: number | null; // primary metric (casts)
  score: number | null; // secondary metric (points)
  date_played: string | null;
  profiles: { alias: string | null } | null;
};

export default function CoursePreviewPanel({ course, onClose }: Props) {
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);

  const [openForm, setOpenForm] = useState(false);
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
          .select("id, throws, score, date_played, profiles(alias)")
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

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/40"
        onClick={() => {
          setOpenForm(false);
          onClose();
        }}
      />

      {/* Panel wrapper */}
      <div
        className="
          md:static md:z-auto md:w-auto
          fixed z-50 bottom-0 inset-x-0
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="
            bg-white rounded-t-3xl md:rounded-2xl shadow-2xl md:shadow-none
            p-0 md:p-0
            md:max-h-[500px] md:overflow-y-auto
          "
        >
          {/* Header image */}
          {course.main_image_url ? (
            <div className="relative w-full aspect-[16/9] md:rounded-t-2xl overflow-hidden">
              <img
                src={course.main_image_url}
                alt={course.name}
                className="h-full w-full object-cover"
              />
              {/* Close btn over image */}
              <button
                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white shadow"
                onClick={() => {
                  setOpenForm(false);
                  onClose();
                }}
                aria-label="Stäng"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="relative p-3">
              <div className="flex justify-end">
                <button
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => {
                    setOpenForm(false);
                    onClose();
                  }}
                  aria-label="Stäng"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4">
            {/* Title & location */}
            <div className="mb-2">
              <h3 className="text-lg font-semibold">{course.name}</h3>
              {course.location && (
                <p className="mt-1 text-sm text-gray-600 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{course.location}</span>
                </p>
              )}
              {course.latitude && course.longitude && (
                <p className="text-xs text-gray-500 mt-1">
                  📍 {course.latitude}, {course.longitude}
                </p>
              )}
            </div>

            {/* Course record (single row) */}
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700">Banrekord</h4>
              <div className="mt-2 rounded-xl border bg-white">
                {loadingScore ? (
                  <div className="p-3 animate-pulse">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="mt-2 h-3 w-16 bg-gray-200 rounded" />
                  </div>
                ) : scoreError ? (
                  <div className="p-3 text-sm text-red-600">{scoreError}</div>
                ) : bestScore ? (
                  <div className="p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">
                        {bestScore.profiles?.alias ?? "Okänd spelare"}
                      </div>
                      <div className="text-gray-600">
                        {bestScore.date_played
                          ? new Date(bestScore.date_played).toLocaleDateString(
                              "sv-SE"
                            )
                          : "Okänt datum"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {recordValue ?? "—"}
                      </div>
                      <div className="text-xs text-gray-500">kast</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-sm text-gray-600">
                    Inga registrerade rundor ännu.
                  </div>
                )}
              </div>
            </div>

            {/* Actions in one row */}
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/courses/${course.id}`}
                onClick={() => {
                  setOpenForm(false);
                  onClose();
                }}
                className="
                  inline-flex items-center justify-center
                  rounded-lg border border-emerald-200
                  px-3 py-1.5 text-sm font-medium
                  text-emerald-700 hover:bg-emerald-50
                "
              >
                Visa detaljer
              </Link>

              <button
                onClick={() => setOpenForm((v) => !v)}
                className="
                  inline-flex items-center justify-center
                  rounded-lg border border-emerald-200
                  px-3 py-1.5 text-sm font-medium
                  text-emerald-700 hover:bg-emerald-50
                "
              >
                {openForm ? "Stäng formulär" : "Lägg till resultat"}
              </button>
            </div>

            {/* Inline add score form (optional reveal) */}
            {openForm && (
              <div className="mt-3">
                {/* If you want to preselect the course, extend AddScoreForm with defaultCourseId={course.id} */}
                <AddScoreForm onClose={() => setOpenForm(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
