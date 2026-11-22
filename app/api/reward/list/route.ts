import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

export async function GET(req: Request) {
  const token = await getToken();
  // Signed-out is a normal state: answer 200 so the browser console stays clean.
  if (!token) return NextResponse.json({ success: false, reason: "login" });

  const incoming = new URL(req.url).searchParams;
  const qs = new URLSearchParams();
  for (const k of ["page", "per_page", "q", "featured_only"]) {
    const v = incoming.get(k)?.trim();
    if (v) qs.set(k, v);
  }
  try {
    const res = await upstream<Raw>(`/reward/list${qs.size ? `?${qs}` : ""}`, { token });
    const list = Array.isArray(res.rewards) ? (res.rewards as Raw[]) : [];
    const meta = (res.meta ?? {}) as Raw;
    const system = (res.system ?? {}) as Raw;
    return NextResponse.json({
      success: true,
      point: toNum(res.point),
      diamond: toNum(res.diamond),
      enabled: system.reward === undefined ? true : Boolean(system.reward),
      rewards: list
        .filter((r) => toNum(r.is_hidden) !== 1)
        .map((r) => ({
          id: toNum(r.id),
          name: toStr(r.name),
          description: toStr(r.description),
          image: toStr(r.image_url) || toStr(r.image),
          featured: toNum(r.is_featured) === 1,
          pointCost: toNum(r.point_cost),
          rewardType: toStr(r.reward_type).toLowerCase(),
          creditAmount: r.credit_amount == null ? null : toNum(r.credit_amount),
          gemAmount: r.gem_amount == null ? null : toNum(r.gem_amount),
          status: toStr(r.status).toLowerCase(),
          stockUnlimited: toNum(r.stock_unlimited) === 1,
          stockRemaining: toNum(r.stock_remaining),
          startAt: toStr(r.start_at) || null,
          endAt: toStr(r.end_at) || null,
        })),
      meta: { page: toNum(meta.current_page, 1), lastPage: toNum(meta.last_page, 1), total: toNum(meta.total, list.length) },
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
