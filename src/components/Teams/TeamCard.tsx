"use client";

import Link from "next/link";
import { MapPinIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export type TeamCardData = {
  id: string;
  name: string;
  ort: string | null;
  logga: string | null;
  bild: string | null;
  about: string | null;
};

type Props = {
  team: TeamCardData;
  /** Om true, hela kortet är en länk till laget. Annars är endast namnet klickbart. */
  asLink?: boolean;
};

export default function TeamCard({ team, asLink = false }: Props) {
  const content = (
    <>
      <div className="aspect-video md:aspect-[3/1] max-h-48 md:max-h-52 bg-retro-card relative w-full z-10">
        {/* Bild i egen behållare med overflow-hidden så zoom inte spill ut */}
        <div className="absolute inset-0 overflow-hidden">
          {(team.bild || team.logga) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.bild || team.logga || ""}
              alt={team.name}
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-105"
              style={{ width: "100%", minWidth: "100%" }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-retro-muted">
              <UserGroupIcon className="w-16 h-16" />
            </div>
          )}
        </div>
        {/* Laglogga utanför overflow så den inte klipps; högt z-index ovanpå texten */}
        {team.logga && (
          <div className="absolute bottom-0 left-3 z-20 h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center translate-y-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={team.logga}
              alt=""
              className="h-full w-full object-contain drop-shadow-lg"
            />
          </div>
        )}
      </div>
      <div className="p-4 pt-10 relative z-0">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          {asLink ? (
            <span className="inline-block text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase transition-all duration-200 group-hover:scale-105 group-hover:text-amber-300">
              {team.name}
            </span>
          ) : (
            <Link
              href={`/teams/${team.id}`}
              className="inline-block text-4xl sm:text-5xl font-bebas tracking-wide text-stone-100 text-retro-accent uppercase transition-all duration-200 hover:scale-105 hover:text-amber-300"
            >
              {team.name}
            </Link>
          )}
          {team.ort && (
            <span className="text-stone-400 text-lg flex items-center gap-1.5 shrink-0">
              <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" />
              {team.ort}
            </span>
          )}
        </div>
        {team.about && (
          <p className="text-stone-400 text-sm mt-2">{team.about}</p>
        )}
      </div>
    </>
  );

  const cardClassName =
    "rounded-2xl border border-retro-border bg-retro-surface overflow-hidden shadow-sm block";

  if (asLink) {
    return (
      <Link href={`/teams/${team.id}`} className={`group ${cardClassName} hover:bg-retro-card/50 transition`}>
        {content}
      </Link>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}
