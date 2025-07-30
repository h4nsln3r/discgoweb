"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm from "@/components/Forms/CourseForm";

type CourseDataFromDb = {
  name: string;
  location: string;
  latitude: string;
  longitude: string;
  imageUrls: string[];
  mainImageUrl: string;
  description: string;
  city: string;
  country: string;
};

type CourseFormData = {
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
  mainImageUrl: string;
  description: string;
  city: string;
  country: string;
};

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDataFromDb | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(
          "name, location, latitude, longitude, image_urls, main_image_url, description, city, country"
        )
        .eq("id", id as string)
        .single();

      if (error) {
        console.error(error);
        alert("Kunde inte hämta kursdata");
      } else if (data) {
        setCourseData({
          name: data.name,
          location: data.location ?? "",
          latitude: data.latitude?.toString() || "",
          longitude: data.longitude?.toString() || "",
          imageUrls: Array.isArray(data.image_urls)
            ? data.image_urls
            : data.image_urls
            ? JSON.parse(data.image_urls as string)
            : [],
          mainImageUrl: data.main_image_url || "",
          description: data.description ?? "",
          city: data.city ?? "",
          country: data.country ?? "",
        });
      }

      setLoading(false);
    };

    fetchCourse();
  }, [id, supabase]);

  const handleUpdate = async (formData: CourseFormData) => {
    const { error } = await supabase
      .from("courses")
      .update({
        name: formData.name,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        image_urls: JSON.stringify(formData.imageUrls),
        main_image_url: formData.mainImageUrl,
        description: formData.description,
        city: formData.city,
        country: formData.country,
      })
      .eq("id", id as string);

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
        initialLocation={courseData.location}
        initialLatitude={courseData.latitude}
        initialLongitude={courseData.longitude}
        initialImageUrls={courseData.imageUrls}
        initialMainImageUrl={courseData.mainImageUrl}
        initialDescription={courseData.description}
        initialCity={courseData.city}
        initialCountry={courseData.country}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </div>
  );
}
