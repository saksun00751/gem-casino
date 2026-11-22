import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { promotion?: unknown };
  const promotion = typeof body.promotion === "string" ? body.promotion.trim() : "";
  if (!promotion) return NextResponse.json({ success: false, message: "ไม่พบรหัสโปรโมชัน" }, { status: 400 });
  try {
    const res = await upstream<{ message?: string }>("/promotion/select", { method: "POST", token, body: { promotion } });
    return NextResponse.json({ success: true, message: res.message || "รับโปรโมชันสำเร็จ" });
  } catch (e) {
    const message = e instanceof UpstreamError ? e.message : "ไม่สามารถรับโปรโมชันได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
