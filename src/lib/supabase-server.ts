// lib/supabase-server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/** Next 15: cookies() är async – måste awaitas så att session läses rätt. */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerComponentClient<Database>({
    cookies: () => cookieStore,
  });
}

/**
 * Admin-klient med service role – bypassar RLS.
 * Använd ENDAST på servern för operationer där du redan kontrollerat behörighet i koden.
 * Kräver SUPABASE_SERVICE_ROLE_KEY i miljön.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY måste sättas för admin-klient"
    );
  }
  return createClient<Database>(url, key);
}
