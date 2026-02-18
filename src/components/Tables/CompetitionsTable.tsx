"use client";

import { useRouter } from "next/navigation";

function CompetitionsTable({
  competitions,
}: {
  competitions: {
    competition_id: string;
    competitions: {
      id: string;
      title: string;
      start_date: string | null;
      end_date: string | null;
    } | null;
  }[];
}) {
  const router = useRouter();

  return (
    <div>
      <h2 className="text-xl font-semibold mt-6 mb-2 text-stone-100">
        🏆 Tävlingar på denna bana
      </h2>
      <div className="overflow-x-auto border border-retro-border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-retro-surface">
            <tr>
              <th className="px-4 py-2 border-b border-retro-border text-stone-200">Titel</th>
              <th className="px-4 py-2 border-b border-retro-border text-stone-200">Startdatum</th>
              <th className="px-4 py-2 border-b border-retro-border text-stone-200">Slutdatum</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((c, idx) => (
              <tr
                key={idx}
                className="hover:bg-retro-card cursor-pointer border-b border-retro-border last:border-b-0"
                onClick={() =>
                  c.competitions?.id &&
                  router.push(`/competitions/${c.competitions.id}`)
                }
              >
                <td className="px-4 py-2 text-stone-200">{c.competitions?.title}</td>
                <td className="px-4 py-2 text-stone-200">
                  {formatDate(c.competitions?.start_date)}
                </td>
                <td className="px-4 py-2 text-stone-200">
                  {formatDate(c.competitions?.end_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function formatDate(date: string | null | undefined) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default CompetitionsTable;
