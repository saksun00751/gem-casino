import { NextResponse } from "next/server";
import { upstream } from "@/lib/server/upstream";

// Is the backend reachable? Cheap public call, shared for 30 s so many visitors do not multiply it.
export async function GET() {
  try {
    await upstream("/games/types", { revalidate: 30 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
