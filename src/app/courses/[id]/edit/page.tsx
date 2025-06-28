"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [userId, setUserId] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Hämta inloggad användare
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
    };
    getUser();
  }, [supabase]);

  // Hämta kursdata
  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "name, location, latitude, longitude, image_urls, main_image_url, created_by"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Fetch error:", error);
        return;
      }

      if (data) {
        setName(data.name);
        setLocation(data.location ?? "");
        setLatitude(data.latitude?.toString() || "");
        setLongitude(data.longitude?.toString() || "");
        setCreatorId(data.created_by || null);

        let images: string[] = [];
        if (Array.isArray(data.image_urls)) {
          images = data.image_urls;
        } else if (typeof data.image_urls === "string") {
          try {
            const parsed = JSON.parse(data.image_urls);
            if (Array.isArray(parsed)) images = parsed;
          } catch {
            console.warn(
              "Kunde inte parsa image_urls som JSON-sträng:",
              data.image_urls
            );
          }
        }
        setImageUrls(images);
        setMainImageUrl(data.main_image_url || "");
      }
    };

    fetchCourse();
  }, [id, supabase]);

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

    setLoading(false);

    if (error) {
      console.error("Update error:", error);
      alert("Fel vid uppdatering");
    } else {
      alert("Banan uppdaterad!");
      router.push(`/courses/${id}`);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Är du säker på att du vill ta bort banan? Detta går inte att ångra."
    );
    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase.from("courses").delete().eq("id", id);

    setLoading(false);

    if (error) {
      console.error("Delete error:", error);
      alert("Fel vid borttagning");
    } else {
      alert("Banan har tagits bort.");
      router.push("/courses");
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Redigera bana</h1>

      {mainImageUrl && (
        <div className="space-y-2">
          <h2 className="font-semibold">Huvudbild (förhandsgranskning):</h2>
          <img
            src={mainImageUrl}
            alt="Main preview"
            className="w-48 h-32 object-cover rounded border"
          />
        </div>
      )}

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
            value={location}
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
            value={latitude}
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
            value={longitude}
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

          {Array.isArray(imageUrls) &&
            imageUrls.map((url, index) => (
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
          {loading ? "Sparar..." : "Spara ändringar"}
        </button>

        {userId && creatorId && userId === creatorId && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded"
          >
            Ta bort bana
          </button>
        )}
      </form>
    </div>
  );
}
