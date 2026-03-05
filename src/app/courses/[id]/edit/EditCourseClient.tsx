"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  landskap: string;
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
  landskap: string;
  holes: CourseHole[];
};

export default function EditCourseClient({ courseId }: { courseId: string }) {
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseDataFromDb | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      const columnsWithLandskap =
        "name, location, latitude, longitude, image_urls, main_image_url, description, city, country, landskap";
      let result = await supabase
        .from("courses")
        .select(columnsWithLandskap)
        .eq("id", courseId)
        .single();

      if (result.error) {
        const msg = result.error.message ?? String(result.error.code ?? result.error);
        const missingColumn = /column.*does not exist|landskap/i.test(msg);
        if (missingColumn) {
          result = await supabase
            .from("courses")
            .select("name, location, latitude, longitude, image_urls, main_image_url, description, city, country")
            .eq("id", courseId)
            .single();
        }
        if (result.error) {
          console.error("Course fetch error:", result.error.message ?? result.error.code ?? result.error);
          showToast("Kunde inte hämta kursdata.", "error");
          setLoading(false);
          return;
        }
      }

      const course = result.data as Record<string, unknown>;
      const { data: holesData } = await supabase
        .from("course_holes")
        .select("hole_number, par, length")
        .eq("course_id", courseId)
        .order("hole_number");

      const holes: CourseHole[] = (holesData ?? []).map((h) => ({
        hole_number: h.hole_number,
        par: h.par,
        length: h.length,
      }));

      if (course) {
        setCourseData({
          name: (course.name as string) ?? "",
          location: (course.location as string) ?? "",
          latitude: course.latitude != null ? String(course.latitude) : "",
          longitude: course.longitude != null ? String(course.longitude) : "",
          imageUrls: Array.isArray(course.image_urls)
            ? (course.image_urls as string[])
            : typeof course.image_urls === "string" && course.image_urls
            ? JSON.parse(course.image_urls)
            : [],
          mainImageUrl: (course.main_image_url as string) || "",
          description: (course.description as string) ?? "",
          city: (course.city as string) ?? "",
          country: (course.country as string) ?? "",
          landskap: (course.landskap as string) ?? "",
          holes,
        });
      }
      setLoading(false);
    };

    fetchCourse();
  }, [courseId, supabase, showToast]);

  const handleUpdate = async (formData: CourseFormData) => {
    const payload: Record<string, unknown> = {
      name: formData.name,
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      image_urls: JSON.stringify(formData.imageUrls),
      main_image_url: formData.mainImageUrl,
      description: formData.description,
      city: formData.city,
      country: formData.country,
      landskap: formData.landskap || null,
    };
    let result = await supabase.from("courses").update(payload).eq("id", courseId);

    if (result.error && /column.*does not exist|landskap/i.test(result.error.message ?? "")) {
      delete payload.landskap;
      result = await supabase.from("courses").update(payload).eq("id", courseId);
    }
    if (result.error) {
      console.error("Course update error:", result.error.message ?? result.error.code ?? result.error);
      showToast("Fel vid uppdatering av bana.", "error");
      return;
    }
    await supabase.from("course_holes").delete().eq("course_id", courseId);
    if (formData.holes.length > 0) {
      await supabase.from("course_holes").insert(
        formData.holes.map((h) => ({
          course_id: courseId,
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);
    const res = await fetch(`/api/delete-course?id=${encodeURIComponent(courseId)}`, { method: "DELETE" });
    setDeleting(false);
    const data = res.ok ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast((data as { error?: string })?.error ?? "Kunde inte ta bort banan.", "error");
      return;
    }
    showToast("Banan har tagits bort.", "success");
    router.push("/courses");
    router.refresh();
  };

  if (loading) return <div className="max-w-2xl mx-auto p-6 text-stone-400">Laddar...</div>;
  if (!courseData) return <div className="max-w-2xl mx-auto p-6 text-amber-400">Ingen kurs hittad</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="mb-2">
        <BackLink />
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
        initialLandskap={courseData.landskap}
        initialHoles={courseData.holes}
        onSubmit={handleUpdate}
        submitText="Spara ändringar"
      />

      <div className="pt-8 mt-8 border-t border-retro-border">
        <p className="text-sm text-stone-400 mb-2">Ta bort banan permanent. Endast du som skapade banan, eller admin, kan ta bort den.</p>
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={deleting}
          className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
        >
          {deleting ? "Tar bort…" : "Ta bort banan"}
        </button>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-retro-surface border border-retro-border rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-confirm-title" className="text-lg font-semibold text-stone-100">
              Vill du verkligen ta bort banan?
            </h2>
            <p className="text-stone-400 text-sm">
              Alla hålinfo, kopplingar till tävlingar och resultat kopplade till banan påverkas. Detta kan inte ångras.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-retro-border bg-retro-card text-stone-200 hover:bg-retro-surface transition"
              >
                Nej
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                Ja, ta bort banan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
