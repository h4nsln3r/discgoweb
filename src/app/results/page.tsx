"use client";

import { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

interface Score {
  id: string;
  score: number;
  date_played: string;
  competition_id: string | null;
  courses: { name: string } | null;
  profiles: { alias: string } | null;
  competitions: { title: string } | null;
}

export default function ResultsPage() {
  const [data, setData] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

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

  // Kolumndefinitioner
  const columns: ColumnDef<Score>[] = [
    {
      accessorKey: "courses.name",
      header: "Bana",
      cell: (info) =>
        info.row.original.courses
          ? info.row.original.courses.name
          : "Okänd bana",
    },
    {
      accessorKey: "profiles.alias",
      header: "Spelare",
      cell: (info) =>
        info.row.original.profiles
          ? info.row.original.profiles.alias
          : "Okänd spelare",
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: (info) => (
        <span className="font-semibold">{String(info.getValue())}</span>
      ),
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
          "Utanför tävling"
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
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) return <p className="p-4">Laddar resultat...</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Alla resultat</h1>

      {/* Globalt sökfält */}
      <input
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Sök efter bana, spelare, score eller tävling..."
        className="mb-4 p-2 border rounded w-full max-w-sm"
      />

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
              } hover:bg-gray-100`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 border">
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
