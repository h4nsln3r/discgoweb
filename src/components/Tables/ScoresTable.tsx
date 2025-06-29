"use client";
import { useMemo, useState } from "react";

function ScoresTable({
  scores,
}: {
  scores: {
    score: number;
    created_at: string;
    profiles: { alias: string | null } | null;
  }[];
}) {
  const [sortBy, setSortBy] = useState<"alias" | "score" | "created_at">(
    "score"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState<string>("");

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

  const record = scores.reduce((best, current) => {
    return current.score < best.score ? current : best;
  }, scores[0]);

  return (
    <div className="space-y-4">
      <div className="text-green-700 font-medium">
        🥇 Banrekord: {record.score} kast – {record.profiles?.alias ?? "Okänd"}{" "}
        ({formatDate(record.created_at)})
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="filter" className="text-sm">
          Filtrera på spelare:
        </label>
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-1 text-sm"
        >
          <option value="">Alla</option>
          {uniqueAliases.map((alias) => (
            <option key={alias} value={alias}>
              {alias}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-4 py-2 border-b cursor-pointer"
                onClick={() => handleSort("alias")}
              >
                Spelare {sortBy === "alias" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer"
                onClick={() => handleSort("score")}
              >
                Score {sortBy === "score" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
              <th
                className="px-4 py-2 border-b cursor-pointer"
                onClick={() => handleSort("created_at")}
              >
                Datum {sortBy === "created_at" ? (sortAsc ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFiltered.map((s, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-2 border-b">
                  {s.profiles?.alias ?? "Okänd"}
                </td>
                <td className="px-4 py-2 border-b">{s.score}</td>
                <td className="px-4 py-2 border-b">
                  {formatDate(s.created_at)}
                </td>
              </tr>
            ))}
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
