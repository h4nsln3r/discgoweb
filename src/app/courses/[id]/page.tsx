import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Database } from "@/types/supabase";
import { getCurrentUserWithAdmin, canEditAsOwnerOrAdmin } from "@/lib/auth-server";
import Link from "next/link";
import { MapPinIcon, PlusCircleIcon, HashtagIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import ImageGallery from "@/components/ImageGallery";
import { SetTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import ScoresTable from "@/components/Tables/ScoresTable";
import { formatScorePar } from "@/lib/scoreDisplay";
import CompetitionsTable from "@/components/Tables/CompetitionsTable";
import MapEmbed from "@/components/Maps/MapEmbed";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ from?: string; competitionId?: string }>;
}) {
  const cookieStore = await cookies();
  const supabase = createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
  const { id } = await params;

  // Hämta kursen
  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course || error) notFound();

  const { user, isAdmin } = await getCurrentUserWithAdmin(supabase);
  const canEdit = canEditAsOwnerOrAdmin(user?.id ?? null, isAdmin, course.created_by ?? undefined);

  const { data: creatorProfile } = (course as { created_by?: string | null }).created_by
    ? await supabase
        .from("profiles")
        .select("id, alias")
        .eq("id", (course as { created_by: string }).created_by)
        .single()
    : { data: null };

  // Hämta tävlingar
  const { data: competitions } = await supabase
    .from("competition_courses")
    .select("competition_id, competitions ( id, title, start_date, end_date )")
    .eq("course_id", id);

  // Hämta alla scores (med id för hole-in-one-koppling)
  const { data: allScores } = await supabase
    .from("scores")
    .select("id, user_id, score, created_at, profiles!scores_user_id_fkey( alias )")
    .eq("course_id", id);

  const scoreIds = (allScores ?? []).map((s) => (s as { id: string }).id);
  let holeInOnes: { hole_number: number; alias: string; user_id: string | null }[] = [];
  if (scoreIds.length > 0) {
    const { data: aces } = await supabase
      .from("score_holes")
      .select("score_id, hole_number")
      .in("score_id", scoreIds)
      .eq("throws", 1);
    const scoreById = new Map((allScores ?? []).map((s) => [(s as { id: string }).id, s]));
    holeInOnes = (aces ?? []).map((a) => {
      const score = scoreById.get((a as { score_id: string }).score_id) as { user_id?: string; profiles: { alias: string | null } | null } | undefined;
      return {
        hole_number: (a as { hole_number: number }).hole_number,
        alias: score?.profiles?.alias ?? "Okänd",
        user_id: score?.user_id ?? null,
      };
    });
  }

  // Hämta hål (par + längd) om banan har hålinfo
  const { data: holes } = await supabase
    .from("course_holes")
    .select("hole_number, par, length")
    .eq("course_id", id)
    .order("hole_number");

  // Robust parsing av image_urls
  const parsedImageUrls = parseImageUrls(course.image_urls);

  // Main_image först
  const allImages = [
    ...(course.main_image_url ? [course.main_image_url] : []),
    ...parsedImageUrls,
  ];

  // Sortera scores för topp 3
  const top3 = allScores
    ? [...allScores].sort((a, b) => a.score - b.score).slice(0, 3)
    : [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <SetTopbarActions
        backHref="/courses"
        editHref={canEdit ? `/courses/${course.id}/edit` : null}
        editLabel="Redigera bana"
        pageTitle={course.name}
      />
      {allImages.length > 0 && (
        <ImageGallery
          images={allImages}
          holeCount={holes && holes.length > 0 ? holes.length : undefined}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <MapEmbed
            course={{
              name: course.name,
              location: course.location ?? "",
              latitude: course.latitude,
              longitude: course.longitude,
              description: course.description ?? "",
              city: course.city ?? "",
              country: course.country ?? "",
              imageUrls: parseImageUrls(course.image_urls),
              mainImageUrl: course.main_image_url ?? "",
            }}
          />

          {top3.length > 0 && (
            <div className="rounded-xl border border-retro-border bg-retro-surface p-4">
              <h2 className="font-semibold text-lg mb-2 text-stone-100">🏆 Topp 3 resultat</h2>
              <ul className="space-y-1 text-stone-200">
                {top3.map((score, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>
                      {(score as { user_id?: string }).user_id ? (
                        <Link
                          href={`/profile/${(score as { user_id: string }).user_id}`}
                          className="text-retro-accent hover:underline"
                        >
                          {score.profiles?.alias ?? "Okänd spelare"}
                        </Link>
                      ) : (
                        (score.profiles?.alias ?? "Okänd spelare")
                      )}
                    </span>
                    <span>
                      {(score as { id?: string }).id ? (
                        <Link
                          href={`/results/${(score as { id: string }).id}`}
                          className="text-retro-accent hover:underline font-medium"
                        >
                          {formatScorePar(score.score)}
                        </Link>
                      ) : (
                        formatScorePar(score.score)
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {holeInOnes.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h2 className="font-semibold text-lg mb-2 text-amber-200">⛳ Hole in one</h2>
              <ul className="space-y-1 text-stone-200">
                {holeInOnes.map((ace, idx) => (
                  <li key={idx}>
                    Hål {ace.hole_number} – {ace.user_id ? (
                      <Link href={`/profile/${ace.user_id}`} className="text-retro-accent hover:underline">
                        {ace.alias}
                      </Link>
                    ) : (
                      ace.alias
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {((course as { landskap?: string | null }).landskap || course.city || course.country || course.location) && (
            <p className="text-stone-400 flex flex-wrap items-center gap-x-2 gap-y-1">
              <MapPinIcon className="w-4 h-4 text-retro-muted shrink-0" aria-hidden />
              {(course as { landskap?: string | null }).landskap && (
                <span className="text-amber-500/90">{(course as { landskap: string }).landskap}</span>
              )}
              {(course as { landskap?: string | null }).landskap && (course.city || course.country) && <span> · </span>}
              {course.city && <span>{course.city}</span>}
              {course.city && course.country && <span>, </span>}
              {course.country && <span>{course.country}</span>}
              {(course.city || course.country) && course.location && <span> · </span>}
              {course.location && <span className="text-retro-muted text-sm">{course.location}</span>}
            </p>
          )}

          {creatorProfile && (course as { created_by?: string | null }).created_by && (
            <p className="text-stone-400 flex items-center gap-2 text-sm">
              <UserCircleIcon className="w-4 h-4 text-retro-muted shrink-0" aria-hidden />
              <span>Lagt till av </span>
              <Link
                href={`/profile/${(course as { created_by: string }).created_by}`}
                className="text-retro-accent hover:underline"
              >
                {(creatorProfile as { alias: string | null }).alias?.trim() || "Okänd"}
              </Link>
            </p>
          )}

          {course.description && (
            <div className="border-t border-retro-border pt-4">
              <h2 className="text-xl font-semibold mb-2 text-stone-100">Beskrivning</h2>
              <p className="whitespace-pre-line text-stone-200">{course.description}</p>
            </div>
          )}

          {holes && holes.length > 0 && (
            <div className="border-t border-retro-border pt-4">
              <h2 className="text-xl font-semibold mb-3 text-stone-100 flex items-center gap-2">
                <HashtagIcon className="w-5 h-5 shrink-0 text-retro-muted" aria-hidden />
                Hål
              </h2>
              <div className="rounded-xl border border-retro-border bg-retro-card/50 overflow-hidden">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-px bg-retro-border">
                  {holes.map((h) => (
                    <div
                      key={h.hole_number}
                      className="bg-retro-surface p-2 sm:p-3 text-center"
                    >
                      <p className="text-xs text-retro-muted font-medium">Hål {h.hole_number}</p>
                      <p className="text-stone-100 font-semibold">Par {h.par}</p>
                      {h.length != null && (
                        <p className="text-sm text-stone-400">{h.length} m</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-3 py-2 bg-retro-card border-t border-retro-border text-sm text-stone-400">
                  Par {holes.reduce((sum, h) => sum + h.par, 0)} totalt
                  {holes.some((h) => h.length != null) && (
                    <> · {holes.filter((h) => h.length != null).reduce((sum, h) => sum + (h.length ?? 0), 0)} m totalt</>
                  )}
                </div>
              </div>
            </div>
          )}
          <p className="pt-2">
            <Link
              href={`/results/new?course_id=${course.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-retro-accent hover:text-retro-accent-hover transition"
            >
              <PlusCircleIcon className="w-4 h-4 shrink-0" aria-hidden />
              Lägg till resultat
            </Link>
          </p>
        </div>
      </div>

      {allScores && allScores.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-stone-100">Alla resultat</h2>
          <ScoresTable
            scores={allScores}
            parByHole={holes ? Object.fromEntries(holes.map((h) => [h.hole_number, h.par])) : undefined}
          />
        </div>
      )}

      {competitions && competitions.length > 0 && (
        <CompetitionsTable competitions={competitions} />
      )}
    </div>
  );
}

function parseImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((s) => typeof s === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((s) => typeof s === "string");
      }
    } catch {
      return [];
    }
  }
  return [];
}
