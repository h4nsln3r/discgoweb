// app/api/create-course/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  });

  const body = await req.json();
  const { name, location, latitude, longitude, image_url } = body;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("courses").insert([
    {
      name,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      image_url,
      created_by: user.id,
    },
  ]);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Course created" }, { status: 200 });
}
