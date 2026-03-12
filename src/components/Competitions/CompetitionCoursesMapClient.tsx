"use client";

import dynamic from "next/dynamic";

type CourseInput = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  main_image_url?: string | null;
};

type Props = {
  courses: CourseInput[];
  competitionId?: string;
};

const CompetitionCoursesMap = dynamic(
  () => import("@/components/Maps/CompetitionCoursesMap").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-retro-border bg-retro-surface h-80 animate-pulse" />
    ),
  }
);

export default function CompetitionCoursesMapClient({
  courses,
  competitionId,
}: Props) {
  return (
    <CompetitionCoursesMap courses={courses} competitionId={competitionId} />
  );
}
