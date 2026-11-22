import { NextResponse } from "next/server";
import { upstream, getToken, clearToken, UpstreamError } from "@/lib/server/upstream";
import { mapProfile } from "@/lib/server/me";

export async function GET() {
  const token = await getToken();
  // "Not signed in" is a normal state, so answer 200 (a 401 shows up as a red error in the browser console).
  if (!token) return NextResponse.json({ success: false });
  try {
    const { profile: p } = await upstream<{ profile: Record<string, unknown> }>("/member/profile", { token });
    return NextResponse.json(mapProfile(p));
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403)) {
      await clearToken();
      return NextResponse.json({ success: false });
    }
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
