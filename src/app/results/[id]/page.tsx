"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

/** Normalize anything -> string[] (handles null, string, JSON string, object) */
function normalizeFriends(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).filter(Boolean);

  if (typeof input === "string") {
    // Could be a plain string or JSON string
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
      // Not an array JSON -> treat as single value
      return [trimmed];
    } catch {
      // Not JSON -> treat as single value
      return [trimmed];
    }
  }

  // Handle objects like {0: "A", 1: "B"} or {names: [...]}
  if (typeof input === "object") {
    try {
      const values = Object.values(input as Record<string, unknown>);
      const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v]));
      return flat.map(String).filter(Boolean);
    } catch {
      return [];
    }
  }

  return [];
}

type ScoreDetail = {
  id: string;
  throws: number | null;
  score: number | null;
  date_played: string | null;
  with_friends: unknown; // normalize later
  competition_id: string | null;
  courses: { id: string; name: string } | null;
  profiles: { alias: string } | null;
  competitions: { title: string } | null;
};

export default function ScoreDetailPage() {
  const supabase = createClientComponentClient<Database>();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ScoreDetail | null>(null);

  // Load one score by id
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scores")
        .select(
          `
          id,
          throws,
          score,
          date_played,
          with_friends,
          competition_id,
          courses ( id, name ),
          profiles ( alias ),
          competitions ( title )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("[SCORE DETAIL ERROR]", error);
      }
      setItem((data ?? null) as unknown as ScoreDetail | null);
      setLoading(false);
    };

    if (id) load();
  }, [id, supabase]);

  if (loading) return <div className="p-6">Laddar...</div>;
  if (!item) return <div className="p-6">Hittade inte resultatet.</div>;

  // Robust handling for with_friends + throws fallback
  const friends = normalizeFriends(item.with_friends);
  const throwsValue = item.throws ?? item.score ?? null;

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Top bar actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/results")}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Tillbaka till alla resultat
        </button>

        <Link
          href={`/results/${item.id}/edit`}
          className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Redigera resultat
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Resultat</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Course */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Bana</div>
          <div className="text-lg font-semibold">
            {item.courses?.name ?? "Okänd bana"}
          </div>
        </div>

        {/* Player */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Spelare</div>
          <div className="text-lg font-semibold">
            {item.profiles?.alias ?? "Okänd spelare"}
          </div>
        </div>

        {/* Throws (primary) */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Kast</div>
          <div className="text-lg font-semibold">
            {throwsValue !== null ? `${throwsValue} kast` : "—"}
          </div>
        </div>

        {/* Score (points) */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Poäng</div>
          <div className="text-lg font-semibold">
            {item.score !== null && item.score !== undefined ? item.score : "—"}
          </div>
        </div>

        {/* Date */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Datum</div>
          <div className="text-lg font-semibold">
            {item.date_played
              ? new Date(item.date_played).toLocaleDateString("sv-SE")
              : "—"}
          </div>
        </div>

        {/* Competition */}
        <div className="rounded border p-4 bg-white">
          <div className="text-sm text-gray-500">Tävling</div>
          <div className="text-lg font-semibold">
            {item.competitions ? (
              <Link
                href={`/competitions/${item.competition_id}`}
                className="text-blue-600 hover:underline"
              >
                {item.competitions.title}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </div>

        {/* With friends */}
        <div className="rounded border p-4 bg-white md:col-span-2">
          <div className="text-sm text-gray-500">Spelade med</div>
          {friends.length > 0 ? (
            <ul className="list-disc list-inside">
              {friends.map((f, i) => (
                <li key={`${f}-${i}`}>{f}</li>
              ))}
            </ul>
          ) : (
            <div className="text-lg font-semibold">—</div>
          )}
        </div>
      </div>
    </main>
  );
}
