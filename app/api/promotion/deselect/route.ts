import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";

export async function POST() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    const res = await upstream<{ message?: string }>("/promotion/deselect", { method: "POST", token, body: {} });
    return NextResponse.json({ success: true, message: res.message || "ยกเลิกโปรโมชันสำเร็จ" });
  } catch (e) {
    const message = e instanceof UpstreamError ? e.message : "ไม่สามารถยกเลิกโปรโมชันได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
