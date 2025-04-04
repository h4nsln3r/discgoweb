"use client";

import dynamic from "next/dynamic";
import type { Course } from "./CourseList";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function Map({ courses }: { courses: Course[] }) {
  return <LeafletMap courses={courses} />;
}
