"use client";

import { useState } from "react";
import AddCourseForm from "./AddCourseForm";
import CourseList from "./CourseList";

export default function AddCourseClientWrapper() {
  const [refresh, setRefresh] = useState(false);

  return (
    <>
      <AddCourseForm onCourseCreated={() => setRefresh(!refresh)} />
      <h2 className="text-2xl font-semibold mt-10 mb-4">Alla banor</h2>
      <CourseList refresh={refresh} />
    </>
  );
}
