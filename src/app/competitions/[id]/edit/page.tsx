"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/ToastProvider";

export default function EditCompetitionPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: string; name: string }[]>(
    []
  );

  // Hämta tävling + befintliga banor + alla banor
  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      const { data: competition, error: compError } = await supabase
        .from("competitions")
        .select("id, title, description, start_date, end_date, image_url")
        .eq("id", id)
        .single();

      if (compError || !competition) {
        console.error("Fetch competition error:", compError);
        showToast("Kunde inte hämta tävlingen.", "error");
        setLoading(false);
        return;
      }

      setTitle(competition.title ?? "");
      setDescription(competition.description ?? "");
      setStartDate(
        competition.start_date
          ? new Date(competition.start_date).toISOString().slice(0, 10)
          : ""
      );
      setEndDate(
        competition.end_date
          ? new Date(competition.end_date).toISOString().slice(0, 10)
          : ""
      );
      setImageUrl(competition.image_url ?? "");

      const { data: compCourses } = await supabase
        .from("competition_courses")
        .select("course_id")
        .eq("competition_id", id);

      const ids = (compCourses ?? [])
        .map((r) => r.course_id)
        .filter((c): c is string => c != null);
      setSelectedCourseIds(ids);

      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");
      setAllCourses(courses ?? []);

      setLoading(false);
    };

    fetch();
  }, [id, supabase, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);

    const { error: updateError } = await supabase
      .from("competitions")
      .update({
        title,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        image_url: imageUrl || null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update error:", updateError);
      showToast("Kunde inte spara tävlingen.", "error");
      setSaving(false);
      return;
    }

    // Ersätt kopplade banor: ta bort alla, lägg till valda
    await supabase
      .from("competition_courses")
      .delete()
      .eq("competition_id", id);

    if (selectedCourseIds.length > 0) {
      const res = await fetch("/api/add-competition-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: id,
          courseIds: selectedCourseIds,
        }),
      });
      if (!res.ok) {
        showToast("Tävlingen sparad, men koppling till banor kunde inte uppdateras.", "error");
      }
    }

    showToast("Tävlingen har uppdaterats!", "success");
    setSaving(false);
    router.push(`/competitions/${id}`);
    router.refresh();
  };

  const toggleCourse = (courseId: string, checked: boolean) => {
    if (checked) {
      setSelectedCourseIds((prev) => [...prev, courseId]);
    } else {
      setSelectedCourseIds((prev) => prev.filter((c) => c !== courseId));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-stone-400">Laddar...</p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/competitions/${id}`}
          className="text-stone-400 hover:text-stone-100 flex items-center gap-1 text-sm font-medium transition"
        >
          ← Tillbaka till tävlingen
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-stone-100">Redigera tävling</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block font-semibold mb-1 text-stone-200">
            Tävlingstitel
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tävlingstitel"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-semibold mb-1 text-stone-200">
            Beskrivning
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beskrivning"
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block font-semibold mb-1 text-stone-200">
              Startdatum
            </label>
            <input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block font-semibold mb-1 text-stone-200">
              Slutdatum
            </label>
            <input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="image_url" className="block font-semibold mb-1 text-stone-200">
            Bild-URL
          </label>
          <input
            id="image_url"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Förhandsgranskning"
              className="mt-2 w-full max-h-40 object-cover rounded-lg border border-retro-border"
            />
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-2 text-stone-200">Banor i tävlingen</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-retro-border p-3 bg-retro-card">
            {allCourses.length === 0 ? (
              <p className="text-sm text-retro-muted">Inga banor tillagda än.</p>
            ) : (
              allCourses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 cursor-pointer text-sm text-stone-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.includes(c.id)}
                    onChange={(e) => toggleCourse(c.id, e.target.checked)}
                    className="rounded border-retro-border bg-retro-surface text-retro-accent focus:ring-retro-accent"
                  />
                  {c.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-retro-accent text-stone-100 px-4 py-2 rounded-lg font-medium hover:bg-retro-accent-hover disabled:opacity-50 transition"
          >
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
          <Link
            href={`/competitions/${id}`}
            className="px-4 py-2 rounded-lg border border-retro-border text-stone-200 hover:bg-retro-surface transition"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </div>
  );
}
