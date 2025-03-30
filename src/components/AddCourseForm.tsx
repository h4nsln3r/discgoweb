"use client";

import { useState } from "react";

export default function AddCourseForm() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      alert("Bana skapad!");
      setName("");
      setLocation("");
      setLatitude("");
      setLongitude("");
      setImageUrl("");
    } else {
      alert("Fel vid skapande");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-w-md">
      <h2 className="text-xl font-semibold">Lägg till ny bana</h2>

      <input
        type="text"
        placeholder="Banans namn"
        className="border p-2 w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Plats / stad"
        className="border p-2 w-full"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        required
      />

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
