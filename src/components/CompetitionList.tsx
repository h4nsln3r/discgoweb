"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type CompetitionItem = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Speldatum (senaste först)" },
  { value: "date_asc", label: "Speldatum (tidigaste först)" },
  { value: "name_asc", label: "Namn (A–Ö)" },
  { value: "name_desc", label: "Namn (Ö–A)" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function CompetitionList({
  competitions,
}: {
  competitions: CompetitionItem[];
}) {
  const [sort, setSort] = useState<SortValue>("date_asc");

  const sorted = useMemo(() => {
    const list = [...competitions];
    switch (sort) {
      case "date_desc":
        return list.sort((a, b) => {
          const da = a.start_date ? new Date(a.start_date).getTime() : 0;
          const db = b.start_date ? new Date(b.start_date).getTime() : 0;
          return db - da;
        });
      case "date_asc":
        return list.sort((a, b) => {
          const da = a.start_date ? new Date(a.start_date).getTime() : 0;
          const db = b.start_date ? new Date(b.start_date).getTime() : 0;
          return da - db;
        });
      case "name_asc":
        return list.sort((a, b) =>
          (a.title ?? "").localeCompare(b.title ?? "", "sv")
        );
      case "name_desc":
        return list.sort((a, b) =>
          (b.title ?? "").localeCompare(a.title ?? "", "sv")
        );
      default:
        return list;
    }
  }, [competitions, sort]);

  if (!competitions.length) {
    return (
      <p className="rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-500 shadow-sm">
        Inga tävlingar än.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <label className="text-sm font-medium text-gray-700">Sortering:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.id}`}
            className="block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition"
          >
            {comp.image_url ? (
              <img
                src={comp.image_url}
                alt={comp.title}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                Ingen bild
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {comp.title}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {formatDate(comp.start_date)} – {formatDate(comp.end_date)}
              </p>
              <span className="inline-block mt-2 text-sm text-emerald-600 font-medium hover:underline">
                Visa detaljer
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
