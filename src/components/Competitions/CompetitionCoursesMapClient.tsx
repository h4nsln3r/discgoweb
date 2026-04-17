"use client";

import dynamic from "next/dynamic";

type CourseInput = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  main_image_url?: string | null;
  hole_count?: number;
};

type Props = {
  courses: CourseInput[];
  competitionId?: string;
  variant?: "default" | "hero";
};

const CompetitionCoursesMap = dynamic(
  () => import("@/components/Maps/CompetitionCoursesMap").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-retro-border bg-retro-surface h-52 animate-pulse" />
    ),
  }
);

export default function CompetitionCoursesMapClient({
  courses,
  competitionId,
  variant = "default",
}: Props) {
  return (
    <CompetitionCoursesMap courses={courses} competitionId={competitionId} variant={variant} />
  );
}
