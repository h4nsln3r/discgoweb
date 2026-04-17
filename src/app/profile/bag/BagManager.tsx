"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bars3Icon,
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
  PlusCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { createSupabaseClient } from "@/lib/supabase";

export type BagStatus = "active" | "discarded" | "worthless" | "for_trade";

const BAG_STATUS_LABELS: Record<BagStatus, string> = {
  active: "I bruk",
  discarded: "Bortkastad",
  worthless: "Värdelös",
  for_trade: "Vill byta/sälja",
};

const DISC_TYPE_LABELS: Record<string, string> = {
  driver: "Driver",
  fairway: "Fairway",
  midrange: "Midrange",
  putter: "Putter",
  other: "Annan",
};

type Disc = { id: string; name: string; bild: string | null; disc_type?: string | null; brand?: string | null };
type BagItem = {
  id: string;
  disc_id: string;
  created_at: string;
  status: BagStatus;
  sort_order?: number | null;
  disc: {
    id: string;
    name: string;
    bild: string | null;
    disc_type?: string | null;
    brand?: string | null;
    speed?: number | null;
    glide?: number | null;
    turn?: number | null;
    fade?: number | null;
  } | null;
};

const DISC_TYPE_SORT_ORDER: Record<string, number> = {
  other: 0,
  putter: 1,
  midrange: 2,
  fairway: 3,
  driver: 4,
};

type BagSortKey = "added" | "distance_desc" | "distance_asc" | "type" | "custom";
const TOUCH_DRAG_DELAY_MS = 250;

function moveBagItem(items: BagItem[], draggedId: string, targetId: string) {
  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return items;

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);

  return nextItems.map((item, index) => ({
    ...item,
    sort_order: index,
  }));
}

