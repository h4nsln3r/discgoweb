// components/OnboardingForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

type Course = { id: string; name: string };
type Profile = {
  id: string;
  avatar_url: string | null;
  alias: string | null;
  home_course: string | null;
} | null;

export default function OnboardingForm({
  profile,
  courses,
}: {
  profile: Profile;
  courses: Course[];
}) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [alias, setAlias] = useState(profile?.alias ?? "");
  // We only need the current avatar url for preview when no new file is chosen.
  // (Keeping the setter triggers a no-unused-vars error.)
  const [avatarUrl] = useState(profile?.avatar_url ?? "");
  const [homeCourse, setHomeCourse] = useState(profile?.home_course ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Helper: resize + compress ---
  const resizeImage = (file: File, maxSize = 512): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No ctx");

        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject("Canvas toBlob failed");
          },
          "image/jpeg",
          0.8
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (): Promise<string | null> => {
    if (!file) return avatarUrl || null;
    const compressed = await resizeImage(file);

    // ✅ ENBART filnamn, ingen "avatars/" här
    const filePath = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, compressed, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const uploadedUrl = await handleFileUpload();

      const res = await fetch("/api/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias,
          avatar_url: uploadedUrl,
          home_course: homeCourse || null,
        }),
        credentials: "include", // 🔴 viktig: skicka session-cookies till API-route
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Kunde inte spara profil");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Visningsnamn
        </label>
        <input
          required
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Ditt namn eller alias"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Profilbild
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Preview"
            className="mt-2 h-24 w-24 rounded-full object-cover border"
          />
        )}
        <p className="text-xs text-gray-600 mt-1">
          Bilden komprimeras automatiskt.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hembana (valfritt)
        </label>
        <select
          value={homeCourse ?? ""}
          onChange={(e) => setHomeCourse(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Välj bana</option>
          {courses.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {loading ? "Sparar..." : "Spara och fortsätt"}
      </button>
    </form>
  );
}
