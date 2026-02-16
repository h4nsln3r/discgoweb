// src/app/courses/page.tsx
import CourseList from "@/components/CourseList";
import Link from "next/link";

export default async function AllCoursesPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏞️ Alla banor</h1>
        <Link
          href="/courses/new"
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition"
        >
          Lägg till bana
        </Link>
      </div>
      <CourseList />
    </main>
  );
}
