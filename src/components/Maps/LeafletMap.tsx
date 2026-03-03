"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import type { Course } from "../CourseList";
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

function isValidLatLng(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
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
      const lat = Number(course.latitude);
      const lng = Number(course.longitude);
      if (!isValidLatLng(lat, lng)) return;
      const center: [number, number] = [lat, lng];
      if (!isValidLatLng(center[0], center[1])) return;
      lastCenterRef.current = center;
      const offsetX = centerOffsetPx ?? 0;
      const offsetY = centerOffsetPxY ?? 0;
      if (offsetX !== 0 || offsetY !== 0) {
        map.once("moveend", () => {
          map.panBy([-offsetX, offsetY], { duration: 0.25 });
        });
      }
      map.flyTo(center, ZOOM_SELECTED, { duration: 0.6 });
    } else if (!fitToCourses) {
      const target = lastCenterRef.current ?? defaultCenter;
      const [tLat, tLng] = target;
      const offsetX = centerOffsetPx ?? 0;
      const offsetY = centerOffsetPxY ?? 0;
      if (offsetX !== 0 || offsetY !== 0) {
        map.once("moveend", () => {
          map.panBy([-offsetX, offsetY], { duration: 0.25 });
        });
      }
      if (!isValidLatLng(tLat, tLng)) {
        lastCenterRef.current = null;
        map.flyTo(defaultCenter, ZOOM_DEFAULT, { duration: 0.6 });
      } else {
        map.flyTo(target, ZOOM_DEFAULT, { duration: 0.6 });
        lastCenterRef.current = null;
      }
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
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14, animate: false });
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
};

export default function LeafletMap({
  courses,
  onSelectCourse,
  selectedCourseId,
  height = "500px",
  centerOffsetPx,
  centerOffsetPxY,
  fitToCourses,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [defaultZoom, setDefaultZoom] = useState(6);
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

  return (
    <MapContainer
      key="dashboard-map"
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={true}
      className="w-full z-0 rounded-lg shadow"
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
  );
}
