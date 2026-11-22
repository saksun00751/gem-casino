import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";
import { toNum, toStr } from "@/lib/server/num";

type Raw = Record<string, unknown>;

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { reward_id?: unknown };
  const rewardId = Math.trunc(toNum(body.reward_id));
  if (rewardId <= 0) return NextResponse.json({ success: false, message: "ไม่พบรางวัลที่เลือก" }, { status: 400 });
  try {
    const res = await upstream<Raw>("/reward/redeem", { method: "POST", token, body: { reward_id: rewardId } });
    const fmt = (res.format ?? {}) as Raw;
    return NextResponse.json({
      success: true,
      message: toStr(res.message) || "แลกรางวัลสำเร็จ",
      point: res.point == null ? null : toNum(res.point),
      title: toStr(fmt.title),
      msg: toStr(fmt.msg),
    });
  } catch (e) {
    const message = e instanceof UpstreamError ? e.message : "ไม่สามารถแลกรางวัลได้";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
