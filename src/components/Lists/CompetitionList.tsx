"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { SortValue } from "@/components/Competitions/CompetitionSortDropdown";

export type CompetitionItem = {
  id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
};

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

const DEFAULT_SORT: SortValue = "date_asc";

export default function CompetitionList({
  competitions,
  sort: sortFromUrl,
  q: qFromUrl,
}: {
  competitions: CompetitionItem[];
  sort?: SortValue | null;
  q?: string;
}) {
  const sort = sortFromUrl ?? DEFAULT_SORT;
  const q = (qFromUrl ?? "").trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return competitions;
    return competitions.filter((c) => (c.title ?? "").toLowerCase().includes(q));
  }, [competitions, q]);

  const sorted = useMemo(() => {
    const list = [...filtered];
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
  }, [filtered, sort]);

  if (!competitions.length) {
    return (
      <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
        <p className="text-stone-300 text-lg">Inga tävlingar än.</p>
        <p className="text-stone-500 text-sm mt-2">
          Lägg till en tävling för att se den här.
        </p>
        <Link
          href="/competitions/new"
          className="inline-block mt-4 px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
        >
          Lägg till tävling
        </Link>
      </div>
    );
  }

  if (q && sorted.length === 0 && competitions.length > 0) {
    return (
      <p className="text-stone-400 py-6">
        Inga tävlingar matchar sökningen.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 w-full">
        {sorted.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.id}`}
            className="group block w-full rounded-xl border border-retro-border bg-retro-surface shadow-sm overflow-hidden hover:border-retro-muted/50 transition"
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
              <h2 className="inline-block text-2xl sm:text-3xl font-bebas tracking-wide text-stone-100 uppercase group-hover:scale-105 group-hover:text-amber-300 transition-all duration-200">
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
