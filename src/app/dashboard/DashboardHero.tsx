"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import DashboardWeather from "./DashboardWeather";

const AUTO_ADVANCE_MS = 10000;

type Props = {
  images: { url: string }[];
  userName?: string;
  userCity?: string | null;
  /** På desktop: fyll förälderns höjd (t.ex. 100vh i split-layout). */
  desktopFullHeight?: boolean;
  /** Externt styrd bildindex (t.ex. vid mobil-sektioner som swipeas). */
  controlledIndex?: number;
  /** Stäng av automatisk bildrotation (t.ex. när index styrs externt). */
  disableAutoAdvance?: boolean;
};

export default function DashboardHero({ images, userName, userCity, desktopFullHeight, controlledIndex, disableAutoAdvance }: Props) {
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (i: number) => {
      if (images.length === 0) return;
      setIndex(((i % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  const next = useCallback(() => goTo(index + 1), [index, goTo]);
  const prev = useCallback(() => goTo(index - 1), [index, goTo]);

  useEffect(() => {
    if (disableAutoAdvance) return;
    if (images.length <= 1) return;
    intervalRef.current = setInterval(next, AUTO_ADVANCE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [disableAutoAdvance, images.length, index, next]);

  useEffect(() => {
    if (controlledIndex == null || images.length === 0) return;
    setIndex(((controlledIndex % images.length) + images.length) % images.length);
  }, [controlledIndex, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const handleTouchEnd = () => {
    if (touchStart == null || touchEnd == null || images.length <= 1) return;
    const diff = touchStart - touchEnd;
    const minSwipe = 50;
    if (diff > minSwipe) next();
    else if (diff < -minSwipe) prev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchEnd(null);
    setTouchStart(e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart != null) setTouchEnd(e.clientX);
  };
  const handleMouseUp = () => {
    if (touchStart != null && touchEnd != null && images.length > 1) {
      const diff = touchStart - touchEnd;
      if (diff > 50) next();
      else if (diff < -50) prev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };
  const handleMouseLeave = () => {
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (images.length === 0) {
    return (
      <div
        className={`w-full bg-retro-card/50 border-b border-retro-border ${desktopFullHeight ? "h-full min-h-0" : "h-[40vh] min-h-[240px]"}`}
        aria-hidden
      />
    );
  }

  return (
    <section
      className={`relative w-full overflow-hidden bg-stone-900 ${desktopFullHeight ? "h-full min-h-0 max-h-none md:mt-0" : "h-[60vh] min-h-[320px] max-h-[720px] md:mt-6"}`}
      aria-label="Bildspel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {(userName || userCity != null) && (
        <motion.div
          className="absolute top-4 left-4 md:top-6 md:left-6 z-10 max-w-[85%]"
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        >
          {userName && (
            <p className="font-bebas text-2xl md:text-3xl tracking-wide uppercase text-stone-100 drop-shadow-lg">
              Välkommen, <span className="text-amber-300">{userName}</span>!
            </p>
          )}
          <DashboardWeather userCity={userCity} />
        </motion.div>
      )}
      {images.map((img, i) => (
        <div
          key={`${img.url}-${i}`}
          className="absolute inset-0 transition-opacity duration-700 ease-out"
          style={{
            opacity: i === index ? 1 : 0,
            pointerEvents: i === index ? "auto" : "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt=""
            className="w-full h-full object-cover select-none"
            draggable={false}
          />
        </div>
      ))}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Bild ${i + 1} av ${images.length}`}
              aria-current={i === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
