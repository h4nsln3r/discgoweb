"use client";

import React from "react";

const LOADING_TITLES = {
  courses: "Laddar banor...",
  results: "Laddar resultat...",
  competitions: "Laddar tävlingar...",
  profile: "Laddar profil...",
} as const;

type Variant = keyof typeof LOADING_TITLES;

type Props = {
  /** Fördefinierade texter per sida – använd dessa så att all copy är på ett ställe */
  variant?: Variant;
  /** Egna text om du inte använder variant */
  title?: string;
};

export default function PageLoading({ variant, title }: Props) {
  const text = title ?? (variant ? LOADING_TITLES[variant] : "Laddar...");
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
      <div className="h-12 w-12 rounded-full border-4 border-retro-accent/30 border-t-retro-accent animate-spin" />
      <p className="text-base font-medium text-stone-300">{text}</p>
    </div>
  );
}

