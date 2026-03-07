"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Map from "@/components/Maps/Map";
import DashboardFeeds from "./DashboardFeeds";
import PageLoading from "@/components/PageLoading";
import { MapPinIcon, UserCircleIcon, UserGroupIcon } from "@heroicons/react/24/outline";

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
};

export default function DashboardContent({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapCourseId, setSelectedMapCourseId] = useState<string | null>(null);

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

  const initialData = useMemo(
    () =>
      data
        ? {
            courses: data.courses,
            latestScores: data.latestScores,
            competitions: data.competitions,
          }
        : undefined,
    [data]
  );

  if (loading) return <PageLoading title="Laddar dashboard..." />;
  if (error) return <p className="text-amber-400 p-4">{error}</p>;
  if (!data) return null;

  const newMembers = data.newMembers ?? [];

  const newMembersCard = newMembers.length > 0 ? (
    <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 md:p-5 h-fit">
      <h2 className="text-lg font-semibold text-stone-100 mb-3 flex items-center gap-2">
          <UserGroupIcon className="h-5 w-5 text-retro-accent" aria-hidden />
          Nya medlemmar
        </h2>
      <div className="flex flex-wrap gap-3 md:gap-4">
        {newMembers.map((member) => (
          <Link
            key={member.id}
            href={`/profile/${member.id}`}
            className="group relative flex flex-col items-center"
            title={member.alias}
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-retro-border bg-retro-card ring-2 ring-transparent group-hover:ring-retro-accent/50 transition-all shrink-0">
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-500">
                  <UserCircleIcon className="w-8 h-8 md:w-9 md:h-9" />
                </div>
              )}
            </div>
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-lg bg-stone-800 text-stone-100 text-xs font-medium opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {member.alias}
            </span>
          </Link>
        ))}
      </div>
    </div>
  ) : null;

  const newCourses = data.courses ?? [];
  const newCoursesCard = newCourses.length > 0 ? (
    <div className="rounded-2xl border border-retro-border bg-retro-surface p-4 md:p-5 h-fit">
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

  const hasRightColumn = newMembersCard || newCoursesCard;

  return (
    <div className="p-4 pt-8 sm:pt-2 space-y-6">
      {/* Desktop: kartan till vänster, Nya medlemmar + Nya banor till höger. Mobil: Nya medlemmar överst, sedan karta, sedan Nya banor. */}
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="order-2 md:order-1 flex-1 min-w-0">
          <Map
            userName={userName}
            initialCourses={data.mapCourses}
            onSelectionChange={setSelectedMapCourseId}
            fromDashboard
          />
        </div>
        {hasRightColumn && (
          <div className="order-1 md:order-2 w-full md:w-72 md:shrink-0 flex flex-col gap-4">
            {newMembersCard}
            {newCoursesCard}
          </div>
        )}
      </div>
      <DashboardFeeds initialData={initialData} />
    </div>
  );
}
