// src/components/Buttons/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

type Props = {
  /** Anropas efter klick (t.ex. stäng meny) */
  onAfterClick?: () => void;
  /** Extra klass – t.ex. för menyvariant */
  className?: string;
};

export default function LogoutButton({ onAfterClick, className }: Props) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogout = async () => {
    onAfterClick?.();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        "bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
      }
    >
      Logga ut
    </button>
  );
}
