import { NextResponse } from "next/server";
import { upstream, publicCache, UpstreamError } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;
const SAFE = /^[a-zA-Z0-9_-]{1,40}$/;

// The game list is public on the backend, so no sign-in is needed to browse it.
export async function GET(_req: Request, ctx: { params: Promise<{ type: string; provider: string }> }) {
  const { type, provider } = await ctx.params;
  if (!SAFE.test(type) || !SAFE.test(provider)) return NextResponse.json({ success: false, reason: "bad_request" }, { status: 400 });
  try {
    const res = await upstream<Raw>(`/games/${type.toLowerCase()}/${provider.toLowerCase()}`, { revalidate: 120 });
    const list = Array.isArray(res.data) ? (res.data as Raw[]) : [];
    const games = list
      .filter((g) => toStr(g.status).toUpperCase() === "ACTIVE" && toStr(g.id))
      .map((g) => {
        const img = rec(g.image) ?? {};
        return {
          id: toStr(g.id),
          provider: toStr(g.provider) || provider.toUpperCase(),
          name: toStr(g.gameName) || toStr(g.id),
          image: toStr(img.vertical) || toStr(img.horizontal) || toStr(img.banner),
        };
      });
    return NextResponse.json({ success: true, games }, { headers: publicCache(120) });
  } catch (e) {
    if (e instanceof UpstreamError && e.status === 404) return NextResponse.json({ success: true, games: [] });
    return NextResponse.json({ success: false, reason: "error" }, { status: 502 });
  }
}
