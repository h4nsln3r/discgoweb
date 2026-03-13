"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import AddScoreForm from "@/components/Forms/AddScoreForm";

type CompetitionData = { id: string; title: string; courses: { id: string; name: string }[] } | null;

export default function AddResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTopbarActions } = useTopbarActions();
  const courseIdFromUrl = searchParams.get("course_id");
  const competitionIdFromUrl = searchParams.get("competition_id");

  const [competitionData, setCompetitionData] = useState<CompetitionData>(null);
  const [coursesForForm, setCoursesForForm] = useState<{ id: string; name: string }[] | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(!!courseIdFromUrl);
  const [competitionLoading, setCompetitionLoading] = useState(!!competitionIdFromUrl);

  useEffect(() => {
    const backHref = competitionIdFromUrl
      ? `/competitions/${competitionIdFromUrl}`
      : "/results";
    setTopbarActions({
      backHref,
      editHref: null,
      editLabel: null,
      pageTitle: "Lägg till resultat",
    });
    return () => {
      setTopbarActions({
        backHref: null,
        pageTitle: null,
      });
    };
  }, [setTopbarActions, competitionIdFromUrl]);

  useEffect(() => {
    if (!courseIdFromUrl) {
      setCoursesLoading(false);
      setCoursesForForm(null);
      return;
    }
    let cancelled = false;
    setCoursesLoading(true);
    fetch("/api/get-courses")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setCoursesForForm(Array.isArray(data) ? data : []);
          setCoursesLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCoursesForForm([]);
          setCoursesLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [courseIdFromUrl]);

  useEffect(() => {
    if (!competitionIdFromUrl) {
      setCompetitionData(null);
      setCompetitionLoading(false);
      return;
    }
    let cancelled = false;
    setCompetitionLoading(true);
    fetch(`/api/competition-with-courses?competition_id=${competitionIdFromUrl}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setCompetitionData(data ? { id: data.id, title: data.title, courses: data.courses ?? [] } : null);
          setCompetitionLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCompetitionData(null);
          setCompetitionLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [competitionIdFromUrl]);

  return (
    <main className="p-4 md:p-6 w-full max-w-6xl mx-auto">
      {(courseIdFromUrl && coursesLoading) || (competitionIdFromUrl && competitionLoading) ? (
        <AddResultFormSkeleton />
      ) : (
        <AddScoreForm
          editingScore={null}
          initialCourseId={courseIdFromUrl}
          initialCompetitionId={competitionData?.id ?? null}
          competitionTitle={competitionData?.title ?? null}
          competitionCourses={competitionData?.courses ?? null}
          preloadedCourses={coursesForForm ?? undefined}
          onClose={() =>
            competitionIdFromUrl
              ? router.push(`/competitions/${competitionIdFromUrl}`)
              : router.push("/results")
          }
          onSuccess={() => {
            if (competitionIdFromUrl) {
              router.push(`/competitions/${competitionIdFromUrl}`);
            } else {
              router.push("/results");
            }
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

function AddResultFormSkeleton() {
  return (
    <div className="rounded-xl border border-retro-border bg-retro-surface p-6 space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-20 rounded bg-retro-border/60" />
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-retro-border/60" />
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-16 rounded bg-retro-border/60" />
        <div className="h-10 w-32 rounded-lg bg-retro-border/60" />
      </div>
      <div className="pt-2">
        <div className="h-10 w-full rounded-lg bg-retro-border/60" />
      </div>
    </div>
  );
}
