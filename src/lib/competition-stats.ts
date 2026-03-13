/**
 * Helpers för tävlingsstatistik: stabilitet, par, streaks.
 * Används av stabilitetsranking och rundvisualisering.
 */

export type HoleDatum = {
  hole_number: number;
  throws: number;
  par?: number;
};

/**
 * Standardavvikelse för slag per hål (lägre = stabilare rund).
 */
export function holeVariation(holes: HoleDatum[]): number {
  if (holes.length < 2) return 0;
  const values = holes.map((h) => h.throws);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Antal hål spelade i par (throws === par).
 */
export function parCount(holes: HoleDatum[]): number {
  return holes.filter((h) => h.par != null && h.throws === h.par).length;
}

/**
 * Längsta antal på varandra följande hål med par eller bättre (throws <= par).
 */
export function longestParOrBetterStreak(holes: HoleDatum[]): number {
  const sorted = [...holes].sort((a, b) => a.hole_number - b.hole_number);
  let max = 0;
  let current = 0;
  for (const h of sorted) {
    if (h.par != null && h.throws <= h.par) {
      current += 1;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

/**
 * Kumulativt resultat till par per hål (hole 1, 2, …).
 * Returnerar array med kumulativt +/- par efter varje hål.
 */
export function cumulativeScoreToParByHole(holes: HoleDatum[]): { hole: number; toPar: number }[] {
  const sorted = [...holes].sort((a, b) => a.hole_number - b.hole_number);
  let cumulative = 0;
  return sorted.map((h) => {
    if (h.par != null) {
      cumulative += h.throws - h.par;
    }
    return { hole: h.hole_number, toPar: cumulative };
  });
}

/**
 * Slag per hål i ordning (för grafer).
 */
export function throwsByHole(holes: HoleDatum[]): { hole: number; throws: number }[] {
  return [...holes]
    .sort((a, b) => a.hole_number - b.hole_number)
    .map((h) => ({ hole: h.hole_number, throws: h.throws }));
}
