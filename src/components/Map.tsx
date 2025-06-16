"use client";

import dynamic from "next/dynamic";
import type { Course } from "./CourseList";
import { useEffect, useState } from "react";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function Map() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      const res = await fetch("/api/get-courses");
      const data = await res.json();
      setCourses(data);
    };

    fetchCourses();
  }, []);

  return <LeafletMap courses={courses} />;
}
