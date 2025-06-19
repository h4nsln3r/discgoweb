// src/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
    >
      Logga ut
    </button>
  );
}
