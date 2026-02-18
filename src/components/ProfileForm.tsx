"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/supabase";
import { createSupabaseClient } from "@/lib/supabase";
import { useToast } from "@/components/ui/ToastProvider";

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
  const router = useRouter();
  const { showToast } = useToast();

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
        showToast(error.message || "Kunde inte spara profilen.", "error");
        return;
      }

      showToast("Profilen har sparats!", "success");
      setAvatarFile(null);
      router.back();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Något gick fel vid sparande.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-retro-card border border-retro-border overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Profilbild"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs text-retro-muted">Ingen</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-retro-border bg-retro-card cursor-pointer hover:bg-retro-surface transition text-stone-200 text-sm">
              Byt profilbild
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
                className="text-sm text-stone-400 hover:text-stone-100"
              >
                Ångra
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-retro-muted mt-3">
          Profilbilden sparas i Supabase Storage (bucket:{" "}
          <span className="font-mono">avatars</span>).
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">
          Name / Display name
        </label>
        <input
          className={inputClass}
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-300">
          Hemmabana
        </label>
        <select
          className={inputClass}
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
          <label className="block text-sm font-medium text-stone-300">Telefon</label>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="+46 70 123 45 67"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Favorit disc</label>
          <input
            className={inputClass}
            value={favoriteDisc}
            onChange={(e) => setFavoriteDisc(e.target.value)}
            placeholder="t.ex. Destroyer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Stad</label>
          <input
            className={inputClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Malmö"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-stone-300">Lag</label>
          <input
            className={inputClass}
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            placeholder="Ditt lag"
          />
        </div>
      </div>

      <button
        disabled={saving}
        className="w-full rounded-xl bg-retro-accent text-stone-100 py-2.5 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50"
      >
        {saving ? "Sparar..." : "Spara"}
      </button>
    </form>
  );
}
