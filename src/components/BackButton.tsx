"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="flex items-center gap-2 text-stone-300 hover:text-stone-100 transition"
    >
      <ArrowLeftIcon className="w-5 h-5 shrink-0" />
      <span>Tillbaka</span>
    </button>
  );
}
