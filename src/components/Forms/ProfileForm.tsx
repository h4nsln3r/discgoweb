"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/types/supabase";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";
import { CITY_COUNTRY_PAIRS, CITY_SUGGESTIONS, COUNTRY_SUGGESTIONS } from "@/data/location-suggestions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Course = Pick<
  Database["public"]["Tables"]["courses"]["Row"],
  "id" | "name"
>;
type Team = Pick<Database["public"]["Tables"]["teams"]["Row"], "id" | "name">;
type Disc = Pick<Database["public"]["Tables"]["discs"]["Row"], "id" | "name">;

const CROP_SIZE = 320;
const PREVIEW_SIZE = 96;

export default function ProfileForm({
  profile,
  courses,
  teams,
  discs = [],
}: {
  profile: Profile | null;
  courses: Course[];
  teams: Team[];
  discs?: Disc[];
}) {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const { showToast } = useToast();

  const [alias, setAlias] = useState(profile?.alias ?? "");
  const [homeCourse, setHomeCourse] = useState<string>(
    profile?.home_course ?? ""
  );
  const [phone, setPhone] = useState(profile?.phone ?? "+46 ");
  const [favoriteDiscId, setFavoriteDiscId] = useState(
    profile?.favorite_disc_id ?? ""
  );
  const [city, setCity] = useState(profile?.city ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [teamId, setTeamId] = useState(profile?.team_id ?? "");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropDrag, setCropDrag] = useState<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const aliasRef = useRef<HTMLDivElement>(null);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profile?.avatar_url ?? null;
  }, [avatarFile, profile?.avatar_url]);

  useEffect(() => {
    if (!fileToCrop) return;
    const url = URL.createObjectURL(fileToCrop);
    setCropPreviewUrl(url);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [fileToCrop]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  const locationSuggestions = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (q.length < 3) return [];
    return CITY_COUNTRY_PAIRS.filter(
      (p) =>
        p.city.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [locationSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCroppedFile = useCallback(async (): Promise<File | null> => {
    if (!fileToCrop || !imgRef.current) return null;
    const img = imgRef.current;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const zoom = Math.max(0.3, Math.min(3, cropZoom));
    const scale = Math.min(CROP_SIZE / nw, CROP_SIZE / nh);
    const side = CROP_SIZE / (zoom * scale);
    const half = side / 2;
    const sx = nw / 2 - cropOffset.x / scale - half;
    const sy = nh / 2 - cropOffset.y / scale - half;
    const sw = side;
    const sh = side;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.beginPath();
    ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE);
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const f = new File([blob], fileToCrop.name.replace(/\.[^.]+$/, ".jpg") || "avatar.jpg", { type: "image/jpeg" });
          resolve(f);
        },
        "image/jpeg",
        0.92
      );
    });
  }, [fileToCrop, cropZoom, cropOffset]);

  const handleCropConfirm = useCallback(async () => {
    const f = await getCroppedFile();
    if (f) {
      setAvatarFile(f);
      setFileToCrop(null);
      setCropPreviewUrl(null);
    }
  }, [getCroppedFile]);

  const handleCropCancel = useCallback(() => {
    setFileToCrop(null);
    setCropPreviewUrl(null);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFileToCrop(file);
    }
    e.target.value = "";
  }, []);

  async function uploadAvatar() {
    if (!avatarFile) return profile?.avatar_url ?? "";

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw userError ?? new Error("Ingen användare.");

    const ext = avatarFile.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl ?? "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) {
      setInvalidFields(new Set(["alias"]));
      aliasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Fyll i namn / visningsnamn.", "error");
      return;
    }
    setInvalidFields(new Set());
    setSaving(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) throw userErr ?? new Error("Inte inloggad.");

      const avatar_url = await uploadAvatar();

      const selectedDisc = discs.find((d) => d.id === favoriteDiscId);
      const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
        id: user.id,
        alias,
        avatar_url,
        home_course: homeCourse || null,
        phone: phone?.trim() || null,
        favorite_disc_id: favoriteDiscId || null,
        favorite_disc: selectedDisc?.name ?? profile?.favorite_disc ?? null,
        city: city?.trim() || null,
        country: country?.trim() || null,
        team_id: teamId || null,
      };

      console.log("[profile] saving payload:", payload);

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("[profile] upsert error:", error);
        showToast(error.message || "Kunde inte spara profilen.", "error");
        return;
      }

      setAvatarFile(null);
      router.push(`/profile?welcome=1`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Något gick fel vid sparande.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Crop-modal när användaren valt en bild */}
      {fileToCrop && cropPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-retro-surface border border-retro-border rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 border-b border-retro-border">
              <h3 className="text-lg font-semibold text-stone-100">Beskär profilbild</h3>
              <p className="text-sm text-stone-400 mt-1">Zooma och dra för att placera. Cirkeln visar utsnittet.</p>
            </div>
            <div className="p-4">
              <div
                className="mx-auto rounded-full overflow-hidden bg-retro-card border-2 border-retro-border select-none touch-none"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  setCropDrag({ startX: e.clientX, startY: e.clientY, startOffset: { ...cropOffset } });
                }}
                onMouseMove={(e) => {
                  if (!cropDrag) return;
                  setCropOffset({
                    x: cropDrag.startOffset.x + (e.clientX - cropDrag.startX),
                    y: cropDrag.startOffset.y + (e.clientY - cropDrag.startY),
                  });
                }}
                onMouseUp={() => setCropDrag(null)}
                onMouseLeave={() => setCropDrag(null)}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  setCropDrag({ startX: t.clientX, startY: t.clientY, startOffset: { ...cropOffset } });
                }}
                onTouchMove={(e) => {
                  if (!cropDrag) return;
                  const t = e.touches[0];
                  setCropOffset({
                    x: cropDrag.startOffset.x + (t.clientX - cropDrag.startX),
                    y: cropDrag.startOffset.y + (t.clientY - cropDrag.startY),
                  });
                }}
                onTouchEnd={() => setCropDrag(null)}
              >
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transform: `scale(${cropZoom}) translate(${cropOffset.x}px, ${cropOffset.y}px)`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={cropPreviewUrl}
                    alt="Beskär"
                    className="max-w-none select-none"
                    style={{
                      width: CROP_SIZE,
                      height: CROP_SIZE,
                      objectFit: "contain",
                    }}
                    draggable={false}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-stone-400 mb-1">Zoom</label>
                <input
                  type="range"
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none bg-retro-card border border-retro-border accent-retro-accent"
                />
              </div>
            </div>
            <div className="p-4 flex gap-3 border-t border-retro-border">
              <button
                type="button"
                onClick={handleCropCancel}
                className="flex-1 py-2.5 rounded-xl border border-retro-border text-stone-200 hover:bg-retro-card transition"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="flex-1 py-2.5 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition"
              >
                Använd bild
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="rounded-full bg-retro-card border border-retro-border overflow-hidden flex items-center justify-center shrink-0"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm text-retro-muted">Ingen</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-retro-border bg-retro-card cursor-pointer hover:bg-retro-surface transition text-stone-200 text-sm">
              Byt profilbild
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>

            {avatarFile && (
              <button
                type="button"
                onClick={() => setAvatarFile(null)}
                className="text-sm text-stone-400 hover:text-stone-100"
              >
                Ångra
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-retro-muted mt-3">
          Profilbilden sparas i Supabase Storage (bucket:{" "}
          <span className="font-mono">avatars</span>).
        </p>
      </div>

      <div ref={aliasRef} className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">
          Name / Display name
        </label>
        <input
          className={invalidFields.has("alias") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
          value={alias}
          onChange={(e) => {
            setAlias(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("alias"); return n; });
          }}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">
          Hemmabana
        </label>
        <select
          className={inputClass}
          value={homeCourse}
          onChange={(e) => setHomeCourse(e.target.value)}
        >
          <option value="">Välj bana</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Telefon</label>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+46 70 123 45 67"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Favorit disc</label>
          <select
            className={inputClass}
            value={favoriteDiscId}
            onChange={(e) => setFavoriteDiscId(e.target.value)}
          >
            <option value="">Ingen vald</option>
            {discs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {discs.length === 0 && (
            <p className="text-xs text-retro-muted">
              <Link href="/discs" className="text-retro-accent hover:underline">Lägg till discar</Link> först om du vill välja en favorit.
            </p>
          )}
        </div>
      </div>

      {/* Sök ort – fyller i både stad och land */}
      <div className="space-y-2" ref={locationDropdownRef}>
        <label className="block text-sm font-medium text-stone-300">
          Sök ort (stad och land)
        </label>
        <input
          className={inputClass}
          value={locationSearch}
          onChange={(e) => {
            setLocationSearch(e.target.value);
            setLocationDropdownOpen(true);
          }}
          onFocus={() => locationSuggestions.length > 0 && setLocationDropdownOpen(true)}
          placeholder="t.ex. Malmö eller Sverige"
          autoComplete="off"
        />
        {locationDropdownOpen && locationSuggestions.length > 0 && (
          <ul className="rounded-xl border border-retro-border bg-retro-surface shadow-lg overflow-hidden max-h-56 overflow-y-auto z-10">
            {locationSuggestions.map((p) => (
              <li key={`${p.city}-${p.country}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-stone-200 hover:bg-retro-card transition flex justify-between gap-2"
                  onClick={() => {
                    setCity(p.city);
                    setCountry(p.country);
                    setLocationSearch("");
                    setLocationDropdownOpen(false);
                  }}
                >
                  <span>{p.city}</span>
                  <span className="text-retro-muted shrink-0">{p.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Stad</label>
          <input
            className={inputClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Malmö"
            list="profile-city-list"
            autoComplete="off"
          />
          <datalist id="profile-city-list">
            {CITY_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Land</label>
          <input
            className={inputClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="t.ex. Sverige"
            list="profile-country-list"
            autoComplete="off"
          />
          <datalist id="profile-country-list">
            {COUNTRY_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">Lag</label>
        <select
          className={inputClass}
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">Inget lag</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {teams.length === 0 && (
          <p className="text-xs text-retro-muted">
            <Link href="/teams" className="text-retro-accent hover:underline">Lägg till lag</Link> först om du vill välja ett.
          </p>
        )}
      </div>

      <button
        disabled={saving}
        className="w-full rounded-xl bg-retro-accent text-stone-100 py-2.5 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>
    </form>
  );
}
