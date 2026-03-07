"use client";

import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm, { type CourseHole } from "@/components/Forms/CourseForm";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import { useToast } from "@/components/Toasts/ToastProvider";

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
    landskap: string;
    holes: CourseHole[];
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("courses")
      .insert({
        name: data.name,
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        image_urls: JSON.stringify(data.imageUrls),
        main_image_url: data.mainImageUrl,
        description: data.description,
        city: data.city,
        country: data.country,
        landskap: data.landskap?.trim() || null,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      showToast("Fel vid skapande av bana.", "error");
      return;
    }
    if (inserted?.id && data.holes.length > 0) {
      await supabase.from("course_holes").insert(
        data.holes.map((h) => ({
          course_id: inserted.id,
          hole_number: h.hole_number,
          par: h.par,
          length: h.length,
        }))
      );
    }
    showToast("Banan har skapats!", "success");
    router.push("/courses");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <SetTopbarActions backHref="/courses" />
      <h1 className="text-2xl font-bold text-stone-100">Lägg till ny bana</h1>
      <CourseForm onSubmit={handleCreate} submitText="Skapa bana" />
    </div>
  );
}
