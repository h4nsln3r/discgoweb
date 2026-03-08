"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Select from "react-select";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toasts/ToastProvider";
import { parseUDiscCsv, type UDiscRound } from "@/lib/udiscCsv";

type Course = { id: string; name: string; main_image_url?: string | null };
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
  const [manualGuests, setManualGuests] = useState<string[]>([]);
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [guestInputValue, setGuestInputValue] = useState("");
  const [addResultForAliases, setAddResultForAliases] = useState<string[]>([]);
  const [resultForOthers, setResultForOthers] = useState<Record<string, { throws: string; holeThrows: string[] }>>({});
  const [expandedOtherResults, setExpandedOtherResults] = useState<Set<string>>(new Set());
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [udiscRounds, setUdiscRounds] = useState<UDiscRound[] | null>(null);
  const [udiscInputKey, setUdiscInputKey] = useState(0);

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

  const appliedUdiscRoundRef = useRef<UDiscRound | null>(null);

  const applyUDiscRound = useCallback(
    (round: UDiscRound) => {
      setDatePlayed(round.date);
      setThrows(String(round.total));
      const courseList = courses.length ? courses : [];
      const matched = courseList.find(
        (c) => c.name.toLowerCase().trim() === round.courseName.toLowerCase().trim()
      );
      if (matched) {
        setSelectedCourse(matched.id);
      } else {
        setSelectedCourse("");
        showToast(
          `Kunde inte matcha banan "${round.courseName}". Välj bana manuellt i listan.`,
          "info"
        );
      }
      if (round.holeScores.length > 0) {
        appliedUdiscRoundRef.current = round;
      }
      setUdiscRounds(null);
      clearInvalid("course");
      clearInvalid("date");
      clearInvalid("throws");
      clearInvalid("holes");
    },
    [courses, showToast, clearInvalid]
  );

  useEffect(() => {
    const round = appliedUdiscRoundRef.current;
    if (!round || courseHoles.length === 0) return;
    const byHole = new Map(round.holeScores.map((h) => [h.hole_number, h.throws]));
    const filled = courseHoles.map((h) => (byHole.get(h.hole_number) != null ? String(byHole.get(h.hole_number)) : ""));
    setHoleThrows(filled);
    appliedUdiscRoundRef.current = null;
  }, [courseHoles]);

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

  const playerOptionsForSelect = useMemo(
    () =>
      players
        .filter((p) => p.id !== currentUserId && !withFriends.includes(p.alias))
        .map((p) => ({ value: p.alias, label: p.alias })),
    [players, currentUserId, withFriends]
  );

  // När bana/hål ändras, synka holeThrows-längd för andras resultat
  useEffect(() => {
    if (courseHoles.length === 0) return;
    setResultForOthers((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const alias of Object.keys(next)) {
        const cur = next[alias].holeThrows;
        if (cur.length !== courseHoles.length) {
          next[alias] = {
            ...next[alias],
            holeThrows: courseHoles.map((_, i) => cur[i] ?? ""),
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [courseHoles]);

  const toggleAddResultFor = useCallback(
    (alias: string) => {
      setAddResultForAliases((prev) => {
        if (prev.includes(alias)) {
          setResultForOthers((r) => {
            const next = { ...r };
            delete next[alias];
            return next;
          });
          setExpandedOtherResults((e) => {
            const n = new Set(e);
            n.delete(alias);
            return n;
          });
          return prev.filter((a) => a !== alias);
        }
        setResultForOthers((r) => ({
          ...r,
          [alias]: {
            throws: "",
            holeThrows: courseHoles.map(() => ""),
          },
        }));
        setExpandedOtherResults((e) => new Set(e).add(alias));
        return [...prev, alias];
      });
    },
    [courseHoles]
  );

  const setOtherResultThrows = useCallback((alias: string, throws: string) => {
    setResultForOthers((r) => (r[alias] ? { ...r, [alias]: { ...r[alias], throws } } : r));
  }, []);

  const setOtherResultHoleThrow = useCallback((alias: string, holeIndex: number, value: string) => {
    setResultForOthers((r) => {
      if (!r[alias]) return r;
      const next = [...r[alias].holeThrows];
      next[holeIndex] = value;
      return { ...r, [alias]: { ...r[alias], holeThrows: next } };
    });
  }, []);

  const otherResultTotals = useMemo(() => {
    const out: Record<string, { throws: number; score: number } | null> = {};
    const totalPar = courseHoles.reduce((s, h) => s + h.par, 0);
    for (const alias of addResultForAliases) {
      const data = resultForOthers[alias];
      if (!data) {
        out[alias] = null;
        continue;
      }
      if (usePerHole && data.holeThrows.length === courseHoles.length) {
        let totalThrows = 0;
        let valid = true;
        for (const t of data.holeThrows) {
          const n = Number(t);
          if (Number.isNaN(n) || n < 1) {
            valid = false;
            break;
          }
          totalThrows += n;
        }
        out[alias] = valid ? { throws: totalThrows, score: totalThrows - totalPar } : null;
      } else if (!usePerHole && data.throws.trim() !== "") {
        const n = Number(data.throws);
        out[alias] = !Number.isNaN(n) ? { throws: n, score: n - totalPar } : null;
      } else {
        out[alias] = null;
      }
    }
    return out;
  }, [addResultForAliases, resultForOthers, courseHoles, usePerHole]);

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
    for (const alias of addResultForAliases) {
      const tot = otherResultTotals[alias];
      if (tot === null) invalid.add(`other-${alias}`);
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
      const hasOtherInvalid = addResultForAliases.some((a) => invalid.has(`other-${a}`));
      showToast(
        !selectedCourse?.trim()
          ? "Välj en bana."
          : !datePlayed?.trim()
            ? "Fyll i datum."
            : usePerHole && totalFromHoles === null
              ? "Fyll i slag för alla hål."
              : !usePerHole && (throws.trim() === "" || Number.isNaN(Number(throws)))
                ? "Fyll i antal kast."
                : hasOtherInvalid
                  ? "Fyll i resultat för alla medspelare du valt att lägga till."
                  : "Fyll i alla obligatoriska fält.",
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

    if (!res.ok) {
      setLoading(false);
      showToast("Något gick fel vid sparandet av resultatet.", "error");
      return;
    }

    let otherFailed = false;
    for (const alias of addResultForAliases) {
      const tot = otherResultTotals[alias];
      if (tot === null) continue;
      const player = players.find((p) => p.alias === alias);
      if (!player?.id) continue;
      const otherPayload = {
        ...payload,
        for_user_id: player.id,
        score: tot.score,
        throws: tot.throws,
        with_friends: combinedFriendsForSubmit,
      } as const;
      if (usePerHole && resultForOthers[alias]?.holeThrows.length === courseHoles.length) {
        (otherPayload as { hole_scores?: { hole_number: number; throws: number }[] }).hole_scores = courseHoles.map(
          (h, i) => ({
            hole_number: h.hole_number,
            throws: Number(resultForOthers[alias].holeThrows[i]) || 0,
          })
        );
      }
      const otherRes = await fetch("/api/add-score", {
        method: "POST",
        body: JSON.stringify(otherPayload),
      });
      if (!otherRes.ok) otherFailed = true;
    }

    setLoading(false);

    if (otherFailed) {
      showToast("Ditt resultat sparades, men något gick fel för en eller flera medspelares resultat.", "error");
    } else {
      showToast(
        editingScore ? "Resultatet har uppdaterats!" : addResultForAliases.length > 0 ? "Alla resultat har sparats!" : "Resultatet har sparats!",
        "success"
      );
    }
    onSuccess?.();

    if (editingScore) {
      onClose();
    } else {
      setThrows("");
      setDatePlayed(new Date().toISOString().split("T")[0]);
      setWithFriends([]);
      setManualGuests([]);
      setAddResultForAliases([]);
      setResultForOthers({});
      setExpandedOtherResults(new Set());
      setSelectedCourse("");
      setCourseHoles([]);
      setHoleThrows([]);
    }
  };

  const handleUDiscFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const rounds = parseUDiscCsv(text);
        if (rounds.length === 0) {
          showToast("Inga rundor hittades i filen. Kontrollera att det är en UDisc CSV-export.", "error");
          return;
        }
        setUdiscRounds(rounds);
        setUdiscInputKey((k) => k + 1);
      };
      reader.readAsText(file, "UTF-8");
      e.target.value = "";
    },
    [showToast]
  );

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.name })),
    [courses]
  );
  const selectedCourseOption = useMemo(
    () => courseOptions.find((o) => o.value === selectedCourse) ?? null,
    [courseOptions, selectedCourse]
  );

  const selectedCourseData = useMemo(
    () => courses.find((c) => c.id === selectedCourse) ?? null,
    [courses, selectedCourse]
  );

  const formatPreviewDate = (dateStr: string) => {
    if (!dateStr.trim()) return null;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const holeScoreStatus = useMemo(() => {
    if (!usePerHole || courseHoles.length === 0 || holeThrows.length !== courseHoles.length) return null;
    return courseHoles.map((h, i) => {
      const t = Number(holeThrows[i]);
      if (Number.isNaN(t) || t < 1) return { hole_number: h.hole_number, par: h.par, relative: null };
      return { hole_number: h.hole_number, par: h.par, relative: t - h.par };
    });
  }, [usePerHole, courseHoles, holeThrows]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start mt-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-8 min-w-0"
      >
      {/* Bana först – sökbar dropdown */}
      <section ref={courseRef}>
        <label className="block font-medium text-stone-200 mb-2">
          {isCompetitionMode ? "Bana (i tävlingen)" : "Vilken bana körde du?"}
        </label>
        {isCompetitionMode && competitionTitle && (
          <p className="text-xs text-stone-400 mb-2">Bara banor som ingår i tävlingen kan väljas.</p>
        )}
        {isCompetitionMode && courses.length === 0 ? (
          <p className="text-sm text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
            Tävlingen har inga banor kopplade. Gå till Redigera tävling och lägg till banor.
          </p>
        ) : (
          <Select
            aria-label={isCompetitionMode ? "Välj bana (i tävlingen)" : "Sök och välj bana"}
            placeholder="Sök eller välj bana..."
            value={selectedCourseOption}
            options={courseOptions}
            onChange={(opt) => {
              setSelectedCourse(opt?.value ?? "");
              clearInvalid("course");
            }}
            isClearable
            isSearchable
            noOptionsMessage={() => "Ingen bana matchar sökningen"}
            loadingMessage={() => "Laddar banor..."}
            instanceId="course-select"
            classNamePrefix="course-select"
            inputId="course-select-input"
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 44,
                backgroundColor: "var(--retro-card, #1c1917)",
                borderColor: invalidFields.has("course")
                  ? "rgb(239 68 68)"
                  : state.isFocused
                    ? "var(--retro-accent, #f59e0b)"
                    : "var(--retro-border, #44403c)",
                boxShadow: state.isFocused && !invalidFields.has("course") ? "0 0 0 2px rgba(245, 158, 11, 0.3)" : "none",
                "&:hover": {
                  borderColor: invalidFields.has("course") ? "rgb(239 68 68)" : "var(--retro-border, #44403c)",
                },
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "var(--retro-card, #1c1917)",
                border: "1px solid var(--retro-border, #44403c)",
                zIndex: 50,
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? "var(--retro-surface, #292524)" : "transparent",
                color: "var(--stone-200, #e7e5e4)",
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--stone-100, #f5f5f4)",
              }),
              input: (base) => ({
                ...base,
                color: "var(--stone-100, #f5f5f4)",
              }),
              placeholder: (base) => ({
                ...base,
                color: "var(--stone-500, #78716c)",
              }),
            }}
          />
        )}
      </section>

      {!editingScore && !isCompetitionMode && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-stone-200">Importera från UDisc</p>
          <p className="text-xs text-stone-400">
            Exportera dina rundor i UDisc (Du → Runder → ☰ → Exportera till CSV) och ladda upp filen här. Välj sedan vilken runda du vill lägga in.
          </p>
          <input
            key={udiscInputKey}
            type="file"
            accept=".csv"
            onChange={handleUDiscFile}
            className="block w-full text-sm text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-retro-border file:bg-retro-surface file:text-stone-200 file:text-sm"
          />
          {udiscRounds && udiscRounds.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-stone-500">
                {udiscRounds.length} runda(or) hittade – välj en att använda:
              </p>
              <ul className="max-h-48 overflow-y-auto rounded-lg border border-retro-border divide-y divide-retro-border">
                {udiscRounds.map((r, i) => (
                  <li key={`${r.date}-${r.courseName}-${r.playerName}-${i}`}>
                    <button
                      type="button"
                      onClick={() => applyUDiscRound(r)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-retro-surface transition flex justify-between items-center gap-2"
                    >
                      <span className="text-stone-200 truncate">
                        {r.courseName}
                        {r.layoutName ? ` (${r.layoutName})` : ""} – {r.date}
                      </span>
                      <span className="shrink-0 text-stone-400">
                        {r.total} slag{r.relativeToPar !== 0 ? ` (${r.relativeToPar > 0 ? "+" : ""}${r.relativeToPar})` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {isCompetitionMode && competitionTitle && (
        <div className="rounded-lg border border-retro-accent/40 bg-retro-accent/10 px-3 py-2">
          <p className="text-xs text-retro-muted font-medium">Tävling</p>
          <p className="text-stone-100 font-semibold">{competitionTitle}</p>
        </div>
      )}

      <section ref={dateRef}>
        <label className="block font-medium text-stone-200 mb-2">Datum</label>
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
      </section>

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

      <section>
        <label className="block font-medium text-stone-200 mb-2">Vilka var med?</label>
        <p className="text-sm text-stone-400 mb-2">Lägg till medspelare eller gäster. Du behöver inte välja någon.</p>
        <div className="flex gap-2 flex-wrap items-stretch">
          <div className="flex-1 min-w-[200px]" style={{ minHeight: 44 }}>
            <Select
              aria-label="Sök och lägg till medspelare"
              placeholder="Sök spelare..."
              value={null}
              options={playerOptionsForSelect}
              onChange={(opt) => {
                if (opt?.value) {
                  setWithFriends([...withFriends, opt.value]);
                }
              }}
              isClearable
              isSearchable
              noOptionsMessage={() => "Inga fler spelare att lägga till"}
              instanceId="player-select"
              classNamePrefix="player-select"
              inputId="player-select-input"
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 44,
                  backgroundColor: "var(--retro-card, #1c1917)",
                  borderColor: state.isFocused ? "var(--retro-accent, #f59e0b)" : "var(--retro-border, #44403c)",
                  boxShadow: state.isFocused ? "0 0 0 2px rgba(245, 158, 11, 0.3)" : "none",
                  "&:hover": { borderColor: "var(--retro-border, #44403c)" },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "var(--retro-card, #1c1917)",
                  border: "1px solid var(--retro-border, #44403c)",
                  zIndex: 50,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "var(--retro-surface, #292524)" : "transparent",
                  color: "var(--stone-200, #e7e5e4)",
                }),
                input: (base) => ({ ...base, color: "var(--stone-100, #f5f5f4)" }),
                placeholder: (base) => ({ ...base, color: "var(--stone-500, #78716c)" }),
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowGuestInput(true)}
            className="shrink-0 px-4 py-2.5 rounded-lg border border-retro-border bg-retro-card text-stone-200 hover:bg-retro-border/30 transition text-sm font-medium"
          >
            Lägg till gäst
          </button>
        </div>
        {showGuestInput && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              type="text"
              placeholder="Skriv gästnamn"
              value={guestInputValue}
              onChange={(e) => setGuestInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const name = guestInputValue.trim();
                  if (name) {
                    setManualGuests([...manualGuests, name]);
                    setGuestInputValue("");
                  }
                  setShowGuestInput(false);
                }
                if (e.key === "Escape") {
                  setShowGuestInput(false);
                  setGuestInputValue("");
                }
              }}
              className="flex-1 min-w-0 rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                const name = guestInputValue.trim();
                if (name) {
                  setManualGuests([...manualGuests, name]);
                  setGuestInputValue("");
                }
                setShowGuestInput(false);
              }}
              className="shrink-0 px-3 py-2 rounded-lg bg-retro-accent/80 text-stone-100 text-sm hover:bg-retro-accent transition"
            >
              Lägg till
            </button>
          </div>
        )}
        {(withFriends.length > 0 || manualGuests.some((g) => g.trim() !== "")) && (
          <div className="mt-3">
            <span className="text-xs font-medium text-stone-500 block mb-1">Var med</span>
            <div className="flex flex-wrap gap-2">
              {withFriends.map((alias) => {
                const addingResult = addResultForAliases.includes(alias);
                return (
                  <span
                    key={alias}
                    className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1 rounded-lg bg-retro-accent/20 border border-retro-accent/40 text-stone-200 text-sm"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() => {
                        setWithFriends(withFriends.filter((a) => a !== alias));
                        setAddResultForAliases((prev) => prev.filter((a) => a !== alias));
                        setResultForOthers((r) => {
                          const next = { ...r };
                          delete next[alias];
                          return next;
                        });
                        setExpandedOtherResults((e) => {
                          const n = new Set(e);
                          n.delete(alias);
                          return n;
                        });
                      }}
                      className="text-stone-400 hover:text-stone-100 ml-0.5"
                      aria-label={`Ta bort ${alias}`}
                    >
                      ×
                    </button>
                    {!editingScore && (
                      <button
                        type="button"
                        onClick={() => toggleAddResultFor(alias)}
                        className="ml-1 text-xs text-retro-accent hover:text-amber-300 underline"
                      >
                        {addingResult ? "Ta bort resultat" : "Lägg till resultat"}
                      </button>
                    )}
                  </span>
                );
              })}
              {manualGuests.filter((g) => g.trim() !== "").map((guest) => (
                <span
                  key={`guest-${guest}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-retro-accent/20 border border-retro-accent/40 text-stone-200 text-sm"
                >
                  Gäst: {guest}
                  <button
                    type="button"
                    onClick={() => setManualGuests(manualGuests.filter((g) => g !== guest))}
                    className="text-stone-400 hover:text-stone-100 ml-0.5"
                    aria-label={`Ta bort gäst ${guest}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {!editingScore && addResultForAliases.length > 0 && (
          <div className="mt-4 space-y-3">
            {addResultForAliases.map((alias) => {
              const data = resultForOthers[alias];
              const totals = otherResultTotals[alias];
              const isExpanded = expandedOtherResults.has(alias);
              const isInvalid = invalidFields.has(`other-${alias}`);
              return (
                <div
                  key={alias}
                  className={`rounded-lg border overflow-hidden ${isInvalid ? "border-red-500" : "border-retro-border"}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedOtherResults((prev) => {
                        const next = new Set(prev);
                        if (next.has(alias)) next.delete(alias);
                        else next.add(alias);
                        return next;
                      })
                    }
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-retro-card/60 text-left text-stone-200 hover:bg-retro-border/20 transition-colors"
                  >
                    <span className="font-medium">Resultat för {alias}</span>
                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 shrink-0" aria-hidden />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 shrink-0" aria-hidden />
                    )}
                  </button>
                  {isExpanded && data && (
                    <div className="p-3 pt-1 border-t border-retro-border bg-retro-card/30 space-y-3">
                      {usePerHole ? (
                        <>
                          <p className="text-xs text-stone-400">Slag per hål för {alias}</p>
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
                                  value={data.holeThrows[i] ?? ""}
                                  onChange={(e) => setOtherResultHoleThrow(alias, i, e.target.value)}
                                  className="w-full rounded-lg border border-retro-border bg-retro-surface px-2 py-1.5 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-retro-accent"
                                />
                              </div>
                            ))}
                          </div>
                          {totals !== null && (
                            <p className="text-sm text-stone-300">
                              Totalt: <strong>{totals.throws}</strong> slag · Poäng:{" "}
                              <strong>
                                {totals.score === 0 ? "Par" : totals.score > 0 ? `+${totals.score}` : totals.score}
                              </strong>
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-stone-200">Antal kast för {alias}</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="t.ex. 54"
                            value={data.throws}
                            onChange={(e) => setOtherResultThrows(alias, e.target.value)}
                            className="w-full rounded-lg border border-retro-border bg-retro-surface px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
                          />
                          {totals !== null && (
                            <p className="text-sm text-stone-300">
                              Poäng:{" "}
                              <strong>
                                {totals.score === 0 ? "Par" : totals.score > 0 ? `+${totals.score}` : totals.score}
                              </strong>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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

      {/* Höger: förhandsvisning – banbild, datum, hål med färger */}
      <aside className="min-w-0 lg:sticky lg:top-24 space-y-4 rounded-lg border border-retro-border bg-retro-card/40 overflow-hidden">
        {selectedCourseData ? (
          <>
            <div className="relative aspect-video w-full bg-retro-surface">
              {selectedCourseData.main_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedCourseData.main_image_url}
                  alt={selectedCourseData.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-stone-500 text-sm">
                  Ingen bild
                </div>
              )}
            </div>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-lg font-semibold text-stone-100">{selectedCourseData.name}</p>
              {datePlayed.trim() && formatPreviewDate(datePlayed) && (
                <p className="text-stone-300 capitalize">{formatPreviewDate(datePlayed)}</p>
              )}
              {holeScoreStatus && (
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Hål</p>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                    {holeScoreStatus.map(({ hole_number, par, relative }) => {
                      let bg = "bg-stone-600";
                      let label = "–";
                      if (relative !== null) {
                        if (relative <= -1) bg = "bg-blue-600";
                        else if (relative === 0) bg = "bg-green-600";
                        else if (relative === 1) bg = "bg-red-500";
                        else if (relative === 2) bg = "bg-red-700";
                        else bg = "bg-red-900";
                        label = relative <= 0 ? String(relative) : `+${relative}`;
                      } else {
                        label = `Par ${par}`;
                      }
                      return (
                        <div
                          key={hole_number}
                          className={`${bg} rounded flex flex-col items-center justify-center py-2 px-1 min-h-[52px]`}
                          title={`Hål ${hole_number} (Par ${par})${relative !== null ? ` · ${label}` : ""}`}
                        >
                          <span className="text-xs text-white/90">{hole_number}</span>
                          <span className="text-xs font-semibold text-white">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="aspect-video flex items-center justify-center text-stone-500 text-sm px-4">
            Välj en bana för att se förhandsvisning
          </div>
        )}
      </aside>
    </div>
  );
}
