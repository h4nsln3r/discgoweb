"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm from "@/components/Forms/CourseForm";
import { useToast } from "@/components/ui/ToastProvider";

export default function AddCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { showToast } = useToast();

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
      console.error(error);
      showToast("Fel vid skapande av bana.", "error");
    } else {
      showToast("Banan har skapats!", "success");
      router.push("/courses");
      router.refresh();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Lägg till ny bana</h1>
      <CourseForm onSubmit={handleCreate} submitText="Skapa bana" />
    </div>
  );
}
