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

function isPast(comp: CompetitionItem): boolean {
  if (!comp.end_date) return false;
  return new Date(comp.end_date) < new Date();
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

  const { upcoming, past } = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case "date_desc":
        list.sort((a, b) => {
          const da = a.start_date ? new Date(a.start_date).getTime() : 0;
          const db = b.start_date ? new Date(b.start_date).getTime() : 0;
          return db - da;
        });
        break;
      case "date_asc":
        list.sort((a, b) => {
          const da = a.start_date ? new Date(a.start_date).getTime() : 0;
          const db = b.start_date ? new Date(b.start_date).getTime() : 0;
          return da - db;
        });
        break;
      case "name_asc":
        list.sort((a, b) =>
          (a.title ?? "").localeCompare(b.title ?? "", "sv")
        );
        break;
      case "name_desc":
        list.sort((a, b) =>
          (b.title ?? "").localeCompare(a.title ?? "", "sv")
        );
        break;
      default:
        break;
    }
    const upcoming = list.filter((c) => !isPast(c));
    const past = list.filter((c) => isPast(c));
    return { upcoming, past };
  }, [filtered, sort]);

  const sorted = useMemo(() => [...upcoming, ...past], [upcoming, past]);

  if (!competitions.length) {
    return (
      <div className="mx-4 sm:mx-6 rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
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
      <p className="text-stone-400 py-6 px-4 sm:px-6">
        Inga tävlingar matchar sökningen.
      </p>
    );
  }

  const gridCols =
    sorted.length === 1
      ? "grid-cols-1"
      : sorted.length === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  const isSingleCard = sorted.length === 1;
  const Card = ({ comp }: { comp: CompetitionItem }) => (
    <Link
      href={`/competitions/${comp.id}`}
      className={`group block w-full overflow-hidden border-0 sm:border border-retro-border shadow-sm aspect-[4/3] hover:border-retro-accent/50 transition relative ${isSingleCard ? "md:aspect-auto md:h-[60vh] md:max-h-[60vh]" : ""}`}
    >
      {comp.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- dynamisk tävlingsbild-URL */}
          <img
            src={comp.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-retro-card bg-gradient-to-t from-stone-900/95 to-stone-800/80"
          aria-hidden
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 pt-10 pb-3 px-3 sm:px-4">
        <h2 className="font-bebas text-2xl sm:text-3xl md:text-4xl tracking-wide uppercase text-white drop-shadow-lg leading-tight">
          {comp.title}
        </h2>
        <p className="text-white/90 text-xs sm:text-sm mt-1 drop-shadow-md">
          {formatDate(comp.start_date)} – {formatDate(comp.end_date)}
        </p>
      </div>
    </Link>
  );

  return (
    <div className={`grid ${gridCols} gap-0 w-full`}>
      {upcoming.map((comp) => (
        <Card key={comp.id} comp={comp} />
      ))}
      {past.length > 0 && (
        <div
          className="col-span-full border-t-2 border-stone-600"
          aria-hidden
        />
      )}
      {past.map((comp) => (
        <Card key={comp.id} comp={comp} />
      ))}
    </div>
  );
}
