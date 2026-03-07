// src/app/courses/page.tsx
import CourseList from "@/components/Lists/CourseList";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";

export default async function AllCoursesPage() {
  return (
    <main className="p-6 max-w-6xl mx-auto">
      <SetTopbarActions
        pageTitle="Alla banor"
        primaryActionHref="/courses/new"
        primaryActionLabel="Lägg till bana"
      />
      <CourseList />
    </main>
  );
}
