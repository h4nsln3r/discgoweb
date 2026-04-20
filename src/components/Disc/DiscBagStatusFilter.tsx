"use client";

import { useRouter, useSearchParams } from "next/navigation";

const BAG_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Alla discar" },
  { value: "for_trade", label: "Vill byta" },
  { value: "discarded", label: "Bortkastade" },
  { value: "worthless", label: "Värdelösa" },
];

type Props = {
  currentBag: string | null;
};

export default function DiscBagStatusFilter({ currentBag }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (value) {
      params.set("bag", value);
    } else {
      params.delete("bag");
    }
    const query = params.toString();
    router.push(query ? `/discs?${query}` : "/discs");
  };

  return (
    <select
      value={currentBag ?? ""}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-retro-accent"
      aria-label="Filtrera på bag-status"
    >
      {BAG_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value || "all"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
