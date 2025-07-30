// src/app/courses/page.tsx
import CourseList from "@/components/CourseList";
import Link from "next/link";

export default async function AllCoursesPage() {
  return (
    <main className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-4">🏞️ Alla banor</h1>
        <Link
          href="/courses/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lägg till bana
        </Link>
      </div>
      <CourseList />
    </main>
  );
}
