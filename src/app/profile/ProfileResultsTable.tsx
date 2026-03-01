"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrophyIcon } from "@heroicons/react/24/outline";

export type ProfileScoreRow = {
  id: string;
  score: number;
  throws: number | null;
  date_played: string | null;
  created_at: string;
  course_id: string;
  courses: { id: string; name: string } | null;
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

export default function ProfileResultsTable({ scoreList }: { scoreList: ProfileScoreRow[] }) {
  const router = useRouter();

  if (scoreList.length === 0) return null;

  return (
    <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
        <TrophyIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
        Mina resultat
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-stone-400 border-b border-retro-border">
              <th className="pb-2 pr-3 font-medium">Bana</th>
              <th className="pb-2 pr-3 font-medium">Kast</th>
              <th className="pb-2 pr-3 font-medium">Poäng</th>
              <th className="pb-2 font-medium">Datum</th>
            </tr>
          </thead>
          <tbody>
            {scoreList.map((s) => (
              <tr
                key={s.id}
                className="border-b border-retro-border/50 last:border-0 cursor-pointer hover:bg-retro-card/50 transition-colors"
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/results/${s.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/results/${s.id}`);
                  }
                }}
              >
                <td className="py-2 pr-3">
                  <Link
                    href={`/courses/${s.courses?.id ?? s.course_id}`}
                    className="text-retro-accent hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.courses?.name ?? "—"}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-stone-200">{s.throws ?? s.score}</td>
                <td className="py-2 pr-3 font-medium text-stone-100">{s.score}</td>
                <td className="py-2 text-stone-400">
                  {formatDate(s.date_played ?? s.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
