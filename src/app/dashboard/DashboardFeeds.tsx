"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
function isLatestCourseArray(val: unknown): val is LatestCourse[] {
  return (
    Array.isArray(val) &&
    val.every(
      (v) => v !== null && typeof v === "object" && "id" in v && "name" in v
    )
  );
}

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

export default function DashboardFeeds() {
  /* courses */
  const [courses, setCourses] = useState<LatestCourse[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  /* scores */
  const [scores, setScores] = useState<LatestScoreRow[] | null>(null);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState<string | null>(null);

  /* competitions */
  const [comps, setComps] = useState<LatestCompetition[] | null>(null);
  const [compsLoading, setCompsLoading] = useState(true);
  const [compsError, setCompsError] = useState<string | null>(null);

  /* --- Fetch latest courses (no any, verbose errors) --- */
  useEffect(() => {
    (async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const res = await fetch("/api/latest-courses", { cache: "no-store" });
        const bodyText = await res.text();

        if (!res.ok) {
          console.error("latest-courses response body:", bodyText);
          throw new Error(`HTTP ${res.status}`);
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          parsed = null;
        }

        const list =
          parsed && isLatestCourseArray(parsed)
            ? parsed
            : parsed &&
              typeof parsed === "object" &&
              "data" in parsed &&
              isLatestCourseArray((parsed as { data?: unknown }).data)
            ? (parsed as { data: LatestCourse[] }).data
            : [];

        setCourses(list);
      } catch (err: unknown) {
        console.error("latest-courses fetch failed:", err);
        setCoursesError("Kunde inte hämta senaste banor.");
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, []);

  /* --- Fetch latest scores (din befintliga route) --- */
  useEffect(() => {
    (async () => {
      setScoresLoading(true);
      setScoresError(null);
      try {
        const res = await fetch("/api/get-latest-scores", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();

        const list = isLatestScoreArray(data) ? data : [];

        setScores(list);
      } catch (err: unknown) {
        console.error("latest-scores fetch failed:", err);
        setScoresError("Kunde inte hämta senaste resultat.");
      } finally {
        setScoresLoading(false);
      }
    })();
  }, []);

  /* --- Fetch latest competitions --- */
  useEffect(() => {
    (async () => {
      setCompsLoading(true);
      setCompsError(null);
      try {
        const res = await fetch("/api/latest-competitions", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: unknown = await res.json();

        const list = isLatestCompetitionArray(data) ? data : [];

        setComps(list);
      } catch (err: unknown) {
        console.error("latest-competitions fetch failed:", err);
        setCompsError("Kunde inte hämta senaste tävlingar.");
      } finally {
        setCompsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Nya banor */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Nya banor</h2>
          <Link href="/courses" className="text-sm text-emerald-700 underline">
            Visa alla banor
          </Link>
        </CardHeader>
        <CardBody>
          <MiniTable
            headers={["Bana", "Plats", "Skapad"]}
            rows={
              courses?.map((c) => [
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="hover:underline"
                >
                  {c.name}
                </Link>,
                c.location ?? "—",
                c.created_at
                  ? new Date(c.created_at).toLocaleDateString("sv-SE")
                  : "—",
              ]) ?? null
            }
            loading={coursesLoading}
            emptyText="Inga banor ännu."
            error={coursesError}
          />
        </CardBody>
      </Card>

      {/* Senaste resultat */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Senaste resultat</h2>
          <Link href="/results" className="text-sm text-emerald-700 underline">
            Visa alla resultat
          </Link>
        </CardHeader>
        <CardBody>
          <MiniTable
            headers={["Spelare", "Bana", "Score", "Datum"]}
            rows={
              scores?.map((r) => {
                const alias = r.latestScore?.profiles?.alias ?? "—";
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
                  alias,
                  <Link
                    key={r.courseId}
                    href={`/courses/${r.courseId}`}
                    className="hover:underline"
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
          <h2 className="text-xl font-semibold">Senaste tävlingar</h2>
          <Link
            href="/competitions"
            className="text-sm text-emerald-700 underline"
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
                  className="hover:underline"
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
    <div className="bg-white border rounded-2xl shadow-sm">{children}</div>
  );
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
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
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left font-medium text-gray-600"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {headers.map((h) => (
                  <td key={h} className="px-4 py-3">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td className="px-4 py-3 text-red-600" colSpan={headers.length}>
                {error}
              </td>
            </tr>
          ) : rows && rows.length ? (
            rows.map((r, i) => (
              <tr key={i} className="border-t">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap">
                    {cell as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-3 text-gray-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
