"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type Props = {
  avatarUrl: string | null;
  displayName?: string | null;
  /** Size class for the thumbnail, e.g. w-32 h-32 md:w-24 md:h-24 */
  className?: string;
  /** Wrapper for the team badge etc. - render as children if needed */
  children?: React.ReactNode;
};

export default function ProfileAvatarModal({
  avatarUrl,
  displayName,
  className = "w-32 h-32 md:w-24 md:h-24 lg:w-28 lg:h-28",
  children,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={`relative shrink-0 overflow-visible ${className}`}>
        <button
          type="button"
          onClick={() => avatarUrl && setOpen(true)}
          className={`w-full h-full rounded-full overflow-hidden bg-retro-card border border-retro-border block ${avatarUrl ? "cursor-pointer hover:ring-2 hover:ring-retro-accent/50 transition" : ""}`}
          aria-label={avatarUrl ? "Visa profilbild i större format" : undefined}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Profilbild" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-retro-muted text-3xl">🥏</div>
          )}
        </button>
        {children}
      </div>

      {open && avatarUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Profilbild förstoring"
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
            className="relative w-full max-w-[min(85vw,85vh)] aspect-square rounded-full overflow-hidden border-4 border-retro-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt={displayName ? `Profilbild – ${displayName}` : "Profilbild"}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </>
  );
}
