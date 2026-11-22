import { NextResponse } from "next/server";
import { API_BASE, getToken } from "@/lib/server/upstream";
import { MAX_AMOUNT } from "@/lib/server/deposit";

const MAX_BYTES = 5 * 1024 * 1024;
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// NOTE: lotto-seed-app's slip upload calls "/api/deposit/slip", which does not exist there either, so the
// backend endpoint below ("/deposit/slip") is an assumption. If the backend rejects it we say so plainly.
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return fail("กรุณาเข้าสู่ระบบ", 401);

  let form: FormData;
  try { form = await req.formData(); } catch { return fail("ข้อมูลไม่ถูกต้อง"); }

  const slip = form.get("slip");
  const amount = Math.round(Number(form.get("amount")) * 100) / 100;
  const bankCode = String(form.get("bank_code") ?? "").replace(/\D/g, "");
  if (!(slip instanceof File) || slip.size === 0) return fail("กรุณาอัปโหลดสลิป");
  if (!["image/jpeg", "image/png"].includes(slip.type)) return fail("รองรับเฉพาะไฟล์ JPG หรือ PNG");
  if (slip.size > MAX_BYTES) return fail("ขนาดไฟล์ต้องไม่เกิน 5MB");
  if (!Number.isFinite(amount) || amount <= 0) return fail("กรุณากรอกจำนวนเงิน");
  if (amount > MAX_AMOUNT) return fail("จำนวนเงินสูงเกินกำหนด");

  const out = new FormData();
  out.append("slip", slip, slip.name || "slip.jpg");
  out.append("amount", String(amount));
  if (bankCode) out.append("bank_code", bankCode);

  try {
    const res = await fetch(`${API_BASE}/deposit/slip`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: out,
      cache: "no-store",
      redirect: "manual",
    });
    if (res.status === 404 || res.status === 405)
      return fail("ช่องทางแนบสลิปยังไม่พร้อมใช้งาน กรุณาติดต่อฝ่ายบริการลูกค้า", 501);
    const j = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok || j.success === false) return fail(j.message?.trim() || "ไม่สามารถส่งสลิปได้");
    return NextResponse.json({ success: true, message: j.message?.trim() || "ส่งสลิปสำเร็จ รอระบบตรวจสอบ" });
  } catch {
    return fail("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่", 502);
  }
}
