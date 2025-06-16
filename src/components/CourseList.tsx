"use client";

import { useEffect, useState } from "react";
import AddScoreForm from "./AddScoreForm";
import CourseScores from "./CourseScores";

export type Course = {
  id: string;
  name: string;
  location: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
};

export default function CourseList({ refresh }: { refresh?: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [openForms, setOpenForms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };

    fetchCourses();
  }, [refresh]);

  const toggleForm = (courseId: string) => {
    setOpenForms((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

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

            {course.image_url && (
              <img
                src={course.image_url}
                alt={course.name}
                className="mt-2 rounded object-cover max-h-48 w-full"
              />
            )}

            {course.latitude && course.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {course.latitude}, {course.longitude}
              </p>
            )}

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
            <CourseScores courseId={course.id} />
          </div>
        ))}
      </div>
    </>
  );
}
