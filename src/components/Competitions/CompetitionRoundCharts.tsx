"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import type {
  CompetitionScoreWithHoles,
  ScoreEntryForHoles,
} from "@/app/api/competitions/[id]/score-holes/route";
import { cumulativeScoreToParByHole } from "@/lib/competition-stats";

const CHART_COLORS = [
  "#d97706", // amber-600
  "#22c55e", // green-500
  "#3b82f6", // blue-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f59e0b", // amber-500
  "#6366f1", // indigo-500
];

type Props = {
  competitionId: string;
  /** Resultat från sidan (samma som under Banor) – används för att hämta hål via /api/score-holes. */
  scoreEntries?: ScoreEntryForHoles[];
};

type ChartPoint = { hole: number; [playerKey: string]: number };

function formatToPar(value: number): string {
  if (value === 0) return "Par";
  if (value > 0) return `+${value}`;
  return String(value);
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

export default function CompetitionRoundCharts({
  competitionId,
  scoreEntries = [],
}: Props) {
  const [rounds, setRounds] = useState<CompetitionScoreWithHoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
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
        .then((list) => {
          if (!cancelled) {
            setRounds(list);
            if (list.length > 0) {
              setSelectedCourseId((prev) => prev || list[0].course_id);
            }
          }
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
        if (!cancelled) {
          const list = Array.isArray(data) ? data : [];
          setRounds(list);
          if (list.length > 0) {
            setSelectedCourseId((prev) => prev || list[0].course_id);
          }
        }
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

  const courses = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rounds) {
      if (!seen.has(r.course_id)) seen.set(r.course_id, r.course_name);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [rounds]);

  // Synka vald bana när kurslistan ändras (t.ex. ny tävling)
  useEffect(() => {
    if (courses.length === 0) return;
    const ids = new Set(courses.map((c) => c.id));
    if (!selectedCourseId || !ids.has(selectedCourseId)) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const courseId = selectedCourseId ?? courses[0]?.id ?? null;

  const chartData = useMemo((): ChartPoint[] => {
    if (!courseId) return [];
    const byCourse = rounds.filter((r) => r.course_id === courseId && r.holes.length >= 2);
    if (byCourse.length === 0) return [];

    const holeSet = new Set<number>();
    for (const r of byCourse) {
      for (const h of r.holes) holeSet.add(h.hole_number);
    }
    const holes = [...holeSet].sort((a, b) => a - b);
    if (holes.length === 0) return [];

    const series = byCourse.map((r, idx) => {
      const cumulative = cumulativeScoreToParByHole(r.holes);
      const byHole = new Map(cumulative.map((c) => [c.hole, c.toPar]));
      return {
        key: `p${idx}`,
        alias: (r.alias ?? "Spelare").trim() || "Spelare",
        color: CHART_COLORS[idx % CHART_COLORS.length],
        byHole,
      };
    });

    const running: Record<number, number> = {};
    for (const h of holes) {
      running[h] = undefined as unknown as number;
    }
    for (const s of series) {
      for (const h of holes) {
        const v = s.byHole.get(h);
        if (v !== undefined) running[h] = v;
      }
    }

    return holes.map((hole) => {
      const point: ChartPoint = { hole };
      series.forEach((s, i) => {
        const v = s.byHole.get(hole);
        if (v !== undefined) point[`p${i}`] = v;
      });
      return point;
    });
  }, [rounds, courseId]);

  const seriesConfig = useMemo(() => {
    if (!courseId) return [];
    const byCourse = rounds.filter((r) => r.course_id === courseId && r.holes.length >= 2);
    return byCourse.map((r, idx) => ({
      key: `p${idx}`,
      name: (r.alias ?? "Spelare").trim() || "Spelare",
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [rounds, courseId]);

  if (loading) {
    return (
      <section className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
          📊 Rundans utveckling
        </h2>
        <div className="p-6 flex items-center justify-center text-stone-400 text-sm min-h-[280px]">
          Laddar grafer…
        </div>
      </section>
    );
  }

  if (rounds.filter((r) => r.holes.length >= 2).length === 0) {
    return (
      <section className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden">
        <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
          📊 Rundans utveckling
        </h2>
        <div className="p-6 text-stone-400 text-sm min-h-[200px]">
          Ingen hål-för-hål-data tillgänglig. Lägg till resultat med slag per hål för att se grafer.
        </div>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-retro-border bg-retro-surface overflow-hidden"
    >
      <h2 className="text-xl font-semibold px-4 py-3 border-b border-retro-border bg-retro-card text-stone-100 font-bebas tracking-wide uppercase">
        📊 Rundans utveckling
      </h2>
      <div className="p-4">
        {courses.length > 1 && (
          <div className="mb-4">
            <label htmlFor="chart-course" className="sr-only">
              Välj bana
            </label>
            <select
              id="chart-course"
              value={courseId ?? ""}
              onChange={(e) => setSelectedCourseId(e.target.value || null)}
              className="rounded-lg border border-retro-border bg-retro-card text-stone-100 px-3 py-2 text-sm focus:ring-2 focus:ring-retro-accent focus:border-transparent"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {chartData.length > 0 && seriesConfig.length > 0 ? (
          <div className="w-full h-[320px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#57534e" opacity={0.5} />
                <XAxis
                  dataKey="hole"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: "#a8a29e", fontSize: 12 }}
                  tickFormatter={(v) => `H${v}`}
                />
                <YAxis
                  tick={{ fill: "#a8a29e", fontSize: 12 }}
                  tickFormatter={formatToPar}
                />
                <ReferenceLine y={0} stroke="#78716c" strokeDasharray="2 2" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#44403c",
                    border: "1px solid #57534e",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#d6d3d1" }}
                  labelFormatter={(label) => `Hål ${label}`}
                  formatter={(value: number, name: string) => [
                    formatToPar(value),
                    seriesConfig.find((s) => s.key === name)?.name ?? name,
                  ]}
                  itemSorter={(a, b) => {
                    const va = a?.value as number | undefined;
                    const vb = b?.value as number | undefined;
                    if (va == null && vb == null) return 0;
                    if (va == null) return 1;
                    if (vb == null) return -1;
                    return va - vb;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value, entry) => (
                    <span style={{ color: (entry as { color?: string }).color ?? "#d6d3d1" }}>
                      {value}
                    </span>
                  )}
                />
                {seriesConfig.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.name}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: s.color }}
                    activeDot={{ r: 5 }}
                    isAnimationActive
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-stone-400 text-sm text-center">
            Inga rundor med tillräckligt med håldata för vald bana.
          </div>
        )}
        <p className="mt-2 text-xs text-stone-500">
          Kumulativt resultat till par (hål för hål). Par = 0.
        </p>
      </div>
    </motion.section>
  );
}
