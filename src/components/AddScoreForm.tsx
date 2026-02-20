"use client";

import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/components/ui/ToastProvider";

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
};

export default function AddScoreForm({
  onClose,
  onSuccess,
  editingScore,
  initialCourseId,
  initialCompetitionId,
  competitionTitle,
  competitionCourses,
}: Props) {
  const { showToast } = useToast();
  const [score, setScore] = useState("");
  const [throws, setThrows] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [withFriends, setWithFriends] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId ?? "");
  const isCompetitionMode = Boolean(initialCompetitionId && competitionCourses !== undefined && competitionCourses !== null);
  const [manualGuests, setManualGuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courseHoles, setCourseHoles] = useState<CourseHole[]>([]);
  const [holeThrows, setHoleThrows] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAlias, setCurrentUserAlias] = useState<string>("");

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
    return { throws: totalThrows, score: totalThrows, totalPar, relativeToPar };
  }, [usePerHole, holeThrows, courseHoles]);

  // Hämta current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const res = await fetch("/api/get-current-user");
      const data = await res.json();
      if (!data.error) {
        setCurrentUserId(data.id);
        setCurrentUserAlias(data.alias);
        // Lägg till dig själv i withFriends direkt
        setWithFriends([data.alias]);
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

  useEffect(() => {
    if (isCompetitionMode) return;
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
  }, [editingScore, initialCourseId, isCompetitionMode]);

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
      setScore(String(editingScore.score));
      setThrows(String(editingScore.throws ?? ""));
      setDatePlayed(
        editingScore.date_played
          ? new Date(editingScore.date_played).toISOString().split("T")[0]
          : ""
      );
      setWithFriends(editingScore.with_friends ?? [currentUserAlias]);
      setSelectedCourse(editingScore.courses.id);
    } else {
      setScore("");
      setThrows("");
      setDatePlayed("");
      setWithFriends(currentUserAlias ? [currentUserAlias] : []);
      setSelectedCourse("");
      setManualGuests([]);
    }
  }, [editingScore, currentUserAlias]);

  // Lägg till gästfält
  const addGuestField = () => {
    setManualGuests([...manualGuests, ""]);
  };

  const handleGuestChange = (index: number, value: string) => {
    const updated = [...manualGuests];
    updated[index] = value;
    setManualGuests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usePerHole) {
      if (totalFromHoles === null) {
        showToast("Fyll i slag för alla hål (minst 1 per hål).", "error");
        return;
      }
    } else {
      const scoreNum = Number(score);
      const throwsNum = Number(throws);
      if (score.trim() === "" || throws.trim() === "" || Number.isNaN(scoreNum) || Number.isNaN(throwsNum)) {
        showToast("Fyll i både antal kast och poäng.", "error");
        return;
      }
    }
    setLoading(true);

    const combinedFriends = [
      ...withFriends,
      ...manualGuests.filter((g) => g.trim() !== "").map((g) => `Gäst:${g}`),
    ];

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
      score: usePerHole && totalFromHoles ? totalFromHoles.score : Number(score),
      throws: usePerHole && totalFromHoles ? totalFromHoles.throws : Number(throws),
      date_played: datePlayed,
      with_friends: combinedFriends,
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
        setScore("");
        setThrows("");
        setDatePlayed(new Date().toISOString().split("T")[0]);
        setWithFriends(currentUserAlias ? [currentUserAlias] : []);
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
      <div>
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
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
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

      {/* Score / Slag per hål */}
      {usePerHole ? (
        <div className="space-y-2">
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
                  }}
                  className="w-full rounded-lg border border-retro-border bg-retro-card px-2 py-1.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
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
            Båda fälten behövs för att skicka in resultatet.
          </p>
          <div>
            <label className="block font-medium text-stone-200 mb-1">Antal kast</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              value={throws}
              onChange={(e) => setThrows(e.target.value)}
              required={!usePerHole}
              placeholder="t.ex. 54"
            />
          </div>
          <div>
            <label className="block font-medium text-stone-200 mb-1">Poäng</label>
            <input
              type="number"
              className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              required={!usePerHole}
              placeholder="t.ex. 54"
            />
          </div>
        </>
      )}

      {/* Datum */}
      <div>
        <label className="block font-medium text-stone-200 mb-1">Datum</label>
        <input
          type="date"
          className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
          value={datePlayed}
          onChange={(e) => setDatePlayed(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setDatePlayed(new Date().toISOString().split("T")[0])}
          className="mt-2 px-3 py-1.5 rounded-lg border border-retro-border bg-retro-card text-sm text-stone-200 hover:bg-retro-border/30 transition"
        >
          Välj idag
        </button>
      </div>

      {/* Medspelare */}
      <div>
        <label className="block font-medium text-stone-200 mb-2">Vilka var med?</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {players.map((player) => {
            const isCurrentUser = player.id === currentUserId;
            const isSelected = withFriends.includes(player.alias);

            return (
              <label
                key={player.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
                  isCurrentUser
                    ? "border-retro-accent/50 bg-retro-accent/15 text-stone-100 font-medium cursor-not-allowed"
                    : "border-retro-border bg-retro-card text-stone-200 hover:border-retro-accent/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isCurrentUser || isSelected}
                  disabled={isCurrentUser}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setWithFriends([...withFriends, player.alias]);
                    } else {
                      setWithFriends(
                        withFriends.filter((name) => name !== player.alias)
                      );
                    }
                  }}
                  className="rounded border-retro-border text-retro-accent focus:ring-retro-accent"
                />
                {player.alias}
              </label>
            );
          })}
        </div>

        {/* Gäst-fält */}
        <div className="space-y-2">
          {manualGuests.map((guest, index) => (
            <input
              key={index}
              type="text"
              className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              placeholder="Gästnamn"
              value={guest}
              onChange={(e) => handleGuestChange(index, e.target.value)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addGuestField}
          className="mt-2 px-3 py-2 rounded-lg border border-retro-border bg-retro-card text-stone-200 hover:bg-retro-border/30 transition"
        >
          Lägg till gäst
        </button>
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
