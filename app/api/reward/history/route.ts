import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, reason: "login" });

  const incoming = new URL(req.url).searchParams;
  const qs = new URLSearchParams();
  for (const k of ["page", "per_page"]) {
    const v = incoming.get(k)?.trim();
    if (v) qs.set(k, v);
  }
  try {
    const res = await upstream<Raw>(`/reward/history${qs.size ? `?${qs}` : ""}`, { token });
    const items = Array.isArray(res.items) ? (res.items as Raw[]) : [];
    const meta = (res.meta ?? {}) as Raw;
    return NextResponse.json({
      success: true,
      items: items.map((i) => ({
        id: toNum(i.id),
        name: toStr(i.reward_name_snapshot),
        pointCost: toNum(i.point_cost_snapshot),
        rewardType: toStr(i.reward_type_snapshot).toLowerCase(),
        creditAmount: i.credit_amount_snapshot == null || i.credit_amount_snapshot === "" ? null : toNum(i.credit_amount_snapshot),
        gemAmount: i.gem_amount_snapshot == null || i.gem_amount_snapshot === "" ? null : toNum(i.gem_amount_snapshot),
        status: toStr(i.status).toLowerCase(),
        redeemedAt: toStr(i.redeemed_at),
      })),
      meta: { page: toNum(meta.current_page, 1), lastPage: toNum(meta.last_page, 1), total: toNum(meta.total, items.length) },
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
