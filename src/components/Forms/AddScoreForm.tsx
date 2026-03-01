"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/components/Toasts/ToastProvider";

type Course = { id: string; name: string };
type Player = { id: string; alias: string };
type CourseHole = { hole_number: number; par: number; length: number | null };

type EditingScore = {
  id: string;
  throws: number | null;
  score: number;
  date_played: string;
  with_friends?: string[];
  courses: { name: string; id: string };
};

type Props = {
  onClose: () => void;
  onSuccess?: () => void;
  editingScore?: EditingScore | null;
  /** Förvald bana (t.ex. från länk från bansidan). */
  initialCourseId?: string | null;
  /** Tävling förvald – då visas bara banor som ingår i tävlingen. */
  initialCompetitionId?: string | null;
  competitionTitle?: string | null;
  /** Banor som ingår i tävlingen (används bara när initialCompetitionId är satt). */
  competitionCourses?: Course[] | null;
  /** Förladdad banlista (t.ex. när sidan laddat banor innan formuläret visas). */
  preloadedCourses?: Course[] | null;
};

export default function AddScoreForm({
  onClose,
  onSuccess,
  editingScore,
  initialCourseId,
  initialCompetitionId,
  competitionTitle,
  competitionCourses,
  preloadedCourses,
}: Props) {
  const { showToast } = useToast();
  const [throws, setThrows] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [withFriends, setWithFriends] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId ?? "");
  const isCompetitionMode = Boolean(initialCompetitionId && competitionCourses !== undefined && competitionCourses !== null);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([]);
  const [holeThrows, setHoleThrows] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAlias, setCurrentUserAlias] = useState<string>("");
  const [friendSearch, setFriendSearch] = useState("");
  const [manualGuests, setManualGuests] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const courseRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const throwsRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const holesRef = useRef<HTMLDivElement>(null);

  const clearInvalid = useCallback((field: string) => {
    setInvalidFields((prev) => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  }, []);

  const usePerHole = courseHoles.length > 0;
  const totalFromHoles = useMemo(() => {
    if (!usePerHole) return null;
    let totalThrows = 0;
    for (const t of holeThrows) {
      const n = Number(t);
      if (Number.isNaN(n) || n < 1) return null;
      totalThrows += n;
    }
    if (holeThrows.length !== courseHoles.length) return null;
    const totalPar = courseHoles.reduce((s, h) => s + h.par, 0);
    const relativeToPar = totalThrows - totalPar; // + = över par, - = under par
    return { throws: totalThrows, score: relativeToPar, totalPar, relativeToPar };
  }, [usePerHole, holeThrows, courseHoles]);

  const totalParFromCourse = useMemo(
    () => courseHoles.reduce((s, h) => s + h.par, 0),
    [courseHoles]
  );

  // Hämta current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const res = await fetch("/api/get-current-user");
      const data = await res.json();
      if (!data.error) {
        setCurrentUserId(data.id);
        setCurrentUserAlias(data.alias ?? "");
      }
    };
    fetchCurrentUser();
  }, []);

  // Tävlingsläge: använd bara tävlingens banor
  useEffect(() => {
    if (isCompetitionMode && competitionCourses) {
      setCourses(competitionCourses);
      if (editingScore?.courses) {
        setSelectedCourse(editingScore.courses.id);
      } else if (competitionCourses.length > 0) {
        const firstId = initialCourseId && competitionCourses.some((c) => c.id === initialCourseId) ? initialCourseId : competitionCourses[0].id;
        setSelectedCourse(firstId);
      }
    }
  }, [isCompetitionMode, competitionCourses, editingScore, initialCourseId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const playersRes = await fetch("/api/get-profiles");
      const playersData = await playersRes.json();
      setPlayers(playersData);
    };
    fetchPlayers();
  }, []);

  // Förladade banor (t.ex. från Lägg till resultat med course_id i URL)
  useEffect(() => {
    if (isCompetitionMode || !preloadedCourses?.length) return;
    setCourses(preloadedCourses);
    if (initialCourseId && preloadedCourses.some((c) => c.id === initialCourseId)) {
      setSelectedCourse(initialCourseId);
    }
  }, [isCompetitionMode, preloadedCourses, initialCourseId]);

  useEffect(() => {
    if (isCompetitionMode) return;
    if (preloadedCourses?.length) return; // använd förladade, hoppa över fetch
    const fetchData = async () => {
      const [coursesRes, playersRes] = await Promise.all([
        fetch("/api/get-courses"),
        fetch("/api/get-profiles"),
      ]);
      const coursesData = await coursesRes.json();
      const playersData = await playersRes.json();
      setCourses(coursesData);
      setPlayers(playersData);
      if (editingScore?.courses) {
        setSelectedCourse(editingScore.courses.id);
      } else if (initialCourseId && coursesData.some((c: Course) => c.id === initialCourseId)) {
        setSelectedCourse(initialCourseId);
      }
    };
    fetchData();
  }, [editingScore, initialCourseId, isCompetitionMode, preloadedCourses?.length]);

  // Hämta hål för vald bana
  useEffect(() => {
    if (!selectedCourse) {
      setCourseHoles([]);
      setHoleThrows([]);
      return;
    }
    const fetchHoles = async () => {
      const res = await fetch(`/api/course-holes?course_id=${selectedCourse}`);
      const data = await res.json();
      const holes = Array.isArray(data) ? data : [];
      setCourseHoles(holes);
      setHoleThrows(holes.map(() => ""));
    };
    fetchHoles();
  }, [selectedCourse]);

  // Vid redigering: hämta score_holes om banan har hål
  useEffect(() => {
    if (!editingScore?.id || !selectedCourse || courseHoles.length === 0) return;
    const fetchScoreHoles = async () => {
      const res = await fetch(`/api/score-holes?score_id=${editingScore.id}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      const byHole = new Map(arr.map((h: { hole_number: number; throws: number }) => [h.hole_number, h.throws]));
      setHoleThrows(courseHoles.map((h) => (byHole.get(h.hole_number) != null ? String(byHole.get(h.hole_number)) : "")));
    };
    fetchScoreHoles();
  }, [editingScore?.id, selectedCourse, courseHoles]);

  // Autofyll formulär vid redigering
  useEffect(() => {
    if (editingScore) {
      setThrows(String(editingScore.throws ?? ""));
      setDatePlayed(
        editingScore.date_played
          ? new Date(editingScore.date_played).toISOString().split("T")[0]
          : ""
      );
      const raw = editingScore.with_friends;
      const friends = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
          ? (() => {
              try {
                const p = JSON.parse(raw.trim());
                return Array.isArray(p) ? p.map(String).filter(Boolean) : [];
              } catch {
                return [];
              }
            })()
          : [];
      setWithFriends(friends.filter((a) => a !== currentUserAlias && !a.startsWith("Gäst:")));
      setManualGuests(friends.filter((a) => a.startsWith("Gäst:")).map((a) => a.replace(/^Gäst:/, "")));
      setSelectedCourse(editingScore.courses.id);
    } else {
      setThrows("");
      setDatePlayed("");
      setWithFriends([]);
      setManualGuests([]);
      setSelectedCourse(initialCourseId ?? "");
    }
  }, [editingScore, currentUserAlias, initialCourseId]);

  const combinedFriendsForSubmit = useMemo(() => {
    const others = withFriends.filter((a) => a.trim() !== "");
    const guests = manualGuests.filter((g) => g.trim() !== "").map((g) => `Gäst:${g.trim()}`);
    return currentUserAlias ? [currentUserAlias, ...others, ...guests] : [...others, ...guests];
  }, [currentUserAlias, withFriends, manualGuests]);

  const searchQuery = friendSearch.trim().toLowerCase();
  const playersForPicker = useMemo(() => {
    return players.filter((p) => {
      if (p.id === currentUserId) return false;
      if (!searchQuery) return true;
      return (p.alias ?? "").toLowerCase().includes(searchQuery);
    });
  }, [players, currentUserId, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = new Set<string>();
    if (!selectedCourse?.trim()) invalid.add("course");
    if (!datePlayed?.trim()) invalid.add("date");
    if (usePerHole) {
      if (totalFromHoles === null) invalid.add("holes");
    } else {
      const throwsNum = Number(throws);
      if (throws.trim() === "" || Number.isNaN(throwsNum)) invalid.add("throws");
    }
    if (invalid.size > 0) {
      setInvalidFields(invalid);
      const order: string[] = ["course", "date", usePerHole ? "holes" : "throws"].filter(Boolean);
      const first = order.find((id) => invalid.has(id));
      const refMap = { course: courseRef, date: dateRef, throws: throwsRef, score: scoreRef, holes: holesRef } as const;
      const ref = first ? refMap[first as keyof typeof refMap]?.current : null;
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      showToast(
        !selectedCourse?.trim()
          ? "Välj en bana."
          : !datePlayed?.trim()
            ? "Fyll i datum."
            : usePerHole
              ? "Fyll i slag för alla hål."
              : "Fyll i antal kast.",
        "error"
      );
      return;
    }
    setInvalidFields(new Set());
    setLoading(true);

    const payload: {
      course_id: string;
      score: number;
      throws: number;
      date_played: string;
      with_friends: string[];
      competition_id?: string | null;
      hole_scores?: { hole_number: number; throws: number }[];
    } = {
      course_id: selectedCourse,
      score: usePerHole && totalFromHoles
        ? totalFromHoles.relativeToPar
        : Number(throws) - totalParFromCourse,
      throws: usePerHole && totalFromHoles ? totalFromHoles.throws : Number(throws),
      date_played: datePlayed,
      with_friends: combinedFriendsForSubmit,
    };
    if (initialCompetitionId) payload.competition_id = initialCompetitionId;
    if (usePerHole && holeThrows.length === courseHoles.length) {
      payload.hole_scores = courseHoles.map((h, i) => ({
        hole_number: h.hole_number,
        throws: Number(holeThrows[i]) || 0,
      }));
    }

    let res;
    if (editingScore) {
      res = await fetch("/api/update-score", {
        method: "PUT",
        body: JSON.stringify({ id: editingScore.id, ...payload }),
      });
    } else {
      res = await fetch("/api/add-score", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    setLoading(false);

    if (res.ok) {
      showToast(
        editingScore ? "Resultatet har uppdaterats!" : "Resultatet har sparats!",
        "success"
      );
      onSuccess?.();

      if (editingScore) {
        onClose();
      } else {
        setThrows("");
        setDatePlayed(new Date().toISOString().split("T")[0]);
        setWithFriends([]);
        setManualGuests([]);
        setSelectedCourse("");
        setCourseHoles([]);
        setHoleThrows([]);
      }
    } else {
      showToast("Något gick fel vid sparandet av resultatet.", "error");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 mt-4 rounded-xl border border-retro-border bg-retro-surface p-4 md:p-5"
    >
      {isCompetitionMode && competitionTitle && (
        <div className="rounded-lg border border-retro-accent/40 bg-retro-accent/10 px-3 py-2">
          <p className="text-xs text-retro-muted font-medium">Tävling</p>
          <p className="text-stone-100 font-semibold">{competitionTitle}</p>
          <p className="text-xs text-stone-400 mt-0.5">Bara banor som ingår i tävlingen kan väljas.</p>
        </div>
      )}

      {/* Dropdown för bana */}
      <div ref={courseRef}>
        <label className="block font-medium text-stone-200 mb-1">
          {isCompetitionMode ? "Välj bana (i tävlingen)" : "Välj bana"}
        </label>
        {isCompetitionMode && courses.length === 0 ? (
          <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            Tävlingen har inga banor kopplade. Gå till Redigera tävling och lägg till banor.
          </p>
        ) : (
          <select
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              clearInvalid("course");
            }}
            required
            className={`w-full rounded-lg border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 ${invalidFields.has("course") ? `border-red-500 ring-2 ring-red-500/50 focus:ring-red-500` : "border-retro-border focus:ring-retro-accent"}`}
          >
            <option value="">-- Välj bana --</option>
            {courses.map((course) => (
              <option key={course.id} value={String(course.id)}>
                {course.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Datum – samma rad som Välj idag */}
      <div ref={dateRef}>
        <label className="block font-medium text-stone-200 mb-1">Datum</label>
        <div className="flex gap-2">
          <input
            type="date"
            className={`flex-1 min-w-0 rounded-lg border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 ${invalidFields.has("date") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
            value={datePlayed}
            onChange={(e) => {
              setDatePlayed(e.target.value);
              clearInvalid("date");
            }}
          />
          <button
            type="button"
            onClick={() => setDatePlayed(new Date().toISOString().split("T")[0])}
            className="shrink-0 px-3 py-2 rounded-lg border border-retro-border bg-retro-card text-sm text-stone-200 hover:bg-retro-border/30 transition"
          >
            Välj idag
          </button>
        </div>
      </div>

      {/* Score / Slag per hål */}
      {usePerHole ? (
        <div ref={holesRef} className="space-y-2">
          <label className="block font-medium text-stone-200 mb-1">Slag per hål</label>
          <p className="text-sm text-stone-400">Banan har hålinfo – fyll i antal slag per hål.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {courseHoles.map((h, i) => (
              <div key={h.hole_number} className="flex flex-col gap-0.5">
                <span className="text-xs text-stone-500">
                  {h.hole_number} (Par {h.par})
                </span>
                <input
                  type="number"
                  min={1}
                  placeholder="–"
                  value={holeThrows[i] ?? ""}
                  onChange={(e) => {
                    const next = [...holeThrows];
                    next[i] = e.target.value;
                    setHoleThrows(next);
                    clearInvalid("holes");
                  }}
                  className={`w-full rounded-lg border bg-retro-card px-2 py-1.5 text-stone-100 text-sm focus:outline-none focus:ring-2 ${invalidFields.has("holes") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
                />
              </div>
            ))}
          </div>
          {totalFromHoles !== null && (
            <div className="flex flex-wrap gap-4 text-sm text-stone-300">
              <span>
                Totalt: <strong>{totalFromHoles.throws}</strong> slag
              </span>
              <span>
                Poäng:{" "}
                <strong>
                  {totalFromHoles.relativeToPar === 0
                    ? "Par"
                    : totalFromHoles.relativeToPar > 0
                      ? `+${totalFromHoles.relativeToPar} (över par)`
                      : `${totalFromHoles.relativeToPar} (under par)`}
                </strong>
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-stone-400 mb-2">
            Fyll i antal kast. Poängen räknas automatiskt mot banans par (t.ex. +1 = en över par).
          </p>
          <div ref={throwsRef}>
            <label className="block font-medium text-stone-200 mb-1">Antal kast</label>
            <input
              type="number"
              min={1}
              className={`w-full rounded-lg border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 ${invalidFields.has("throws") ? "border-red-500 ring-2 ring-red-500/50 focus:ring-red-500" : "border-retro-border focus:ring-retro-accent"}`}
              value={throws}
              onChange={(e) => {
                setThrows(e.target.value);
                clearInvalid("throws");
              }}
              required={!usePerHole}
              placeholder="t.ex. 54"
            />
          </div>
          {selectedCourse && (
            <div ref={scoreRef} className="text-sm text-stone-300">
              <span className="font-medium text-stone-200">Poäng (mot par): </span>
              {throws.trim() !== "" && !Number.isNaN(Number(throws))
                ? (() => {
                    const rel = Number(throws) - totalParFromCourse;
                    if (rel === 0) return "Par";
                    if (rel > 0) return `+${rel} (över par)`;
                    return `${rel} (under par)`;
                  })()
                : "—"}
            </div>
          )}
        </>
      )}

      {/* Vilka var med – sök profiler, lägg till med checkmark, visa valda under */}
      <div>
        <label className="block font-medium text-stone-200 mb-1">Vilka var med?</label>
        <p className="text-sm text-stone-400 mb-2">Sök och lägg till spelare som var med. Du behöver inte välja någon.</p>
        <input
          type="text"
          placeholder="Sök spelare..."
          value={friendSearch}
          onChange={(e) => setFriendSearch(e.target.value)}
          className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent mb-2"
        />
        <div className="max-h-40 overflow-y-auto rounded-lg border border-retro-border bg-retro-card divide-y divide-retro-border">
          {playersForPicker.length === 0 ? (
            <div className="px-3 py-2 text-sm text-stone-500">
              {searchQuery ? "Inga spelare matchar sökningen." : "Skriv för att söka spelare."}
            </div>
          ) : (
            playersForPicker.map((player) => {
              const isSelected = withFriends.includes(player.alias);
              return (
                <label
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-retro-surface cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWithFriends([...withFriends, player.alias]);
                      } else {
                        setWithFriends(withFriends.filter((a) => a !== player.alias));
                      }
                    }}
                    className="rounded border-retro-border text-retro-accent focus:ring-retro-accent"
                  />
                  <span className="text-stone-200">{player.alias}</span>
                </label>
              );
            })
          )}
        </div>
        {withFriends.length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-stone-500 block mb-1">Registrerade som var med</span>
            <div className="flex flex-wrap gap-2">
              {withFriends.map((alias) => (
                <span
                  key={alias}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-retro-accent/20 border border-retro-accent/40 text-stone-200 text-sm"
                >
                  {alias}
                  <button
                    type="button"
                    onClick={() => setWithFriends(withFriends.filter((a) => a !== alias))}
                    className="text-stone-400 hover:text-stone-100 ml-0.5"
                    aria-label={`Ta bort ${alias}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          {manualGuests.map((guest, index) => (
            <input
              key={index}
              type="text"
              className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              placeholder="Gästnamn"
              value={guest}
              onChange={(e) => {
                const next = [...manualGuests];
                next[index] = e.target.value;
                setManualGuests(next);
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => setManualGuests([...manualGuests, ""])}
            className="px-3 py-2 rounded-lg border border-retro-border bg-retro-card text-stone-200 hover:bg-retro-border/30 transition text-sm"
          >
            Lägg till gäst
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || (isCompetitionMode && courses.length === 0)}
          className="px-4 py-2.5 rounded-lg bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition focus:outline-none focus:ring-2 focus:ring-retro-accent focus:ring-offset-2 focus:ring-offset-retro-bg disabled:opacity-50"
        >
          {loading
            ? "Sparar..."
            : editingScore
            ? "Uppdatera resultat"
            : "Spara resultat"}
        </button>
        {editingScore && (
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone-400 hover:text-stone-200 underline transition"
          >
            Avbryt redigering
          </button>
        )}
      </div>
    </form>
  );
}
