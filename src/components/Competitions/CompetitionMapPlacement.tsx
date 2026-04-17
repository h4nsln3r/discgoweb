"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MapIcon } from "@heroicons/react/24/outline";
import CompetitionCoursesMapClient from "@/components/Competitions/CompetitionCoursesMapClient";

type CourseInput = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  main_image_url?: string | null;
  /** Antal rader i course_holes (servern räknar ihop). */
  hole_count?: number;
};

/** Efter mount: undviker SSR/klient-mismatch för viewport. Första paint = alltid inline (samma som server). */
function useIsMdAfterMount() {
  const [isMd, setIsMd] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMd;
}

/**
 * Desktop (md+): full bredd i heron (samma typ av sidmarginal som titelraden).
 * Två lika spår i grid; höger spår har minbredd så kartan inte kollapsar. Vid smalt fönster: horisontell scroll.
 * Vänster spår: info | smal kolumn (datum + deltagare).
 */
export function CompetitionHeroDesktopTop({
  courses,
  competitionId,
  infoColumn,
  metaColumn,
}: {
  courses: CourseInput[];
  competitionId: string;
  /** Beskrivning / infotext (egen kolumn inom vänstra halvan). */
  infoColumn: ReactNode;
  /** Datumkort + deltagare (smal kolumn inom vänstra halvan). */
  metaColumn: ReactNode;
}) {
  const isMd = useIsMdAfterMount();
  if (isMd !== true) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 w-full px-4 pt-4 md:px-6 md:pt-6">
      <div className="pointer-events-auto w-full min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
        <div className="grid min-h-0 w-full min-w-0 max-h-[min(70vh,42rem)] grid-cols-1 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(22rem,1fr)] md:gap-3 lg:gap-4">
          {/* Vänster halva (flexibel): info + smal meta-rail */}
          <div className="flex min-h-0 min-w-0 flex-row gap-2 sm:gap-3 md:gap-3 lg:gap-4">
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {infoColumn}
            </div>
            <div className="flex min-h-0 w-[min(11.25rem,34%)] max-w-[13.5rem] shrink-0 flex-col gap-2 overflow-y-auto overscroll-contain border-l border-white/15 pl-2 [scrollbar-width:thin] sm:gap-3 sm:pl-3 md:pl-4 [&_h2]:text-base [&_h2]:md:text-lg [&_h2>svg]:h-4 [&_h2>svg]:w-4 [&_h2>svg]:md:h-5 [&_h2>svg]:md:w-5">
              {metaColumn}
            </div>
          </div>
          {/* Höger halva: karta med golvminbredd via grid-spåret */}
          <div className="flex min-h-0 min-w-0 w-full flex-col">
            <h2 className="mb-1.5 shrink-0 font-bebas text-lg uppercase leading-none tracking-wide text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] sm:mb-2 sm:text-xl md:text-2xl">
              <span className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 shrink-0 text-amber-400 drop-shadow-sm sm:h-6 sm:w-6" aria-hidden />
                Banor i tävlingen
              </span>
            </h2>
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-amber-400/25 bg-retro-surface/92 shadow-2xl shadow-amber-900/20 ring-1 ring-black/30 backdrop-blur-md">
              <CompetitionCoursesMapClient variant="hero" courses={courses} competitionId={competitionId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vanlig flödesplacering; döljs på desktop om kartan redan ligger i heron. */
export function CompetitionMapMainFlow({
  hasHeroImage,
  courses,
  competitionId,
}: {
  hasHeroImage: boolean;
  courses: CourseInput[];
  competitionId: string;
}) {
  const isMd = useIsMdAfterMount();
  if (hasHeroImage && isMd === true) return null;
  return <CompetitionCoursesMapClient courses={courses} competitionId={competitionId} />;
}
