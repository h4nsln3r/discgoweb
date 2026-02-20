"use client";

import React from "react";
import Image from "next/image";

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
      <div className="relative h-16 w-16 md:h-28 md:w-28 lg:h-32 lg:w-32 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-retro-accent/30 border-t-retro-accent animate-spin" />
        <div className="relative z-10 h-10 w-10 md:h-16 md:w-16 lg:h-20 lg:w-20 animate-spin">
          <Image
            src="/logo/disclogo.png"
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      <p className="text-base font-medium text-stone-300">{text}</p>
    </div>
  );
}
