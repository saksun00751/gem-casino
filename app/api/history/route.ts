import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

// Wallet transaction types the site shows (lotto_* types belong to the lotto product and are left out).
const TYPES = new Set(["all", "deposit", "withdraw", "bonus", "game", "cashback", "referral", "ic", "rollback", "admin_adjust", "other"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const status = (raw: unknown): "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" => {
  const s = String(raw ?? "").toUpperCase();
  if (s === "SUCCESS" || s === "COMPLETED" || s === "1") return "SUCCESS";
  if (s === "PENDING" || s === "WAIT" || s === "0") return "PENDING";
  if (s === "FAILED") return "FAILED";
  return "CANCELLED";
};

export async function GET(req: Request) {
  const token = await getToken();
  // Signed-out is a normal state: answer 200 so the browser console stays clean.
  if (!token) return NextResponse.json({ success: false, reason: "login" });

  const q = new URL(req.url).searchParams;
  const type = q.get("type") ?? "all";
  if (!TYPES.has(type)) return NextResponse.json({ success: false, reason: "bad_request" }, { status: 400 });
  const qs = new URLSearchParams({ type });
  for (const k of ["date_start", "date_stop"]) {
    const v = q.get(k)?.trim();
    if (v) {
      if (!DATE.test(v)) return NextResponse.json({ success: false, reason: "bad_request" }, { status: 400 });
      qs.set(k, v);
    }
  }
  const page = Math.max(1, Math.trunc(toNum(q.get("page"), 1)));
  if (page > 1) qs.set("page", String(page));

  try {
    const res = await upstream<Raw>(`/wallet/transactions?${qs}`, { token });
    const d = rec(res.data) ?? {};
    const items = Array.isArray(d.items) ? (d.items as Raw[]) : [];
    const s = rec(d.summary) ?? {};
    const p = rec(d.pagination) ?? {};
    return NextResponse.json({
      success: true,
      rows: items.map((r, i) => {
        const credit = toStr(r.direction).toUpperCase() === "CREDIT";
        const amount = Math.abs(toNum(r.amount));
        return {
          id: toNum(r.id, i + 1),
          title: toStr(r.title) || toStr(r.type_label) || toStr(r.type),
          detail: toStr(r.detail),
          credit,
          amount: toNum(r.signed_amount, credit ? amount : -amount),
          balanceAfter: toNum(r.balance_after),
          date: toStr(r.created_at),
          status: status(r.status),
        };
      }),
      summary: { count: toNum(s.count), credit: toNum(s.total_credit_amount), debit: toNum(s.total_debit_amount), net: toNum(s.net_amount) },
      pagination: { page: toNum(p.page, 1), limit: toNum(p.limit, 20), total: toNum(p.total), hasMore: Boolean(p.has_more) },
    });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
