"use client";

import { useEffect, useMemo, useState } from "react";
import Map from "@/components/Maps/Map";
import DashboardFeeds from "./DashboardFeeds";
import PageLoading from "@/components/ui/PageLoading";

type DashboardSummary = {
  courses: { id: string; name: string; location?: string | null; created_at?: string | null }[];
  latestScores: {
    courseId: string;
    courseName: string;
    latestScore: { id: string; score: number; date_played: string | null; profiles?: { alias: string } | null } | null;
  }[];
  competitions: { id: string; title: string; start_date?: string | null; created_at?: string | null }[];
  mapCourses: { id: string; name: string; location?: string | null; latitude?: number | null; longitude?: number | null; main_image_url?: string | null }[];
};

export default function DashboardContent({ userName }: { userName: string }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="p-4 space-y-6">
      <Map userName={userName} initialCourses={data.mapCourses} />
      <DashboardFeeds initialData={initialData} />
    </div>
  );
}
