"use client";

import { useEffect, useMemo, useState } from "react";
import type { Database } from "@/types/supabase";
import { createSupabaseClient } from "@/lib/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Course = Pick<
  Database["public"]["Tables"]["courses"]["Row"],
  "id" | "name"
>;

export default function ProfileForm({
  profile,
  courses,
}: {
  profile: Profile | null;
  courses: Course[];
}) {
  const supabase = createSupabaseClient();

  const [alias, setAlias] = useState(profile?.alias ?? "");
  const [homeCourse, setHomeCourse] = useState<string>(
    profile?.home_course ?? ""
  );
  const [phone, setPhone] = useState(profile?.phone ?? "+46 ");
  const [favoriteDisc, setFavoriteDisc] = useState(
    profile?.favorite_disc ?? ""
  );
  const [city, setCity] = useState(profile?.city ?? "");
  const [team, setTeam] = useState(profile?.team ?? "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return profile?.avatar_url ?? null;
  }, [avatarFile, profile?.avatar_url]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  async function uploadAvatar() {
    if (!avatarFile) return profile?.avatar_url ?? "";

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) throw userError ?? new Error("Ingen användare.");

    const ext = avatarFile.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl ?? "";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) throw userErr ?? new Error("Inte inloggad.");

      const avatar_url = await uploadAvatar();

      const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
        id: user.id,
        alias,
        avatar_url,
        home_course: homeCourse || null,
        phone: phone?.trim() || null,
        favorite_disc: favoriteDisc?.trim() || null,
        city: city?.trim() || null,
        team: team?.trim() || null,
      };

      console.log("[profile] saving payload:", payload);

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("[profile] upsert error:", error);
        alert(error.message);
        return;
      }

      alert("Profil uppdaterad!");
      setAvatarFile(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-100 border overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-gray-500">Ingen</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white cursor-pointer hover:bg-gray-50 transition">
              <span className="text-sm">Byt profilbild</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {avatarFile && (
              <button
                type="button"
                onClick={() => setAvatarFile(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Ångra
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Profilbilden sparas i Supabase Storage (bucket:{" "}
          <span className="font-mono">avatars</span>).
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">
          Name / Display name
        </label>
        <input
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-800">
          Hemmabana
        </label>
        <select
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={homeCourse}
          onChange={(e) => setHomeCourse(e.target.value)}
        >
          <option value="">Välj bana</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            Telefon
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+46 70 123 45 67"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            Favorit disc
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={favoriteDisc}
            onChange={(e) => setFavoriteDisc(e.target.value)}
            placeholder="t.ex. Destroyer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            Stad
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Malmö"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">Lag</label>
          <input
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="Ditt lag"
          />
        </div>
      </div>

      <button
        disabled={saving}
        className="w-full rounded-xl bg-emerald-600 text-white py-2.5 font-medium hover:bg-emerald-700 transition disabled:opacity-50"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>
    </form>
  );
}
