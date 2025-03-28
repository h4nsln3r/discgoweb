// src/components/Navbar.tsx
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import LogoutButton from "./LogoutButton";

export default async function Navbar() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100 shadow">
      <Link href="/" className="text-xl font-bold">
        Discgolf App
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">
              Inloggad som {user.email}
            </span>
            <LogoutButton />
          </>
        ) : (
          <Link href="/auth" className="text-blue-600 hover:underline">
            Logga in
          </Link>
        )}
      </div>
    </nav>
  );
}
