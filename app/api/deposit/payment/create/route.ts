import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { loadBank, providersFrom, qrFrom, requestIdFrom, rec, isBackendUrl, PROVIDER_ID, MAX_AMOUNT } from "@/lib/server/deposit";
import { toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const failed = (p: unknown) => {
  const r = rec(p);
  return r?.success === false || rec(r?.data)?.success === false;
};
const msgOf = (p: unknown, fallback: string) => {
  const r = rec(p);
  const m = r?.message ?? r?.msg ?? r?.error;
  return typeof m === "string" && m.trim() ? m : fallback;
};

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { success: false, message: `HTTP ${res.status}` }; }
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return fail("กรุณาเข้าสู่ระบบ", 401);

  const body = (await req.json().catch(() => ({}))) as { provider?: unknown; amount?: unknown };
  const providerId = typeof body.provider === "string" ? body.provider.trim() : "";
  const amount = Math.round(Number(body.amount) * 100) / 100;
  if (!PROVIDER_ID.test(providerId)) return fail("ช่องทางไม่ถูกต้อง");
  if (!Number.isFinite(amount) || amount <= 0) return fail("กรุณากรอกจำนวนเงิน");
  if (amount > MAX_AMOUNT) return fail("จำนวนเงินสูงเกินกำหนด");

  try {
    // The gateway URL comes from the backend's own list, never from the browser.
    const provider = providersFrom(await loadBank("payment", token)).find((p) => p.id === providerId);
    if (!provider || !isBackendUrl(provider.paymentUrl)) return fail("ช่องทางนี้ไม่พร้อมใช้งาน");
    if (provider.minDeposit > 0 && amount < provider.minDeposit)
      return fail(`ยอดฝากขั้นต่ำ ${provider.minDeposit.toLocaleString("th-TH")} บาท`);

    const res = await fetch(provider.paymentUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount }),
      cache: "no-store",
      redirect: "manual",
    });
    const created = await readJson(res);
    if (!res.ok || failed(created)) return fail(msgOf(created, "ไม่สามารถสร้างรายการฝากเงินได้"));

    const c = rec(created) ?? {};
    const url = toStr(c.url).trim();
    const hasTarget = c.target !== undefined;

    // Gateway wants the member on its own payment page.
    if (hasTarget && url) {
      if (!/^https:\/\//i.test(url)) return fail("ลิงก์ชำระเงินไม่ถูกต้อง");
      return NextResponse.json({ success: true, kind: "redirect", url, target: c.target === "blank" ? "_blank" : "_self" });
    }

    let qrPayload: unknown = created;
    if (!hasTarget && url && isBackendUrl(url)) {
      const r2 = await fetch(url, { method: "GET", cache: "no-store", redirect: "manual" });
      qrPayload = await readJson(r2);
      if (!r2.ok || failed(qrPayload)) return fail(msgOf(qrPayload, "ไม่สามารถโหลด QR Code ได้"));
    }
    let qr = qrFrom(qrPayload);
    if (!qr) {
      const requestId = requestIdFrom(created);
      if (!requestId) return fail("ไม่พบรหัสรายการจากระบบชำระเงิน");
      const data = await upstream<Raw>(`/${providerId}/qrcode/${encodeURIComponent(requestId)}`, { token });
      qr = qrFrom(data, requestId);
      if (!qr) return fail("รูปแบบข้อมูล QR ไม่ถูกต้อง");
    }
    return NextResponse.json({ success: true, kind: "qr", qr });
  } catch (e) {
    return fail(e instanceof UpstreamError ? e.message : "ไม่สามารถสร้างรายการฝากเงินได้", e instanceof UpstreamError ? 400 : 502);
  }
}
