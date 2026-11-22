import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";

type Raw = Record<string, unknown>;
const KEYS = ["bank", "payment", "tw", "slip"] as const;
// The flag is 0 (off) or a positive number. We saw payment = 2 while the backend was listing its providers,
// so anything above 0 counts as enabled (lotto-seed-app only accepted exactly 1).
const on = (v: unknown) => v === true || Number(v) > 0;

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, reason: "login" });
  try {
    const profile = await upstream<Raw>("/member/profile", { token });
    let dep = rec(rec(profile.profile)?.deposit);
    if (!dep) {
      const legacy = await upstream<Raw>("/deposit/channels", { token });
      dep = rec(rec(legacy.data)?.deposit);
    }
    const sort = rec(dep?.sort) ?? {};
    const channels = KEYS.filter((k) => on(dep?.[k])).sort(
      (a, b) => Number(sort[a] ?? 99) - Number(sort[b] ?? 99),
    );
    return NextResponse.json({ success: true, channels });
  } catch (e) {
    if (e instanceof UpstreamError && (e.status === 401 || e.status === 403))
      return NextResponse.json({ success: false, reason: "login" });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
