"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
} from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  MapPinIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  TrophyIcon,
  FlagIcon,
  PencilSquareIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";
import PageLoading from "@/components/PageLoading";
import { getHoleThrowBg, getHoleThrowStyle } from "@/lib/holeColors";

interface Score {
  id: string;
  user_id: string;
  throws: number | null;
  score: number;
  date_played: string;
  competition_id: string | null;
  courses: { id: string; name: string };
  profiles: { alias: string; avatar_url?: string | null } | null;
  competitions: { title: string } | null;
  with_friends?: string[];
}

export default function ResultsPage() {
  const router = useRouter();

  const [data, setData] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedHolesId, setExpandedHolesId] = useState<string | null>(null);
  const [holesByScoreId, setHolesByScoreId] = useState<
    Record<string, { hole_number: number; throws: number; par?: number }[] | null>
  >({});
  const [onlyCompetitions, setOnlyCompetitions] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchHolesForScore = (scoreId: string, courseId?: string) => {
    if (holesByScoreId[scoreId] !== undefined) return;
    setHolesByScoreId((prev) => ({ ...prev, [scoreId]: null }));
    const url = courseId
      ? `/api/score-holes?score_id=${encodeURIComponent(scoreId)}&course_id=${encodeURIComponent(courseId)}`
      : `/api/score-holes?score_id=${encodeURIComponent(scoreId)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        setHolesByScoreId((prev) => ({
          ...prev,
          [scoreId]: Array.isArray(data) ? data : [],
        }))
      )
      .catch(() =>
        setHolesByScoreId((prev) => ({ ...prev, [scoreId]: [] }))
      );
  };

  const toggleHoles = (scoreId: string, courseId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedHolesId((prev) => (prev === scoreId ? null : scoreId));
    if (expandedHolesId !== scoreId) fetchHolesForScore(scoreId, courseId);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/get-current-user");
        const data = await res.json();
        if (!data.error && data.id) {
          setCurrentUserId(data.id);
          setIsAdmin((data as { is_admin?: boolean }).is_admin === true);
        }
      } catch {
        // not logged in or error
      }
    };
    fetchUser();
  }, []);

  const handleRowClick = (id: string) => {
    router.push(`/results/${id}`);
  };

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    id: string
  ) => {
    // Make row accessible: Enter/Space navigates
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/results/${id}`);
    }
  };

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const res = await fetch("/api/get-all-scores");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching scores:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  // Unika banor och spelare för dropdowns
  const uniqueCourses = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.courses?.name).filter(Boolean))
      ),
    [data]
  );

  const uniquePlayers = useMemo(
    () =>
      Array.from(
        new Set(data.map((item) => item.profiles?.alias).filter(Boolean))
      ),
    [data]
  );

  const dataForTable = useMemo(
    () =>
      onlyCompetitions
        ? data.filter((s) => s.competition_id != null)
        : data,
    [data, onlyCompetitions]
  );

  // Kolumndefinitioner med explicit id
  const columns: ColumnDef<Score>[] = [
    {
      id: "course",
      accessorFn: (row) => row.courses?.name ?? "Okänd bana",
      header: "Bana",
      cell: (info) => {
        const row = info.row.original;
        const name = row.courses?.name ?? "Okänd bana";
        return row.courses?.id ? (
          <Link
            href={`/courses/${row.courses.id}`}
            className="text-retro-accent hover:underline"
          >
            {name}
          </Link>
        ) : (
          name
        );
      },
    },
    {
      id: "player",
      accessorFn: (row) => row.profiles?.alias ?? "Okänd spelare",
      header: "Spelare",
      cell: (info) => {
        const row = info.row.original;
        const alias = row.profiles?.alias ?? "Okänd spelare";
        return row.user_id ? (
          <Link
            href={`/profile/${row.user_id}`}
            className="text-retro-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {alias}
          </Link>
        ) : (
          alias
        );
      },
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Link
            href={`/results/${row.id}`}
            className="font-semibold text-retro-accent hover:underline"
            title="Visa resultat"
          >
            {row.score}
          </Link>
        );
      },
    },
    {
      accessorKey: "throws",
      header: "Kast",
      cell: (info) => {
        const row = info.row.original;
        return (
          // <Link
          //   href={`/results/${row.id}/edit`}
          //   className="font-semibold text-blue-600 hover:underline"
          //   title="Redigera resultat"
          // >
          //   {row.score}
          // </Link>
          <p>{row.throws}</p>
        );
      },
    },
    {
      accessorKey: "date_played",
      header: "Datum",
      cell: (info) =>
        new Date(info.getValue() as string).toLocaleDateString("sv-SE"),
    },
    {
      accessorKey: "competitions.title",
      header: "Tävling",
      cell: (info) => {
        const comp = info.row.original;
        return comp.competitions ? (
          <a
            href={`/competitions/${comp.competition_id}`}
            className="text-retro-accent hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {comp.competitions.title}
          </a>
        ) : (
          "-"
        );
      },
    },
    {
      id: "holes",
      header: () => (
        <span className="inline-flex items-center gap-1">
          <HashtagIcon className="w-4 h-4 shrink-0" aria-hidden /> Hål
        </span>
      ),
      cell: (info) => {
        const row = info.row.original;
        const isExpanded = expandedHolesId === row.id;
        return (
          <button
            type="button"
            onClick={(e) => toggleHoles(row.id, row.courses?.id, e)}
            className="p-1.5 rounded-lg text-retro-accent hover:bg-retro-card transition"
            title={isExpanded ? "Dölj hål" : "Visa hål"}
            aria-label={isExpanded ? "Dölj hål" : "Visa hål"}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        );
      },
    },
  ];

  // Setup React Table
  const table = useReactTable({
    data: dataForTable,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const resetFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setOnlyCompetitions(false);
    table.resetColumnFilters();
  };

  if (loading) return <PageLoading variant="results" />;

  if (data.length === 0) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-stone-100">Alla resultat</h1>
          <Link
            href="/results/new"
            className="px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
          >
            Lägg till resultat
          </Link>
        </div>
        <div className="rounded-xl border border-retro-border bg-retro-surface p-8 text-center">
          <p className="text-stone-300 text-lg">Inga resultat än.</p>
          <p className="text-stone-500 text-sm mt-2">
            Lägg till ett resultat för att se det här.
          </p>
          <Link
            href="/results/new"
            className="inline-block mt-4 px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
          >
            Lägg till resultat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-stone-100">Alla resultat</h1>
        <Link
          href="/results/new"
          className="px-4 py-2 bg-retro-accent text-stone-100 rounded-lg hover:bg-retro-accent-hover transition"
        >
          Lägg till resultat
        </Link>
      </div>

      {/* Globalt sökfält */}
      <input
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Sök efter bana, spelare, score eller tävling..."
        className="mb-4 p-2 border border-retro-border rounded-lg w-full max-w-sm bg-retro-surface text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-retro-accent"
      />

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={(table.getColumn("course")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table
              .getColumn("course")
              ?.setFilterValue(e.target.value || undefined)
          }
          className="p-2 border border-retro-border rounded-lg bg-retro-surface text-stone-100"
        >
          <option value="">Alla banor</option>
          {uniqueCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          value={(table.getColumn("player")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table
              .getColumn("player")
              ?.setFilterValue(e.target.value || undefined)
          }
          className="p-2 border border-retro-border rounded-lg bg-retro-surface text-stone-100"
        >
          <option value="">Alla spelare</option>
          {uniquePlayers.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>

        <select
          value={onlyCompetitions ? "tavling" : ""}
          onChange={(e) => setOnlyCompetitions(e.target.value === "tavling")}
          className="p-2 border border-retro-border rounded-lg bg-retro-surface text-stone-100"
          aria-label="Filtrera på tävlingar"
        >
          <option value="">Alla resultat</option>
          <option value="tavling">Endast tävlingar</option>
        </select>

        <button
          onClick={resetFilters}
          className="p-2 bg-retro-card border border-retro-border rounded-lg hover:bg-retro-surface text-stone-200 transition"
        >
          Rensa filter
        </button>
      </div>

      {/* Mobil: fällbara rader med rullgardinseffekt */}
      <div className="md:hidden space-y-2">
        {table.getRowModel().rows.map((row) => {
          const score = row.original;
          const isOpen = expandedId === score.id;
          return (
            <div
              key={row.id}
              className={`relative border border-retro-border rounded-xl overflow-hidden bg-retro-surface ${score.competition_id ? "border-l-4 border-l-amber-500" : ""}`}
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId((id) => (id === score.id ? null : score.id))
                }
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-retro-card/50 transition-colors focus:outline-none focus:ring-2 focus:ring-retro-accent focus:ring-inset"
                aria-expanded={isOpen}
                aria-controls={`result-details-${score.id}`}
                id={`result-row-${score.id}`}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {/* Rad 1: Bana (vänster) + Datum (höger) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPinIcon className="h-4 w-4 text-retro-accent shrink-0" aria-hidden />
                      {score.courses?.id ? (
                        <Link
                          href={`/courses/${score.courses.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-stone-100 truncate text-retro-accent hover:underline"
                        >
                          {score.courses.name ?? "Okänd bana"}
                        </Link>
                      ) : (
                        <span className="font-medium text-stone-100 truncate">
                          {score.courses?.name ?? "Okänd bana"}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-stone-400 shrink-0">
                      <CalendarDaysIcon className="h-4 w-4 text-stone-500" aria-hidden />
                      {new Date(score.date_played).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                  {/* Rad 2: Användare (avatar + alias) + kast */}
                  <div className="flex items-center gap-2 text-sm text-stone-400">
                    {score.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external avatar URL
                      <img
                        src={score.profiles.avatar_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <UserCircleIcon className="h-6 w-6 text-stone-500 shrink-0" aria-hidden />
                    )}
                    <span className="truncate">
                      {score.user_id ? (
                        <Link
                          href={`/profile/${score.user_id}`}
                          className="text-retro-accent hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {score.profiles?.alias ?? "Okänd"}
                        </Link>
                      ) : (
                        (score.profiles?.alias ?? "Okänd")
                      )}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <TrophyIcon className="h-4 w-4 text-stone-500" aria-hidden />
                      {score.throws != null ? (
                        <span>{score.throws} kast</span>
                      ) : (
                        <span>Score {score.score}</span>
                      )}
                    </span>
                  </div>
                </div>
                {score.competition_id && (
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0"
                    title="Tävlingsresultat"
                  >
                    <FlagIcon className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <ChevronDownIcon
                  className={`h-5 w-5 text-stone-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <div
                id={`result-details-${score.id}`}
                role="region"
                aria-labelledby={`result-row-${score.id}`}
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{
                  gridTemplateRows: isOpen ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-retro-border bg-retro-card/50 px-4 py-3 space-y-3">
                    {score.competitions && (
                      <div className="flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-sm">
                        <FlagIcon className="h-4 w-4 text-amber-400 shrink-0" />
                        <span className="text-stone-400">Tävling:</span>
                        <Link
                          href={`/competitions/${score.competition_id}`}
                          className="font-medium text-amber-400 hover:text-amber-300 hover:underline truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {score.competitions.title}
                        </Link>
                      </div>
                    )}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                      <dt className="flex items-center gap-2 text-stone-500">
                        <MapPinIcon className="h-4 w-4 text-retro-accent" />
                        Bana
                      </dt>
                      <dd className="text-stone-200">
                        {score.courses?.id ? (
                          <Link
                            href={`/courses/${score.courses.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-retro-accent hover:underline"
                          >
                            {score.courses.name ?? "—"}
                          </Link>
                        ) : (
                          (score.courses?.name ?? "—")
                        )}
                      </dd>
                      <dt className="flex items-center gap-2 text-stone-500">
                        <UserCircleIcon className="h-4 w-4" />
                        Spelare
                      </dt>
                      <dd className="text-stone-200">
                        {score.user_id ? (
                          <Link
                            href={`/profile/${score.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-retro-accent hover:underline"
                          >
                            {score.profiles?.alias ?? "—"}
                          </Link>
                        ) : (
                          (score.profiles?.alias ?? "—")
                        )}
                      </dd>
                      <dt className="flex items-center gap-2 text-stone-500">
                        <TrophyIcon className="h-4 w-4" />
                        Score
                      </dt>
                      <dd className="text-stone-200">{score.score}</dd>
                      {score.throws != null && (
                        <>
                          <dt className="flex items-center gap-2 text-stone-500">
                            <TrophyIcon className="h-4 w-4" />
                            Kast
                          </dt>
                          <dd className="text-stone-200">{score.throws}</dd>
                        </>
                      )}
                      <dt className="flex items-center gap-2 text-stone-500">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Datum
                      </dt>
                      <dd className="text-stone-200">
                        {new Date(score.date_played).toLocaleDateString("sv-SE")}
                      </dd>
                    </dl>
                    <div className="border-t border-retro-border pt-3">
                      <button
                        type="button"
                        onClick={(e) => toggleHoles(score.id, score.courses?.id, e)}
                        className="inline-flex items-center gap-2 text-sm text-retro-accent hover:underline"
                      >
                        {expandedHolesId === score.id ? (
                          <ChevronUpIcon className="w-4 h-4" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4" />
                        )}
                        <HashtagIcon className="w-4 h-4" />
                        {expandedHolesId === score.id ? "Dölj hål" : "Visa hål"}
                      </button>
                      {expandedHolesId === score.id && (
                        <div className="mt-2">
                          {holesByScoreId[score.id] === undefined ? (
                            <p className="text-sm text-stone-400">Laddar hål…</p>
                          ) : holesByScoreId[score.id] === null ? (
                            <p className="text-sm text-stone-400">Laddar hål…</p>
                          ) : (holesByScoreId[score.id]?.length ?? 0) === 0 ? (
                            <p className="text-sm text-stone-400">
                              Ingen hålfördelning sparad.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {[...(holesByScoreId[score.id] ?? [])]
                                .sort((a, b) => a.hole_number - b.hole_number)
                                .map((h) => {
                                  const bg = getHoleThrowBg(h.throws, h.par);
                                  const style = getHoleThrowStyle(h.throws, h.par);
                                  return (
                                    <span
                                      key={h.hole_number}
                                      className={`inline-flex items-center gap-1 rounded-lg border border-retro-border px-2.5 py-1 text-sm text-stone-200 ${bg || "bg-retro-surface"}`}
                                      style={Object.keys(style).length > 0 ? style : undefined}
                                    >
                                      <span className="text-retro-muted">
                                        H{h.hole_number}
                                      </span>
                                      <span className="font-medium">{h.throws}</span>
                                    </span>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/results/${score.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-2 flex-1 min-w-0 py-2.5 rounded-lg bg-retro-accent text-stone-100 font-medium hover:bg-retro-accent-hover transition focus:outline-none focus:ring-2 focus:ring-retro-accent focus:ring-offset-2 focus:ring-offset-retro-bg"
                      >
                        Öppna resultat
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                      {currentUserId != null && (score.user_id === currentUserId || isAdmin) && (
                        <Link
                          href={`/results/${score.id}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-retro-border bg-retro-surface text-stone-200 font-medium hover:bg-retro-border/30 transition"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Redigera
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: tabell */}
      <div className="hidden md:block overflow-x-auto border border-retro-border rounded-lg">
        <table className="min-w-full">
          <thead className="bg-retro-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2 border-b border-retro-border cursor-pointer select-none text-left text-stone-200 font-medium"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const score = row.original;
              const isHolesExpanded = expandedHolesId === score.id;
              const rowHoles = holesByScoreId[score.id];
              return (
                <Fragment key={row.id}>
                  <tr
                    className={`${
                      index % 2 === 0 ? "bg-retro-surface" : "bg-retro-card"
                    } hover:bg-retro-border/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-retro-accent border-b border-retro-border`}
                    onClick={() => handleRowClick(score.id)}
                    onKeyDown={(e) => handleRowKeyDown(e, score.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Öppna resultat ${score.id}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 text-stone-200"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("a, button")) e.stopPropagation();
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {isHolesExpanded && (
                    <tr
                      key={`${row.id}-holes`}
                      className="bg-retro-card/50 border-b border-retro-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <td
                        colSpan={row.getVisibleCells().length}
                        className="px-4 py-3"
                      >
                        {rowHoles === undefined ? (
                          <p className="text-sm text-stone-400">Laddar hål…</p>
                        ) : rowHoles === null ? (
                          <p className="text-sm text-stone-400">Laddar hål…</p>
                        ) : rowHoles.length === 0 ? (
                          <p className="text-sm text-stone-400">
                            Ingen hålfördelning sparad.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {[...rowHoles]
                              .sort((a, b) => a.hole_number - b.hole_number)
                              .map((h) => {
                                const bg = getHoleThrowBg(h.throws, h.par);
                                const style = getHoleThrowStyle(h.throws, h.par);
                                return (
                                  <span
                                    key={h.hole_number}
                                    className={`inline-flex items-center gap-1 rounded-lg border border-retro-border px-2.5 py-1 text-sm text-stone-200 ${bg || "bg-retro-surface"}`}
                                    style={Object.keys(style).length > 0 ? style : undefined}
                                  >
                                    <span className="text-retro-muted">
                                      H{h.hole_number}
                                    </span>
                                    <span className="font-medium">{h.throws}</span>
                                  </span>
                                );
                              })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
