"use client";

import { useRouter, useSearchParams } from "next/navigation";

const DISC_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Alla typer" },
  { value: "driver", label: "Driver" },
  { value: "fairway", label: "Fairway" },
  { value: "midrange", label: "Midrange" },
  { value: "putter", label: "Putter" },
  { value: "other", label: "Annan" },
];

type Props = {
  currentType: string | null;
};

export default function DiscTypeFilter({ currentType }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    const query = params.toString();
    router.push(query ? `/discs?${query}` : "/discs");
  };

  return (
    <select
      value={currentType ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-retro-accent"
      aria-label="Filtrera på disc-typ"
    >
      {DISC_TYPE_OPTIONS.map((opt) => (
        <option key={opt.value || "all"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
