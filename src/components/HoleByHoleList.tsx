"use client";

import { getHoleThrowBg, getHoleThrowStyle } from "@/lib/holeColors";

export type HoleInfo = { hole_number: number; throws: number; par?: number };

type Props = {
  holes: HoleInfo[];
  /** hole_number -> par (används om par saknas på varje hål) */
  parByHole?: Record<number, number>;
  /** Klass på container (t.ex. för tabellcell). Default: flex flex-col gap-3 */
  className?: string;
  /** Klass på varje badge (för att matcha olika kontexter). */
  badgeClassName?: string;
};

function splitFirst9Last9(holes: HoleInfo[]): { first9: HoleInfo[]; last9: HoleInfo[] } {
  const sorted = [...holes].sort((a, b) => a.hole_number - b.hole_number);
  const first9 = sorted.filter((h) => h.hole_number <= 9);
  const last9 = sorted.filter((h) => h.hole_number > 9);
  return { first9, last9 };
}

/** Visar hål uppdelat i första 9 och sista 9. Desktop: varsin rad. Mobil: uppdelat med mellanrum. */
export default function HoleByHoleList({
  holes,
  parByHole,
  className = "",
  badgeClassName = "inline-flex items-center gap-1 rounded-lg border border-retro-border px-2.5 py-1 text-sm text-stone-200",
}: Props) {
  const { first9, last9 } = splitFirst9Last9(holes);

  const renderBadges = (group: HoleInfo[]) =>
    group.map((h) => {
      const par = h.par ?? parByHole?.[h.hole_number];
      const bg = getHoleThrowBg(h.throws, par);
      const style = getHoleThrowStyle(h.throws, par);
      return (
        <span
          key={h.hole_number}
          className={`${badgeClassName} ${bg || "bg-retro-surface"}`}
          style={Object.keys(style).length > 0 ? style : undefined}
        >
          <span className="text-retro-muted">H{h.hole_number}</span>
          <span className="font-medium">{h.throws}</span>
        </span>
      );
    });

  return (
    <div className={`flex flex-col gap-3 md:gap-4 ${className}`.trim()}>
      {first9.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {first9.length < holes.length && (
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              Första 9
            </span>
          )}
          <div className="flex flex-wrap gap-2">{renderBadges(first9)}</div>
        </div>
      )}
      {last9.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Sista 9
          </span>
          <div className="flex flex-wrap gap-2">{renderBadges(last9)}</div>
        </div>
      )}
    </div>
  );
}
