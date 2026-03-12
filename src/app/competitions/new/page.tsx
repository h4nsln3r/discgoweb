"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/Toasts/ToastProvider";
import CompetitionImageField from "@/components/Forms/CompetitionImageField";

function formatDateWithWeekday(dateStr: string): string {
  if (!dateStr.trim()) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(d);
}

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

    setTimeout(() => {
      router.push("/competitions");
    }, 1500);
  };

  const inputClass =
    "w-full border border-retro-border bg-retro-surface text-stone-100 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  const selectedCourseNames = useMemo(
    () =>
      courses
        .map((id) => allCourses.find((c) => c.id === id)?.name)
        .filter(Boolean) as string[],
    [courses, allCourses]
  );

  const hasPreview = title.trim() || imageUrl || startDate || endDate || description.trim() || selectedCourseNames.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bebas tracking-wide uppercase text-stone-100 mb-6">
        Skapa ny tävling
      </h1>
      {loading && (
        <p className="text-retro-accent font-medium mb-4">⏳ Skapar tävling...</p>
      )}
      {successMessage && (
        <p className="text-retro-accent font-medium mb-4">{successMessage}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        <form onSubmit={handleSubmit} className="space-y-6 min-w-0">
          <div ref={titleRef}>
            <label className="block font-medium text-stone-200 mb-2">
              Tävlingstitel
            </label>
            <input
              type="text"
              placeholder="t.ex. Vårserien 2026"
              value={title ?? ""}
              onChange={(e) => {
                setTitle(e.target.value);
                setInvalidFields((p) => {
                  const n = new Set(p);
                  n.delete("title");
                  return n;
                });
              }}
              required
              className={
                invalidFields.has("title")
                  ? `${inputClass} border-red-500 ring-2 ring-red-500/50`
                  : inputClass
              }
            />
          </div>

          <div>
            <label className="block font-medium text-stone-200 mb-2">
              Beskrivning
            </label>
            <textarea
              placeholder="Valfri beskrivning av tävlingen..."
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block font-medium text-stone-200 mb-2">
              Datum
            </label>
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <input
                  type="date"
                  value={startDate ?? ""}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={inputClass}
                />
                <span className="text-xs text-stone-500 block mt-1">Från</span>
              </div>
              <div className="flex-1 min-w-[140px]">
                <input
                  type="date"
                  value={endDate ?? ""}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className={inputClass}
                />
                <span className="text-xs text-stone-500 block mt-1">Till</span>
              </div>
            </div>
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
            <div className="space-y-2 rounded-xl border border-retro-border p-4 bg-retro-card max-h-56 overflow-y-auto">
              {allCourses.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-3 text-stone-200 cursor-pointer py-1.5 rounded-lg hover:bg-retro-surface/50 transition"
                >
                  <input
                    type="checkbox"
                    checked={courses.includes(c.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setCourses((prev) => [...prev, c.id]);
                      else
                        setCourses((prev) => prev.filter((id) => id !== c.id));
                    }}
                    className="rounded border-retro-border bg-retro-surface text-retro-accent focus:ring-retro-accent w-4 h-4"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-retro-accent focus:ring-offset-2 focus:ring-offset-retro-bg"
          >
            {loading ? "Skapar..." : "Skapa tävling"}
          </button>
        </form>

        {/* Förhandsvisning – samma känsla som tävlingssidan */}
        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-xl border border-retro-border bg-retro-card/40 overflow-hidden">
            {hasPreview ? (
              <>
                <div className="relative aspect-video w-full bg-retro-surface">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-stone-500 text-sm">
                      Ingen bild vald
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 pt-12 pb-3 px-4 bg-gradient-to-t from-black/85 via-black/50 to-transparent"
                    aria-hidden
                  >
                    <h2 className="font-bebas text-3xl sm:text-4xl md:text-5xl tracking-wide uppercase text-white drop-shadow-lg leading-none">
                      {title.trim() || "Tävlingstitel"}
                    </h2>
                    {startDate && endDate && (
                      <p className="mt-2 text-white/90 text-sm font-medium">
                        {formatDateWithWeekday(startDate)} –{" "}
                        {formatDateWithWeekday(endDate)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {description.trim() && (
                    <div>
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                        Beskrivning
                      </p>
                      <p className="text-stone-200 text-sm whitespace-pre-line">
                        {description}
                      </p>
                    </div>
                  )}
                  {selectedCourseNames.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                        Banor ({selectedCourseNames.length})
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {selectedCourseNames.map((name) => (
                          <li
                            key={name}
                            className="px-2.5 py-1 rounded-lg bg-retro-accent/20 border border-retro-accent/40 text-stone-200 text-sm"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-stone-500 px-4 py-8">
                <p className="text-sm font-medium">Förhandsvisning</p>
                <p className="text-xs mt-1">
                  Fyll i titel, datum eller lägg till bild för att se hur
                  tävlingen kommer att se ut.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
