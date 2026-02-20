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
    <div className="min-h-[50vh] flex flex-col items-center justify-center" aria-label={loadingLabel}>
      <div className="h-72 w-72 md:h-[32rem] md:w-[32rem] lg:h-[40rem] lg:w-[40rem] animate-spin shrink-0">
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
