"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import {
  holeVariation,
  parCount,
  longestParOrBetterStreak,
  type HoleDatum,
} from "@/lib/competition-stats";
import type {
  CompetitionScoreWithHoles,
  ScoreEntryForHoles,
} from "@/app/api/competitions/[id]/score-holes/route";

type Props = {
  competitionId: string;
  /** Resultat från sidan (samma som under Banor) – används för att hämta hål via /api/score-holes. */
  scoreEntries?: ScoreEntryForHoles[];
};

type RoundStat = {
  scoreId: string;
  userId: string;
  alias: string;
  courseName: string;
  variation: number;
  pars: number;
  streak: number;
};

function roundVariation(holes: HoleDatum[]): number {
  return Math.round(holeVariation(holes) * 100) / 100;
}

async function fetchHolesForEntries(
  entries: ScoreEntryForHoles[]
): Promise<CompetitionScoreWithHoles[]> {
  const results = await Promise.all(
    entries.map((e) =>
      fetch(
        `/api/score-holes?score_id=${encodeURIComponent(e.scoreId)}&course_id=${encodeURIComponent(e.courseId)}`
      )
        .then((r) => r.json())
        .then((holes: { hole_number: number; throws: number; par?: number }[]) =>
          Array.isArray(holes) ? holes : []
        )
    )
  );
  return entries.map((e, i) => ({
    score_id: e.scoreId,
    user_id: e.userId,
    alias: e.alias,
    course_id: e.courseId,
    course_name: e.courseName,
    holes: results[i] ?? [],
  }));
}

export default function CompetitionStabilitySection({
  competitionId,
  scoreEntries = [],
}: Props) {
  const [rounds, setRounds] = useState<CompetitionScoreWithHoles[]>([]);
  const [loading, setLoading] = useState(true);
  const scoreEntriesRef = useRef(scoreEntries);
  scoreEntriesRef.current = scoreEntries;
  const scoreEntriesKey =
    scoreEntries.length > 0
      ? scoreEntries
          .map((e) => e.scoreId)
          .sort()
          .join(",")
      : "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const entries = scoreEntriesRef.current;

    if (entries.length > 0) {
      fetchHolesForEntries(entries)
        .then((data) => {
          if (!cancelled) setRounds(data);
        })
        .catch(() => {
          if (!cancelled) setRounds([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    fetch(`/api/competitions/${competitionId}/score-holes`)
      .then((r) => r.json())
      .then((data: CompetitionScoreWithHoles[]) => {
        if (!cancelled) setRounds(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setRounds([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [competitionId, scoreEntriesKey]);

  const stats: RoundStat[] = rounds
    .filter((r) => r.holes.length >= 2)
    .map((r) => ({
      scoreId: r.score_id,
      userId: r.user_id,
      alias: (r.alias ?? "Okänd").trim() || "Okänd",
      courseName: r.course_name,
      variation: roundVariation(r.holes),
      pars: parCount(r.holes),
      streak: longestParOrBetterStreak(r.holes),
    }));

  const minVariation = stats.length
    ? stats.reduce((best, s) => (s.variation < best.variation ? s : best), stats[0])
    : null;
  const mostPars = stats.length
    ? stats.reduce((best, s) => (s.pars > best.pars ? s : best), stats[0])
    : null;
  const longestStreak = stats.length
    ? stats.reduce((best, s) => (s.streak > best.streak ? s : best), stats[0])
    : null;

  if (loading) {
    return (
      <section className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
          📈 Stabilitetsranking
        </h2>
        <div className="p-6 flex items-center justify-center text-stone-400 text-sm">
          Laddar statistik…
        </div>
      </section>
    );
  }

  if (stats.length === 0) {
    return (
      <section className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
          📈 Stabilitetsranking
        </h2>
        <div className="p-6 text-stone-400 text-sm">
          Ingen hål-för-hål-data tillgänglig än. Lägg till resultat med slag per hål för att se stabilitet.
        </div>
      </section>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.35 },
    }),
  };

  return (
    <section className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
      <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
        📈 Stabilitetsranking
      </h2>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {minVariation && (
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-xl border border-retro-border bg-retro-card p-4 flex flex-col shadow-md hover:border-amber-500/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <ChartBarIcon className="w-5 h-5 text-amber-500/80" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Minst variation</span>
            </div>
            <p className="text-2xl font-bebas text-stone-100 tracking-wide uppercase leading-tight">
              <Link href={`/profile/${minVariation.userId}`} className="text-retro-accent hover:text-amber-400 transition-colors">
                {minVariation.alias}
              </Link>
            </p>
            <p className="text-sm text-stone-400 mt-1">{minVariation.courseName}</p>
            <p className="mt-2 text-amber-400/90 font-semibold text-lg">
              σ = {minVariation.variation.toFixed(2)}
            </p>
          </motion.div>
        )}
        {mostPars && (
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-xl border border-retro-border bg-retro-card p-4 flex flex-col shadow-md hover:border-amber-500/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <TrophyIcon className="w-5 h-5 text-amber-500/80" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Flest par</span>
            </div>
            <p className="text-2xl font-bebas text-stone-100 tracking-wide uppercase leading-tight">
              <Link href={`/profile/${mostPars.userId}`} className="text-retro-accent hover:text-amber-400 transition-colors">
                {mostPars.alias}
              </Link>
            </p>
            <p className="text-sm text-stone-400 mt-1">{mostPars.courseName}</p>
            <p className="mt-2 text-amber-400/90 font-semibold text-lg">
              {mostPars.pars} par
            </p>
          </motion.div>
        )}
        {longestStreak && (
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-xl border border-retro-border bg-retro-card p-4 flex flex-col shadow-md hover:border-amber-500/40 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 text-stone-400 mb-2">
              <FireIcon className="w-5 h-5 text-amber-500/80" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Längsta par-streak</span>
            </div>
            <p className="text-2xl font-bebas text-stone-100 tracking-wide uppercase leading-tight">
              <Link href={`/profile/${longestStreak.userId}`} className="text-retro-accent hover:text-amber-400 transition-colors">
                {longestStreak.alias}
              </Link>
            </p>
            <p className="text-sm text-stone-400 mt-1">{longestStreak.courseName}</p>
            <p className="mt-2 text-amber-400/90 font-semibold text-lg">
              {longestStreak.streak} hål i rad
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
