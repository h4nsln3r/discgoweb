"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Course } from "./CourseList";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LeafletMap({ courses }: { courses: Course[] }) {
  const swedenCenter: [number, number] = [62.0, 15.0];

  return (
    <div className="mt-10">
      <MapContainer
        center={swedenCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full z-0 rounded-lg shadow"
        style={{ height: "500px" }} // ✅ fixar höjd
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {courses
          .filter((c) => c.latitude && c.longitude)
          .map((course) => (
            <Marker
              key={course.id}
              position={[course.latitude!, course.longitude!]}
            >
              <Popup>
                <strong>{course.name}</strong>
                <br />
                {course.location}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
