// src/app/courses/page.tsx
import CourseList from "@/components/CourseList";

export default async function AllCoursesPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏞️ Alla banor</h1>
      <CourseList />
    </main>
  );
}
