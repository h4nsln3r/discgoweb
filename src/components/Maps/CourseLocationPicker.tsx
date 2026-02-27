"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon (same as LeafletMap)
const iconProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete iconProto._getIconUrl;

const defaultIcon = new L.Icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const DEFAULT_CENTER: [number, number] = [55.6, 13.0]; // Malmö-området
const DEFAULT_ZOOM = 8;

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Fly map to lat/lng when they change (e.g. after geocode). */
function FlyTo({ lat, lng, zoom = 16 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (isValidLatLng(lat, lng)) {
      map.flyTo([lat, lng], zoom, { duration: 0.5 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

/** Listen to map click and report position. */
function MapClickHandler({
  onLatLngChange,
}: {
  onLatLngChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isValidLatLng(lat, lng)) {
        onLatLngChange(lat, lng);
      }
    },
  });
  return null;
}

type PickerMapInnerProps = {
  lat: number | null;
  lng: number | null;
  onLatLngChange: (lat: number, lng: number) => void;
};

function PickerMapInner({ lat, lng, onLatLngChange }: PickerMapInnerProps) {
  const position: [number, number] | null =
    lat != null && lng != null && isValidLatLng(lat, lng) ? [lat, lng] : null;
  const center: [number, number] = position ?? DEFAULT_CENTER;
  const zoom = position ? 15 : DEFAULT_ZOOM;

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {position && <FlyTo lat={position[0]} lng={position[1]} zoom={15} />}
      <MapClickHandler onLatLngChange={onLatLngChange} />
      {position && (
        <Marker
          position={position}
          icon={defaultIcon}
          draggable
          eventHandlers={{
            dragend(e) {
              const ll = e.target.getLatLng();
              if (isValidLatLng(ll.lat, ll.lng)) {
                onLatLngChange(ll.lat, ll.lng);
              }
            },
          }}
        />
      )}
    </>
  );
}

/** Geocode via Nominatim (OpenStreetMap). Returns { lat, lng } or null. */
async function geocode(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q,
    format: "json",
    limit: "1",
  })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Discgoweb/1.0 (disc golf course location picker)" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

type CourseLocationPickerProps = {
  latitude: string;
  longitude: string;
  onLatLngChange: (lat: number, lng: number) => void;
  /** Förslag till adress (t.ex. plats + stad + land). */
  addressSuggestion?: string;
};

export default function CourseLocationPicker({
  latitude,
  longitude,
  onLatLngChange,
  addressSuggestion = "",
}: CourseLocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [addressQuery, setAddressQuery] = useState("");
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lat = latitude ? parseFloat(latitude) : null;
  const lng = longitude ? parseFloat(longitude) : null;
  const hasValidPosition = lat != null && lng != null && isValidLatLng(lat, lng);

  const handleGeocode = useCallback(async () => {
    const query = addressQuery.trim() || addressSuggestion.trim();
    if (!query) {
      setGeocodeError("Skriv en adress eller plats.");
      return;
    }
    setGeocodeError(null);
    setGeocodeLoading(true);
    try {
      const result = await geocode(query);
      if (result) {
        onLatLngChange(result.lat, result.lng);
      } else {
        setGeocodeError("Hittade ingen position för den adressen.");
      }
    } catch {
      setGeocodeError("Kunde inte söka. Försök igen.");
    } finally {
      setGeocodeLoading(false);
    }
  }, [addressQuery, addressSuggestion, onLatLngChange]);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-retro-border bg-retro-card h-64 flex items-center justify-center text-stone-500 text-sm">
        Laddar karta…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block font-semibold mb-1 text-stone-200">
          Sök position från adress
        </label>
        <p className="text-xs text-stone-500 mb-2">
          Skriv en adress eller plats (t.ex. &quot;Järnvägsgatan 1, Malmö&quot; eller &quot;Kärsön, Stockholm&quot;) och klicka Sök – då fylls latitud och longitud i automatiskt. Du kan också klicka på kartan nedan för att sätta en prick.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={addressQuery || addressSuggestion}
            onChange={(e) => {
              setAddressQuery(e.target.value);
              setGeocodeError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGeocode())}
            placeholder="Adress eller plats"
            className="flex-1 border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500 text-sm"
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={geocodeLoading}
            className="px-3 py-2 rounded-lg bg-retro-accent text-stone-100 text-sm font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
          >
            {geocodeLoading ? "Söker…" : "Sök"}
          </button>
        </div>
        {geocodeError && (
          <p className="text-amber-300 text-sm mt-1">{geocodeError}</p>
        )}
      </div>

      <div className="rounded-xl border border-retro-border overflow-hidden bg-retro-card">
        <p className="text-xs text-stone-500 px-3 py-2 border-b border-retro-border">
          Klicka på kartan för att sätta banans position, eller dra markören.
        </p>
        <div className="h-64 w-full">
          <MapContainer
            center={hasValidPosition ? [lat!, lng!] : DEFAULT_CENTER}
            zoom={hasValidPosition ? 15 : DEFAULT_ZOOM}
            scrollWheelZoom
            className="h-full w-full"
            style={{ minHeight: 256 }}
          >
            <PickerMapInner
              lat={lat}
              lng={lng}
              onLatLngChange={onLatLngChange}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
