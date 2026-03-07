"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTopbarActions } from "@/components/Topbar/TopbarActionsContext";
import CompetitionSortDropdown, { type SortValue } from "@/components/Competitions/CompetitionSortDropdown";
import CompetitionList, { type CompetitionItem } from "@/components/Lists/CompetitionList";

const VALID_SORT: SortValue[] = ["date_asc", "date_desc", "name_asc", "name_desc"];

function parseSort(s: string | null): SortValue {
  if (s && VALID_SORT.includes(s as SortValue)) return s as SortValue;
  return "date_asc";
}

type Props = {
  competitions: CompetitionItem[];
};

export default function CompetitionsPageClient({ competitions }: Props) {
  const searchParams = useSearchParams();
  const sort = parseSort(searchParams.get("sort"));
  const q = searchParams.get("q") ?? "";
  const { setTopbarActions } = useTopbarActions();

  useEffect(() => {
    setTopbarActions({
      backHref: null,
      editHref: null,
      editLabel: null,
      pageTitle: "Alla tävlingar",
      primaryActionHref: "/competitions/new",
      primaryActionLabel: "Lägg till tävling",
      topbarExtraLeft: <CompetitionSortDropdown currentSort={sort} />,
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
    <main className="w-full py-4 sm:py-6">
      <CompetitionList competitions={competitions} sort={sort} q={q} />
    </main>
  );
}
