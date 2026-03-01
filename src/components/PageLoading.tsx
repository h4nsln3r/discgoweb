"use client";

import React from "react";
import Image from "next/image";

const LOADING_TITLES = {
  courses: "Laddar banor...",
  results: "Laddar resultat...",
  competitions: "Laddar tävlingar...",
  profile: "Laddar profil...",
  teams: "Laddar lag...",
} as const;

type Variant = keyof typeof LOADING_TITLES;

type Props = {
  /** Fördefinierade texter per sida – använd dessa så att all copy är på ett ställe */
  variant?: Variant;
  /** Egna text om du inte använder variant */
  title?: string;
};

export default function PageLoading({ variant, title }: Props) {
  const loadingLabel = title ?? (variant ? LOADING_TITLES[variant] : "Laddar");
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[min(50vh,420px)] w-full max-w-full overflow-hidden py-8 px-4"
      aria-label={loadingLabel}
    >
      {/* Storlek begränsad med vmin så den aldrig orsakar scroll (max 40 % av minsta skärmdimension) */}
      <div className="h-[min(14rem,40vmin)] w-[min(14rem,40vmin)] max-w-full animate-spin shrink-0">
        <Image
          src="/logo/disco.png"
          alt=""
          width={640}
          height={640}
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );
}
