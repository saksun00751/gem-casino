import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { cleanHtml } from "@/lib/server/sanitize";

type ApiPromotion = {
  code: number;
  id?: string;
  name_th: string;
  filepic?: string;
  sort?: number;
  bonus_percent?: string;
  bonus_max?: string;
  turnpro?: string;
  content?: string;
  amount_min?: string;
};

const num = (v: unknown) => parseFloat(String(v ?? "0")) || 0;
const rec = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const truthy = (v: unknown) => v === true || v === 1 || ["1", "true", "y", "yes"].includes(String(v).trim().toLowerCase());

// Promotion the member is currently using (lotto-seed-app reads it from /member/loadbalance).
function activeFrom(payload: unknown) {
  const root = rec(payload);
  if (!root) return null;
  for (const c of [root.promotion, rec(root.data)?.promotion, rec(root.profile)?.promotion]) {
    const p = rec(c);
    if (!p || !truthy(p.select)) continue;
    return { name: String(p.name ?? "").trim() || "โปรโมชันที่เลือก", min: num(p.min) };
  }
  return null;
}

export async function GET() {
  const token = await getToken();
  // Signed-out is a normal state: answer 200 so the browser console stays clean.
  if (!token) return NextResponse.json({ success: false, reason: "login" });
  try {
    const [list, balance] = await Promise.all([
      upstream<{ data?: { promotions?: ApiPromotion[] } }>("/promotion/list", { token }),
      upstream("/member/loadbalance", { token }).catch(() => null),
    ]);
    const promotions = (list.data?.promotions ?? [])
      .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999))
      .map((p) => ({
        code: String(p.code ?? ""),
        id: (p.id ?? "").trim().toLowerCase(),
        name: p.name_th,
        image: p.filepic ?? "",
        bonusPercent: num(p.bonus_percent),
        bonusMax: num(p.bonus_max),
        turn: num(p.turnpro),
        minDeposit: num(p.amount_min),
        content: cleanHtml(p.content),
      }));
    return NextResponse.json({ success: true, promotions, active: activeFrom(balance) });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
