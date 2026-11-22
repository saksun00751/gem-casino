import { NextResponse } from "next/server";
import { upstream, getToken } from "@/lib/server/upstream";
import { PROVIDER_ID } from "@/lib/server/deposit";

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { provider?: string; txid?: string };
  const provider = (b.provider ?? "").trim();
  const txid = (b.txid ?? "").trim();
  if (!PROVIDER_ID.test(provider) || !txid) return NextResponse.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  try {
    await upstream(`/${provider}/deposit/expire/${encodeURIComponent(txid)}`, { method: "POST", token, body: {} });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 502 });
  }
}
