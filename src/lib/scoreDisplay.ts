/** Formaterar poäng (par-baserat: +1 = över par, 0 = par, -2 = under par). */
export function formatScorePar(score: number | null | undefined): string {
  if (score === null || score === undefined) return "—";
  if (score === 0) return "Par";
  if (score > 0) return `+${score}`;
  return String(score);
}
