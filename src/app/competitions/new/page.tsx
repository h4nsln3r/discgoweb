"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";
import CompetitionImageField from "@/components/Forms/CompetitionImageField";

export default function NewCompetitionPage() {
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [courses, setCourses] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: string; name: string }[]>(
    []
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, name");
      if (data) setAllCourses(data);
      if (error) console.log("error", error);
    };
    fetchCourses();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setInvalidFields(new Set(["title"]));
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Fyll i tävlingstitel.", "error");
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);
    setSuccessMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      showToast("Du måste vara inloggad för att skapa tävlingar.", "error");
      return;
    }

    const { data: createdCompetition, error } = await supabase
      .from("competitions")
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        image_url: imageUrl,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[CREATE COMPETITION ERROR]", error);
      setLoading(false);
      showToast("Kunde inte skapa tävlingen.", "error");
      return;
    }

    if (createdCompetition && courses.length > 0) {
      const response = await fetch("/api/add-competition-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: createdCompetition.id,
          courseIds: courses,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        console.error("Failed to add competition courses:", error);
        setLoading(false);
        showToast("Kunde inte koppla banor.", "error");
        return;
      }
    }

    setSuccessMessage("✅ Tävlingen har skapats!");
    showToast("Tävlingen har skapats!", "success");
    setLoading(false);

    // Gå till tävlingslistan så att den laddas om med den nya tävlingen
    setTimeout(() => {
      router.push("/competitions");
    }, 1500);
  };

  const inputClass =
    "w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-stone-100">Skapa ny tävling</h1>
      {loading && <p className="text-retro-accent">⏳ Skapar tävling...</p>}
      {successMessage && <p className="text-retro-accent">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={titleRef}>
          <input
            type="text"
            placeholder="Tävlingstitel"
            value={title ?? ""}
            onChange={(e) => {
              setTitle(e.target.value);
              setInvalidFields((p) => { const n = new Set(p); n.delete("title"); return n; });
            }}
            required
            className={invalidFields.has("title") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
          />
        </div>

        <textarea
          placeholder="Beskrivning"
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />

        <div className="flex gap-4">
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="date"
            value={endDate ?? ""}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <CompetitionImageField
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          supabase={supabase}
          showToast={showToast}
          disabled={loading}
          idPrefix="new"
          inputClass={inputClass}
        />

        <div>
          <h2 className="font-semibold mb-2 text-stone-200">Välj banor</h2>
          <div className="space-y-2 rounded-lg border border-retro-border p-3 bg-retro-card">
            {allCourses.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courses.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) setCourses((prev) => [...prev, c.id]);
                    else setCourses((prev) => prev.filter((id) => id !== c.id));
                  }}
                  className="rounded border-retro-border bg-retro-surface text-retro-accent focus:ring-retro-accent"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-retro-accent text-stone-100 py-2 px-4 rounded-lg hover:bg-retro-accent-hover transition disabled:opacity-50"
        >
          {loading ? "Skapar..." : "Skapa tävling"}
        </button>
      </form>
    </div>
  );
}
