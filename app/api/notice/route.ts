import { NextResponse } from "next/server";
import { upstream, getToken } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";

// Back-office announcement for the ticker: `system.notice` from /member/loadbalance (members only).
// Plain text only: tags are stripped, whitespace collapsed, length capped.
export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: true, notice: null });
  try {
    const res = await upstream<Record<string, unknown>>("/member/loadbalance", { token });
    const raw = rec(res.system)?.notice;
    const text = typeof raw === "string" ? raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) : "";
    return NextResponse.json({ success: true, notice: text || null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: true, notice: null });
  }
}
