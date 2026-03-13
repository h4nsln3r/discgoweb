"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon,
  UserCircleIcon,
  TrophyIcon,
  CalendarDaysIcon,
  FlagIcon,
  UserGroupIcon,
  HashtagIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";
import HoleByHoleList from "@/components/HoleByHoleList";
import { formatScorePar } from "@/lib/scoreDisplay";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";

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
  course_id: string | null;
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
  const [holes, setHoles] = useState<{ hole_number: number; throws: number; par?: number }[] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAlias, setCurrentUserAlias] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmed, setConfirmed] = useState<{ user_id: string; alias: string }[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      const res = await fetch("/api/get-current-user");
      if (res.ok) {
        const data = await res.json();
        setIsAdmin((data as { is_admin?: boolean }).is_admin === true);
      } else {
        setIsAdmin(false);
      }
    };
    loadUser();
  }, [supabase]);

  useEffect(() => {
    if (!currentUserId) {
      setCurrentUserAlias(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("alias")
      .eq("id", currentUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setCurrentUserAlias((data as { alias: string }).alias?.trim() ?? "");
        else if (!cancelled) setCurrentUserAlias("");
      });
    return () => { cancelled = true; };
  }, [currentUserId, supabase]);

  useEffect(() => {
    if (!item?.id) {
      setConfirmed([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/score-confirmations?score_id=${encodeURIComponent(item.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.confirmed) setConfirmed(data.confirmed);
        else if (!cancelled) setConfirmed([]);
      })
      .catch(() => { if (!cancelled) setConfirmed([]); });
    return () => { cancelled = true; };
  }, [item?.id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("scores")
        .select(
          `
          id,
          user_id,
          course_id,
          throws,
          score,
          date_played,
          with_friends,
          competition_id,
          courses ( id, name ),
          profiles!scores_user_id_fkey ( alias ),
          competitions ( title )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("[SCORE DETAIL ERROR]", error);
      }
      setItem((data ?? null) as unknown as ScoreDetail | null);
      setHoles(null);
      setLoading(false);
    };

    load();
  }, [id, supabase]);

  useEffect(() => {
    if (!item?.id) return;
    let cancelled = false;
    const courseId = item.courses?.id ?? item.course_id ?? "";
    const url = courseId
      ? `/api/score-holes?score_id=${encodeURIComponent(item.id)}&course_id=${encodeURIComponent(courseId)}`
      : `/api/score-holes?score_id=${encodeURIComponent(item.id)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setHoles(data);
        else if (!cancelled) setHoles([]);
      })
      .catch(() => {
        if (!cancelled) setHoles([]);
      });
    return () => { cancelled = true; };
  }, [item?.id, item?.courses?.id, item?.course_id]);

  if (loading) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        <SetTopbarActions backHref="/results" />
        <div className="text-stone-400 animate-pulse">Laddar...</div>
      </main>
    );
  }
  if (!item) {
    return (
      <main className="p-4 md:p-6 max-w-3xl mx-auto">
        <SetTopbarActions backHref="/results" />
        <p className="text-stone-400">Hittade inte resultatet.</p>
      </main>
    );
  }

  const friends = normalizeFriends(item.with_friends);
  const throwsValue = item.throws ?? item.score ?? null;

  const canEdit = currentUserId != null && (item.user_id === currentUserId || isAdmin);

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <SetTopbarActions
        backHref="/results"
        editHref={canEdit ? `/results/${item.id}/edit` : null}
        editLabel="Redigera resultat"
        pageTitle="Resultat"
      />

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

        {/* Inlämnad av (skapare) */}
        <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
          <div className="flex items-center gap-2 text-sm text-stone-500 mb-1">
            <UserCircleIcon className="h-4 w-4" />
            Inlämnad av
          </div>
          <div className="text-lg font-semibold text-stone-100">
            {item.user_id ? (
              <Link
                href={`/profile/${item.user_id}`}
                className="text-retro-accent hover:underline"
              >
                {item.profiles?.alias ?? "Okänd spelare"}
              </Link>
            ) : (
              item.profiles?.alias ?? "Okänd spelare"
            )}
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
            {formatScorePar(item.score)}
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
            <>
              <ul className="space-y-1.5 text-stone-200 mb-3">
                {friends.map((f, i) => {
                  const isConfirmed = !f.startsWith("Gäst:") && confirmed.some((c) => c.alias.trim() === f.trim());
                  return (
                    <li key={`${f}-${i}`} className="flex items-center gap-2">
                      {isConfirmed ? (
                        <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-500 shrink-0" />
                      )}
                      <span className={isConfirmed ? "text-stone-100" : ""}>{f}</span>
                    </li>
                  );
                })}
              </ul>
              {currentUserId &&
                currentUserAlias &&
                item.user_id !== currentUserId &&
                friends.some((f) => f === currentUserAlias || f.trim() === currentUserAlias) &&
                !confirmed.some((c) => c.user_id === currentUserId) && (
                  <button
                    type="button"
                    disabled={confirming}
                    onClick={async () => {
                      setConfirming(true);
                      try {
                        const res = await fetch("/api/confirm-score", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ score_id: item.id }),
                        });
                        const data = await res.json();
                        if (res.ok && data?.ok) {
                          setConfirmed((prev) => [...prev, { user_id: currentUserId, alias: currentUserAlias }]);
                        }
                      } finally {
                        setConfirming(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {confirming ? "Bekräftar…" : "Bekräfta att jag var med"}
                  </button>
                )}
            </>
          ) : (
            <p className="text-stone-400">—</p>
          )}
        </div>
      </div>

      {/* Hål – visas alltid; innehåll beroende på om det finns sparad hålfördelning */}
      <div className="rounded-xl border border-retro-border p-4 bg-retro-surface">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-3">
          <HashtagIcon className="w-5 h-5 text-retro-muted shrink-0" aria-hidden />
          Hål
        </h2>
        {holes === null ? (
          <p className="text-stone-400 text-sm">Laddar hål…</p>
        ) : holes.length === 0 ? (
          <p className="text-stone-400 text-sm">Ingen hålfördelning sparad för detta resultat.</p>
        ) : (
          <HoleByHoleList
            holes={holes}
            badgeClassName="inline-flex items-center gap-1.5 rounded-lg border border-retro-border px-3 py-1.5 text-sm text-stone-200 bg-retro-card"
          />
        )}
      </div>

    </main>
  );
}
