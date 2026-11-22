import { NextResponse } from "next/server";
import { registerEnabled } from "@/lib/theme";
import { upstream, setToken, UpstreamError } from "@/lib/server/upstream";

type Field = "user_name" | "password" | "confirmPassword" | "firstname" | "lastname" | "bank" | "acc_no";
type FieldErrors = Partial<Record<Field, string>>;

// Whitespace incl. NBSP and zero-width characters.
const HAS_SPACE = /[\s\u200B-\u200D\uFEFF]/;
const squash = (v: string) => v.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();

// Same rules as lotto-seed-app registerAction (plus whitespace checks).
function validate(b: Record<string, string>): FieldErrors {
  const e: FieldErrors = {};
  if (!b.user_name) e.user_name = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!/^0\d{9}$/.test(b.user_name)) e.user_name = "เบอร์ไม่ถูกต้อง (ต้องเป็น 10 หลักและขึ้นต้นด้วย 0)";
  if (!b.password) e.password = "กรุณากรอกรหัสผ่าน";
  else if (HAS_SPACE.test(b.password)) e.password = "รหัสผ่านต้องไม่มีช่องว่าง";
  else if (b.password.length < 6 || b.password.length > 16) e.password = "รหัสผ่านต้องมี 6-16 ตัวอักษร";
  if (!b.confirmPassword) e.confirmPassword = "กรุณายืนยันรหัสผ่าน";
  else if (HAS_SPACE.test(b.confirmPassword)) e.confirmPassword = "รหัสผ่านต้องไม่มีช่องว่าง";
  else if (b.confirmPassword !== b.password) e.confirmPassword = "รหัสผ่านไม่ตรงกัน";
  if (!b.firstname) e.firstname = "กรุณากรอกชื่อ";
  if (!b.lastname) e.lastname = "กรุณากรอกนามสกุล";
  if (!b.bank || Number.isNaN(parseInt(b.bank, 10))) e.bank = "กรุณาเลือกธนาคาร";
  if (!b.acc_no) e.acc_no = "กรุณากรอกเลขบัญชี";
  else if (b.acc_no.length < 10 || b.acc_no.length > 12) e.acc_no = "เลขบัญชีต้องมี 10-12 หลัก";
  return e;
}

function fieldErrorsFromApi(payload: Record<string, unknown> | undefined): FieldErrors {
  const out: FieldErrors = {};
  if (!payload) return out;
  const errors = payload.errors as Record<string, unknown> | undefined;
  const pick = (k: string) => {
    const v = errors?.[k];
    return Array.isArray(v) ? (typeof v[0] === "string" ? v[0] : undefined) : typeof v === "string" ? v : undefined;
  };
  if (errors && typeof errors === "object") {
    out.user_name = pick("user_name");
    out.password = pick("password");
    out.confirmPassword = pick("password_confirm");
    out.firstname = pick("firstname") ?? pick("name");
    out.lastname = pick("lastname");
    out.bank = pick("bank");
    out.acc_no = pick("acc_no");
  }
  const dup = payload.duplicate_fields;
  if (Array.isArray(dup)) {
    if (dup.includes("user_name") && !out.user_name) out.user_name = "เบอร์โทรศัพท์นี้ถูกใช้สมัครแล้ว";
    if (dup.includes("acc_no") && !out.acc_no) out.acc_no = "เลขบัญชีนี้ถูกใช้งานแล้วในธนาคารที่เลือก";
  }
  for (const k of Object.keys(out) as Field[]) if (!out[k]) delete out[k];
  return out;
}

const safeMsg = (m: string | undefined, fallback: string) =>
  !m || m.trim().startsWith("{") || m.trim().startsWith("[") ? fallback : m;

export async function POST(req: Request) {
  if (!registerEnabled()) return NextResponse.json({ success: false, message: "ขณะนี้ปิดรับสมัครสมาชิกชั่วคราว" }, { status: 403 });
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (k: string) => (typeof raw[k] === "string" ? squash(raw[k] as string) : "");
  const body = {
    user_name: str("user_name").replace(/\D/g, ""),
    password: typeof raw.password === "string" ? raw.password : "",
    confirmPassword: typeof raw.confirmPassword === "string" ? raw.confirmPassword : "",
    firstname: str("firstname"),
    lastname: str("lastname"),
    bank: str("bank"),
    acc_no: str("acc_no").replace(/\D/g, ""),
  };
  const referral = str("referralCode").replace(/[^A-Za-z0-9]/g, "");
  const marketing = str("marketing").replace(/\s/g, "");

  const fieldErrors = validate(body);
  if (Object.keys(fieldErrors).length) return NextResponse.json({ success: false, fieldErrors }, { status: 400 });

  try {
    await upstream("/auth/register", {
      method: "POST",
      body: {
        user_name: body.user_name,
        password: body.password,
        password_confirm: body.confirmPassword,
        name: `${body.firstname} ${body.lastname}`.trim(),
        acc_no: body.acc_no,
        bank: parseInt(body.bank, 10),
        refer: 1,
        ...(referral ? { referral_code: referral } : {}),
        ...(marketing ? { marketing } : {}),
      },
    });
  } catch (e) {
    if (e instanceof UpstreamError) {
      const fe = fieldErrorsFromApi(e.payload);
      if (Object.keys(fe).length)
        return NextResponse.json({ success: false, error: safeMsg(e.message, "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่"), fieldErrors: fe }, { status: 400 });
      if (e.status === 409 || e.message.toLowerCase().includes("exist"))
        return NextResponse.json({ success: false, fieldErrors: { user_name: "เบอร์โทรศัพท์นี้ถูกใช้สมัครแล้ว" } }, { status: 409 });
      return NextResponse.json({ success: false, error: safeMsg(e.message, "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่") }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่" }, { status: 502 });
  }

  // Auto-login after a successful registration (same as lotto-seed-app).
  let loggedIn = false;
  try {
    const res = await upstream<{ access_token?: string }>("/auth/login", {
      method: "POST",
      body: { user_name: body.user_name, password: body.password },
    });
    if (res.access_token) {
      await setToken(res.access_token);
      loggedIn = true;
    }
  } catch {}
  return NextResponse.json({ success: true, loggedIn });
}
