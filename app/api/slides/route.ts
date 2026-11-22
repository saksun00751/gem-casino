import { NextResponse } from "next/server";
import { upstream, getToken } from "@/lib/server/upstream";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

// Home-page slides from the backend ( GET /slides ). Like lotto-seed-app the member's token is sent when there is one.
export async function GET() {
  const token = await getToken();
  try {
    const res = await upstream<Raw>("/slides", { token: token ?? undefined });
    const list = Array.isArray(res.data) ? (res.data as Raw[]) : [];
    const slides = list
      .map((s, i) => ({
        id: toStr(s.code ?? s.id) || String(i + 1),
        src: toStr(s.filepic) || toStr(s.image),
        alt: toStr(s.title ?? s.name).trim(),
        sort: toNum(s.sort, 9999),
      }))
      // Only real web images are passed on (the value ends up in an <img src>).
      .filter((s) => /^https?:\/\//i.test(s.src))
      .sort((a, b) => a.sort - b.sort);
    return NextResponse.json({ success: true, signedIn: !!token, slides }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, slides: [] }, { status: 502 });
  }
}
