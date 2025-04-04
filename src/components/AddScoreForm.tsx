"use client";

import { useState } from "react";

type Props = {
  courseId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddScoreForm({ courseId, onClose, onSuccess }: Props) {
  const [score, setScore] = useState("");
  const [datePlayed, setDatePlayed] = useState("");
  const [withFriends, setWithFriends] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/add-score", {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId,
        score: Number(score),
        date_played: datePlayed,
        with_friends: withFriends
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f !== ""),
      }),
    });

    setLoading(false);

    if (res.ok) {
      alert("Resultat sparat!");
      onClose();
      onSuccess?.();
    } else {
      alert("Något gick fel.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-4 border p-4 rounded bg-gray-50"
    >
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

      <div>
        <label className="block font-medium">Datum</label>
        <input
          type="date"
          className="border p-2 w-full"
          value={datePlayed}
          onChange={(e) => setDatePlayed(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-medium">
          Vilka var med? (kommaseparerade)
        </label>
        <input
          type="text"
          className="border p-2 w-full"
          value={withFriends}
          onChange={(e) => setWithFriends(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Sparar..." : "Spara resultat"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500 underline"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
