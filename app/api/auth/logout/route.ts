import { NextResponse } from "next/server";
import { upstream, getToken, clearToken } from "@/lib/server/upstream";

export async function POST() {
  const token = await getToken();
  if (token) await upstream("/auth/logout", { method: "POST", body: {}, token }).catch(() => {});
  await clearToken();
  return NextResponse.json({ success: true });
}
