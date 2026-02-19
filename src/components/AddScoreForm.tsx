"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Course = { id: string; name: string };
type Player = { id: string; alias: string };

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
};

export default function AddScoreForm({
  onClose,
  onSuccess,
  editingScore,
}: Props) {
  const { showToast } = useToast();
  const [score, setScore] = useState("");
  const [throws, setThrows] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [withFriends, setWithFriends] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [manualGuests, setManualGuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAlias, setCurrentUserAlias] = useState<string>("");

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

  // Hämta kurser och spelare
  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, playersRes] = await Promise.all([
        fetch("/api/get-courses"),
        fetch("/api/get-profiles"),
      ]);

      const coursesData = await coursesRes.json();
      const playersData = await playersRes.json();

      setCourses(coursesData);
      setPlayers(playersData);

      // Om vi redigerar → sätt selectedCourse direkt
      if (editingScore?.courses) {
        setSelectedCourse(editingScore.courses.id);
      }
    };

    fetchData();
  }, [editingScore]);

  // Autofyll formulär vid redigering
  useEffect(() => {
    if (editingScore) {
      setScore(String(editingScore.score));
      setThrows(String(editingScore.throws));
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
    setLoading(true);

    // Kombinera medspelare och gäster
    const combinedFriends = [
      ...withFriends,
      ...manualGuests.filter((g) => g.trim() !== "").map((g) => `Gäst:${g}`),
    ];

    const payload = {
      course_id: selectedCourse,
      score: Number(score),
      throws: Number(throws),
      date_played: datePlayed,
      with_friends: combinedFriends,
    };

    console.log("payload", payload, editingScore?.id);

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
        // Stäng vid redigering
        onClose();
      } else {
        // Reset vid nytt resultat
        setScore("");
        setThrows("");
        setDatePlayed(new Date().toISOString().split("T")[0]);
        setWithFriends(currentUserAlias ? [currentUserAlias] : []);
        setManualGuests([]);
        setSelectedCourse("");
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
      {/* Dropdown för bana */}
      <div>
        <label className="block font-medium text-stone-200 mb-1">Välj bana</label>
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
      </div>

      {/* Score */}
      <div>
        <label className="block font-medium text-stone-200 mb-1">Poäng</label>
        <input
          type="number"
          className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
        />
      </div>

      {/* Kast */}
      <div>
        <label className="block font-medium text-stone-200 mb-1">Antal kast</label>
        <input
          type="number"
          className="w-full rounded-lg border border-retro-border bg-retro-card px-3 py-2 text-stone-100 focus:outline-none focus:ring-2 focus:ring-retro-accent"
          value={throws}
          onChange={(e) => setThrows(e.target.value)}
          required
        />
      </div>

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
          disabled={loading}
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
