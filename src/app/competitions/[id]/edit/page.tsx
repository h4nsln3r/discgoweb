"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import { useToast } from "@/components/Toasts/ToastProvider";
import CompetitionImageField from "@/components/Forms/CompetitionImageField";
import DeleteCompetitionButton from "@/components/Competitions/DeleteCompetitionButton";

export default function EditCompetitionPage() {
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreator, setIsCreator] = useState<boolean | null>(null);

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: string; name: string }[]>(
    []
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const titleRef = useRef<HTMLDivElement>(null);

  // Hämta tävling + befintliga banor + alla banor (endast när id ändras)
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const doFetch = async () => {
      const [
        { data: { user } },
        currentUserRes,
        { data: competition, error: compError },
      ] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/get-current-user").then((r) => (r.ok ? r.json() : null)),
        supabase.from("competitions").select("id, title, description, start_date, end_date, image_url, created_by").eq("id", id).single(),
      ]);

      if (cancelled) return;

      if (compError || !competition) {
        console.error("Fetch competition error:", compError);
        showToastRef.current("Kunde inte hämta tävlingen.", "error");
        setLoading(false);
        return;
      }

      const isAdmin = (currentUserRes as { is_admin?: boolean } | null)?.is_admin === true;
      const creatorId = (competition as { created_by?: string | null }).created_by;
      setIsCreator(Boolean(creatorId && user?.id && (creatorId === user.id || isAdmin)));

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
      setImageUrl(typeof competition.image_url === "string" ? competition.image_url : "");

      const { data: compCourses } = await supabase
        .from("competition_courses")
        .select("course_id")
        .eq("competition_id", id);

      if (cancelled) return;

      const ids = (compCourses ?? [])
        .map((r) => r.course_id)
        .filter((c): c is string => c != null);
      setSelectedCourseIds(ids);

      const { data: courses } = await supabase
        .from("courses")
        .select("id, name")
        .order("name");

      if (cancelled) return;
      setAllCourses(courses ?? []);
      setLoading(false);
    };

    doFetch();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!title.trim()) {
      setInvalidFields(new Set(["title"]));
      titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      showToast("Fyll i tävlingstitel.", "error");
      return;
    }
    setInvalidFields(new Set());
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
        <SetTopbarActions backHref={id ? `/competitions/${id}` : null} />
        <p className="text-stone-400">Laddar...</p>
      </div>
    );
  }

  if (isCreator === false) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <SetTopbarActions backHref={id ? `/competitions/${id}` : null} />
        <p className="text-stone-400">
          Du kan bara redigera tävlingar som du själv skapat.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-retro-border bg-retro-surface text-stone-100 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-retro-accent placeholder:text-stone-500";

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <SetTopbarActions backHref={id ? `/competitions/${id}` : null} />
      <h1 className="text-2xl font-bold text-stone-100">Redigera tävling</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={titleRef}>
          <label htmlFor="title" className="block font-semibold mb-1 text-stone-200">
            Tävlingstitel
          </label>
          <input
            id="title"
            type="text"
            value={title ?? ""}
            onChange={(e) => {
              setTitle(e.target.value);
              setInvalidFields((p) => { const n = new Set(p); n.delete("title"); return n; });
            }}
            placeholder="Tävlingstitel"
            className={invalidFields.has("title") ? `${inputClass} border-red-500 ring-2 ring-red-500/50` : inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-semibold mb-1 text-stone-200">
            Beskrivning
          </label>
          <textarea
            id="description"
            value={description ?? ""}
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
              value={startDate ?? ""}
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
              value={endDate ?? ""}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <CompetitionImageField
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          supabase={supabase}
          showToast={showToast}
          disabled={saving}
          idPrefix="edit"
          inputClass={inputClass}
        />

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

        {id && (
          <div className="mt-8 pt-6 border-t border-retro-border">
            <p className="text-stone-400 text-sm mb-2">Ta bort tävlingen permanent.</p>
            <DeleteCompetitionButton
              competitionId={id}
              competitionTitle={title || "Tävlingen"}
              variant="danger"
            />
          </div>
        )}
      </form>
    </div>
  );
}
