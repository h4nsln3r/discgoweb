"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm from "@/components/Forms/CourseForm";
import { CourseData } from "@/types/util";

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "name, location, latitude, longitude, image_urls, main_image_url"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        alert("Kunde inte hämta kursdata");
      } else {
        setCourseData({
          name: data.name,
          location: data.location ?? "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
          image_urls: Array.isArray(data.image_urls)
            ? data.image_urls
            : (() => {
                try {
                  return JSON.parse(data.image_urls ?? "") || [];
                } catch {
                  return [];
                }
              })(),
          main_image_url: data.main_image_url || "",
        });
      }

      setLoading(false);
    };

    fetchCourse();
  }, [id, supabase]);

  const handleUpdate = async (formData: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
    imageUrls: string[];
    mainImageUrl: string;
  }) => {
    const { error } = await supabase
      .from("courses")
      .update({
        name: formData.name,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image_urls: JSON.stringify(formData.imageUrls),
        main_image_url: formData.mainImageUrl,
      })
      .eq("id", id);

    if (error) {
      alert("Fel vid uppdatering av bana");
      console.error(error);
    } else {
      alert("Banan uppdaterad!");
      router.push(`/courses/${id}`);
    }
  };

  if (loading) return <div>Laddar...</div>;
  if (!courseData) return <div>Ingen kurs hittad</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Redigera bana</h1>
      <CourseForm
        initialName={courseData.name}
        initialLocation={courseData.location ?? ""}
        initialLatitude={courseData.latitude ?? ""}
        initialLongitude={courseData.longitude && courseData.longitude}
        initialImageUrls={courseData.image_urls ?? [""]}
        initialMainImageUrl={courseData.main_image_url ?? ""}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </div>
  );
}
