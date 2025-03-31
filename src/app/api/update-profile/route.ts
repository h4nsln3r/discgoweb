import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const cookieStore = cookies(); // ✅ 1. hämta cookies korrekt
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore, // ✅ 2. skicka in som funktion
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const { alias, avatar_url, home_course } = body;

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    alias,
    avatar_url,
    home_course,
  });

  if (error) {
    console.error('[UPSERT ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Profile updated' });
}
