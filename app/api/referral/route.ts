import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

// Friends' phone numbers are masked here so the full number never reaches the browser.
function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length >= 6 ? `${d.slice(0, 3)}-XXX-${d.slice(-2)}XX` : "";
}

export async function GET() {
  const token = await getToken();
  // Signed-out is a normal state: answer 200 so the browser console stays clean.
  if (!token) return NextResponse.json({ success: false, reason: "login" });
  try {
    const res = await upstream<Raw>("/member/contributor", { token });
    const d = rec(res.data) ?? {};
    const summary = rec(res.summary) ?? rec(d.summary) ?? {};
    const rule = rec(res.rule) ?? rec(d.rule) ?? {};
    const list = (Array.isArray(res.referrals) ? res.referrals : Array.isArray(d.referrals) ? d.referrals : []) as Raw[];
    const more = toStr(rule.more_message).trim() || toStr(res.more_message).trim() || toStr(d.more_message).trim();

    return NextResponse.json({
      success: true,
      code: toStr(summary.referral_code).trim(),
      count: toNum(summary.referred_members),
      income: toNum(summary.referral_income),
      bonusIncome: toNum(summary.promotion_bonus_income),
      bonusCount: toNum(summary.promotion_bonus_count),
      rule: {
        display: toStr(rule.display_value).trim(),
        percent: toNum(rule.bonus_percent),
        price: toNum(rule.bonus_price),
        lengthType: toStr(rule.length_type).trim(),
        more,
      },
      referrals: list.map((r, i) => {
        const ref = rec(r.referee) ?? {};
        return {
          id: toStr(r.id) || String(i + 1),
          name: toStr(ref.displayName ?? ref.display_name ?? r.display_name ?? r.name).trim(),
          phone: maskPhone(toStr(ref.phone ?? r.phone)),
          earned: toNum(r.totalEarned ?? r.total_earned),
          joinedAt: toStr(ref.createdAt ?? ref.created_at ?? r.createdAt ?? r.created_at),
        };
      }),
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
