import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Not used. Profile updates are handled client-side." },
    { status: 410 }
  );
}
