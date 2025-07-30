"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm from "@/components/Forms/CourseForm";

export default function AddCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  const handleCreate = async (data: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrls: string[];
    mainImageUrl: string;
    description: string;
    city: string;
    country: string;
  }) => {
    const { error } = await supabase.from("courses").insert({
      name: data.name,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      image_urls: JSON.stringify(data.imageUrls),
      main_image_url: data.mainImageUrl,
      description: data.description,
      city: data.city,
      country: data.country,
    });

    if (error) {
      alert("Fel vid skapande av bana");
      console.error(error);
    } else {
      alert("Banan skapad!");
      router.push("/courses");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Lägg till ny bana</h1>
      <CourseForm onSubmit={handleCreate} submitText="Skapa bana" />
    </div>
  );
}
