import type { CSSProperties } from "react";

/**
 * Bakgrundsfärg för ett hål baserat på slag vs par.
 * Under par = grön, över par = röd, par = ingen färg.
 * Returnerar Tailwind-klass.
 */
export function getHoleThrowBg(throws: number, par: number | undefined): string {
  const p = par != null ? Number(par) : NaN;
  if (Number.isNaN(p)) return "";
  const t = Number(throws);
  if (t < p) return "bg-green-600/50";
  if (t > p) return "bg-red-600/50";
  return "";
}

/**
 * Inline style för samma logik – använd om Tailwind-klassen inte syns.
 */
export function getHoleThrowStyle(
  throws: number,
  par: number | undefined
): CSSProperties {
  const p = par != null ? Number(par) : NaN;
  if (Number.isNaN(p)) return {};
  const t = Number(throws);
  if (t < p) return { backgroundColor: "rgba(22, 163, 74, 0.55)" };
  if (t > p) return { backgroundColor: "rgba(220, 38, 38, 0.55)" };
  return {};
}
