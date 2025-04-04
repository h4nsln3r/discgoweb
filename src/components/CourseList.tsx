// components/CourseList.tsx
"use client";

import { useEffect, useState } from "react";
import Map from "./Map";

export type Course = {
  id: string;
  name: string;
  location: string;
  image_url?: string;
  latitude?: number;
  longitude?: number;
};

export default function CourseList({ refresh }: { refresh: boolean }) {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };

    fetchCourses();
  }, [refresh]);

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
            {/* {course.image_url && (
              <img
                src={course.image_url}
                alt={course.name}
                className="mt-2 rounded object-cover max-h-48 w-full"
              />
            )} */}
            {course.latitude && course.longitude && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {course.latitude}, {course.longitude}
              </p>
            )}
          </div>
        ))}
      </div>
      <Map courses={courses} />
    </>
  );
}
