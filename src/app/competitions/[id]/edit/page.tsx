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
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { compareCompetitionCourseOrder } from "@/lib/competition-courses-sort";

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

  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [organizerIds, setOrganizerIds] = useState<string[]>([]);
  const [participants, setParticipants] = useState<{ user_id: string; alias: string | null; avatar_url: string | null }[]>([]);

  // Hämta tävling + befintliga banor + alla banor + arrangörer (endast när id ändras)
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const doFetch = async () => {
      const [
        { data: { user } },
        currentUserRes,
        { data: competition, error: compError },
        organizersRes,
      ] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/get-current-user").then((r) => (r.ok ? r.json() : null)),
        supabase.from("competitions").select("id, title, description, start_date, end_date, image_url, created_by").eq("id", id).single(),
        fetch(`/api/competitions/${id}/organizers`).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (cancelled) return;

      if (compError || !competition) {
        console.error("Fetch competition error:", compError);
        showToastRef.current("Kunde inte hämta tävlingen.", "error");
        setLoading(false);
        return;
      }

      const isAdmin = (currentUserRes as { is_admin?: boolean } | null)?.is_admin === true;
      const cId = (competition as { created_by?: string | null }).created_by ?? null;
      setCreatorId(cId);

      const orgData = organizersRes as { creatorId?: string | null; organizerIds?: string[]; participants?: { user_id: string; alias: string | null; avatar_url: string | null }[] } | null;
      if (orgData) {
        setOrganizerIds(orgData.organizerIds ?? []);
        setParticipants(orgData.participants ?? []);
      }

      const canEdit = user?.id && (cId === user.id || isAdmin || (orgData?.organizerIds?.includes(user.id) ?? false));
      setIsCreator(Boolean(canEdit));

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
        .select("course_id, created_at")
        .eq("competition_id", id);

      if (cancelled) return;

      const rows = (compCourses ?? []) as {
        course_id: string | null;
        sort_order?: number | null;
        created_at: string | null;
      }[];
      rows.sort(compareCompetitionCourseOrder);
      const ids = rows.map((r) => r.course_id).filter((c): c is string => c != null);
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
      setSelectedCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
    } else {
      setSelectedCourseIds((prev) => prev.filter((c) => c !== courseId));
    }
  };

  const moveCourse = (index: number, direction: -1 | 1) => {
    setSelectedCourseIds((prev) => {
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const t = copy[index]!;
      copy[index] = copy[next]!;
      copy[next] = t;
      return copy;
    });
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
          Endast arrangörer kan redigera denna tävling.
        </p>
      </div>
    );
  }

  const canAddOrganizer = participants.filter((p) => !organizerIds.includes(p.user_id));
  const addOrganizer = async (userId: string) => {
    if (!id) return;
    const res = await fetch(`/api/competitions/${id}/organizers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Kunde inte lägga till arrangör.", "error");
      return;
    }
    setOrganizerIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    showToast("Arrangör tillagd.", "success");
  };
  const removeOrganizer = async (userId: string) => {
    if (!id || userId === creatorId) return;
    const res = await fetch(`/api/competitions/${id}/organizers?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "Kunde inte ta bort arrangör.", "error");
      return;
    }
    setOrganizerIds((prev) => prev.filter((id) => id !== userId));
    showToast("Arrangör borttagen.", "success");
  };

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

        <div className="space-y-4">
          <div>
            <h2 className="font-semibold mb-2 text-stone-200">Spelordning</h2>
            <p className="text-xs text-stone-500 mb-2">
              Första banan överst. Om du inte ändrar ordning används samma ordning som när banorna kopplades till tävlingen.
            </p>
            {selectedCourseIds.length === 0 ? (
              <p className="text-sm text-stone-500 rounded-lg border border-retro-border p-3 bg-retro-card">
                Inga banor valda än. Kryssa i banor nedan – de läggs sist i ordningen.
              </p>
            ) : (
              <ol className="space-y-1.5 rounded-lg border border-retro-border p-3 bg-retro-card list-none m-0">
                {selectedCourseIds.map((courseId, index) => {
                  const name = allCourses.find((c) => c.id === courseId)?.name ?? courseId;
                  return (
                    <li
                      key={courseId}
                      className="flex items-center gap-2 rounded-md bg-retro-surface/80 border border-retro-border/60 px-2 py-1.5"
                    >
                      <span className="tabular-nums text-stone-500 text-sm w-6 shrink-0 font-medium">{index + 1}.</span>
                      <span className="flex-1 min-w-0 text-sm text-stone-200 truncate">{name}</span>
                      <div className="flex shrink-0 gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveCourse(index, -1)}
                          disabled={index === 0}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-retro-card disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Flytta upp"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCourse(index, 1)}
                          disabled={index === selectedCourseIds.length - 1}
                          className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-retro-card disabled:opacity-30 disabled:pointer-events-none"
                          aria-label="Flytta ner"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <div>
            <h2 className="font-semibold mb-2 text-stone-200">Lägg till eller ta bort banor</h2>
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
        </div>

        <div>
          <h2 className="font-semibold mb-2 text-stone-200">Arrangörer</h2>
          <p className="text-sm text-stone-500 mb-2">
            Arrangörer kan redigera tävlingen och bjuda in fler arrangörer. Endast deltagare i tävlingen kan läggas till.
          </p>
          <div className="rounded-lg border border-retro-border p-3 bg-retro-card space-y-2">
            {organizerIds.length === 0 ? (
              <p className="text-sm text-stone-500">Inga arrangörer.</p>
            ) : (
              <ul className="space-y-1.5">
                {organizerIds.map((uid) => {
                  const part = participants.find((p) => p.user_id === uid);
                  const alias = part?.alias?.trim() || "Okänd";
                  const isCreatorUser = uid === creatorId;
                  return (
                    <li key={uid} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-stone-200 text-sm">
                        {alias}
                        {isCreatorUser && <span className="text-stone-500 ml-1">(skapare)</span>}
                      </span>
                      {!isCreatorUser && (
                        <button
                          type="button"
                          onClick={() => removeOrganizer(uid)}
                          className="text-xs text-amber-400 hover:text-amber-300"
                        >
                          Ta bort som arrangör
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {canAddOrganizer.length > 0 && (
              <div className="pt-2 border-t border-retro-border">
                <label htmlFor="add-organizer" className="block text-xs text-stone-500 mb-1">
                  Lägg till arrangör
                </label>
                <select
                  id="add-organizer"
                  className="w-full border border-retro-border bg-retro-surface text-stone-100 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) {
                      addOrganizer(v);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">Välj deltagare…</option>
                  {canAddOrganizer.map((p) => (
                    <option key={p.user_id} value={p.user_id}>
                      {p.alias?.trim() || "Okänd"}
                    </option>
                  ))}
                </select>
              </div>
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
