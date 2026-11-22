import { NextResponse } from "next/server";
import { API_BASE, getToken } from "@/lib/server/upstream";

// Pusher private-channel authorisation. The browser never sees the member token: it posts here
// (cookie) and we forward the socket_id / channel_name to the backend with the token.
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false }, { status: 401 });
  try {
    const form = new URLSearchParams(await req.text());
    const channel = form.get("channel_name") ?? "";
    // Only ever authorise the site's own member channels (blocks forged channel names).
    if (!/^private-[A-Za-z0-9_.\-]{1,100}$/.test(channel) || !(form.get("socket_id") ?? "").match(/^\d+\.\d+$/))
      return NextResponse.json({ success: false }, { status: 400 });
    const res = await fetch(`${API_BASE}/realtime/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form.toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return new NextResponse(await res.text(), {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
