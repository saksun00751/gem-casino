import { NextResponse } from "next/server";
import { getToken, UpstreamError } from "@/lib/server/upstream";
import { loadBank, providersFrom } from "@/lib/server/deposit";

export async function POST() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    // paymentUrl is deliberately not sent to the browser: the server looks it up again when creating a deposit.
    const providers = providersFrom(await loadBank("payment", token)).map(({ paymentUrl: _u, ...p }) => p);
    if (!providers.length) return NextResponse.json({ success: false, message: "ไม่สามารถโหลดข้อมูลช่องทาง Payment ได้" }, { status: 404 });
    return NextResponse.json({ success: true, providers });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof UpstreamError ? e.message : "ไม่สามารถโหลดข้อมูลช่องทาง Payment ได้" }, { status: 400 });
  }
}
