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
      <h2 className="text-xl font-semibold mt-6 mb-2">
        🏆 Tävlingar på denna bana
      </h2>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border-b">Titel</th>
              <th className="px-4 py-2 border-b">Startdatum</th>
              <th className="px-4 py-2 border-b">Slutdatum</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((c, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() =>
                  c.competitions?.id &&
                  router.push(`/competitions/${c.competitions.id}`)
                }
              >
                <td className="px-4 py-2 border-b">{c.competitions?.title}</td>
                <td className="px-4 py-2 border-b">
                  {formatDate(c.competitions?.start_date)}
                </td>
                <td className="px-4 py-2 border-b">
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
