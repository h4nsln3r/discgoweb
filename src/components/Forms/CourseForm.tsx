"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { uploadCourseImage } from "@/lib/course-uploads";
import { CITY_COUNTRY_PAIRS, CITY_SUGGESTIONS, COUNTRY_SUGGESTIONS } from "@/data/location-suggestions";
import dynamic from "next/dynamic";

const CourseLocationPicker = dynamic(
  () => import("@/components/Maps/CourseLocationPicker").then((m) => m.default),
  { ssr: false, loading: () => <div className="h-64 rounded-xl border border-retro-border bg-retro-card animate-pulse" /> }
);

export type CourseHole = {
  hole_number: number;
  par: number;
  length: number | null;
};

type CourseFormProps = {
  initialName?: string;
  initialLocation?: string;
  initialLatitude?: string;
  initialLongitude?: string;
  initialImageUrls?: string[];
  initialMainImageUrl?: string;
  initialDescription?: string;
  initialCity?: string;
  initialCountry?: string;
  initialHoles?: CourseHole[];
  onSubmit: (data: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrls: string[];
    mainImageUrl: string;
    description: string;
    city: string;
    country: string;
    holes: CourseHole[];
  }) => Promise<void>;
  submitText: string;
};

const HOLE_OPTIONS = [0, 9, 12, 18] as const;

function defaultHoles(count: number): CourseHole[] {
  return Array.from({ length: count }, (_, i) => ({
    hole_number: i + 1,
    par: 3,
    length: null as number | null,
  }));
}

