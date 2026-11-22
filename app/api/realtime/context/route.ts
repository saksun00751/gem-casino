import { NextResponse } from "next/server";
import { upstream, getToken } from "@/lib/server/upstream";

// The signed-in member's private channel name.
export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, reason: "login" });
  try {
    return NextResponse.json(await upstream<Record<string, unknown>>("/member/realtime-context", { token }));
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
