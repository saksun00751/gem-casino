import { NextResponse } from "next/server";
import { upstream, setToken, UpstreamError } from "@/lib/server/upstream";
import { getT } from "@/lib/server/i18n";
import { mapProfile } from "@/lib/server/me";
import { clientIp, clearFailures, lockedFor, recordFailure } from "@/lib/server/ratelimit";

export async function POST(req: Request) {
  const { username, password } = (await req.json().catch(() => ({}))) as { username?: string; password?: string };
  if (!username?.trim() || !password) {
    return NextResponse.json({ success: false, message: "กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน" }, { status: 400 });
  }
  // Slow down password guessing: lock per IP and per account after repeated failures.
  const keys = [`ip:${clientIp(req)}`, `user:${username.trim()}`];
  const wait = lockedFor(keys);
  if (wait > 0) {
    return NextResponse.json(
      { success: false, message: (await getT())("ลองเข้าสู่ระบบผิดหลายครั้ง กรุณารอ {n} นาที แล้วลองใหม่", { n: Math.ceil(wait / 60) }) },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }
  try {
    const res = await upstream<{ access_token?: string }>("/auth/login", {
      method: "POST",
      body: { user_name: username.trim(), password },
    });
    if (!res.access_token) throw new UpstreamError(401, "login failed");
    clearFailures(keys);
    await setToken(res.access_token);
    // Return the profile in the same response so the browser needs no extra /api/me round trip.
    // If it fails, login still succeeds and the client falls back to /api/me.
    const me = await upstream<{ profile: Record<string, unknown> }>("/member/profile", { token: res.access_token })
      .then(({ profile: p }) => mapProfile(p))
      .catch(() => null);
    return NextResponse.json({ success: true, me });
  } catch (e) {
    const status = e instanceof UpstreamError ? e.status : 502;
    if (status === 400 || status === 401 || status === 422) recordFailure(keys); // only wrong credentials count
    const message =
      status === 400 || status === 401 || status === 422
        ? "เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง"
        : "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่";
    return NextResponse.json({ success: false, message }, { status: status === 502 ? 502 : 401 });
  }
}
