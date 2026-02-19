"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function ProfileWelcomeToast({
  displayName,
}: {
  displayName: string | null;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const welcome = searchParams.get("welcome");
    if (!welcome) return;
    done.current = true;
    const name = (displayName?.trim() ?? "") || "där";
    showToast(`Välkommen, ${name}! Profilen är sparad.`, "success");
    const t = setTimeout(() => router.replace("/profile", { scroll: false }), 2500);
    return () => clearTimeout(t);
  }, [searchParams, displayName, showToast, router]);

  return null;
}
