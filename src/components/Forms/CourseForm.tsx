"use client";

import { useState } from "react";

type CourseFormProps = {
  initialName?: string;
  initialLocation?: string;
  initialLatitude?: string;
  initialLongitude?: string;
  initialImageUrls?: string[];
  initialMainImageUrl?: string;
  initialDescription?: string;
  initialCity?: string;
  initialCountry?: string;
  onSubmit: (data: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrls: string[];
    mainImageUrl: string;
    description: string;
    city: string;
    country: string;
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
  initialDescription = "",
  initialCity = "",
  initialCountry = "",
  onSubmit,
  submitText,
}: CourseFormProps) {
  const [name, setName] = useState(initialName);
  const [location, setLocation] = useState(initialLocation);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [description, setDescription] = useState(initialDescription);
  const [city, setCity] = useState(initialCity);
  const [country, setCountry] = useState(initialCountry);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
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
      description,
      city,
      country,
    });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block font-semibold mb-1 text-stone-200">
          Namn
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namn"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          required
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block font-semibold mb-1 text-stone-200">
          Plats (område eller park)
        </label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Plats"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          required
        />
      </div>

      {/* City & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block font-semibold mb-1 text-stone-200">
            Stad
          </label>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Stad"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
        </div>
        <div>
          <label htmlFor="country" className="block font-semibold mb-1 text-stone-200">
            Land
          </label>
          <input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Land"
            className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
          />
        </div>
      </div>

      {/* Latitude & Longitude */}
      <div>
        <label htmlFor="latitude" className="block font-semibold mb-1 text-stone-200">
          Latitud
        </label>
        <input
          id="latitude"
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitud"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
        />
      </div>

      <div>
        <label htmlFor="longitude" className="block font-semibold mb-1 text-stone-200">
          Longitud
        </label>
        <input
          id="longitude"
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitud"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block font-semibold mb-1 text-stone-200">
          Beskrivning
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv banan, använd radbrytningar och emojis"
          rows={5}
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded whitespace-pre-line focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
        />
      </div>

      {/* Bilder */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-stone-200">Bilder (max 5):</span>
          <button
            type="button"
            onClick={handleAddImage}
            disabled={imageUrls.length >= 5}
            className="text-sm text-retro-accent hover:underline"
          >
            Lägg till bild
          </button>
        </div>

        {imageUrls.map((url, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <label
                htmlFor={`imageUrl-${index}`}
                className="block text-sm font-medium mb-0.5 text-stone-300"
              >
                Bild-URL {index + 1}
              </label>
              <input
                id={`imageUrl-${index}`}
                type="url"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="Bild-URL"
                className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
              />
            </div>

            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-16 h-16 object-cover rounded border border-retro-border"
              />
            )}

            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="text-amber-400 text-sm hover:underline"
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

      {/* Main Image URL */}
      <div className="space-y-1">
        <label htmlFor="mainImageUrlInput" className="block font-semibold text-stone-200">
          Huvudbild-URL (redigera direkt)
        </label>
        <input
          id="mainImageUrlInput"
          type="url"
          value={mainImageUrl}
          onChange={(e) => setMainImageUrl(e.target.value)}
          placeholder="Ange eller klistra in URL för huvudbild"
          className="w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="bg-retro-accent text-stone-100 px-4 py-2 rounded-lg hover:bg-retro-accent-hover transition disabled:opacity-50"
      >
        {loading ? "Sparar..." : submitText}
      </button>
    </form>
  );
}
