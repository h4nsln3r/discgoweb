// lib/supabase.ts
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

export const createSupabaseClient = () => createBrowserSupabaseClient();
