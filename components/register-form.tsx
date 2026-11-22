"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

type Bank = { code: number; name: string; shortcode: string; image: string };
type Errors = Partial<Record<"user_name" | "password" | "confirmPassword" | "firstname" | "lastname" | "bank" | "acc_no", string>>;

// Input cleaners: spaces are dropped as the user types/pastes, so nothing is silently truncated later.
const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const noSpace = (v: string) => v.replace(/[\s\u200B-\u200D\uFEFF]/g, "");
const nameText = (v: string) => v.replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/^\s+/, "").replace(/\s{2,}/g, " ");

const inputCls = "h-11 rounded-[30px] bg-white/10 px-4";

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p role="alert" className="px-2 text-xs text-red-300">{error}</p> : hint ? <p className="px-2 text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}

function BankPicker({ banks, value, onChange, hasError }: { banks: Bank[]; value: string; onChange: (v: string) => void; hasError?: boolean }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  const selected = banks.find((b) => String(b.code) === value);
  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        id="reg-bank"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!banks.length}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-11 w-full items-center gap-2.5 rounded-[30px] border bg-white/10 px-3 text-left text-[length:calc(14px*var(--fs))] outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 ${hasError ? "border-red-400" : open ? "border-[var(--brand)]" : "border-input"}`}
      >
        {selected ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt="" className="size-7 shrink-0 rounded-full bg-white object-contain p-0.5" />
            <span className="min-w-0 flex-1 truncate">{selected.name}</span>
          </>
        ) : (
          banks.length ? <span className="flex-1 px-1 text-white/50">{t("เลือกธนาคาร")}</span> : <span aria-label={t("กำลังโหลดธนาคาร")} className="skeleton h-5 flex-1 rounded" />
        )}
        <span aria-hidden className={`pr-1 text-xs text-white/60 transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("ธนาคาร")}
          className="no-scrollbar absolute inset-x-0 top-full z-30 mt-1.5 grid max-h-[216px] grid-cols-1 gap-1.5 overflow-y-auto rounded-[12px] border border-[var(--brand)] bg-[var(--surface-2)] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.55)]"
        >
          {banks.map((b) => {
            const active = String(b.code) === value;
            return (
              <li key={b.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => { onChange(String(b.code)); setOpen(false); }}
                  className={`flex h-10 w-full items-center gap-2 rounded-[10px] border px-1.5 text-left transition active:scale-[0.97] ${active ? "border-[var(--brand)] bg-[var(--brand)]/20" : "border-transparent bg-white/10 hover:bg-white/15"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt="" loading="lazy" className="size-7 shrink-0 rounded-full bg-white object-contain p-0.5" />
                  <span className="min-w-0 flex-1 truncate text-[length:calc(12px*var(--fs))] font-medium leading-tight">{b.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function RegisterForm({ onDone, onSwitchToLogin }: { onDone?: () => void; onSwitchToLogin?: () => void }) {
  const t = useT();
  const { refresh } = useSite();
  const [f, setF] = React.useState({
    user_name: "", password: "", confirmPassword: "", firstname: "", lastname: "", bank: "", acc_no: "", referralCode: "",
  });
  const [marketing, setMarketing] = React.useState("");
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [errors, setErrors] = React.useState<Errors>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    // ?market=CODE is remembered across visits, like lotto-seed-app.
    try {
      const m = new URLSearchParams(window.location.search).get("market");
      if (m) localStorage.setItem("marketing_code", m);
      setMarketing(m ?? localStorage.getItem("marketing_code") ?? "");
      // ?ref=CODE comes from a friend's referral link; remembered until the account is created.
      const clean = (v: string | null) => (v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      const fromUrl = clean(new URLSearchParams(window.location.search).get("ref"));
      if (fromUrl) localStorage.setItem("referral_code", fromUrl);
      const ref = fromUrl || clean(localStorage.getItem("referral_code"));
      if (ref) setF((p) => (p.referralCode ? p : { ...p, referralCode: ref }));
    } catch {}
    fetch("/api/auth/banks/")
      .then((r) => r.json())
      .then((j) => setBanks(Array.isArray(j.banks) ? j.banks : []))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, firstname: f.firstname.trim(), lastname: f.lastname.trim(), marketing: marketing.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) {
        setErrors(Object.fromEntries(Object.entries((j.fieldErrors ?? {}) as Record<string, string>).map(([k, v]) => [k, t(v)])) as Errors);
        setError(j.error ? t(j.error) : "");
        return;
      }
      try { localStorage.removeItem("marketing_code"); localStorage.removeItem("referral_code"); } catch {}
      setErrors({});
      setDone(true);
      toast.success(t("สมัครสมาชิกสำเร็จ ยินดีต้อนรับ"));
      await refresh();
      setTimeout(() => onDone?.(), 1200);
    } catch {
      setError(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setBusy(false);
    }
  }

  if (done)
    return (
      <div className="grid justify-items-center gap-2 py-6 text-center">
        <span className="text-[length:calc(48px*var(--fs))]">🎉</span>
        <p className="text-[length:calc(18px*var(--fs))] font-medium text-[var(--brand)]">{t("สมัครสมาชิกสำเร็จ!")}</p>
        <p className="text-sm text-white/70">{t("กำลังเข้าสู่ระบบ…")}</p>
      </div>
    );

  return (
    <form className="grid gap-3" onSubmit={submit} noValidate>
      <Field id="reg-phone" label={t("เบอร์โทรศัพท์")} error={errors.user_name} hint={t("เบอร์ 10 หลัก ขึ้นต้นด้วย 0 ใช้เป็นชื่อผู้ใช้เข้าสู่ระบบ")}>
        <Input id="reg-phone" inputMode="numeric" autoComplete="username" placeholder="0xxxxxxxxx"
          value={f.user_name} onChange={(e) => setF((p) => ({ ...p, user_name: digits(e.target.value, 10) }))} className={inputCls} />
      </Field>
      <Field id="reg-pass" label={t("รหัสผ่าน")} error={errors.password} hint={t("6-16 ตัวอักษร")}>
        <Input id="reg-pass" type="password" autoComplete="new-password" placeholder="••••••"
          value={f.password} onChange={(e) => setF((p) => ({ ...p, password: noSpace(e.target.value).slice(0, 16) }))} className={inputCls} />
      </Field>
      <Field id="reg-confirm" label={t("ยืนยันรหัสผ่าน")} error={errors.confirmPassword}>
        <Input id="reg-confirm" type="password" autoComplete="new-password" placeholder={t("กรอกรหัสผ่านอีกครั้ง")}
          value={f.confirmPassword} onChange={(e) => setF((p) => ({ ...p, confirmPassword: noSpace(e.target.value).slice(0, 16) }))} className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="reg-first" label={t("ชื่อ")} error={errors.firstname}>
          <Input id="reg-first" autoComplete="given-name" value={f.firstname} onChange={(e) => setF((p) => ({ ...p, firstname: nameText(e.target.value) }))} onBlur={() => setF((p) => ({ ...p, firstname: p.firstname.trim() }))} className={inputCls} />
        </Field>
        <Field id="reg-last" label={t("นามสกุล")} error={errors.lastname}>
          <Input id="reg-last" autoComplete="family-name" value={f.lastname} onChange={(e) => setF((p) => ({ ...p, lastname: nameText(e.target.value) }))} onBlur={() => setF((p) => ({ ...p, lastname: p.lastname.trim() }))} className={inputCls} />
        </Field>
      </div>
      <Field id="reg-bank" label={t("ธนาคาร")} error={errors.bank}>
        <BankPicker banks={banks} value={f.bank} hasError={!!errors.bank} onChange={(v) => setF((p) => ({ ...p, bank: v }))} />
      </Field>
      <Field id="reg-acc" label={t("เลขบัญชีธนาคาร")} error={errors.acc_no} hint={t("10-12 หลัก ต้องเป็นบัญชีของคุณเอง ใช้สำหรับถอนเงิน")}>
        <Input id="reg-acc" inputMode="numeric" placeholder="xxxxxxxxxx"
          value={f.acc_no} onChange={(e) => setF((p) => ({ ...p, acc_no: digits(e.target.value, 12) }))} className={inputCls} />
      </Field>
      <Field id="reg-ref" label={t("รหัสแนะนำ (ถ้ามี)")} hint={t("ไม่บังคับ — กรอกเฉพาะถ้ามีคนแนะนำ")}>
        <Input id="reg-ref" autoComplete="off" placeholder={t("เช่น LTABCD12")}
          value={f.referralCode} onChange={(e) => setF((p) => ({ ...p, referralCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) }))} className={inputCls} />
      </Field>
      {error && <p role="alert" className="text-center text-sm text-red-300">{error}</p>}
      <Button type="submit" disabled={busy} className="brand-gradient h-11 rounded-[30px] text-base font-medium">
        {busy ? t("กำลังสมัครสมาชิก...") : t("สมัครสมาชิก")}
      </Button>
      <p className="text-center text-sm text-white/70">
        {t("มีบัญชีอยู่แล้ว?")}{" "}
        {onSwitchToLogin ? (
          <button type="button" onClick={onSwitchToLogin} className="text-[var(--brand)] underline">{t("เข้าสู่ระบบ")}</button>
        ) : (
          <Link href="/login/" className="text-[var(--brand)] underline">{t("เข้าสู่ระบบ")}</Link>
        )}
      </p>
    </form>
  );
}