export default function CourseForm({
  initialName = "",
  initialLocation = "",
  initialLatitude = "",
  initialLongitude = "",
  initialImageUrls = [],
  initialMainImageUrl = "",
  initialDescription = "",
  initialCity = "",
  initialCountry = "",
  initialHoles = [],
  onSubmit,
  submitText,
}: CourseFormProps) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [description, setDescription] = useState(initialDescription);
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [mainImageUrl, setMainImageUrl] = useState(initialMainImageUrl);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

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

  const numHolesOption = useMemo((): 0 | 9 | 12 | 18 => {
    const n = initialHoles.length;
    if (n === 0) return 0;
    if (n <= 9) return 9;
    if (n <= 12) return 12;
    return 18;
  }, [initialHoles.length]);
  const [numHoles, setNumHoles] = useState<0 | 9 | 12 | 18>(numHolesOption);
  const [holes, setHoles] = useState<CourseHole[]>(() => {
    if (initialHoles.length === 0) return [];
    const sorted = [...initialHoles].sort((a, b) => a.hole_number - b.hole_number);
    const count = numHolesOption;
    const next = defaultHoles(count);
    sorted.forEach((h, i) => {
      if (i < next.length) next[i] = { hole_number: i + 1, par: h.par, length: h.length };
    });
    return next;
  });

  const syncHolesToCount = (count: 0 | 9 | 12 | 18) => {
    if (count === 0) {
      setHoles([]);
      return;
    }
    setHoles((prev) => {
      const next = defaultHoles(count);
      prev.forEach((h, i) => {
        if (i < next.length) {
          next[i] = { hole_number: i + 1, par: h.par, length: h.length };
        }
      });
      return next;
    });
  };

  const addImageByUrl = () => {
    const url = newUrlInput.trim();
    if (!url || imageUrls.length >= 5) return;
    setImageUrls((prev) => [...prev, url]);
    setNewUrlInput("");
    if (!mainImageUrl) setMainImageUrl(url);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || imageUrls.length >= 5) return;
    setUploading(true);
    const url = await uploadCourseImage(supabase, file);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (url) {
      setImageUrls((prev) => [...prev, url]);
      if (!mainImageUrl) setMainImageUrl(url);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...imageUrls];
    const [removed] = updated.splice(index, 1);
    setImageUrls(updated);
    if (mainImageUrl === removed) {
      setMainImageUrl(updated[0] ?? "");
    }
  };

  const setMainByClick = (url: string) => {
    setMainImageUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = new Set<string>();
    if (!name.trim()) invalid.add("name");
    if (!location.trim()) invalid.add("location");
    if (invalid.size > 0) {
      setInvalidFields(invalid);
      (invalid.has("name") ? nameRef.current : locationRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);
    await onSubmit({
      name,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      imageUrls,
      mainImageUrl,
      description,
      city,
      country,
      holes: numHoles === 0 ? [] : holes,
    });
    setLoading(false);
  };

  const setHolePar = (index: number, par: number) => {
    setHoles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], par };
      return next;
    });
  };
  const setHoleLength = (index: number, length: number | null) => {
    setHoles((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], length };
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div ref={nameRef}>
        <label htmlFor="name" className="block font-semibold mb-1 text-stone-200">
          Namn
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("name"); return n; });
          }}
          placeholder="Namn"
          className={`w-full border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 placeholder:text-stone-500 ${invalidFields.has("name") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
          required
        />
      </div>

      {/* Location */}
      <div ref={locationRef}>
        <label htmlFor="location" className="block font-semibold mb-1 text-stone-200">
          Plats (område eller park)
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("location"); return n; });
          }}
          placeholder="Plats"
          className={`w-full border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 placeholder:text-stone-500 ${invalidFields.has("location") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
          required
        />
      </div>

      {/* Sök ort – fyller i både stad och land */}
      <div className="space-y-2" ref={locationDropdownRef}>
        <label className="block font-semibold text-stone-200">
          Sök ort (stad och land)
        </label>
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => {
            setLocationSearch(e.target.value);
            setLocationDropdownOpen(true);
          }}
          onFocus={() => locationSuggestions.length > 0 && setLocationDropdownOpen(true)}
          placeholder="t.ex. Malmö eller Sverige"
          autoComplete="off"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
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

      {/* Stad & Land */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block font-semibold mb-1 text-stone-200">
            Stad
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => {
              const v = e.target.value;
              setCity(v);
              const q = v.trim().toLowerCase();
              if (q) {
                const pair = CITY_COUNTRY_PAIRS.find((p) => p.city.trim().toLowerCase() === q);
                if (pair) setCountry(pair.country);
              }
            }}
            placeholder="t.ex. Malmö"
            list="course-city-list"
            autoComplete="off"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
          <datalist id="course-city-list">
            {CITY_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="country" className="block font-semibold mb-1 text-stone-200">
            Land
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="t.ex. Sverige"
            list="course-country-list"
            autoComplete="off"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
          <datalist id="course-country-list">
            {COUNTRY_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Karta och adresssökning för position (lat/long) */}
      <CourseLocationPicker
        latitude={latitude}
        longitude={longitude}
        onLatLngChange={(lat, lng) => {
          setLatitude(String(lat));
          setLongitude(String(lng));
        }}
        addressSuggestion={[location, city, country].filter(Boolean).join(", ")}
      />

      {/* Latitud & Longitud (kan fyllas i via karta/adress ovan eller manuellt) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="latitude" className="block font-semibold mb-1 text-stone-200">
            Latitud
          </label>
          <input
            id="latitude"
            type="text"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="t.ex. 55.61"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
        </div>
        <div>
          <label htmlFor="longitude" className="block font-semibold mb-1 text-stone-200">
            Longitud
          </label>
          <input
            id="longitude"
            type="text"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="t.ex. 13.00"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block font-semibold mb-1 text-stone-200">
          Beskrivning
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv banan, använd radbrytningar och emojis"
          rows={5}
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded whitespace-pre-line focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
        />
      </div>

      {/* Bilder: grid med klick för huvudbild + lägg till via URL eller uppladdning */}
      <div className="space-y-4">
        <span className="font-semibold text-stone-200 block">Bilder (max 5)</span>
        <p className="text-sm text-stone-400">
          Klicka på en bild för att välja den som huvudbild. Du kan lägga till bilder via URL eller ladda upp en fil.
        </p>

        {imageUrls.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {imageUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative group rounded-xl overflow-hidden border-2 transition-all bg-retro-card"
              >
                <button
                  type="button"
                  onClick={() => setMainByClick(url)}
                  className={`w-full aspect-[4/3] block text-left outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-retro-bg focus:ring-retro-accent rounded-lg overflow-hidden ${
                    mainImageUrl === url
                      ? "ring-2 ring-retro-accent border-retro-accent"
                      : "border-transparent hover:border-stone-500"
                  }`}
                  title={mainImageUrl === url ? "Huvudbild (klicka för att behålla)" : "Klicka för att sätta som huvudbild"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Bana ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {mainImageUrl === url && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium bg-retro-accent text-stone-100 shadow">
                      Huvudbild
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-stone-100 hover:bg-red-600/90 flex items-center justify-center text-sm transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Ta bort bild"
                  aria-label="Ta bort bild"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {imageUrls.length < 5 && (
          <div className="rounded-xl border border-retro-border bg-retro-card/30 p-4 space-y-3">
            <span className="text-sm font-medium text-stone-300 block">Lägg till bild</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageByUrl())}
                  placeholder="https://... (bild-URL)"
                  className="flex-1 border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500 text-sm"
                />
                <button
                  type="button"
                  onClick={addImageByUrl}
                  disabled={!newUrlInput.trim()}
                  className="px-3 py-2 rounded bg-retro-surface border border-retro-border text-stone-200 text-sm font-medium hover:bg-retro-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lägg till URL
                </button>
              </div>
              <div className="flex items-center">
                <input
                  id="course-image-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <label
                  htmlFor="course-image-upload"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded border border-retro-border bg-retro-surface text-stone-200 text-sm transition ${
                    uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-retro-card"
                  }`}
                >
                  {uploading ? "Laddar upp…" : "Ladda upp bild"}
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hål (valfritt): antal, par och längd per hål */}
      <div className="space-y-3 rounded-xl border border-retro-border bg-retro-card/30 p-4">
        <div className="flex items-center gap-2">
          <label htmlFor="numHoles" className="font-semibold text-stone-200">
            Antal hål (valfritt)
          </label>
          <select
            id="numHoles"
            value={numHoles}
            onChange={(e) => {
              const v = Number(e.target.value) as 0 | 9 | 12 | 18;
              setNumHoles(v);
              syncHolesToCount(v);
            }}
            className="border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent"
          >
            <option value={0}>Ingen hålinfo</option>
            {HOLE_OPTIONS.filter((n) => n > 0).map((n) => (
              <option key={n} value={n}>{n} hål</option>
            ))}
          </select>
        </div>
        {holes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-stone-400">Par är obligatoriskt, längd (meter) valfritt.</p>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {holes.map((hole, index) => (
                <div key={hole.hole_number} className="grid grid-cols-[auto_1fr_1fr] gap-2 items-center">
                  <span className="text-stone-300 text-sm w-8">Hål {hole.hole_number}</span>
                  <div>
                    <label className="sr-only">Par</label>
                    <select
                      value={hole.par}
                      onChange={(e) => setHolePar(index, Number(e.target.value))}
                      className="w-full border border-retro-border bg-retro-surface text-stone-100 p-1.5 rounded text-sm"
                    >
                      {[3, 4, 5].map((p) => (
                        <option key={p} value={p}>Par {p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="sr-only">Längd (m)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="Längd m"
                      value={hole.length ?? ""}
                      onChange={(e) => setHoleLength(index, e.target.value ? Number(e.target.value) : null)}
                      className="w-full border border-retro-border bg-retro-surface text-stone-100 p-1.5 rounded text-sm placeholder:text-stone-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="bg-retro-accent text-stone-100 px-4 py-2 rounded-lg hover:bg-retro-accent-hover transition disabled:opacity-50"
      >
        {loading ? "Sparar..." : submitText}
      </button>
    </form>
  );
}
