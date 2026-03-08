import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  });

  try {
    // Hämta senaste banor
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id, name, location, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (coursesError) {
      console.error("[dashboard-summary] latest courses error", coursesError);
    }

    // Hämta alla banor (för scores)
    const { data: allCourses, error: allCoursesError } = await supabase
      .from("courses")
      .select("id, name");

    if (allCoursesError) {
      console.error("[dashboard-summary] all courses error", allCoursesError);
    }

    const latestScores: {
      courseId: string;
      courseName: string;
      latestScore: {
        id: string;
        user_id?: string;
        score: number;
        date_played: string | null;
        profiles?: { alias: string } | null;
      } | null;
    }[] = [];

    if (allCourses) {
      // Hämta senaste score per bana (en query per bana – samma logik som befintlig route)
      for (const course of allCourses) {
        const { data: scores, error: scoreError } = await supabase
          .from("scores")
          .select("id, user_id, score, date_played, profiles!scores_user_id_fkey(alias)")
          .eq("course_id", course.id)
          .order("date_played", { ascending: false })
          .limit(1);

        if (scoreError) {
          console.error(
            "[dashboard-summary] latest score error",
            scoreError.message
          );
          continue;
        }

        latestScores.push({
          courseId: course.id as string,
          courseName: course.name,
          latestScore: scores?.[0] || null,
        });
      }
    }

    // Hämta senaste tävlingar
    const { data: competitions, error: competitionsError } = await supabase
      .from("competitions")
      .select("id, title, start_date, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (competitionsError) {
      console.error(
        "[dashboard-summary] latest competitions error",
        competitionsError
      );
    }

    // Alla banor för kartan
    const { data: mapCoursesRaw, error: mapCoursesError } = await supabase
      .from("courses")
      .select("id, name, location, city, latitude, longitude, main_image_url");

    if (mapCoursesError) {
      console.error("[dashboard-summary] mapCourses error", mapCoursesError);
    }

    // Hål per bana (för visning i panel)
    const { data: holesData } = await supabase
      .from("course_holes")
      .select("course_id");
    const holeCountByCourse: Record<string, number> = {};
    for (const row of holesData ?? []) {
      const cid = (row as { course_id: string }).course_id;
      holeCountByCourse[cid] = (holeCountByCourse[cid] ?? 0) + 1;
    }
    const mapCourses = (mapCoursesRaw ?? []).map((c) => ({
      ...c,
      hole_count: holeCountByCourse[c.id as string] ?? 0,
    }));

    // Nya medlemmar: max 6 st, endast registrerade senaste veckan
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoIso = oneWeekAgo.toISOString();

    const { data: newMembersRows, error: newMembersError } = await supabase
      .from("profiles")
      .select("id, alias, avatar_url")
      .gte("created_at", oneWeekAgoIso)
      .order("created_at", { ascending: false })
      .limit(6);

    if (newMembersError) {
      console.error("[dashboard-summary] newMembers error", newMembersError);
    }

    const newMembers: { id: string; alias: string; avatar_url: string | null }[] =
      (newMembersRows ?? []).map((p) => ({
        id: (p as { id: string }).id,
        alias: (p as { alias: string }).alias ?? "",
        avatar_url: (p as { avatar_url: string | null }).avatar_url ?? null,
      }));

    // Nya discar: senaste tillagda, max 5
    const { data: newDiscsRows, error: newDiscsError } = await supabase
      .from("discs")
      .select("id, name, bild, brand, disc_type")
      .order("created_at", { ascending: false })
      .limit(5);

    if (newDiscsError) {
      console.error("[dashboard-summary] newDiscs error", newDiscsError);
    }

    const newDiscs: { id: string; name: string; bild: string | null; brand: string | null; disc_type: string | null }[] =
      (newDiscsRows ?? []).map((d) => ({
        id: (d as { id: string }).id,
        name: (d as { name: string }).name,
        bild: (d as { bild: string | null }).bild ?? null,
        brand: (d as { brand: string | null }).brand ?? null,
        disc_type: (d as { disc_type: string | null }).disc_type ?? null,
      }));

    // Hero-bilder: nyligen tillagda tävlingsbilder först, annars tävlings-/banbilder
    const { data: recentPhotos } = await supabase
      .from("competition_photos")
      .select("image_url")
      .order("created_at", { ascending: false })
      .limit(20);
    const heroUrls: string[] = (recentPhotos ?? []).map((p) => (p as { image_url: string }).image_url).filter(Boolean);
    if (heroUrls.length < 5) {
      const { data: compImages } = await supabase
        .from("competitions")
        .select("image_url")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);
      for (const c of compImages ?? []) {
        const url = (c as { image_url: string | null }).image_url;
        if (url && !heroUrls.includes(url)) heroUrls.push(url);
      }
    }
    if (heroUrls.length < 5) {
      const { data: courseImages } = await supabase
        .from("courses")
        .select("main_image_url")
        .not("main_image_url", "is", null)
        .limit(10);
      for (const c of courseImages ?? []) {
        const url = (c as { main_image_url: string | null }).main_image_url;
        if (url && !heroUrls.includes(url)) heroUrls.push(url);
      }
    }
    const heroImages = heroUrls.map((url) => ({ url }));

    return NextResponse.json({
      courses: courses ?? [],
      latestScores,
      competitions: competitions ?? [],
      mapCourses,
      newMembers,
      newDiscs,
      heroImages,
    });
  } catch (err: unknown) {
    const msg = `[dashboard-summary] unhandled: ${
      err instanceof Error ? err.message : String(err)
    }`;
    console.error(msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

