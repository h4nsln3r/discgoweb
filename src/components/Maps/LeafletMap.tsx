"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import type { Course } from "../Lists/CourseList";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Remove default loader to set custom URLs
const iconProto = L.Icon.Default.prototype as unknown as {
  _getIconUrl?: unknown;
};
delete iconProto._getIconUrl;

// Default (blue)
const defaultIcon = new L.Icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Active (green) – uses a green PNG (vanlig community-ikon)
const activeIcon = new L.Icon({
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ZOOM_SELECTED = 14;
const ZOOM_DEFAULT = 6;
const FALLBACK_CENTER: [number, number] = [58.2, 15.0];

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function toSafeCenter(lat: number, lng: number): [number, number] {
  if (isValidLatLng(lat, lng)) return [lat, lng];
  return FALLBACK_CENTER;
}

function MapViewController({
  selectedCourseId,
  courses,
  defaultCenter,
  centerOffsetPx,
  centerOffsetPxY,
  fitToCourses,
}: {
  selectedCourseId: string | null;
  courses: Course[];
  defaultCenter: [number, number];
  /** På desktop: pan efter fly. Positiv = pana vänster (panel till vänster), negativ = pana höger (panel till höger). */
  centerOffsetPx?: number;
  /** Vertikal pan: positiv = pana ner (innehållet skiftas uppåt, t.ex. för mobil med panel nedtill). */
  centerOffsetPxY?: number;
  fitToCourses?: boolean;
}) {
  const map = useMap();
  const lastCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      if (!course) return;
      const c = course as { latitude?: unknown; longitude?: unknown; lat?: unknown; lng?: unknown };
      const rawLat = c.latitude ?? c.lat;
      const rawLng = c.longitude ?? c.lng;
      const lat = typeof rawLat === "number" && Number.isFinite(rawLat) ? rawLat : Number(rawLat);
      const lng = typeof rawLng === "number" && Number.isFinite(rawLng) ? rawLng : Number(rawLng);
      const safeCenter = toSafeCenter(lat, lng);
      const useFallback = safeCenter[0] === FALLBACK_CENTER[0] && safeCenter[1] === FALLBACK_CENTER[1];
      const centerLat = Number.isFinite(safeCenter[0]) ? safeCenter[0] : 58.2;
      const centerLng = Number.isFinite(safeCenter[1]) ? safeCenter[1] : 15.0;
      const centerForFly: [number, number] = [centerLat, centerLng];
      if (!useFallback) lastCenterRef.current = centerForFly;
      else lastCenterRef.current = null;
      const offsetX = centerOffsetPx ?? 0;
      const offsetY = centerOffsetPxY ?? 0;
      if ((offsetX !== 0 || offsetY !== 0) && !useFallback) {
        map.once("moveend", () => {
          map.panBy([-offsetX, offsetY], { duration: 0.25 });
        });
      }
      const zoom = useFallback ? ZOOM_DEFAULT : ZOOM_SELECTED;
      let attempts = 0;
      const maxAttempts = 50;
      const doFly = () => {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          try {
            map.flyTo(centerForFly, zoom, { duration: 0.6 });
          } catch {
            map.setView(centerForFly, zoom);
          }
        } else if (attempts < maxAttempts) {
          attempts += 1;
          requestAnimationFrame(doFly);
        } else {
          try {
            map.setView(centerForFly, zoom);
          } catch {
            // Kartan har inte giltig storlek – ignorerar
          }
        }
      };
      map.whenReady(() => {
        requestAnimationFrame(doFly);
      });
    } else if (!fitToCourses) {
      const target = lastCenterRef.current ?? defaultCenter;
      const tLat = Number.isFinite(target[0]) ? target[0] : FALLBACK_CENTER[0];
      const tLng = Number.isFinite(target[1]) ? target[1] : FALLBACK_CENTER[1];
      const offsetX = centerOffsetPx ?? 0;
      const offsetY = centerOffsetPxY ?? 0;
      if (offsetX !== 0 || offsetY !== 0) {
        map.once("moveend", () => {
          map.panBy([-offsetX, offsetY], { duration: 0.25 });
        });
      }
      const fallbackLat = Number.isFinite(defaultCenter[0]) ? defaultCenter[0] : FALLBACK_CENTER[0];
      const fallbackLng = Number.isFinite(defaultCenter[1]) ? defaultCenter[1] : FALLBACK_CENTER[1];
      const targetCenter: [number, number] = !isValidLatLng(tLat, tLng) ? [fallbackLat, fallbackLng] : [tLat, tLng];
      lastCenterRef.current = null;
      let attemptsOther = 0;
      const doFlyOther = () => {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          try {
            map.flyTo(targetCenter, ZOOM_DEFAULT, { duration: 0.6 });
          } catch {
            map.setView(targetCenter, ZOOM_DEFAULT);
          }
        } else if (attemptsOther < 50) {
          attemptsOther += 1;
          requestAnimationFrame(doFlyOther);
        } else {
          try {
            map.setView(targetCenter, ZOOM_DEFAULT);
          } catch {
            // Kartan har inte giltig storlek
          }
        }
      };
      map.whenReady(() => {
        requestAnimationFrame(doFlyOther);
      });
    }
  }, [selectedCourseId, courses, defaultCenter, map, centerOffsetPx, centerOffsetPxY, fitToCourses]);

  return null;
}

