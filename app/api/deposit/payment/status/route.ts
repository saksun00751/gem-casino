import { NextResponse } from "next/server";
import { upstream, getToken } from "@/lib/server/upstream";
import { pickStatus, PROVIDER_ID } from "@/lib/server/deposit";

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const q = new URL(req.url).searchParams;
  const provider = (q.get("provider") ?? "").trim();
  const txid = (q.get("txid") ?? "").trim();
  if (!PROVIDER_ID.test(provider) || !txid) return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  try {
    const data = await upstream(`/${provider}/deposit/status/${encodeURIComponent(txid)}`, { token });
    return NextResponse.json({ success: true, state: pickStatus(data) });
  } catch {
    // Transient errors just mean "ask again later".
    return NextResponse.json({ success: true, state: "pending" });
  }
}
