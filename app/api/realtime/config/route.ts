import { NextResponse } from "next/server";
import { upstream, publicCache } from "@/lib/server/upstream";

// Websocket settings (host, key, channels). Public and the same for everyone: cached for 5 minutes.
export async function GET() {
  try {
    const res = await upstream<Record<string, unknown>>("/realtime/config", { revalidate: 300 });
    return NextResponse.json(res, { headers: publicCache(300) });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
