"use client";

import { useState } from "react";
import { MapIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

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
  const [satellite, setSatellite] = useState(true);
  const zoomLevel = 18;

  const mapSrc =
    course.latitude && course.longitude
      ? `https://www.google.com/maps?q=${course.latitude},${course.longitude}&t=${satellite ? "k" : ""}&hl=sv&z=${zoomLevel}&output=embed`
      : `https://www.google.com/maps?q=${encodeURIComponent(course.name + " " + course.location)}&t=${satellite ? "k" : ""}&hl=sv&z=${zoomLevel}&output=embed`;

  const directionsHref =
    course.latitude && course.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${course.latitude},${course.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(course.name + " " + course.location)}`;

  return (
    <>
      <iframe
        title="Karta"
        width="100%"
        height="300"
        className="rounded-xl border border-retro-border shadow"
        src={mapSrc}
        allowFullScreen
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSatellite(!satellite)}
          className="inline-flex items-center gap-2 rounded-xl border border-retro-border bg-retro-surface px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-retro-card hover:text-stone-100 transition"
        >
          <MapIcon className="w-4 h-4 shrink-0" />
          {satellite ? "Karta" : "Satellit"}
        </button>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-retro-border bg-retro-surface px-4 py-2.5 text-sm font-medium text-stone-200 hover:bg-retro-card hover:text-stone-100 transition"
        >
          Vägbeskrivning
          <ArrowTopRightOnSquareIcon className="w-4 h-4 shrink-0" />
        </a>
      </div>
    </>
  );
}
