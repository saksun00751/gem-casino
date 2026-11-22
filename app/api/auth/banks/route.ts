import { NextResponse } from "next/server";
import { upstream, publicCache } from "@/lib/server/upstream";

type Bank = { code: number; name_th: string; shortcode: string; image_url: string };

export async function GET() {
  try {
    const res = await upstream<{ data?: { banks?: Bank[] } }>("/auth/register/banks", { revalidate: 3600 });
    const banks = (res.data?.banks ?? []).map((b) => ({
      code: b.code,
      name: b.name_th,
      shortcode: b.shortcode,
      image: b.image_url,
    }));
    return NextResponse.json({ success: true, banks }, { headers: publicCache(3600) });
  } catch {
    return NextResponse.json({ success: false, banks: [] }, { status: 502 });
  }
}
