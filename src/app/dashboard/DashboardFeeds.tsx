"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardDocumentListIcon, TrophyIcon } from "@heroicons/react/24/outline";

/* ---------- Shapes ---------- */
type LatestCourse = {
  id: string;
  name: string;
  location?: string | null;
  created_at?: string | null;
};

type LatestScoreRow = {
  courseId: string;
  courseName: string;
  latestScore: {
    id: string;
    user_id?: string;
    score: number;
    date_played: string | null;
    profiles?: { alias: string } | null;
  } | null;
};

type LatestCompetition = {
  id: string;
  title: string;
  start_date?: string | null;
  created_at?: string | null;
};

/* ---------- Type guards (no any) ---------- */
function isLatestScoreArray(val: unknown): val is LatestScoreRow[] {
  return (
    Array.isArray(val) &&
    val.every(
      (v) =>
        v !== null &&
        typeof v === "object" &&
        "courseId" in v &&
        "courseName" in v
    )
  );
}

function isLatestCompetitionArray(val: unknown): val is LatestCompetition[] {
  return (
    Array.isArray(val) &&
    val.every(
      (v) => v !== null && typeof v === "object" && "id" in v && "title" in v
    )
  );
}

type InitialData = {
  courses: LatestCourse[];
  latestScores: LatestScoreRow[];
  competitions: LatestCompetition[];
};

export default function DashboardFeeds({
  initialData,
}: {
  /** Om satt används denna data och ingen egen fetch görs. */
  initialData?: InitialData | null;
} = {}) {
  const [scores, setScores] = useState<LatestScoreRow[] | null>(
    initialData?.latestScores ?? null
  );
  const [scoresLoading, setScoresLoading] = useState(!initialData);
  const [scoresError, setScoresError] = useState<string | null>(null);

  const [comps, setComps] = useState<LatestCompetition[] | null>(
    initialData?.competitions ?? null
  );
  const [compsLoading, setCompsLoading] = useState(!initialData);
  const [compsError, setCompsError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setScores(initialData.latestScores);
      setComps(initialData.competitions);
      setScoresLoading(false);
      setCompsLoading(false);
      return;
    }
    (async () => {
      setScoresLoading(true);
      setCompsLoading(true);
      setScoresError(null);
      setCompsError(null);
      try {
        const res = await fetch("/api/dashboard-summary", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();

        if (
          data &&
          typeof data === "object" &&
          "latestScores" in data &&
          isLatestScoreArray((data as { latestScores: unknown }).latestScores)
        ) {
          setScores((data as { latestScores: LatestScoreRow[] }).latestScores);
        } else {
          setScores([]);
        }

        if (
          data &&
          typeof data === "object" &&
          "competitions" in data &&
          isLatestCompetitionArray(
            (data as { competitions: unknown }).competitions
          )
        ) {
          setComps(
            (data as { competitions: LatestCompetition[] }).competitions
          );
        } else {
          setComps([]);
        }
      } catch (err: unknown) {
        console.error("dashboard-summary fetch failed:", err);
        const msg = "Kunde inte hämta dashboard-data.";
        setScoresError(msg);
        setCompsError(msg);
      } finally {
        setScoresLoading(false);
        setCompsLoading(false);
      }
    })();
  }, [initialData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Senaste resultat */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-stone-100 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-retro-accent shrink-0" aria-hidden />
            Senaste resultat
          </h2>
          <Link href="/results" className="text-sm text-retro-accent hover:underline">
            Visa alla resultat
          </Link>
        </CardHeader>
        <CardBody>
          <MiniTable
            headers={["Spelare", "Bana", "Score", "Datum"]}
            rows={
              scores?.map((r) => {
                const alias = r.latestScore?.profiles?.alias ?? "—";
                const userId = r.latestScore?.user_id;
                const aliasCell = userId ? (
                  <Link
                    key={r.courseId + userId}
                    href={`/profile/${userId}`}
                    className="text-retro-accent hover:underline"
                  >
                    {alias}
                  </Link>
                ) : (
                  alias
                );
                const scoreVal =
                  typeof r.latestScore?.score === "number"
                    ? r.latestScore.score
                    : "—";
                const date = r.latestScore?.date_played
                  ? new Date(r.latestScore.date_played).toLocaleDateString(
                      "sv-SE"
                    )
                  : "—";
                return [
                  aliasCell,
                  <Link
                    key={r.courseId}
                    href={`/courses/${r.courseId}?from=dashboard`}
                    className="text-retro-accent hover:underline"
                  >
                    {r.courseName}
                  </Link>,
                  scoreVal,
                  date,
                ];
              }) ?? null
            }
            loading={scoresLoading}
            emptyText="Inga resultat ännu."
            error={scoresError}
          />
        </CardBody>
      </Card>

      {/* Senaste tävlingar (competitions) */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-stone-100 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-retro-accent shrink-0" aria-hidden />
          Senaste tävlingar
        </h2>
          <Link
            href="/competitions"
            className="text-sm text-retro-accent hover:underline"
          >
            Visa alla tävlingar
          </Link>
        </CardHeader>
        <CardBody>
          <MiniTable
            headers={["Titel", "Datum", "Skapad"]}
            rows={
              comps?.map((t) => [
                <Link
                  key={t.id}
                  href={`/competitions/${t.id}`}
                  className="text-retro-accent hover:underline"
                >
                  {t.title}
                </Link>,
                t.start_date
                  ? new Date(t.start_date).toLocaleDateString("sv-SE")
                  : "—",
                t.created_at
                  ? new Date(t.created_at).toLocaleDateString("sv-SE")
                  : "—",
              ]) ?? null
            }
            loading={compsLoading}
            emptyText="Inga tävlingar ännu."
            error={compsError}
          />
        </CardBody>
      </Card>
    </div>
  );
}

/* ------- UI helpers ------- */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-retro-surface border border-retro-border rounded-2xl shadow-sm">{children}</div>
  );
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-retro-border">
      {children}
    </div>
  );
}
function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-0">{children}</div>;
}
function MiniTable({
  headers,
  rows,
  loading,
  emptyText,
  error,
}: {
  headers: string[];
  rows: (React.ReactNode[] | (string | number | null)[])[] | null;
  loading: boolean;
  emptyText: string;
  error: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-retro-card">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left font-medium text-stone-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-t border-retro-border animate-pulse">
                {headers.map((h) => (
                  <td key={h} className="px-4 py-3">
                    <div className="h-3 bg-retro-border rounded w-24" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td className="px-4 py-3 text-amber-400" colSpan={headers.length}>
                {error}
              </td>
            </tr>
          ) : rows && rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-retro-border">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap text-stone-200">
                    {cell as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-3 text-retro-muted" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
