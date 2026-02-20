"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BackLink from "@/components/Buttons/BackLink";
import {
  ArrowLeftIcon,
  MapPinIcon,
  UserCircleIcon,
  TrophyIcon,
  CalendarDaysIcon,
  FlagIcon,
  PencilSquareIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
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
  user_id: string;
  throws: number | null;
  score: number | null;
  date_played: string | null;
  with_friends: unknown;
  competition_id: string | null;
  courses: { id: string; name: string } | null;
  profiles: { alias: string } | null;
  competitions: { title: string } | null;
};

export default function ScoreDetailPage() {
  const supabase = createClientComponentClient<Database>();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ScoreDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scores")
        .select(
          `
          id,
          user_id,
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

  if (loading) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="text-stone-400 animate-pulse">Laddar...</div>
      </main>
    );
  }
  if (!item) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        <p className="text-stone-400">Hittade inte resultatet.</p>
        <Link
          href="/results"
          className="inline-flex items-center gap-2 mt-3 text-retro-accent hover:underline"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Tillbaka till alla resultat
        </Link>
      </main>
    );
  }

  const friends = normalizeFriends(item.with_friends);
  const throwsValue = item.throws ?? item.score ?? null;

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <BackLink href="/results">Tillbaka till alla resultat</BackLink>
      </div>

      <h1 className="text-2xl font-bold text-stone-100">Resultat</h1>

      {/* Tävling – synlig högst upp om det finns */}
      {item.competitions && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-3">
          <FlagIcon className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-stone-400">Tävling:</span>
          <Link
            href={`/competitions/${item.competition_id}`}
            className="font-medium text-amber-400 hover:text-amber-300 hover:underline"
          >
            {item.competitions.title}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bana */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <MapPinIcon className="h-4 w-4 text-retro-accent" />
            Bana
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {item.courses?.id ? (
              <Link
                href={`/courses/${item.courses.id}`}
                className="text-retro-accent hover:underline"
              >
                {item.courses.name ?? "Okänd bana"}
              </Link>
            ) : (
              (item.courses?.name ?? "Okänd bana")
            )}
          </div>
        </div>

        {/* Spelare */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <UserCircleIcon className="h-4 w-4" />
            Spelare
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {item.profiles?.alias ?? "Okänd spelare"}
          </div>
        </div>

        {/* Kast */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <TrophyIcon className="h-4 w-4" />
            Kast
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {throwsValue !== null ? `${throwsValue} kast` : "—"}
          </div>
        </div>

        {/* Poäng */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <TrophyIcon className="h-4 w-4" />
            Poäng
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {item.score !== null && item.score !== undefined ? item.score : "—"}
          </div>
        </div>

        {/* Datum */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <CalendarDaysIcon className="h-4 w-4" />
            Datum
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {item.date_played
              ? new Date(item.date_played).toLocaleDateString("sv-SE")
              : "—"}
          </div>
        </div>

        {/* Spelade med */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface md:col-span-2">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
            <UserGroupIcon className="h-4 w-4" />
            Spelade med
          </div>
          {friends.length > 0 ? (
            <ul className="space-y-1 text-stone-200">
              {friends.map((f, i) => (
                <li key={`${f}-${i}`} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-retro-accent shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-stone-400">—</p>
          )}
        </div>
      </div>

      {currentUserId != null && item.user_id === currentUserId && (
        <div className="pt-2">
          <Link
            href={`/results/${item.id}/edit`}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-lg bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition focus:outline-none focus:ring-2 focus:ring-retro-accent focus:ring-offset-2 focus:ring-offset-retro-bg"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Redigera resultat
          </Link>
        </div>
      )}
    </main>
  );
}
