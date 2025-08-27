"use client";

import { useEffect, useState, useMemo } from "react";
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

interface Score {
  id: string;
  throws: number | null;
  score: number;
  date_played: string;
  competition_id: string | null;
  courses: { id: string; name: string };
  profiles: { alias: string } | null;
  competitions: { title: string } | null;
  with_friends?: string[]; // 👈 add here
}

export default function ResultsPage() {
  const router = useRouter();

  const [data, setData] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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
        console.log("json", json);
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

  // Kolumndefinitioner med explicit id
  const columns: ColumnDef<Score>[] = [
    {
      id: "course",
      accessorFn: (row) => row.courses?.name ?? "Okänd bana",
      header: "Bana",
    },
    {
      id: "player",
      accessorFn: (row) => row.profiles?.alias ?? "Okänd spelare",
      header: "Spelare",
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Link
            href={`/results/${row.id}/edit`}
            className="font-semibold text-blue-600 hover:underline"
            title="Redigera resultat"
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
            className="text-blue-600 hover:underline"
          >
            {comp.competitions.title}
          </a>
        ) : (
          "-"
        );
      },
    },
  ];

  // Setup React Table
  const table = useReactTable({
    data,
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

  // Rensa filter-funktion
  const resetFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    table.resetColumnFilters();
  };

  if (loading) return <p className="p-4">Laddar resultat...</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Alla resultat</h1>
        <Link
          href="/results/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Lägg till resultat
        </Link>
      </div>

      {/* Globalt sökfält */}
      <input
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Sök efter bana, spelare, score eller tävling..."
        className="mb-4 p-2 border rounded w-full max-w-sm"
      />

      {/* Filter dropdowns */}
      <div className="flex gap-4 mb-4">
        {/* Filter för Bana */}
        <select
          value={(table.getColumn("course")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table
              .getColumn("course")
              ?.setFilterValue(e.target.value || undefined)
          }
          className="p-2 border rounded"
        >
          <option value="">Alla banor</option>
          {uniqueCourses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        {/* Filter för Spelare */}
        <select
          value={(table.getColumn("player")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table
              .getColumn("player")
              ?.setFilterValue(e.target.value || undefined)
          }
          className="p-2 border rounded"
        >
          <option value="">Alla spelare</option>
          {uniquePlayers.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>

        {/* Rensa filter-knapp */}
        <button
          onClick={resetFilters}
          className="p-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Rensa filter
        </button>
      </div>

      {/* Tabell */}
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2 border cursor-pointer select-none"
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
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`${
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400`}
              onClick={() => handleRowClick(row.original.id)}
              onKeyDown={(e) => handleRowKeyDown(e, row.original.id)}
              tabIndex={0} // accessible focus
              role="button" // semantics
              aria-label={`Öppna resultat ${row.original.id}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-2 border"
                  // If any cell contains its own Link/button, stop row navigation when clicking those
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest("a,button")) e.stopPropagation();
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
