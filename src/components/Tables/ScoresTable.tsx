"use client";
import { useMemo, useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { TrophyIcon, ChevronDownIcon, ChevronUpIcon, UserIcon, CalendarDaysIcon, HashtagIcon } from "@heroicons/react/24/outline";
import { getHoleThrowBg, getHoleThrowStyle } from "@/lib/holeColors";
import { formatScorePar } from "@/lib/scoreDisplay";

type ScoreRow = {
  id?: string;
  user_id?: string;
  score: number;
  created_at: string;
  profiles: { alias: string | null } | null;
};

type HoleRow = { hole_number: number; throws: number; par?: number };

function ScoresTable({
  scores,
  parByHole,
}: {
  scores: ScoreRow[];
  /** hole_number -> par (för färg under/över par) */
  parByHole?: Record<number, number>;
}) {
  const [sortBy, setSortBy] = useState<"alias" | "score" | "created_at">("score");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [recordHolesOpen, setRecordHolesOpen] = useState(false);
  const [recordHoles, setRecordHoles] = useState<HoleRow[] | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [holesByScoreId, setHolesByScoreId] = useState<Record<string, HoleRow[] | null>>({});

  const uniqueAliases = Array.from(
    new Set(scores.map((s) => s.profiles?.alias ?? "Okänd"))
  );

  const sortedAndFiltered = useMemo(() => {
    let result = scores;
    if (filter) {
      result = result.filter((s) => (s.profiles?.alias ?? "Okänd") === filter);
    }
    result = [...result].sort((a, b) => {
      let valA, valB;
      if (sortBy === "alias") {
        valA = a.profiles?.alias ?? "";
        valB = b.profiles?.alias ?? "";
      } else if (sortBy === "score") {
        valA = a.score;
        valB = b.score;
      } else {
        valA = a.created_at;
        valB = b.created_at;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [scores, sortBy, sortAsc, filter]);

  const record =
    scores.length > 0
      ? scores.reduce((best, current) => (current.score < best.score ? current : best), scores[0])
      : null;

  useEffect(() => {
    if (!recordHolesOpen || !record?.id) return;
    let cancelled = false;
    fetch(`/api/score-holes?score_id=${encodeURIComponent(record.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setRecordHoles(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [recordHolesOpen, record?.id]);

  const fetchHolesForRow = (scoreId: string) => {
    if (holesByScoreId[scoreId] !== undefined) return;
    setHolesByScoreId((prev) => ({ ...prev, [scoreId]: null }));
    fetch(`/api/score-holes?score_id=${encodeURIComponent(scoreId)}`)
      .then((r) => r.json())
      .then((data) => {
        setHolesByScoreId((prev) => ({
          ...prev,
          [scoreId]: Array.isArray(data) ? data : [],
        }));
      })
      .catch(() => setHolesByScoreId((prev) => ({ ...prev, [scoreId]: [] })));
  };

  const toggleRowHoles = (scoreId: string) => {
    setExpandedRowId((prev) => (prev === scoreId ? null : scoreId));
    if (expandedRowId !== scoreId) fetchHolesForRow(scoreId);
  };

  return (
    <div className="space-y-4">
      {record && (
      <div className="rounded-xl border border-retro-border bg-retro-surface p-4">
        <div className="flex flex-wrap items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-amber-400 shrink-0" aria-hidden />
          <span className="text-stone-200 font-medium">
            Banrekord:{" "}
            {record.id ? (
              <Link href={`/results/${record.id}`} className="text-retro-accent font-semibold hover:underline">
                {formatScorePar(record.score)}
              </Link>
            ) : (
              <span className="text-retro-accent font-semibold">{formatScorePar(record.score)}</span>
            )}
            {" – "}
            {record.user_id ? (
              <Link href={`/profile/${record.user_id}`} className="text-stone-100 text-retro-accent hover:underline">
                {record.profiles?.alias ?? "Okänd"}
              </Link>
            ) : (
              <span className="text-stone-100">{record.profiles?.alias ?? "Okänd"}</span>
            )}
            <span className="text-stone-400 text-sm ml-1">({formatDate(record.created_at)})</span>
          </span>
          {record.id && (
            <button
              type="button"
              onClick={() => setRecordHolesOpen((o) => !o)}
              className="ml-auto p-1.5 rounded-lg text-retro-accent hover:bg-retro-card transition"
              title={recordHolesOpen ? "Dölj hål" : "Visa hål"}
              aria-label={recordHolesOpen ? "Dölj hål" : "Visa hål"}
            >
              {recordHolesOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
          )}
        </div>
        {recordHolesOpen && record?.id && (
          <div className="mt-3 pt-3 border-t border-retro-border">
            {recordHoles === null ? (
              <p className="text-sm text-stone-400">Laddar hål…</p>
            ) : recordHoles.length === 0 ? (
              <p className="text-sm text-stone-400">Ingen hålfördelning sparad.</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {recordHoles
                    .sort((a, b) => a.hole_number - b.hole_number)
                    .map((h) => {
                      const par = h.par ?? parByHole?.[h.hole_number];
                      const bg = getHoleThrowBg(h.throws, par);
                      const style = getHoleThrowStyle(h.throws, par);
                      return (
                        <span
                          key={h.hole_number}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm text-stone-200 ${bg || "bg-retro-card"}`}
                          style={Object.keys(style).length > 0 ? style : undefined}
                        >
                          <span className="text-retro-muted">H{h.hole_number}</span>
                          <span className="font-medium">{h.throws}</span>
                        </span>
                      );
                    })}
                </div>
                <Link
                  href={`/results/${record.id}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-retro-accent text-stone-100 hover:bg-retro-accent-hover transition"
                >
                  Gå till resultat
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <div className="flex items-center gap-2">
        <UserIcon className="w-4 h-4 text-stone-400 shrink-0" aria-hidden />
        <label htmlFor="filter" className="text-sm text-stone-300">
          Filtrera på spelare:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-retro-border bg-retro-surface text-stone-100 rounded-lg p-1 text-sm"
        >
          <option value="">Alla</option>
          {uniqueAliases.map((alias) => (
            <option key={alias} value={alias}>
              {alias}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border border-retro-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-retro-surface">
            <tr>
              <th
                className="px-4 py-2 border-b border-retro-border cursor-pointer text-stone-200"
                onClick={() => handleSort("alias")}
              >
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="w-4 h-4 shrink-0" /> Spelare {sortBy === "alias" ? (sortAsc ? "▲" : "▼") : ""}
                </span>
              </th>
              <th
                className="px-4 py-2 border-b border-retro-border cursor-pointer text-stone-200"
                onClick={() => handleSort("score")}
              >
                Poäng {sortBy === "score" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th
                className="px-4 py-2 border-b border-retro-border cursor-pointer text-stone-200"
                onClick={() => handleSort("created_at")}
              >
                <span className="inline-flex items-center gap-1">
                  <CalendarDaysIcon className="w-4 h-4 shrink-0" /> Datum {sortBy === "created_at" ? (sortAsc ? "▲" : "▼") : ""}
                </span>
              </th>
              <th className="px-4 py-2 border-b border-retro-border text-stone-400 text-left w-20">
                <span className="inline-flex items-center gap-1">
                  <HashtagIcon className="w-4 h-4 shrink-0" /> Hål
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((s, idx) => {
              const scoreId = s.id ?? `idx-${idx}`;
              const hasId = Boolean(s.id);
              const isExpanded = expandedRowId === scoreId;
              const rowHoles = hasId ? holesByScoreId[scoreId] : undefined;
              return (
                <Fragment key={scoreId}>
                  <tr className="hover:bg-retro-card border-b border-retro-border last:border-b-0">
                    <td className="px-4 py-2 text-stone-200">
                      {s.user_id ? (
                        <Link href={`/profile/${s.user_id}`} className="text-retro-accent hover:underline">
                          {s.profiles?.alias ?? "Okänd"}
                        </Link>
                      ) : (
                        (s.profiles?.alias ?? "Okänd")
                      )}
                    </td>
                    <td className="px-4 py-2 text-stone-200">
                      {s.id ? (
                        <Link href={`/results/${s.id}`} className="text-retro-accent hover:underline">
                          {formatScorePar(s.score)}
                        </Link>
                      ) : (
                        formatScorePar(s.score)
                      )}
                    </td>
                    <td className="px-4 py-2 text-stone-200">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="px-4 py-2 text-stone-400">
                      {hasId ? (
                        <button
                          type="button"
                          onClick={() => toggleRowHoles(scoreId)}
                          className="p-1.5 rounded-lg text-retro-accent hover:bg-retro-card transition"
                          title={isExpanded ? "Dölj hål" : "Visa hål"}
                          aria-label={isExpanded ? "Dölj hål" : "Visa hål"}
                        >
                          {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  {hasId && isExpanded && (
                    <tr key={`${scoreId}-holes`} className="bg-retro-card/50 border-b border-retro-border">
                      <td colSpan={4} className="px-4 py-3">
                        {rowHoles === undefined ? (
                          <p className="text-sm text-stone-400">Laddar hål…</p>
                        ) : rowHoles === null ? (
                          <p className="text-sm text-stone-400">Laddar hål…</p>
                        ) : rowHoles.length === 0 ? (
                          <p className="text-sm text-stone-400">Ingen hålfördelning sparad.</p>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap gap-2">
                              {[...rowHoles]
                                .sort((a, b) => a.hole_number - b.hole_number)
                                .map((h) => {
                                  const par = (h as HoleRow).par ?? parByHole?.[h.hole_number];
                                  const bg = getHoleThrowBg(h.throws, par);
                                  const style = getHoleThrowStyle(h.throws, par);
                                  return (
                                    <span
                                      key={h.hole_number}
                                      className={`inline-flex items-center gap-1 rounded-lg border border-retro-border px-2.5 py-1 text-sm text-stone-200 ${bg || "bg-retro-surface"}`}
                                      style={Object.keys(style).length > 0 ? style : undefined}
                                    >
                                      <span className="text-retro-muted">H{h.hole_number}</span>
                                      <span className="font-medium">{h.throws}</span>
                                    </span>
                                  );
                                })}
                            </div>
                            <Link
                              href={`/results/${scoreId}`}
                              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium bg-retro-accent text-stone-100 hover:bg-retro-accent-hover transition"
                            >
                              Gå till resultat
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  function handleSort(col: "alias" | "score" | "created_at") {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  }
}
function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default ScoresTable;