function FitBoundsToCourses({
  courses,
  selectedCourseId,
}: {
  courses: Course[];
  selectedCourseId: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (selectedCourseId) return;
    const valid = courses.filter((c) => c.latitude != null && c.longitude != null);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].latitude!, valid[0].longitude!], 12, { animate: false });
      return;
    }
    const points = valid.map((c) => [c.latitude!, c.longitude!] as [number, number]);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8, animate: false });
  }, [courses, map, selectedCourseId]);
  return null;
}

type Props = {
  courses: Course[];
  onSelectCourse?: (course: Course) => void;
  selectedCourseId: string | null;
  /** Höjd på kartcontainern (t.ex. "280px" för inbäddad karta). */
  height?: string;
  /** På desktop: pan efter zoom så pricken hamnar mer till höger (px att pana åt vänster, t.ex. 180). */
  centerOffsetPx?: number;
  /** Vertikal pan: positiv = innehållet skiftas uppåt (t.ex. mobil med panel nedtill). */
  centerOffsetPxY?: number;
  /** Om true, centrera och zooma kartan så att alla banor visas. */
  fitToCourses?: boolean;
  /** På mobil: kräv en tryckning på kartan innan pan/zoom – så att sidan kan skrolla tills användaren aktivt väljer kartan. */
  isMobile?: boolean;
};

export default function LeafletMap({
  courses,
  onSelectCourse,
  selectedCourseId,
  height = "500px",
  centerOffsetPx,
  centerOffsetPxY,
  fitToCourses,
  isMobile = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [defaultZoom, setDefaultZoom] = useState(6);
  /** På mobil: kartan fångar inte touch förrän användaren tryckt en gång (så sidan kan skrolla). */
  const [touchActivated, setTouchActivated] = useState(false);
  useEffect(() => {
    setMounted(true);
    const tablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)");
    setDefaultZoom(tablet.matches ? 5 : 6);
    const listener = () => setDefaultZoom(tablet.matches ? 5 : 6);
    tablet.addEventListener("change", listener);
    return () => tablet.removeEventListener("change", listener);
  }, []);

  const defaultCenter: [number, number] = [58.2, 15.0]; // Södra Sverige

  if (!mounted) {
    return (
      <div
        className="w-full z-0 rounded-lg shadow bg-retro-card flex items-center justify-center"
        style={{ height }}
      >
        <div className="h-80 w-80 md:h-96 md:w-96 animate-spin">
          <Image
            src="/logo/disco.png"
            alt=""
            width={384}
            height={384}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
    );
  }

  const mapInteractive = !isMobile || touchActivated;

  return (
    <div className="relative w-full" style={{ height }}>
      <MapContainer
        key="dashboard-map"
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={mapInteractive}
        dragging={mapInteractive}
        className="w-full h-full z-0 rounded-lg shadow"
        style={{ height }}
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewController
        selectedCourseId={selectedCourseId}
        courses={courses}
        defaultCenter={defaultCenter}
        centerOffsetPx={centerOffsetPx}
        centerOffsetPxY={centerOffsetPxY}
        fitToCourses={fitToCourses}
      />
      {fitToCourses && <FitBoundsToCourses courses={courses} selectedCourseId={selectedCourseId} />}

      {/* Glow under vald bana på kartan */}
      {selectedCourseId &&
        courses
          .filter((c) => c.id === selectedCourseId && c.latitude && c.longitude)
          .map((course) => (
            <CircleMarker
              key={`glow-${course.id}`}
              center={[course.latitude!, course.longitude!]}
              radius={24}
              pathOptions={{
                color: "rgb(34, 197, 94)",
                fillColor: "rgb(34, 197, 94)",
                fillOpacity: 0.25,
                weight: 2,
              }}
            />
          ))}

      {courses
        .filter((c) => c.latitude && c.longitude)
        .map((course) => {
          const isActive = course.id === selectedCourseId;
          return (
            <Marker
              key={course.id}
              position={[course.latitude!, course.longitude!]}
              icon={isActive ? activeIcon : defaultIcon}
              zIndexOffset={isActive ? 1000 : 0} // bring active marker to front
              eventHandlers={{
                click: () => onSelectCourse?.(course),
              }}
            >
              <Popup>
                <strong>{course.name}</strong>
                <br />
                {course.location}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {isMobile && !touchActivated && (
        <button
          type="button"
          onClick={() => setTouchActivated(true)}
          className="absolute inset-0 z-[1000] w-full h-full min-h-full bg-stone-900/70 backdrop-blur-[2px] rounded-lg text-stone-200 text-sm font-medium touch-manipulation"
          style={{ touchAction: "pan-y" }}
          aria-label="Tryck för att använda kartan"
        >
          <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
            Tryck för att använda kartan
          </span>
        </button>
      )}
    </div>
  );
}
