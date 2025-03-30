// lib/supabase-server.ts
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export const createServerSupabaseClient = () => {
  return createServerComponentClient<Database>({
    cookies: () => cookies(),
  });
};
