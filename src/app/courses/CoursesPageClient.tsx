"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import CourseSortDropdown, { type SortValue } from "@/components/Courses/CourseSortDropdown";
import CourseList from "@/components/Lists/CourseList";

const VALID_SORT: SortValue[] = ["date_added_desc", "date_added_asc", "name_asc", "name_desc", "land_landskap"];

function parseSort(s: string | null): SortValue {
  if (s && VALID_SORT.includes(s as SortValue)) return s as SortValue;
  return "date_added_desc";
}

export default function CoursesPageClient() {
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));
  const q = searchParams.get("q") ?? "";
  const { setTopbarActions } = useTopbarActions();

  useEffect(() => {
    setTopbarActions({
      backHref: null,
      editHref: null,
      editLabel: null,
      pageTitle: "Alla banor",
      primaryActionHref: "/courses/new",
      primaryActionLabel: "Lägg till bana",
      topbarExtraLeft: <CourseSortDropdown currentSort={sort} />,
    });
    return () => {
      setTopbarActions({
        pageTitle: null,
        primaryActionHref: null,
        primaryActionLabel: null,
        topbarExtraLeft: null,
      });
    };
  }, [sort, setTopbarActions]);

  return (
    <main className="p-4 md:p-0 md:min-h-screen">
      <CourseList sortFromUrl={sort} searchFromUrl={q} />
    </main>
  );
}
