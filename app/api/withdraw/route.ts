import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { MAX_AMOUNT } from "@/lib/server/deposit";

const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// Limits (balance, min/max, daily cap, turnover, cool-down) are enforced by the backend; here we only
// reject obviously bad input so a malformed request never reaches it.
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return fail("กรุณาเข้าสู่ระบบ", 401);
  const body = (await req.json().catch(() => ({}))) as { amount?: unknown };
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return fail("จำนวนเงินไม่ถูกต้อง");
  if (amount > MAX_AMOUNT) return fail("จำนวนเงินสูงเกินกำหนด");
  try {
    const res = await upstream<{ message?: string }>("/wallet/withdraw", { method: "POST", token, body: { amount: String(amount) } });
    return NextResponse.json({ success: true, message: res.message?.trim() || "ส่งคำขอถอนเงินแล้ว", amount });
  } catch (e) {
    return fail(e instanceof UpstreamError ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่", e instanceof UpstreamError ? 400 : 502);
  }
}
