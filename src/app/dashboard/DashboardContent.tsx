"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Map from "@/components/Maps/Map";
import DashboardHero from "./DashboardHero";
import PageLoading from "@/components/PageLoading";
import { CircleStackIcon, MapPinIcon, TrophyIcon, UserCircleIcon, UserGroupIcon } from "@heroicons/react/24/outline";

type NewMember = { id: string; alias: string; avatar_url: string | null };

type DashboardSummary = {
  courses: { id: string; name: string; location?: string | null; created_at?: string | null }[];
  latestScores: {
    courseId: string;
    courseName: string;
    latestScore: { id: string; score: number; date_played: string | null; profiles?: { alias: string } | null } | null;
  }[];
  competitions: { id: string; title: string; start_date?: string | null; created_at?: string | null }[];
  mapCourses: { id: string; name: string; location?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null; main_image_url?: string | null; hole_count?: number }[];
  newMembers?: NewMember[];
  newDiscs?: { id: string; name: string; bild: string | null; brand: string | null; disc_type: string | null }[];
  heroImages?: { url: string }[];
};

export default function DashboardContent({ userName, userCity = null }: { userName: string; userCity?: string | null }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapCourseId, setSelectedMapCourseId] = useState<string | null>(null);
  const [desktopMapActive, setDesktopMapActive] = useState(false);
  const mobileHeroScrollRef = useRef<HTMLDivElement | null>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const [mobileHeroPanelIndex, setMobileHeroPanelIndex] = useState(0);
  const [mapSectionProminent, setMapSectionProminent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/dashboard-summary", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();
        if (cancelled) return;
        if (json && typeof json === "object" && "courses" in json && "mapCourses" in json) {
          setData(json as DashboardSummary);
        } else {
          setData({
            courses: [],
            latestScores: [],
            competitions: [],
            mapCourses: [],
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Kunde inte ladda dashboard.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = mobileHeroScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const width = el.clientWidth || 1;
      const idx = Math.round(el.scrollLeft / width);
      setMobileHeroPanelIndex(idx <= 0 ? 0 : 1);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const endMapInteraction = () => setDesktopMapActive(false);
    window.addEventListener("pointerup", endMapInteraction);
    window.addEventListener("pointercancel", endMapInteraction);
    return () => {
      window.removeEventListener("pointerup", endMapInteraction);
      window.removeEventListener("pointercancel", endMapInteraction);
    };
  }, []);

  useEffect(() => {
    if (loading || error || !data) return;
    const el = mapSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setMapSectionProminent(e.isIntersecting && e.intersectionRatio > 0.45),
      { threshold: [0, 0.25, 0.45, 0.65, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading, error, data]);

  if (loading) return <PageLoading title="Laddar dashboard..." />;
  if (error) return <p className="text-amber-400 p-4">{error}</p>;
  if (!data) return null;

  const newMembers = data.newMembers ?? [];

  const newMembersBlock = newMembers.length > 0 ? (
    <div className="rounded-xl bg-stone-900/60 backdrop-blur-sm px-2 py-2 md:px-4 md:py-3 min-w-0">
      <h2 className="text-sm md:text-lg font-semibold text-stone-100 mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
        <UserGroupIcon className="h-4 w-4 md:h-5 md:w-5 text-retro-accent shrink-0" aria-hidden />
        <span className="truncate">Nya medlemmar</span>
      </h2>
      <div className="flex flex-wrap gap-1 md:gap-1.5 lg:gap-2">
        {newMembers.map((member) => (
          <Link
            key={member.id}
            href={`/profile/${member.id}`}
            className="group relative flex flex-col items-center"
            title={member.alias}
          >
            <div className="w-9 h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-retro-border bg-retro-card ring-2 ring-transparent group-hover:ring-retro-accent/50 transition-all shrink-0">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-500">
                  <UserCircleIcon className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </div>
              )}
            </div>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 md:mt-1.5 md:px-2 md:py-1 rounded-lg bg-stone-800 text-stone-100 text-[10px] md:text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {member.alias}
            </span>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  const newCourses = data.courses ?? [];
  const newCoursesCard = newCourses.length > 0 ? (
    <div className="rounded-xl border border-retro-border bg-retro-surface/95 backdrop-blur-sm shadow-lg p-4 md:p-5 h-fit">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-retro-accent" aria-hidden />
          Nya banor
        </h2>
        <Link href="/courses" className="text-sm text-retro-accent hover:underline">
          Visa alla
        </Link>
      </div>
      <div className="space-y-0 overflow-hidden rounded-lg border border-retro-border bg-retro-card">
        {newCourses.map((c) => {
          const isSelected = c.id === selectedMapCourseId;
          return (
            <Link
              key={c.id}
              href={`/courses/${c.id}?from=dashboard`}
              className={`block px-3 py-2.5 text-sm transition border-b border-retro-border last:border-b-0 ${
                isSelected
                  ? "bg-retro-accent/20 text-retro-accent font-medium ring-inset ring-1 ring-retro-accent/50"
                  : "text-stone-200 hover:bg-retro-border/30"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </div>
  ) : null;

  const newDiscs = data.newDiscs ?? [];
  const newDiscsBlock = newDiscs.length > 0 ? (
    <div className="rounded-xl bg-stone-900/60 backdrop-blur-sm px-2 py-2 md:px-4 md:py-3 min-w-0">
      <div className="flex items-center justify-between mb-1.5 md:mb-2 gap-1">
        <h2 className="text-sm md:text-lg font-semibold text-stone-100 flex items-center gap-1.5 md:gap-2 min-w-0">
          <CircleStackIcon className="h-4 w-4 md:h-5 md:w-5 text-retro-accent shrink-0" aria-hidden />
          <span className="truncate">Nya discar</span>
        </h2>
        <Link href="/discs" className="text-[10px] md:text-sm text-retro-accent hover:underline shrink-0">
          Visa alla
        </Link>
      </div>
      <div className="flex flex-wrap gap-1 md:gap-1.5 lg:gap-2">
        {newDiscs.map((disc) => (
          <Link
            key={disc.id}
            href={`/discs/${disc.id}`}
            className="group flex flex-col items-center"
            title={disc.name}
          >
            <div className="w-9 h-9 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-retro-border bg-retro-card ring-2 ring-transparent group-hover:ring-retro-accent/50 transition-all shrink-0 flex items-center justify-center">
              {disc.bild ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={disc.bild}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <CircleStackIcon className="w-4 h-4 md:w-6 md:h-6 lg:w-7 lg:h-7 text-stone-500" aria-hidden />
              )}
            </div>
            <span className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-stone-300 truncate max-w-[56px] md:max-w-[80px] text-center">{disc.name}</span>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  const hasOverlayCards = newMembersBlock || newCoursesCard || newDiscsBlock;
  const heroImages = data.heroImages ?? [];
  const latestScores = data.latestScores ?? [];
  const latestCompetitions = data.competitions ?? [];

  const latestResultsHeroCard = (
    <div className="rounded-xl bg-stone-900/60 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3 min-w-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm md:text-base font-semibold text-stone-100 flex items-center gap-1.5">
          <TrophyIcon className="h-4 w-4 text-retro-accent shrink-0" aria-hidden />
          <span className="truncate">Senaste resultat</span>
        </h2>
        <Link href="/results" className="text-[11px] md:text-xs text-retro-accent hover:underline shrink-0">
          Visa alla
        </Link>
      </div>
      <div className="space-y-1.5">
        {latestScores.length === 0 ? (
          <p className="text-xs text-stone-400">Inga resultat än.</p>
        ) : (
          latestScores.slice(0, 3).map((item) => (
            <Link
              key={item.courseId}
              href={`/courses/${item.courseId}?from=dashboard`}
              className="block rounded-lg bg-stone-800/70 hover:bg-stone-700/70 transition px-2.5 py-2"
            >
              <p className="text-xs md:text-sm text-stone-100 truncate">{item.courseName}</p>
              <p className="text-[11px] md:text-xs text-stone-300 truncate">
                {item.latestScore
                  ? `${item.latestScore.score} kast${item.latestScore.profiles?.alias ? ` • ${item.latestScore.profiles.alias}` : ""}`
                  : "Inga registrerade rundor"}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  const latestCompetitionsHeroCard = (
    <div className="rounded-xl bg-stone-900/60 backdrop-blur-sm px-3 py-2.5 md:px-4 md:py-3 min-w-0">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm md:text-base font-semibold text-stone-100 flex items-center gap-1.5">
          <MapPinIcon className="h-4 w-4 text-retro-accent shrink-0" aria-hidden />
          <span className="truncate">Senaste tävlingar</span>
        </h2>
        <Link href="/competitions" className="text-[11px] md:text-xs text-retro-accent hover:underline shrink-0">
          Visa alla
        </Link>
      </div>
      <div className="space-y-1.5">
        {latestCompetitions.length === 0 ? (
          <p className="text-xs text-stone-400">Inga tävlingar än.</p>
        ) : (
          latestCompetitions.slice(0, 3).map((comp) => (
            <Link
              key={comp.id}
              href={`/competitions/${comp.id}`}
              className="block rounded-lg bg-stone-800/70 hover:bg-stone-700/70 transition px-2.5 py-2"
            >
              <p className="text-xs md:text-sm text-stone-100 truncate">{comp.title}</p>
              <p className="text-[11px] md:text-xs text-stone-300 truncate">
                {comp.start_date
                  ? new Date(comp.start_date).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" })
                  : "Datum saknas"}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-col h-[calc(100dvh-var(--topbar-offset))] overflow-y-auto overscroll-contain snap-y snap-mandatory scroll-smooth ${
        desktopMapActive ? "md:snap-none" : "md:snap-mandatory"
      }`}
    >
      {/* Sektion 1: hero i full viewport-höjd (mobil + desktop). */}
      <section ref={heroSectionRef} className="relative h-[calc(100dvh-var(--topbar-offset))] shrink-0 snap-start">
        <div className="relative h-full">
          <DashboardHero
            images={heroImages}
            userName={userName}
            userCity={userCity}
            desktopFullHeight
          />

          {/* Mobil: två horisontella "sidor" i hero-overlayn. */}
          <div className="absolute left-4 right-4 top-20 z-20 overflow-hidden md:hidden">
            <div
              ref={mobileHeroScrollRef}
              className="flex overflow-x-auto overscroll-x-contain snap-x snap-mandatory hide-scrollbar [touch-action:pan-x]"
            >
              <div className="snap-start shrink-0 min-w-full space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {newMembersBlock && <div className="min-w-0">{newMembersBlock}</div>}
                  {newDiscsBlock && <div className="min-w-0">{newDiscsBlock}</div>}
                </div>
                {newCoursesCard}
              </div>
              <div className="snap-start shrink-0 min-w-full space-y-2">
                {latestResultsHeroCard}
                {latestCompetitionsHeroCard}
              </div>
            </div>
            <div className="mt-2 flex justify-center gap-2">
              <span className={`h-1.5 rounded-full transition-all ${mobileHeroPanelIndex === 0 ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
              <span className={`h-1.5 rounded-full transition-all ${mobileHeroPanelIndex === 1 ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
            </div>
          </div>

          {/* Desktop: "Senaste"-kort staplade under välkomsttexten. */}
          <div className="absolute left-6 top-28 z-20 hidden md:block md:w-[320px]">
            <div className="space-y-3">
              {latestResultsHeroCard}
              {latestCompetitionsHeroCard}
            </div>
          </div>

          {hasOverlayCards && (
            <div className="absolute inset-x-4 top-14 bottom-4 md:inset-x-auto md:left-auto md:right-6 md:top-4 md:bottom-auto md:max-w-[280px] z-10 hidden md:flex flex-col gap-3 pointer-events-none">
              {/* Mobil: Nya medlemmar + Nya discar 50/50 bredvid varandra. Desktop: staplade. */}
              <div className="flex flex-row gap-2 md:flex-col md:gap-3 pointer-events-auto">
                {newMembersBlock && <div className="min-w-0 flex-1 md:flex-none pointer-events-auto">{newMembersBlock}</div>}
                {newDiscsBlock && <div className="min-w-0 flex-1 md:flex-none pointer-events-auto">{newDiscsBlock}</div>}
              </div>
              <div className="pointer-events-auto">{newCoursesCard}</div>
            </div>
          )}

          <button
            type="button"
            onClick={() => mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="group absolute right-4 bottom-3 z-30 transition-transform duration-300 hover:scale-110 active:scale-95 md:right-6 md:bottom-4"
            aria-label="Scrolla ner till kartan"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/greenarrow.png"
              alt=""
              className="arrow-pulse h-16 w-16 md:h-32 md:w-32 object-contain transition-transform duration-300 group-hover:scale-110"
            />
          </button>
        </div>
      </section>

      {/* Sektion 2: karta i full viewport-höjd (mobil + desktop). */}
      <section ref={mapSectionRef} className="relative h-[calc(100dvh-var(--topbar-offset))] shrink-0 snap-start">
        <div
          className="-mx-4 h-full md:mx-0 flex flex-col"
          onPointerDown={() => setDesktopMapActive(true)}
        >
          <Map
            userName={userName}
            initialCourses={data.mapCourses}
            onSelectionChange={setSelectedMapCourseId}
            fromDashboard
            height="100%"
          />
        </div>
      </section>

      {mapSectionProminent && (
        <button
          type="button"
          onClick={() => heroSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="group fixed right-14 z-[100] transition-transform duration-300 hover:scale-110 active:scale-95 md:right-10"
          style={{ top: "calc(var(--topbar-offset) - 2.5rem)" }}
          aria-label="Scrolla upp till hero"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/BLUEARROW.png"
            alt=""
            className="arrow-pulse h-20 w-20 md:h-36 md:w-36 object-contain transition-transform duration-300 group-hover:scale-110"
          />
        </button>
      )}
    </div>
  );
}
