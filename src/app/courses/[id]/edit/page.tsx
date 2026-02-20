"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import CourseForm, { type CourseHole } from "@/components/Forms/CourseForm";
import BackLink from "@/components/Buttons/BackLink";
import { useToast } from "@/components/Toasts/ToastProvider";

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
  holes: CourseHole[];
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
  holes: CourseHole[];
};

export default function EditCoursePage() {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDataFromDb | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      const { data: course, error } = await supabase
        .from("courses")
        .select(
          "name, location, latitude, longitude, image_urls, main_image_url, description, city, country"
        )
        .eq("id", id as string)
        .single();

      if (error) {
        console.error(error);
        showToast("Kunde inte hämta kursdata.", "error");
        setLoading(false);
        return;
      }
      const { data: holesData } = await supabase
        .from("course_holes")
        .select("hole_number, par, length")
        .eq("course_id", id as string)
        .order("hole_number");

      const holes: CourseHole[] = (holesData ?? []).map((h) => ({
        hole_number: h.hole_number,
        par: h.par,
        length: h.length,
      }));

      if (course) {
        setCourseData({
          name: course.name,
          location: course.location ?? "",
          latitude: course.latitude?.toString() || "",
          longitude: course.longitude?.toString() || "",
          imageUrls: Array.isArray(course.image_urls)
            ? course.image_urls
            : course.image_urls
            ? JSON.parse(course.image_urls as string)
            : [],
          mainImageUrl: course.main_image_url || "",
          description: course.description ?? "",
          city: course.city ?? "",
          country: course.country ?? "",
          holes,
        });
      }
      setLoading(false);
    };

    fetchCourse();
  }, [id, supabase, showToast]);

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
      console.error(error);
      showToast("Fel vid uppdatering av bana.", "error");
      return;
    }
    await supabase.from("course_holes").delete().eq("course_id", id as string);
    if (formData.holes.length > 0) {
      await supabase.from("course_holes").insert(
        formData.holes.map((h) => ({
          course_id: id,
          hole_number: h.hole_number,
          par: h.par,
          length: h.length,
        }))
      );
    }
    showToast("Banan har uppdaterats!", "success");
    router.push("/courses");
    router.refresh();
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-stone-400">Laddar...</div>;
  if (!courseData) return <div className="max-w-2xl mx-auto p-6 text-amber-400">Ingen kurs hittad</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="mb-2">
        <BackLink href={id ? `/courses/${id}` : "/courses"}>Tillbaka till banan</BackLink>
      </div>
      <h1 className="text-2xl font-bold text-stone-100">Redigera bana</h1>
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
        initialHoles={courseData.holes}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />
    </div>
  );
}
