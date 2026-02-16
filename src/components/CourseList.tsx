"use client";

import { useEffect, useState } from "react";
import AddScoreForm from "./AddScoreForm";
import CourseScores, { CourseScore } from "./CourseScores";
import Link from "next/link";
import PageLoading from "./ui/PageLoading";

export type Course = {
  id: string;
  name: string;
  location: string;
  main_image_url?: string;
  latitude?: number;
  longitude?: number;
  scores?: CourseScore[];
};

export default function CourseList({ refresh }: { refresh?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForms, setOpenForms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const res = await fetch("/api/get-courses-with-scores");
      const data = await res.json();
      setCourses(data);
      setLoading(false);
    };

    fetchCourses();
  }, [refresh]);

  const toggleForm = (courseId: string) => {
    setOpenForms((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  if (loading) return <PageLoading variant="courses" />;
  if (!courses.length)
    return <p className="text-gray-500">Inga banor tillagda än.</p>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <h3 className="text-lg font-semibold">{course.name}</h3>
            <p className="text-sm text-gray-600">{course.location}</p>

            {course.main_image_url && (
              <img
                src={course.main_image_url}
                alt={course.name}
                className="mt-2 rounded object-cover max-h-48 w-full"
              />
            )}

            {course.latitude && course.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {course.latitude}, {course.longitude}
              </p>
            )}

            <Link
              href={`/courses/${course.id}`}
              className="text-sm text-blue-600 hover:underline mt-2 block"
            >
              Visa detaljer
            </Link>

            <button
              onClick={() => toggleForm(course.id)}
              className="mt-4 text-sm text-blue-600 underline"
            >
              {openForms[course.id] ? "Stäng formulär" : "Lägg till resultat"}
            </button>

            {openForms[course.id] && (
              <AddScoreForm
                courseId={course.id}
                onClose={() => toggleForm(course.id)}
              />
            )}

            <CourseScores scores={course.scores ?? []} />
          </div>
        ))}
      </div>
    </>
  );
}
