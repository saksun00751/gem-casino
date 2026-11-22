import { NextResponse } from "next/server";
import { API_BASE, getToken } from "@/lib/server/upstream";

// "Member is online" ping (same as lotto-seed-app).
export async function POST() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const res = await fetch(`${API_BASE}/member/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: "{}",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return NextResponse.json({ success: res.ok }, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
