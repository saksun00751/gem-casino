import { NextResponse } from "next/server";
import { upstream, getToken, UpstreamError } from "@/lib/server/upstream";

const HAS_SPACE = /[\s​-‍﻿]/;
const fail = (message: string, status = 400, fieldErrors?: Record<string, string>) =>
  NextResponse.json({ success: false, message, fieldErrors }, { status });

// Same password rules as registration. Like lotto-seed-app, the backend takes only the new password + confirmation.
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return fail("กรุณาเข้าสู่ระบบ", 401);
  const b = (await req.json().catch(() => ({}))) as { password?: unknown; confirm?: unknown };
  const password = typeof b.password === "string" ? b.password : "";
  const confirm = typeof b.confirm === "string" ? b.confirm : "";

  const e: Record<string, string> = {};
  if (!password) e.password = "กรุณากรอกรหัสผ่านใหม่";
  else if (HAS_SPACE.test(password)) e.password = "รหัสผ่านต้องไม่มีช่องว่าง";
  else if (password.length < 6 || password.length > 16) e.password = "รหัสผ่านต้องมี 6-16 ตัวอักษร";
  if (!confirm) e.confirm = "กรุณายืนยันรหัสผ่านใหม่";
  else if (confirm !== password) e.confirm = "รหัสผ่านไม่ตรงกัน";
  if (Object.keys(e).length) return fail("ข้อมูลไม่ถูกต้อง", 400, e);

  try {
    const res = await upstream<{ message?: string }>("/member/change-password", {
      method: "POST",
      token,
      body: { password, password_confirmation: confirm },
    });
    return NextResponse.json({ success: true, message: res.message?.trim() || "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    return fail(err instanceof UpstreamError ? err.message : "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่", err instanceof UpstreamError ? 400 : 502);
  }
}