export default function BagManager({ discs, favoriteDiscId }: { discs: Disc[]; favoriteDiscId?: string | null }) {
  const router = useRouter();
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [favoriteDiscIdState, setFavoriteDiscIdState] = useState<string | null>(favoriteDiscId ?? null);
  const [settingFavorite, setSettingFavorite] = useState<string | null>(null);
  const [selectedDiscId, setSelectedDiscId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<BagSortKey>("type");
  const [customOrderLocked, setCustomOrderLocked] = useState(true);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [touchDragEnabled, setTouchDragEnabled] = useState(false);
  const touchDragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFavoriteDiscIdState(favoriteDiscId ?? null);
  }, [favoriteDiscId]);

  useEffect(() => {
    return () => {
      if (touchDragTimerRef.current) {
        clearTimeout(touchDragTimerRef.current);
      }
    };
  }, []);

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

  const updateBagStatus = async (bagItemId: string, status: BagStatus) => {
    setUpdatingStatusId(bagItemId);
    setError(null);
    const res = await fetch("/api/bag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bag_item_id: bagItemId, status }),
    });
    setUpdatingStatusId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunde inte uppdatera status");
      return;
    }
    setBag((prev) =>
      prev.map((b) => (b.id === bagItemId ? { ...b, status } : b))
    );
    router.refresh();
  };

  const saveCustomOrder = useCallback(async (items: BagItem[]) => {
    setSavingOrder(true);
    setError(null);
    const res = await fetch("/api/bag", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        items: items.map((item, index) => ({ id: item.id, sort_order: index })),
      }),
    });
    setSavingOrder(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Kunde inte spara ordningen");
      fetchBag();
      return false;
    }
    router.refresh();
    return true;
  }, [fetchBag, router]);

  const bagDiscIds = new Set(bag.map((b) => b.disc_id));
  const availableDiscs = discs.filter((d) => !bagDiscIds.has(d.id));
  const sortedBag = useMemo(() => {
    const items = [...bag];
    items.sort((a, b) => {
      if (sortBy === "added") {
        return a.created_at.localeCompare(b.created_at);
      }
      if (sortBy === "custom") {
        const aOrder = a.sort_order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.sort_order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }
      if (sortBy === "distance_desc" || sortBy === "distance_asc") {
        const aSpeed = a.disc?.speed ?? -1;
        const bSpeed = b.disc?.speed ?? -1;
        if (aSpeed !== bSpeed) {
          return sortBy === "distance_desc" ? bSpeed - aSpeed : aSpeed - bSpeed;
        }
      }
      if (sortBy === "type") {
        const aType = DISC_TYPE_SORT_ORDER[a.disc?.disc_type ?? "other"] ?? DISC_TYPE_SORT_ORDER.other;
        const bType = DISC_TYPE_SORT_ORDER[b.disc?.disc_type ?? "other"] ?? DISC_TYPE_SORT_ORDER.other;
        if (aType !== bType) return aType - bType;
      }
      return (a.disc?.name ?? "").localeCompare(b.disc?.name ?? "", "sv");
    });
    return items;
  }, [bag, sortBy]);

  const isCustomSort = sortBy === "custom";
  const canDragReorder = isCustomSort && !customOrderLocked && !savingOrder;
  const clearTouchDragTimer = useCallback(() => {
    if (touchDragTimerRef.current) {
      clearTimeout(touchDragTimerRef.current);
      touchDragTimerRef.current = null;
    }
  }, []);

  const handleTouchDropTarget = useCallback((clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY);
    const dropTarget = element?.closest("[data-bag-drop-target]");
    const targetId = dropTarget?.getAttribute("data-bag-drop-target") ?? null;
    setDragOverItemId(targetId);
    return targetId;
  }, []);

  const startTouchDragHold = useCallback((bagItemId: string) => {
    if (!canDragReorder) return;
    clearTouchDragTimer();
    touchDragTimerRef.current = setTimeout(() => {
      setDraggedItemId(bagItemId);
      setDragOverItemId(bagItemId);
      setTouchDragEnabled(true);
      touchDragTimerRef.current = null;
    }, TOUCH_DRAG_DELAY_MS);
  }, [canDragReorder, clearTouchDragTimer]);

  const stopTouchDrag = useCallback(() => {
    clearTouchDragTimer();
    setTouchDragEnabled(false);
    setDraggedItemId(null);
    setDragOverItemId(null);
  }, [clearTouchDragTimer]);

  const reorderBag = useCallback(async (targetId: string) => {
    if (!canDragReorder || !draggedItemId || draggedItemId === targetId) return;

    const previousBag = bag;
    const nextBag = moveBagItem(bag, draggedItemId, targetId);
    setBag(nextBag);
    setDraggedItemId(null);
    setDragOverItemId(null);
    const ok = await saveCustomOrder(nextBag);
    if (!ok) setBag(previousBag);
  }, [bag, canDragReorder, draggedItemId, saveCustomOrder]);

  return (
    <div className="space-y-6">
      {/* Lägg till disc */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-200 mb-3 flex items-center gap-2">
          <PlusCircleIcon className="w-5 h-5 text-retro-accent" />
          Lägg till disc
        </h2>
        <div className="space-y-2">
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
          <Link
            href="/discs/new"
            className="inline-flex items-center rounded-xl border border-retro-border bg-retro-card px-3 py-2 text-sm text-stone-200 hover:bg-retro-card/80 transition"
          >
            Skapa en ny disc
          </Link>
        </div>
        {error && <p className="text-amber-400 text-sm mt-2">{error}</p>}
      </div>

      {/* Discar i bagen */}
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-stone-200">Discar i bagen</h2>
          <label className="flex items-center gap-2 text-xs text-stone-400">
            Sortera
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BagSortKey)}
              className="rounded-lg border border-retro-border bg-retro-card text-stone-200 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-retro-accent"
              aria-label="Sortera discar i bagen"
            >
              <option value="custom">Egen ordning</option>
              <option value="type">Typ (Övriga → Putter → Driver)</option>
              <option value="distance_desc">Distans (lång → kort)</option>
              <option value="distance_asc">Distans (kort → lång)</option>
              <option value="added">Tillagd ordning</option>
            </select>
          </label>
          {isCustomSort ? (
            <button
              type="button"
              onClick={() => setCustomOrderLocked((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-retro-border bg-retro-card px-3 py-1.5 text-xs text-stone-200 hover:bg-retro-card/80 transition"
              aria-pressed={!customOrderLocked}
              aria-label={customOrderLocked ? "Lås upp egen sortering" : "Lås egen sortering"}
              title={customOrderLocked ? "Lås upp egen sortering" : "Lås egen sortering"}
            >
              {customOrderLocked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
              {customOrderLocked ? "Låst" : "Upplåst"}
            </button>
          ) : null}
        </div>
        {isCustomSort ? (
          <p className="mb-3 text-xs text-stone-500">
            {customOrderLocked
              ? "Egen ordning är låst. Tryck på låset för att kunna dra discar upp och ner."
              : savingOrder
                ? "Sparar ny ordning..."
                : "Dra discarna upp och ner för att spara din egen ordning. Pa mobil: hall inne handtaget en kort stund och dra sedan med fingret."}
          </p>
        ) : null}
        {loading ? (
          <p className="text-stone-500 text-sm">Laddar...</p>
        ) : bag.length === 0 ? (
          <p className="text-stone-500 text-sm">Inga discar i bagen än. Lägg till ovan.</p>
        ) : (
          <ul className="space-y-2">
            {sortedBag.map((b) => (
              <Fragment key={b.id}>
                {isCustomSort ? (
                  <li
                    data-bag-drop-target={b.id}
                    onDragOver={(e) => {
                      if (!canDragReorder || draggedItemId === b.id) return;
                      e.preventDefault();
                      setDragOverItemId(b.id);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      await reorderBag(b.id);
                    }}
                    className={`h-3 rounded-md transition ${
                      dragOverItemId === b.id && canDragReorder ? "bg-retro-accent/40" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                ) : null}
                <li
                  onDragEnd={() => {
                    setDraggedItemId(null);
                    setDragOverItemId(null);
                  }}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-xl border p-3 transition ${
                    dragOverItemId === b.id && canDragReorder
                      ? "border-retro-accent bg-retro-card"
                      : "bg-retro-card/50 border-retro-border"
                  }`}
                >
                  {isCustomSort ? (
                    <div
                      draggable={canDragReorder}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", b.id);
                        setDraggedItemId(b.id);
                      }}
                      onTouchStart={() => startTouchDragHold(b.id)}
                      onTouchMove={(e) => {
                        if (!touchDragEnabled || draggedItemId !== b.id) return;
                        const touch = e.touches[0];
                        if (!touch) return;
                        e.preventDefault();
                        handleTouchDropTarget(touch.clientX, touch.clientY);
                      }}
                      onTouchEnd={async (e) => {
                        clearTouchDragTimer();
                        if (!touchDragEnabled || draggedItemId !== b.id) {
                          stopTouchDrag();
                          return;
                        }
                        const touch = e.changedTouches[0];
                        const targetId = touch ? handleTouchDropTarget(touch.clientX, touch.clientY) : dragOverItemId;
                        if (targetId) {
                          await reorderBag(targetId);
                        }
                        stopTouchDrag();
                      }}
                      onTouchCancel={() => {
                        stopTouchDrag();
                      }}
                      className={`flex shrink-0 items-center justify-center rounded-lg border border-retro-border px-2 py-3 text-stone-400 ${
                        canDragReorder ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-50"
                      }`}
                      style={{ touchAction: canDragReorder ? "none" : "auto" }}
                      aria-label={canDragReorder ? "Dra för att ändra ordning" : "Ordningen är låst"}
                      title={canDragReorder ? "Dra för att ändra ordning" : "Ordningen är låst"}
                    >
                      <Bars3Icon className="w-5 h-5" />
                    </div>
                  ) : null}
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
                    <div className="min-w-0">
                      <span className="text-stone-200 font-medium truncate block">{b.disc?.name ?? "—"}</span>
                      <div className="flex flex-col gap-0.5 text-xs">
                        {b.disc?.brand && <span className="font-semibold text-stone-400">{b.disc.brand}</span>}
                        {b.disc?.disc_type && <span className="text-amber-400/90">{DISC_TYPE_LABELS[b.disc.disc_type] ?? b.disc.disc_type}</span>}
                        <span className="text-stone-500 tabular-nums">
                          {[b.disc?.speed, b.disc?.glide, b.disc?.turn, b.disc?.fade].filter((n) => n != null).length > 0
                            ? [b.disc?.speed, b.disc?.glide, b.disc?.turn, b.disc?.fade].filter((n) => n != null).join(" · ")
                            : "—"}
                        </span>
                      </div>
                    </div>
                    {favoriteDiscIdState === b.disc_id && (
                      <span className="text-amber-400 shrink-0 flex items-center gap-1 text-xs font-medium">
                        <StarIconSolid className="w-4 h-4" aria-hidden />
                        Favorit
                      </span>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 sm:gap-1 shrink-0 flex-wrap">
                    <select
                      value={b.status}
                      onChange={(e) => updateBagStatus(b.id, e.target.value as BagStatus)}
                      disabled={updatingStatusId === b.id}
                      className="rounded-lg border border-retro-border bg-retro-surface text-stone-200 text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-retro-accent disabled:opacity-50"
                      aria-label="Status för discen"
                    >
                      {(Object.keys(BAG_STATUS_LABELS) as BagStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {BAG_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
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
              </Fragment>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
