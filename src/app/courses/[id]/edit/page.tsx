// src/app/courses/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
// import { Course } from "@/components/CourseList";

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  //   const [courses, setCourses] = useState<Course[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    image_url: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    const fetchCourse = async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (data) {
        setFormData({
          name: data.name || "",
          location: data.location || "",
          image_url: data.image_url || "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
        });
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("courses")
      .update({
        name: formData.name,
        location: formData.location,
        image_url: formData.image_url,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      })
      .eq("id", courseId);

    if (error) {
      alert("Något gick fel 😕");
      console.error(error);
    } else {
      alert("Banan uppdaterad!");
      router.push(`/courses/${courseId}`);
    }
  };

  const handleDelete = async (courseId: string) => {
    const confirmed = confirm("Är du säker på att du vill radera banan?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);
    if (error) {
      alert("Kunde inte radera banan.");
      console.error(error);
    } else {
      //   setCourses((prev) => prev.filter((c) => c.id !== courseId));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Redigera bana</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Namn"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="location"
          placeholder="Plats"
          value={formData.location}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="url"
          name="image_url"
          placeholder="Bild-URL"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="latitude"
          placeholder="Latitud"
          value={formData.latitude}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          name="longitude"
          placeholder="Longitud"
          value={formData.longitude}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-green-600 text-white py-2 px-4 rounded"
        >
          Spara ändringar
        </button>
      </form>

      <button
        onClick={() => handleDelete(courseId)}
        className="text-sm text-red-600 mt-2"
      >
        🗑️ Radera bana
      </button>
    </div>
  );
}
