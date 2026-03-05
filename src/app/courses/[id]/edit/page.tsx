import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin, canEditAsOwnerOrAdmin } from "@/lib/auth-server";
import EditCourseClient from "./EditCourseClient";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });

  const { data: course, error } = await supabase
    .from("courses")
    .select("id, created_by")
    .eq("id", id)
    .single();

  if (!course || error) notFound();

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  const canEdit = canEditAsOwnerOrAdmin(user?.id ?? null, isAdmin, course.created_by ?? undefined);

  if (!canEdit) {
    redirect(`/courses/${id}`);
  }

  return <EditCourseClient courseId={id} />;
}
