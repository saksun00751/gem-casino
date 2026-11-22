import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

export async function GET() {
  const token = await getToken();
  // Signed-out is a normal state: answer 200 so the browser console stays clean.
  if (!token) return NextResponse.json({ success: false, reason: "login" });
  try {
    const [bal, prof, banks] = await Promise.all([
      upstream<Raw>("/member/loadbalance", { token }),
      upstream<Raw>("/member/profile", { token }),
      upstream<Raw>("/auth/register/banks").catch(() => ({}) as Raw),
    ]);
    const p = rec(prof.profile) ?? {};
    const b = rec(bal.profile) ?? {};
    const bankCode = toNum(b.bank_code, toNum(p.bank_code));
    const bank = ((rec(banks.data)?.banks ?? []) as Raw[]).find((x) => toNum(x.code) === bankCode);
    const accNo = toStr(b.acc_no ?? p.acc_no).replace(/\D/g, "");
    return NextResponse.json({
      success: true,
      phone: toStr(p.user_name ?? b.user_name),
      name: toStr(b.name ?? p.name).trim(),
      balance: toNum(p.balance ?? b.balance),
      credit: toNum(p.credit),
      diamond: toNum(p.diamond),
      bank: bankCode > 0 && accNo ? { name: bank ? toStr(bank.name_th) : "", logo: bank ? toStr(bank.image_url) : "", accNo } : null,
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
