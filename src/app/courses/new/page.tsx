"use client";

import { useEffect, useState } from "react";
import { Course } from "@/components/CourseList";
import AddCourseForm from "@/components/AddCourseForm";

export default function AddCoursePage() {
  const [refresh, setRefresh] = useState(false);

  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };

    fetchCourses();
  }, [refresh]);

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-6">➕ Lägg till en ny bana</h1>
          <AddCourseForm onCourseCreated={() => setRefresh(!refresh)} />
        </div>
        <div className="w-full md:w-1/2">
          <h1 className="text-2xl font-bold mb-4">🏞️ Alla banor</h1>
          <ul className="space-y-2">
            {courses?.map((course) => (
              <li key={course.id} className="p-4 bg-gray-100 rounded shadow">
                <h2 className="font-semibold">{course.name}</h2>
                <p className="text-sm text-gray-600">
                  {course.location || "Ingen plats angiven"}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
