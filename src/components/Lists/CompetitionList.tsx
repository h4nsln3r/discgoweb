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
      <p className="rounded-xl border border-retro-border bg-retro-surface p-6 text-center text-retro-muted shadow-sm">
        Inga tävlingar än.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <label className="text-sm font-medium text-stone-300">Sortering:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortValue)}
          className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {sorted.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.id}`}
            className="block w-full rounded-xl border border-retro-border bg-retro-surface shadow-sm overflow-hidden hover:border-retro-muted/50 transition"
          >
            {comp.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- external image URL
              <img
                src={comp.image_url}
                alt={comp.title}
                className="w-full h-48 sm:h-56 object-cover"
              />
            ) : (
              <div className="w-full h-48 sm:h-56 bg-retro-card flex items-center justify-center text-retro-muted text-sm">
                Ingen bild
              </div>
            )}
            <div className="p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-semibold text-stone-100">
                {comp.title}
              </h2>
              <p className="text-sm text-stone-400 mt-1">
                {formatDate(comp.start_date)} – {formatDate(comp.end_date)}
              </p>
              <span className="inline-block mt-2 text-sm text-retro-accent font-medium hover:underline">
                Visa detaljer
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
