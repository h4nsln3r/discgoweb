"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/types/supabase";
import type { TeamRole } from "@/lib/team-roles";
import { UserGroupIcon, UserMinusIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/Toasts/ToastProvider";

export type MemberWithRole = {
  id: string;
  alias: string | null;
  avatar_url: string | null;
  role: "admin" | "editor" | "viewer";
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  editor: "Kapten",
  viewer: "Spelare",
};

type Props = {
  teamId: string;
  members: MemberWithRole[];
  currentUserId: string | null;
  myRole: TeamRole | null;
  isMember: boolean;
  canManageRoles: boolean;
  canRemoveMembers?: boolean;
};

export default function TeamMembersSection({
  teamId,
  members,
  currentUserId,
  myRole,
  isMember,
  canManageRoles,
  canRemoveMembers = false,
}: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const adminCount = members.filter((m) => m.role === "admin").length;
  const isOnlyAdmin = myRole === "admin" && adminCount <= 1;
  const canLeave = isMember && !isOnlyAdmin;

  const canRemoveMember = (memberRole: "admin" | "editor" | "viewer") => {
    if (!myRole) return false;
    if (myRole === "admin") return true;
    if (myRole === "editor") return memberRole === "viewer";
    return false;
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "editor" | "viewer") => {
    setUpdating(userId);
    const res = await fetch(`/api/teams/${teamId}/members/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const data = res.ok ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data?.error ?? "Kunde inte uppdatera roll.", "error");
    } else {
      showToast("Roll uppdaterad.", "success");
      router.refresh();
    }
    setUpdating(null);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Vill du verkligen ta bort denna person från laget?")) return;
    setUpdating(userId);
    const res = await fetch(`/api/teams/${teamId}/members/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = res.ok ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast((data as { error?: string })?.error ?? "Kunde inte ta bort medlem.", "error");
    } else {
      showToast("Medlem borttagen från laget.", "success");
      router.refresh();
    }
    setUpdating(null);
  };

  const handleMakeAdmin = async (newAdminUserId: string) => {
    if (!currentUserId || newAdminUserId === currentUserId) return;
    setUpdating(newAdminUserId);
    const res = await fetch(`/api/teams/${teamId}/members/make-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newAdminUserId }),
    });
    const data = res.ok ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data?.error ?? "Kunde inte byta admin.", "error");
    } else {
      showToast("Ny admin tillagd.", "success");
      router.refresh();
    }
    setUpdating(null);
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Vill du verkligen lämna laget?")) return;
    if (!canLeave) return;
    setUpdating("leave");
    const res = await fetch(`/api/teams/${teamId}/leave`, { method: "POST" });
    const data = res.ok ? null : await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data?.error ?? "Kunde inte lämna laget.", "error");
    } else {
      showToast("Du har lämnat laget.", "success");
      router.refresh();
      router.push("/teams");
    }
    setUpdating(null);
  };

  return (
    <div className="rounded-2xl border border-retro-border bg-retro-surface p-6 shadow-sm mb-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-100 mb-4">
        <UserGroupIcon className="w-5 h-5 text-retro-muted shrink-0" />
        Medlemmar
      </h2>
      {members.length === 0 ? (
        <p className="text-stone-400 text-sm">Inga medlemmar i laget än.</p>
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-retro-border bg-retro-card p-3"
            >
              <Link
                href={`/profile/${member.id}`}
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-retro-surface border border-retro-border shrink-0 flex items-center justify-center">
                  {member.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-retro-muted text-xl">🥏</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-stone-100 block truncate">
                    {member.alias || "Spelare"}
                  </span>
                  <span className="text-xs text-stone-500">{ROLE_LABEL[member.role] ?? member.role}</span>
                </div>
                <span className="text-sm text-retro-accent shrink-0">Visa profil →</span>
              </Link>
              {(canManageRoles || canRemoveMembers) && currentUserId && member.id !== currentUserId && (
                <div className="flex items-center gap-2 sm:ml-auto shrink-0 flex-wrap">
                  {canManageRoles && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as "admin" | "editor" | "viewer")}
                        disabled={updating === member.id}
                        className="rounded-lg border border-retro-border bg-retro-surface text-stone-100 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-retro-accent"
                      >
                        <option value="viewer">Spelare</option>
                        <option value="editor">Kapten</option>
                        <option value="admin">Admin</option>
                      </select>
                      {member.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() => handleMakeAdmin(member.id)}
                          disabled={updating === member.id}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium disabled:opacity-50"
                        >
                          Gör till admin
                        </button>
                      )}
                    </>
                  )}
                  {canRemoveMembers && canRemoveMember(member.role) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={updating === member.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 text-red-300 px-2 py-1.5 text-sm font-medium hover:bg-red-950/50 hover:text-red-200 disabled:opacity-50 transition"
                      title="Ta bort från laget"
                    >
                      <UserMinusIcon className="w-4 h-4" />
                      Ta bort
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isMember && currentUserId && (
        <div className="mt-6 pt-4 border-t border-retro-border">
          {isOnlyAdmin ? (
            <p className="text-amber-200 text-sm">
              Du är ensam admin. Ge admin till någon annan i laget (t.ex. via roll-menyn ovan) innan du kan lämna laget.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleLeaveTeam}
              disabled={updating === "leave"}
              className="inline-flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/30 text-red-300 px-3 py-2 text-sm font-medium hover:bg-red-950/50 hover:text-red-200 disabled:opacity-50 transition"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Lämna laget
            </button>
          )}
        </div>
      )}
    </div>
  );
}
