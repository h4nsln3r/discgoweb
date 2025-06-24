"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";

export default function NewCompetitionPage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

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

  // 🟡 Hämta banor från Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, name");
      if (data) setAllCourses(data);
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return alert("Du måste vara inloggad för att skapa tävlingar.");
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
      return alert("Kunde inte skapa tävlingen.");
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
        return alert("Kunde inte koppla banor.");
      }
    }

    setSuccessMessage("✅ Tävlingen har skapats!");
    setLoading(false);

    // Delay innan redirect (valfritt)
    setTimeout(() => {
      router.push("/competitions");
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Skapa ny tävling</h1>
      {loading && <p className="text-blue-600">⏳ Skapar tävling...</p>}
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Tävlingstitel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <textarea
          placeholder="Beskrivning"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div className="flex gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="border p-2 rounded w-full"
          />
        </div>

        <input
          type="url"
          placeholder="Bild-URL (valfri)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <label className="block font-semibold">Välj banor:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {allCourses.map((course) => (
            <label key={course.id} className="flex gap-2 items-center">
              <input
                type="checkbox"
                value={course.id}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCourses((prev) =>
                    checked
                      ? [...prev, course.id]
                      : prev.filter((id) => id !== course.id)
                  );
                }}
              />
              {course.name}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white py-2 px-4 rounded"
        >
          Skapa tävling
        </button>
      </form>
    </div>
  );
}
