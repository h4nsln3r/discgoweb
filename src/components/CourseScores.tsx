"use client";

import { useEffect, useState } from "react";

type Score = {
  id: string;
  score: number;
  date_played: string;
  with_friends?: string[];
  profiles?: {
    alias: string | null;
  };
};

type Props = {
  courseId: string;
};

export default function CourseScores({ courseId }: Props) {
  const [scores, setScores] = useState<Score[]>([]);
  const [filtered, setFiltered] = useState<Score[]>([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");

  useEffect(() => {
    const fetchScores = async () => {
      const res = await fetch(`/api/get-scores?courseId=${courseId}`);
      const data = await res.json();
      setScores(data);
    };

    fetchScores();
  }, [courseId]);

  useEffect(() => {
    const filtered = scores.filter((s) => {
      const date = new Date(s.date_played);
      const matchesYear = year ? date.getFullYear().toString() === year : true;
      const matchesMonth = month
        ? (date.getMonth() + 1).toString().padStart(2, "0") === month
        : true;
      return matchesYear && matchesMonth;
    });

    setFiltered(filtered);
  }, [scores, year, month]);

  if (!scores.length)
    return <p className="text-sm text-gray-500 mt-2">Inga resultat ännu.</p>;

  const best = filtered.reduce(
    (acc, curr) => (curr.score < acc.score ? curr : acc),
    filtered[0]
  );

  return (
    <div className="mt-4">
      <div className="flex gap-4 mb-2">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Alla år</option>
          {[
            ...new Set(
              scores.map((s) => new Date(s.date_played).getFullYear())
            ),
          ].map((y) => (
            <option key={y} value={y.toString()}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Alla månader</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
              {new Date(0, i).toLocaleString("sv-SE", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-1 text-sm">
        {filtered
          .sort((a, b) => a.score - b.score)
          .map((s) => (
            <li
              key={s.id}
              className={s.id === best.id ? "font-bold text-green-700" : ""}
            >
              🥏 {s.score} kast —{" "}
              {new Date(s.date_played).toLocaleDateString("sv-SE")} — av:{" "}
              <strong>{s.profiles?.alias || "okänd spelare"}</strong>
              🥏 {s.score} kast —{" "}
              {new Date(s.date_played).toLocaleDateString("sv-SE")} — med:{" "}
              {/* — med: {s.with_friends?.join(', ') || 'ingen'}  */}
              {s.id === best.id && "👑"}
            </li>
          ))}
      </ul>
    </div>
  );
}
