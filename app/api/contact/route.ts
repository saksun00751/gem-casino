import { NextResponse } from "next/server";
import { upstream, publicCache } from "@/lib/server/upstream";
import { rec } from "@/lib/server/deposit";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

// Only these link types may be opened from the page (blocks javascript:/data: links).
const SAFE_LINK = /^(https?:\/\/|tel:|mailto:)/i;

// Contact channels from the backend ( GET /meta/contact-channels, public ).
export async function GET() {
  try {
    const res = await upstream<Raw>("/meta/contact-channels", { revalidate: 300 });
    const list = (rec(res.data)?.contact_channels ?? []) as Raw[];
    const channels = (Array.isArray(list) ? list : [])
      .map((c, i) => ({
        id: toStr(c.code) || String(i + 1),
        type: toStr(c.type).trim().toLowerCase(),
        label: toStr(c.label).trim(),
        link: toStr(c.link).trim(),
        sort: toNum(c.sort, 9999),
      }))
      .filter((c) => SAFE_LINK.test(c.link))
      .sort((a, b) => a.sort - b.sort);
    return NextResponse.json({ success: true, channels }, { headers: publicCache(300) });
  } catch {
    return NextResponse.json({ success: false, channels: [] }, { status: 502 });
  }
}
