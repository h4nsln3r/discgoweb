// components/AddCourseForm.tsx
"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/Toasts/ToastProvider";

export default function AddCourseForm({
  onCourseCreated,
}: {
  onCourseCreated: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const nameRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

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

    const res = await fetch("/api/create-course", {
      method: "POST",
      body: JSON.stringify({
        name,
        location,
        latitude,
        longitude,
        image_url: imageUrl,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setName("");
      setLocation("");
      setLatitude("");
      setLongitude("");
      setImageUrl("");
      onCourseCreated();
      showToast("Banan skapades!", "success");
    } else {
      showToast("Kunde inte skapa banan.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Lägg till ny bana</h2>

      <div ref={nameRef}>
        <input
          type="text"
          placeholder="Banans namn"
          className={`border p-2 w-full ${invalidFields.has("name") ? "border-red-500 ring-2 ring-red-500/50" : ""}`}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("name"); return n; });
          }}
          required
        />
      </div>

      <div ref={locationRef}>
        <input
          type="text"
          placeholder="Plats / stad"
          className={`border p-2 w-full ${invalidFields.has("location") ? "border-red-500 ring-2 ring-red-500/50" : ""}`}
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setInvalidFields((p) => { const n = new Set(p); n.delete("location"); return n; });
          }}
          required
        />
      </div>

      <input
        type="text"
        placeholder="Latitud (valfritt)"
        className="border p-2 w-full"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
      />

      <input
        type="text"
        placeholder="Longitud (valfritt)"
        className="border p-2 w-full"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
      />

      <input
        type="text"
        placeholder="Bild-URL (valfritt)"
        className="border p-2 w-full"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Skapar..." : "Skapa bana"}
      </button>
    </form>
  );
}
