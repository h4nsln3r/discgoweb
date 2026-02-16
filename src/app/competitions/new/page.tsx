"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
//TODO use Image from next
// import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { useToast } from "@/components/ui/ToastProvider";

export default function NewCompetitionPage() {
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const router = useRouter();
  const { showToast } = useToast();

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

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase.from("courses").select("id, name");
      if (data) setAllCourses(data);
      if (error) console.log("error", error);
    };
    fetchCourses();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      showToast("Du måste vara inloggad för att skapa tävlingar.", "error");
      return;
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
      showToast("Kunde inte skapa tävlingen.", "error");
      return;
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
        showToast("Kunde inte koppla banor.", "error");
        return;
      }
    }

    setSuccessMessage("✅ Tävlingen har skapats!");
    showToast("Tävlingen har skapats!", "success");
    setLoading(false);

    // Gå tillbaka till sidan du kom från
    setTimeout(() => {
      router.back();
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
            className="w-full border p-2 rounded"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="w-full border p-2 rounded"
          />
        </div>

        <input
          type="text"
          placeholder="Bild-URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div>
          <h2 className="font-semibold mb-2">Välj banor</h2>
          <div className="space-y-2">
            {allCourses.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={courses.includes(c.id)}
                  onChange={(e) => {
                    if (e.target.checked) setCourses((prev) => [...prev, c.id]);
                    else setCourses((prev) => prev.filter((id) => id !== c.id));
                  }}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded"
        >
          {loading ? "Skapar..." : "Skapa tävling"}
        </button>
      </form>
    </div>
  );
}
