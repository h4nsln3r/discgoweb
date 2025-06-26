// src/app/courses/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Hämta kursdata
  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "name, location, latitude, longitude, image_urls, main_image_url"
        )
        .eq("id", id)
        .single();

      console.log("error", error);

      if (data) {
        setName(data.name);
        setLocation(data.location ?? "");
        setLatitude(data.latitude?.toString() || "");
        setLongitude(data.longitude?.toString() || "");
        console.log("data.image_urls", data.image_urls);
        const images: string[] = data.image_urls ? data.image_urls : [];
        console.log("images", images);
        setImageUrls([data.image_urls] || []);
        setMainImageUrl(data.main_image_url || "");
      }
    };
    fetchCourse();
  }, [id]);

  // Spara ändringar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("courses")
      .update({
        name,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_urls: imageUrls,
        main_image_url: mainImageUrl,
      })
      .eq("id", id);

    if (!error) {
      alert("Banan uppdaterad!");
      router.push(`/courses/${id}`);
    } else {
      console.error("Update error:", error);
      alert("Fel vid uppdatering");
    }

    setLoading(false);
  };

  // Hantera bilder
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
    const removed = updated.splice(index, 1);
    setImageUrls(updated);
    if (mainImageUrl === removed[0]) {
      setMainImageUrl("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Redigera bana</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Namn"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Plats"
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="text"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="Latitud"
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="Longitud"
          className="w-full border p-2 rounded"
        />

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
          {mainImageUrl}
          <hr></hr>
          {(console.log("setImageUrls"), imageUrls)}

          {imageUrls?.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="Bild-URL"
                className="flex-1 border p-2 rounded"
              />
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

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Sparar..." : "Spara ändringar"}
        </button>
      </form>
    </div>
  );
}
