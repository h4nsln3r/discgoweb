"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Course } from "../CourseList";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Remove default loader to set custom URLs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

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

// Active (green) – uses a green PNG (vanlig community‑ikon)
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

type Props = {
  courses: Course[];
  onSelectCourse?: (course: Course) => void;
  selectedCourseId: string | null;
};

export default function LeafletMap({
  courses,
  onSelectCourse,
  selectedCourseId,
}: Props) {
  const swedenCenter: [number, number] = [62.0, 15.0];

  return (
    <MapContainer
      center={swedenCenter}
      zoom={5}
      scrollWheelZoom={true}
      className="w-full z-0 rounded-lg shadow"
      style={{ height: "500px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

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
