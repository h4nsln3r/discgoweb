"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type BackLinkProps = {
  children?: React.ReactNode;
  className?: string;
};

/** Tillbaka-knapp som går till föregående sida i webbläsarhistoriken. */
export default function BackLink({ children, className }: BackLinkProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={
        className ??
        "inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200 transition"
      }
    >
      <ArrowLeftIcon className="h-5 w-5 shrink-0" />
      <span>{children ?? "Tillbaka"}</span>
    </button>
  );
}
