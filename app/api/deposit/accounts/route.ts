import { NextResponse } from "next/server";
import { getToken, UpstreamError } from "@/lib/server/upstream";
import { loadBank, accountsFrom, noteFrom } from "@/lib/server/deposit";

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const { method } = (await req.json().catch(() => ({}))) as { method?: string };
  if (method !== "bank" && method !== "tw" && method !== "slip")
    return NextResponse.json({ success: false, message: "ช่องทางไม่ถูกต้อง" }, { status: 400 });
  try {
    const raw = await loadBank(method, token);
    const accounts = accountsFrom(raw);
    if (!accounts.length) return NextResponse.json({ success: false, message: "ไม่สามารถโหลดข้อมูลบัญชีได้" }, { status: 404 });
    return NextResponse.json({ success: true, accounts, note: noteFrom(raw) });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof UpstreamError ? e.message : "ไม่สามารถโหลดข้อมูลบัญชีได้" }, { status: 400 });
  }
}
