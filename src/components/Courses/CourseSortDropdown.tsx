"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FunnelIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

export const SORT_OPTIONS = [
  { value: "date_added_desc", label: "Senast tillagda" },
  { value: "date_added_asc", label: "Äldst först" },
  { value: "name_asc", label: "Namn (A–Ö)" },
  { value: "name_desc", label: "Namn (Ö–A)" },
  { value: "land_landskap", label: "Land & landskap" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

type Props = {
  currentSort: SortValue;
};

export default function CourseSortDropdown({ currentSort }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleSelect = (value: SortValue) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Sortering och filter"
        className="inline-flex items-center gap-1 p-1.5 md:p-2 rounded-lg hover:bg-retro-card text-stone-300 hover:text-stone-200 transition"
      >
        <FunnelIcon className="w-5 h-5 md:w-5 md:h-5 shrink-0" />
        <ChevronDownIcon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 min-w-[200px] py-1 rounded-xl border border-retro-border bg-retro-surface shadow-xl z-50 overflow-hidden"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-retro-border bg-retro-card/50">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Sortering</span>
            </div>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="menuitem"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2.5 text-sm transition ${
                  currentSort === opt.value
                    ? "bg-retro-accent/15 text-retro-accent font-medium"
                    : "text-stone-200 hover:bg-retro-card"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
