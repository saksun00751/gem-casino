import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toStr } from "@/lib/server/num";

const SAFE = /^[a-zA-Z0-9_.:-]{1,80}$/;
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// Asks the backend for a play URL for one game. The URL is returned to the browser, which opens it.
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return fail("กรุณาเข้าสู่ระบบก่อนเข้าเล่น", 401);
  const b = (await req.json().catch(() => ({}))) as { provider?: unknown; game?: unknown };
  const provider = typeof b.provider === "string" ? b.provider.trim() : "";
  const game = typeof b.game === "string" ? b.game.trim() : "";
  if (!SAFE.test(provider) || !SAFE.test(game)) return fail("ข้อมูลเกมไม่ถูกต้อง");
  try {
    const res = await upstream<Record<string, unknown>>("/games/login", { method: "POST", token, body: { id: provider, game } });
    const url = toStr(rec(res.data)?.url).trim();
    // Only real web links may be opened (blocks javascript:/data: URLs).
    if (!/^https?:\/\//i.test(url)) return fail("ไม่พบลิงก์สำหรับเข้าเกม");
    return NextResponse.json({ success: true, url });
  } catch (e) {
    return fail(e instanceof UpstreamError ? e.message : "ไม่สามารถเข้าเกมได้ กรุณาลองใหม่", e instanceof UpstreamError ? 400 : 502);
  }
}
