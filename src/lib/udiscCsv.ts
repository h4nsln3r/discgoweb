/**
 * Parse UDisc CSV export.
 * Export from app: You → Rounds → ☰ → Export to CSV.
 * Columns: PlayerName, CourseName, LayoutName, StartDate, EndDate, Total, +/-, RoundRating, Hole1..Hole30
 */

export type UDiscRound = {
  playerName: string;
  courseName: string;
  layoutName: string;
  /** YYYY-MM-DD */
  date: string;
  /** Total throws */
  total: number;
  /** Score relative to par (e.g. -2, +5) */
  relativeToPar: number;
  /** Hole scores 1..N (only holes with values) */
  holeScores: { hole_number: number; throws: number }[];
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (c === "," || c === ";")) {
      out.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  out.push(current.trim());
  return out;
}

/** Parse +/- column to number. E.g. "-2", "+5", "8" */
function parseRelativeToPar(raw: string, total: number, holeScores: number[]): number {
  const s = (raw ?? "").trim();
  if (s === "") {
    // UDisc sometimes leaves +/- empty; we can't derive without par, return 0 and caller can use total
    return 0;
  }
  const n = parseInt(s.replace(/^\+/, ""), 10);
  if (Number.isNaN(n)) return 0;
  return n;
}

/**
 * Parse UDisc CSV text. Skips "Par" rows (course template rows).
 * Returns rounds only (one per player per round).
 */
export function parseUDiscCsv(csvText: string): UDiscRound[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const headers = header.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => {
    const i = headers.indexOf(name.toLowerCase());
    if (i === -1) return headers.indexOf(name.replace(/\+\/\-/g, "+/-").toLowerCase());
    return i;
  };
  const iPlayer = headers.indexOf("playername");
  const iCourse = headers.indexOf("coursename");
  const iLayout = headers.indexOf("layoutname");
  const iStart = headers.indexOf("startdate");
  const iTotal = headers.indexOf("total");
  const iPlusMinus = header.findIndex((h) => h === "+/-");
  const holeIndices: number[] = [];
  for (let h = 1; h <= 30; h++) {
    const i = headers.indexOf(`hole${h}`);
    if (i !== -1) holeIndices.push(i);
  }

  const rounds: UDiscRound[] = [];
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    const row = parseCsvLine(lines[rowIndex]);
    const playerName = (row[iPlayer] ?? "").trim();
    if (playerName === "" || playerName.toLowerCase() === "par") continue;

    const courseName = (row[iCourse] ?? "").trim();
    const layoutName = (row[iLayout] ?? "").trim();
    const startRaw = (row[iStart] ?? "").trim();
    const date = startRaw.includes(" ") ? startRaw.split(" ")[0]! : startRaw;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const totalRaw = (row[iTotal] ?? "").trim();
    const total = parseInt(totalRaw, 10);
    if (Number.isNaN(total) || total < 1) continue;

    const plusMinusRaw = iPlusMinus >= 0 ? (row[iPlusMinus] ?? "").trim() : "";
    const holeThrows: number[] = holeIndices
      .map((i) => {
        const v = (row[i] ?? "").trim();
        const n = parseInt(v, 10);
        return v === "" || Number.isNaN(n) ? null : n;
      })
      .filter((n): n is number => n !== null);
    const relativeToPar = parseRelativeToPar(plusMinusRaw, total, holeThrows);

    const holeScores = holeThrows
      .map((throws, idx) => ({ hole_number: idx + 1, throws }))
      .filter((h) => h.throws > 0);

    rounds.push({
      playerName,
      courseName,
      layoutName,
      date,
      total,
      relativeToPar,
      holeScores,
    });
  }
  return rounds;
}
