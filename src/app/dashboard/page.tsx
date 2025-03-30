import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AddCourseForm from "@/components/AddCourseForm";

export default async function Dashboard() {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // 🟡 Hämta alla banor
  const { data: courses, error } = await supabase.from("courses").select("*");

  console.log(error);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Välkommen {user.email} 👋</h1>
      <p className="text-gray-600 mb-4">
        Lägg till en bana du spelat på eller känner till.
      </p>

      <AddCourseForm />

      <h2 className="text-2xl font-semibold mt-10 mb-4">Alla banor</h2>
      {courses && courses.length > 0 ? (
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
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Inga banor tillagda än.</p>
      )}
    </div>
  );
}
