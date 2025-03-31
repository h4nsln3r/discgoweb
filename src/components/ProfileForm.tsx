"use client";

import { useState } from "react";
import type { Database } from "@/types/supabase";

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
  const [alias, setAlias] = useState(profile?.alias || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [homeCourse, setHomeCourse] = useState(profile?.home_course || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/update-profile", {
      method: "POST",
      body: JSON.stringify({
        alias,
        avatar_url: avatarUrl,
        home_course: homeCourse,
      }),
    });

    if (res.ok) {
      alert("Profil uppdaterad!");
    } else {
      alert("Något gick fel.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        Alias
        <input
          className="border p-2 w-full"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
        />
      </label>

      <label className="block">
        Profilbild URL
        <input
          className="border p-2 w-full"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </label>

      <label className="block">
        Hemmabana
        <select
          className="border p-2 w-full"
          value={homeCourse || ""}
          onChange={(e) => setHomeCourse(e.target.value)}
        >
          <option value="">Välj bana</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Spara
      </button>
    </form>
  );
}
