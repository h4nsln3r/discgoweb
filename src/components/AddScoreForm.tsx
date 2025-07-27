"use client";

import { useEffect, useState } from "react";

type Course = { id: string; name: string };
type Player = { id: string; alias: string };

type EditingScore = {
  id: string;
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
  const [score, setScore] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [withFriends, setWithFriends] = useState<string[]>([]);
  const [manualGuest, setManualGuest] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

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
        setSelectedCourse(editingScore.courses.id); // viktigt: ID, inte namn
      }
    };

    fetchData();
  }, [editingScore]);

  // Autofyll formuläret vid redigering
  useEffect(() => {
    if (editingScore) {
      setScore(String(editingScore.score));
      setDatePlayed(
        editingScore.date_played
          ? new Date(editingScore.date_played).toISOString().split("T")[0]
          : ""
      );
      setWithFriends(editingScore.with_friends ?? []);
      setSelectedCourse(editingScore.courses.id); // Viktigt här också
    } else {
      setScore("");
      setDatePlayed("");
      setWithFriends([]);
      setSelectedCourse("");
    }
  }, [editingScore]);

  // Lägg till manuellt gästnamn
  const addGuest = () => {
    if (manualGuest.trim() !== "") {
      setWithFriends([...withFriends, manualGuest.trim()]);
      setManualGuest("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      course_id: selectedCourse,
      score: Number(score),
      date_played: datePlayed,
      with_friends: withFriends,
    };

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
      alert(editingScore ? "Resultat uppdaterat!" : "Resultat sparat!");
      onSuccess?.();
      onClose();
    } else {
      alert("Något gick fel.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-4 border p-4 rounded bg-gray-50"
    >
      {/* Dropdown för bana */}
      <div>
        <label className="block font-medium">Välj bana</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          required
          className="border p-2 w-full"
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
        <label className="block font-medium">Antal kast</label>
        <input
          type="number"
          className="border p-2 w-full"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
        />
      </div>

      {/* Datum */}
      <div>
        <label className="block font-medium">Datum</label>
        <input
          type="date"
          className="border p-2 w-full"
          value={datePlayed}
          onChange={(e) => setDatePlayed(e.target.value)}
        />
      </div>

      {/* Medspelare */}
      <div>
        <label className="block font-medium">Vilka var med?</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {players.map((player) => (
            <label key={player.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={withFriends?.includes(player.alias) ?? false}
                onChange={(e) => {
                  if (e.target.checked) {
                    setWithFriends([...withFriends, player.alias]);
                  } else {
                    setWithFriends(
                      withFriends.filter((name) => name !== player.alias)
                    );
                  }
                }}
              />
              {player.alias}
            </label>
          ))}
        </div>
        {/* Gäst */}
        <div className="flex gap-2">
          <input
            type="text"
            className="border p-2 flex-1"
            placeholder="Lägg till gästnamn"
            value={manualGuest}
            onChange={(e) => setManualGuest(e.target.value)}
          />
          <button
            type="button"
            onClick={addGuest}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Lägg till
          </button>
        </div>
        {/* Lista med valda */}
        {withFriends.length > 0 && (
          <div className="mt-2 text-sm">
            <p>Valda: {withFriends.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
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
            className="text-sm text-gray-500 underline"
          >
            Avbryt redigering
          </button>
        )}
      </div>
    </form>
  );
}
