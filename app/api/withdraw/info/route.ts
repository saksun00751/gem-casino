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
    const p = rec(bal.profile) ?? {};
    const pp = rec(prof.profile) ?? {};

    const bankCode = toNum(p.bank_code);
    const bankList = (rec(banks.data)?.banks ?? []) as Raw[];
    const bank = bankList.find((b) => toNum(b.code) === bankCode);
    const accNo = toStr(p.acc_no).replace(/\D/g, "");

    return NextResponse.json({
      success: true,
      name: toStr(p.name) || "สมาชิก",
      balance: toNum(p.balance),
      min: toNum(p.withdraw_min, 100),
      max: toNum(p.withdraw_max, 200000),
      maxDay: toNum(p.maxwithdraw_day, 200000),
      sumToday: toNum(p.withdraw_sum_today),
      remainToday: toNum(p.withdraw_remain_today),
      limitAmount: toNum(p.withdraw_limit_amount),
      canWithdraw: bal.withdraw === undefined ? true : Boolean(bal.withdraw),
      notice: toStr(rec(bal.system)?.notice).trim() || null,
      bank: bankCode > 0 && accNo ? { name: bank ? toStr(bank.name_th) : "", logo: bank ? toStr(bank.image_url) : "", accNo } : null,
      promo: {
        active: Boolean(pp.getpro && pp.pro),
        name: toStr(pp.pro_name).trim() || null,
        turnover: toNum(pp.amount_balance),
        limit: toNum(pp.withdraw_limit_amount, toNum(p.withdraw_limit_amount)),
      },
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
