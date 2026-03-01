"use client";

import { useState } from "react";
import { XMarkIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";

type Props = {
  imageUrl: string | null;
  discName: string;
  /** Size of the thumbnail (e.g. w-64 h-64 or max-w-sm aspect-square) */
  className?: string;
};

export default function DiscImageModal({
  imageUrl,
  discName,
  className = "w-72 h-72 sm:w-80 sm:h-80 mx-auto",
}: Props) {
  const [open, setOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div
        className={`${className} rounded-full bg-retro-card border border-retro-border flex items-center justify-center text-retro-muted text-6xl shrink-0 overflow-hidden`}
      >
        🥏
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} rounded-full overflow-hidden bg-retro-card border-2 border-retro-border block shrink-0 cursor-pointer hover:border-retro-accent/50 hover:ring-2 hover:ring-retro-accent/30 transition group relative`}
        aria-label="Visa disc i fullskärm"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
          <ArrowsPointingOutIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition shrink-0" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Disc i fullskärm"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-retro-surface/90 hover:bg-retro-card border border-retro-border text-stone-300 hover:text-stone-100 transition z-10"
            aria-label="Stäng"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div
            className="relative w-full max-w-[min(90vw,90vh)] aspect-square rounded-full overflow-hidden border-4 border-retro-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={discName}
              className="w-full h-full object-cover object-center bg-retro-card"
            />
          </div>
        </div>
      )}
    </>
  );
}
