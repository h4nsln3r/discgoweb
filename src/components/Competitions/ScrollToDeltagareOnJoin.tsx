"use client";

import { useEffect } from "react";

type Props = {
  justJoined: boolean;
};

/** Efter "gå med": smooth-scroll till deltagarsektionen när sidan/refresh är klar. */
export default function ScrollToDeltagareOnJoin({ justJoined }: Props) {
  useEffect(() => {
    if (!justJoined) return;
    const el = document.getElementById("deltagare");
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(id);
  }, [justJoined]);

  return null;
}
