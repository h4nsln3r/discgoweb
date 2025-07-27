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
      setDatePlayed(
        editingScore.date_played
          ? new Date(editingScore.date_played).toISOString().split("T")[0]
          : ""
      );
      setWithFriends(editingScore.with_friends ?? [currentUserAlias]);
      setSelectedCourse(editingScore.courses.id);
    } else {
      setScore("");
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
      alert(editingScore ? "Resultat uppdaterat!" : "Resultat sparat!");
      onSuccess?.();

      if (editingScore) {
        // Stäng vid redigering
        onClose();
      } else {
        // Reset vid nytt resultat
        setScore("");
        setDatePlayed(new Date().toISOString().split("T")[0]);
        setWithFriends(currentUserAlias ? [currentUserAlias] : []);
        setManualGuests([]);
        setSelectedCourse("");
      }
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
        <button
          type="button"
          onClick={() => setDatePlayed(new Date().toISOString().split("T")[0])}
          className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Välj idag
        </button>
      </div>

      {/* Medspelare */}
      <div>
        <label className="block font-medium">Vilka var med?</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {players.map((player) => {
            const isCurrentUser = player.id === currentUserId;
            const isSelected = withFriends.includes(player.alias);

            return (
              <label
                key={player.id}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  isCurrentUser
                    ? "bg-green-200 font-semibold cursor-not-allowed"
                    : ""
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
              className="border p-2 w-full"
              placeholder="Gästnamn"
              value={guest}
              onChange={(e) => handleGuestChange(index, e.target.value)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={addGuestField}
          className="mt-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Lägg till gäst
        </button>
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
