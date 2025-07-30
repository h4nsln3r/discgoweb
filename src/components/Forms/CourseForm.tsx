"use client";

import { useState } from "react";

type CourseFormProps = {
  initialName?: string;
  initialLocation?: string | null;
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
  initialImageUrls?: string[] | null;
  initialMainImageUrl?: string;
  onSubmit: (data: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrls: string[];
    mainImageUrl: string;
  }) => Promise<void>;
  submitText: string;
};

export default function CourseForm({
  initialName = "",
  initialLocation = "",
  initialLatitude = "",
  initialLongitude = "",
  initialImageUrls = [],
  initialMainImageUrl = "",
  onSubmit,
  submitText,
}: CourseFormProps) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [imageUrls, setImageUrls] = useState<string[]>(
    initialImageUrls ?? [""]
  );
  const [mainImageUrl, setMainImageUrl] = useState(initialMainImageUrl);
  const [loading, setLoading] = useState(false);

  const handleAddImage = () => {
    if (imageUrls.length >= 5) return;
    setImageUrls([...imageUrls, ""]);
  };

  const handleImageChange = (index: number, url: string) => {
    const updated = [...imageUrls];
    updated[index] = url;
    setImageUrls(updated);
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...imageUrls];
    const [removed] = updated.splice(index, 1);
    setImageUrls(updated);
    if (mainImageUrl === removed) {
      setMainImageUrl("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({
      name,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      imageUrls,
      mainImageUrl,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block font-semibold mb-1">
          Namn
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namn"
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="location" className="block font-semibold mb-1">
          Plats
        </label>
        <input
          id="location"
          type="text"
          value={location ?? ""}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Plats"
          className="w-full border p-2 rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="latitude" className="block font-semibold mb-1">
          Latitud
        </label>
        <input
          id="latitude"
          type="text"
          value={latitude ?? ""}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitud"
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="longitude" className="block font-semibold mb-1">
          Longitud
        </label>
        <input
          id="longitude"
          type="text"
          value={longitude ?? ""}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitud"
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Bilder (max 5):</span>
          <button
            type="button"
            onClick={handleAddImage}
            disabled={imageUrls.length >= 5}
            className="text-sm text-blue-600"
          >
            Lägg till bild
          </button>
        </div>

        {imageUrls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <label
                htmlFor={`imageUrl-${index}`}
                className="block text-sm font-medium mb-0.5"
              >
                Bild-URL {index + 1}
              </label>
              <input
                id={`imageUrl-${index}`}
                type="url"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="Bild-URL"
                className="w-full border p-2 rounded"
              />
            </div>

            {url && (
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border"
              />
            )}

            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="text-red-600 text-sm"
            >
              Ta bort
            </button>

            <input
              type="radio"
              name="mainImage"
              checked={mainImageUrl === url}
              onChange={() => setMainImageUrl(url)}
              title="Ange som huvudbild"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label htmlFor="mainImageUrlInput" className="block font-semibold">
          Huvudbild-URL (redigera direkt)
        </label>
        <input
          id="mainImageUrlInput"
          type="url"
          value={mainImageUrl}
          onChange={(e) => setMainImageUrl(e.target.value)}
          placeholder="Ange eller klistra in URL för huvudbild"
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Sparar..." : submitText}
      </button>
    </form>
  );
}
