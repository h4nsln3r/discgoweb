"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toasts/ToastProvider";

export type ApplicantRow = {
  id: string;
  user_id: string;
  alias: string | null;
  avatar_url: string | null;
};

const ROLE_OPTIONS: { value: "viewer" | "editor"; label: string }[] = [
  { value: "viewer", label: "Spelare" },
  { value: "editor", label: "Kapten" },
];

type Props = {
  teamId: string;
  applicants: ApplicantRow[];
};

export default function TeamApplicationsSection({ applicants }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);
  const [roleByApp, setRoleByApp] = useState<Record<string, "viewer" | "editor">>({});

  const handleApprove = async (applicationId: string, role: "viewer" | "editor") => {
    setUpdating(applicationId);
    const { error } = await supabase.rpc("approve_team_application", {
      p_application_id: applicationId,
      p_role: role,
    });
    if (error) {
      showToast(error.message || "Kunde inte godkänna ansökan.", "error");
    } else {
      showToast("Ansökan godkänd. Person tillagd som " + (role === "editor" ? "Kapten" : "Spelare") + ".", "success");
      router.refresh();
    }
    setUpdating(null);
  };

  const handleReject = async (applicationId: string) => {
    setUpdating(applicationId);
    const { error } = await supabase.rpc("reject_team_application", {
      p_application_id: applicationId,
    });
    if (error) {
      showToast(error.message || "Kunde inte avslå ansökan.", "error");
    } else {
      showToast("Ansökan avslagen.", "success");
      router.refresh();
    }
    setUpdating(null);
  };

  return (
    <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-4">
        <ClipboardDocumentListIcon className="w-5 h-5 text-retro-muted shrink-0" />
        Ansökningar
      </h2>
      {applicants.length === 0 ? (
        <p className="text-stone-400 text-sm">Inga ansökningar just nu.</p>
      ) : (
      <ul className="space-y-3">
        {applicants.map((app) => (
          <li
            key={app.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-retro-border bg-retro-card p-3"
          >
            <Link
              href={`/profile/${app.user_id}`}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-surface border border-retro-border shrink-0 flex items-center justify-center">
                {app.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={app.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-retro-muted text-xl">🥏</span>
                )}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-stone-100 block truncate">
                  {app.alias || "Spelare"}
                </span>
                <span className="text-xs text-amber-300">Ansökt</span>
              </div>
              <span className="text-sm text-retro-accent shrink-0">Visa profil →</span>
            </Link>
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto shrink-0">
              <select
                value={roleByApp[app.id] ?? "viewer"}
                onChange={(e) => setRoleByApp((prev) => ({ ...prev, [app.id]: e.target.value as "viewer" | "editor" }))}
                disabled={updating === app.id}
                className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-retro-accent"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleApprove(app.id, roleByApp[app.id] ?? "viewer")}
                disabled={updating === app.id}
                className="rounded-lg bg-emerald-600 text-white text-sm px-3 py-1.5 hover:bg-emerald-500 disabled:opacity-50"
              >
                {updating === app.id ? "..." : "Godkänn"}
              </button>
              <button
                type="button"
                onClick={() => handleReject(app.id)}
                disabled={updating === app.id}
                className="rounded-lg border border-red-700 text-red-400 text-sm px-3 py-1.5 hover:bg-red-900/40 disabled:opacity-50"
              >
                Avslå
              </button>
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
