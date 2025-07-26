import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CompetitionWithCourses = {
  id: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  competition_courses: {
    course_id: string;
    courses: { name: string } | null;
  }[];
};

export default async function CompetitionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const cookieStore = cookies(); // INTE await här
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: competition, error } = await supabase
    .from("competitions")
    .select(
      `
      id,
      title,
      description,
      start_date,
      end_date,
      image_url,
      competition_courses (
        course_id,
        courses ( name )
      )
    `
    )
    .eq("id", id as string) // Cast till rätt typ
    .single<CompetitionWithCourses>(); // Typfix

  if (!competition || error) {
    console.error("[FETCH COMPETITION ERROR]", error);
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{competition.title}</h1>
        <Link
          href={`/competitions/${id}/edit`}
          className="text-sm text-blue-600 underline"
        >
          ✏️ Redigera denna bana
        </Link>
      </div>
      {competition.image_url && (
        <img
          src={competition.image_url}
          alt={competition.title}
          className="w-full h-60 object-cover rounded"
        />
      )}

      <p className="text-gray-600">
        🗓️ {formatDate(competition.start_date)} –{" "}
        {formatDate(competition.end_date)}
      </p>

      {competition.description && (
        <p className="text-gray-800 whitespace-pre-line">
          {competition.description}
        </p>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-2">🏞️ Banor</h2>
        <ul className="list-disc pl-5">
          {competition.competition_courses.map((entry) => (
            <li key={entry.course_id}>{entry.courses?.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
