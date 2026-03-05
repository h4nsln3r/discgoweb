"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusCircleIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { createSupabaseClient } from "@/lib/supabase";

type Disc = { id: string; name: string; bild: string | null };
type BagItem = {
  id: string;
  disc_id: string;
  created_at: string;
  disc: { id: string; name: string; bild: string | null } | null;
};

export default function BagManager({ discs, favoriteDiscId }: { discs: Disc[]; favoriteDiscId?: string | null }) {
  const router = useRouter();
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [favoriteDiscIdState, setFavoriteDiscIdState] = useState<string | null>(favoriteDiscId ?? null);
  const [settingFavorite, setSettingFavorite] = useState<string | null>(null);
  const [selectedDiscId, setSelectedDiscId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFavoriteDiscIdState(favoriteDiscId ?? null);
  }, [favoriteDiscId]);

  const fetchBag = useCallback(async () => {
    const res = await fetch("/api/bag");
    if (!res.ok) {
      setBag([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setBag(data.bag ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBag();
  }, [fetchBag]);

  const addToBag = async () => {
    if (!selectedDiscId) return;
    setAdding(true);
    setError(null);
    const res = await fetch("/api/bag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disc_id: selectedDiscId }),
    });
    const data = await res.json().catch(() => ({}));
    setAdding(false);
    if (!res.ok) {
      setError(data.error ?? "Kunde inte lägga till");
      return;
    }
    setSelectedDiscId("");
    fetchBag();
    router.refresh();
  };

  const removeFromBag = async (discId: string) => {
    const res = await fetch(`/api/bag?disc_id=${encodeURIComponent(discId)}`, { method: "DELETE" });
    if (!res.ok) return;
    setBag((prev) => prev.filter((b) => b.disc_id !== discId));
    if (favoriteDiscIdState === discId) setFavoriteDiscIdState(null);
    router.refresh();
  };

  const setAsFavorite = async (discId: string, discName: string) => {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSettingFavorite(discId);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ favorite_disc_id: discId, favorite_disc: discName })
      .eq("id", user.id);
    setSettingFavorite(null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setFavoriteDiscIdState(discId);
    router.refresh();
  };

  const bagDiscIds = new Set(bag.map((b) => b.disc_id));
  const availableDiscs = discs.filter((d) => !bagDiscIds.has(d.id));

  return (
    <div className="space-y-6">
      {/* Lägg till disc */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-200 mb-3 flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5 text-retro-accent" />
          Lägg till disc
        </h2>
        {availableDiscs.length === 0 ? (
          <p className="text-stone-500 text-sm">Alla discar är redan i din bag.</p>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-xl border border-retro-border bg-retro-card text-stone-200 px-3 py-2 min-w-[180px] focus:outline-none focus:ring-2 focus:ring-retro-accent"
              value={selectedDiscId}
              onChange={(e) => setSelectedDiscId(e.target.value)}
            >
              <option value="">Välj disc...</option>
              {availableDiscs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedDiscId || adding}
              onClick={addToBag}
              className="px-4 py-2 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
            >
              {adding ? "Lägger till..." : "Lägg till"}
            </button>
          </div>
        )}
        {error && <p className="text-amber-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Discar i bagen */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-200 mb-3">Discar i bagen</h2>
        {loading ? (
          <p className="text-stone-500 text-sm">Laddar...</p>
        ) : bag.length === 0 ? (
          <p className="text-stone-500 text-sm">Inga discar i bagen än. Lägg till ovan.</p>
        ) : (
          <ul className="space-y-2">
            {bag.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 rounded-xl bg-retro-card/50 border border-retro-border p-3"
              >
                <Link
                  href={`/discs/${b.disc_id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-surface flex items-center justify-center shrink-0">
                    {b.disc?.bild ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={b.disc.bild} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-retro-muted text-xl">🥏</span>
                    )}
                  </div>
                  <span className="text-stone-200 font-medium truncate">{b.disc?.name ?? "—"}</span>
                  {favoriteDiscIdState === b.disc_id && (
                    <span className="text-amber-400 shrink-0 flex items-center gap-1 text-xs font-medium">
                      <StarIconSolid className="w-4 h-4" aria-hidden />
                      Favorit
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  {favoriteDiscIdState !== b.disc_id ? (
                    <button
                      type="button"
                      onClick={() => b.disc && setAsFavorite(b.disc_id, b.disc.name)}
                      disabled={!!settingFavorite}
                      className="p-2 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 transition shrink-0 disabled:opacity-50"
                      aria-label="Sätt som favorit disc"
                      title="Sätt som favorit disc"
                    >
                      <StarIcon className="w-5 h-5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeFromBag(b.disc_id)}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                    aria-label="Ta bort från bagen"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
