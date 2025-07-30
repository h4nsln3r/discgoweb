"use client";

import { useState } from "react";

type CourseData = {
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
  mainImageUrl: string;
  description: string;
  city: string;
  country: string;
};

export default function MapEmbed({ course }: { course: CourseData }) {
  const [satellite, setSatellite] = useState(true); // Satellit som default
  const zoomLevel = 18; // Mer inzoomad vy

  // Karta: lat/long eller fallback till namn+adress
  const mapSrc =
    course.latitude && course.longitude
      ? `https://www.google.com/maps?q=${course.latitude},${
          course.longitude
        }&t=${satellite ? "k" : ""}&hl=sv&z=${zoomLevel}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(
          course.name + " " + course.location
        )}&t=${satellite ? "k" : ""}&hl=sv&z=${zoomLevel}&output=embed`;

  // Länk till vägbeskrivning
  const directionsHref =
    course.latitude && course.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${course.latitude},${course.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          course.name + " " + course.location
        )}`;

  return (
    <>
      {/* Karta */}
      <iframe
        title="Google Maps"
        width="100%"
        height="300"
        className="rounded-lg shadow"
        src={mapSrc}
        allowFullScreen
      ></iframe>

      {/* Toggle mellan kartvy/satellit */}
      <div className="flex gap-2">
        <button
          onClick={() => setSatellite(!satellite)}
          className="flex-1 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Byt till {satellite ? "karta" : "satellit"}
        </button>

        {/* Vägbeskrivningsknapp */}
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Få vägbeskrivning
        </a>
      </div>
    </>
  );
}
