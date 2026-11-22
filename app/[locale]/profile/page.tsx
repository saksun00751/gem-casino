"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

type Profile = {
  phone: string;
  name: string;
  balance: number;
  credit: number;
  diamond: number;
  bank: { name: string; logo: string; accNo: string } | null;
};
type State = "loading" | "ready" | "login" | "error";

const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p;
};
const formatAcc = (acc: string) => {
  const d = acc.replace(/\D/g, "");
  return d.length === 10 || d.length === 12 ? `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9)}` : acc;
};
const maskAcc = (acc: string) => (acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc);
const noSpace = (v: string) => v.replace(/[\s​-‍﻿]/g, "").slice(0, 16);

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] text-white ${className}`}>{children}</div>;
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const [pw, setPw] = React.useState("");
  const [cf, setCf] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    if (open) { setPw(""); setCf(""); setShow(false); setErrors({}); setError(""); setBusy(false); setDone(false); }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/profile/password/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw, confirm: cf }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) {
        setErrors(Object.fromEntries(Object.entries((j.fieldErrors ?? {}) as Record<string, string>).map(([k, v]) => [k, t(v)])));
        setError(j.fieldErrors ? "" : j.message ? t(j.message) : t("เปลี่ยนรหัสผ่านไม่สำเร็จ"));
        return;
      }
      setErrors({});
      setDone(true);
      toast.success(t("เปลี่ยนรหัสผ่านสำเร็จ"));
    } catch {
      setError(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setBusy(false);
    }
  }

  const input = "h-11 rounded-[30px] bg-white/10 px-4";
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="rounded-[15px] border-[var(--brand)] bg-[var(--surface-2)] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{t("เปลี่ยนรหัสผ่าน")}</DialogTitle>
          <DialogDescription className="text-white/70">{t("ตั้งรหัสผ่านใหม่ 6-16 ตัวอักษร (ห้ามมีช่องว่าง)")}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="grid justify-items-center gap-3 py-4 text-center">
            <span className="text-[48px]">✅</span>
            <p className="text-[length:calc(18px*var(--fs))] font-medium text-emerald-200">{t("เปลี่ยนรหัสผ่านสำเร็จ!")}</p>
            <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ใช้รหัสผ่านใหม่ในการเข้าสู่ระบบครั้งถัดไป")}</p>
            <Button onClick={() => onOpenChange(false)} className="brand-gradient h-10 rounded-[30px] px-8 font-medium">{t("ปิด")}</Button>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={submit} noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-new">{t("รหัสผ่านใหม่")}</Label>
              <Input id="pw-new" type={show ? "text" : "password"} autoComplete="new-password" value={pw} onChange={(e) => setPw(noSpace(e.target.value))} className={input} aria-invalid={!!errors.password} />
              {errors.password && <p role="alert" className="px-2 text-xs text-red-300">{errors.password}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pw-confirm">{t("ยืนยันรหัสผ่านใหม่")}</Label>
              <Input id="pw-confirm" type={show ? "text" : "password"} autoComplete="new-password" value={cf} onChange={(e) => setCf(noSpace(e.target.value))} className={input} aria-invalid={!!errors.confirm} />
              {errors.confirm && <p role="alert" className="px-2 text-xs text-red-300">{errors.confirm}</p>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 px-1 text-[length:calc(13px*var(--fs))] text-white/80">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="size-4 accent-[var(--brand)]" /> {t("แสดงรหัสผ่าน")}
            </label>
            {error && <p role="alert" className="rounded-[10px] bg-red-500/25 px-4 py-2 text-center text-sm text-red-100">{error}</p>}
            <Button type="submit" disabled={busy} className="brand-gradient h-11 rounded-[30px] text-base font-medium">{busy ? t("กำลังบันทึก...") : t("เปลี่ยนรหัสผ่าน")}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const t = useT();
  const router = useRouter();
  const { user, authReady, setLoginOpen, logout } = useSite();
  const [state, setState] = React.useState<State>("loading");
  const [p, setP] = React.useState<Profile | null>(null);
  const [showAcc, setShowAcc] = React.useState(false);
  const [pwOpen, setPwOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/profile/", { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setP(j);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  // /api/me already ran (page load / login): wait for it, then load; reload on sign-in/out.
  React.useEffect(() => { if (authReady) load(); }, [authReady, user, load]);

  async function signOut() {
    setLeaving(true);
    await logout();
    router.push("/");
  }

  const display = p?.name || p?.phone || t("สมาชิก");
  const menu = [
    { href: "/history/", icon: "🧾", label: t("ประวัติการเงิน"), desc: t("รายการฝาก-ถอนและความเคลื่อนไหวทั้งหมด") },
    { href: "/referral/", icon: "👥", label: t("แนะนำเพื่อน"), desc: t("รหัส ลิงก์ และรายได้จากการแนะนำ") },
    { href: "/promotions/", icon: "🎁", label: t("โปรโมชัน"), desc: t("ดูและรับโปรโมชันที่เปิดอยู่") },
    { href: "/contact/", icon: "💬", label: t("ติดต่อเรา"), desc: t("LINE / Telegram ฝ่ายบริการลูกค้า") },
  ];

  return (
    <SiteShell>
      <section className="mx-auto max-w-[560px] px-[10px] py-6">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("โปรไฟล์")}</h1>

        {state === "loading" && <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลด")}>{[0, 1, 2].map((i) => <div key={i} className="h-[130px] skeleton rounded-[15px]" />)}</div>}

        {state === "login" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 px-6 py-10 text-center">
            <span className="text-[48px]">👤</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อดูโปรไฟล์")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </Box>
        )}

        {state === "error" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 px-6 py-8 text-center">
            <p className="text-[length:calc(15px*var(--fs))]">{t("โหลดโปรไฟล์ไม่สำเร็จ")}</p>
            <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
          </Box>
        )}

        {state === "ready" && p && (
          <div className="grid gap-4">
            {/* identity + balances */}
            <Box className="overflow-hidden">
              <div className="flex items-center gap-4 bg-gradient-to-br from-[var(--brand)]/30 to-transparent p-5">
                <div className="brand-gradient grid size-16 shrink-0 place-items-center rounded-full text-[length:calc(26px*var(--fs))] font-semibold shadow-[0_0_18px_color-mix(in_srgb,var(--brand)_45%,transparent)]" aria-hidden>
                  {Array.from(display.replace(/^[เแโใไ]+/, ""))[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[length:calc(20px*var(--fs))] font-medium">{display}</p>
                  <p className="text-[length:calc(14px*var(--fs))] tabular-nums text-white/75">{formatPhone(p.phone)}</p>
                  <span className="mt-1 inline-block rounded-full border border-[var(--brand)]/60 px-2.5 py-0.5 text-[length:calc(11px*var(--fs))] text-[var(--brand)]">{t("สมาชิก")}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
                {[[t("ยอดคงเหลือ"), money(p.balance), "🪙"], [t("เครดิต"), money(p.credit), "🎫"], [t("เพชร"), p.diamond.toLocaleString("th-TH"), "💎"]].map(([l, v, i]) => (
                  <div key={l} className="px-2 py-3 text-center">
                    <p className="text-[length:calc(11px*var(--fs))] text-white/60">{i} {l}</p>
                    <p className="text-[length:calc(16px*var(--fs))] font-semibold tabular-nums text-[var(--brand)]">{v}</p>
                  </div>
                ))}
              </div>
            </Box>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/deposit/" className="brand-gradient grid h-12 place-items-center rounded-[30px] text-[length:calc(16px*var(--fs))] font-medium">{t("💰 เติมเงิน")}</Link>
              <Link href="/withdraw/" className="grid h-12 place-items-center rounded-[30px] border border-[var(--brand)] text-[length:calc(16px*var(--fs))] font-medium text-white hover:bg-white/10">{t("💸 ถอนเงิน")}</Link>
            </div>

            {/* bank account */}
            <Box className="p-4">
              <p className="mb-3 text-[length:calc(12px*var(--fs))] tracking-wide text-white/60">{t("🏦 บัญชีธนาคาร")}</p>
              {p.bank ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.bank.logo && <img src={p.bank.logo} alt={p.bank.name} className="size-12 shrink-0 rounded-full bg-white object-contain p-1" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{p.bank.name || t("บัญชีธนาคาร")}</p>
                    <p className="text-[length:calc(18px*var(--fs))] tracking-wide tabular-nums">{showAcc ? formatAcc(p.bank.accNo) : maskAcc(p.bank.accNo)}</p>
                    <p className="truncate text-[length:calc(13px*var(--fs))] text-white/70">{p.name}</p>
                  </div>
                  <button onClick={() => setShowAcc((s) => !s)} aria-pressed={showAcc} className="shrink-0 rounded-[30px] bg-white/15 px-3 py-1.5 text-[length:calc(12px*var(--fs))] hover:bg-white/25">{showAcc ? t("ซ่อน") : t("แสดง")}</button>
                </div>
              ) : (
                <p className="text-[length:calc(14px*var(--fs))] text-amber-200">{t("ยังไม่ได้ผูกบัญชีธนาคาร กรุณา")} <Link href="/contact/" className="font-medium text-[var(--brand)] underline">{t("ติดต่อฝ่ายบริการลูกค้า")}</Link></p>
              )}
              <p className="mt-3 text-[length:calc(12px*var(--fs))] text-white/50">{t("ต้องการเปลี่ยนบัญชีธนาคาร กรุณาติดต่อฝ่ายบริการลูกค้า")}</p>
            </Box>

            {/* menu */}
            <Box className="overflow-hidden">
              <ul className="divide-y divide-white/10">
                {menu.map((m) => (
                  <li key={m.href}>
                    <Link href={m.href} className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-white/5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/10 text-[20px]" aria-hidden>{m.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[length:calc(15px*var(--fs))] font-medium">{m.label}</span>
                        <span className="block text-[length:calc(12px*var(--fs))] text-white/55">{m.desc}</span>
                      </span>
                      <span aria-hidden className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]">›</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button onClick={() => setPwOpen(true)} className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-white/5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-white/10 text-[20px]" aria-hidden>🔐</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[length:calc(15px*var(--fs))] font-medium">{t("เปลี่ยนรหัสผ่าน")}</span>
                      <span className="block text-[length:calc(12px*var(--fs))] text-white/55">{t("อัปเดตรหัสผ่านของคุณ")}</span>
                    </span>
                    <span aria-hidden className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]">›</span>
                  </button>
                </li>
              </ul>
            </Box>

            <button onClick={signOut} disabled={leaving}
              className="flex h-12 items-center justify-center gap-2 rounded-[30px] border border-red-400/50 bg-red-500/10 text-[length:calc(15px*var(--fs))] font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
              🚪 {leaving ? t("กำลังออกจากระบบ...") : t("ออกจากระบบ")}
            </button>
          </div>
        )}
      </section>
      <PasswordDialog open={pwOpen} onOpenChange={setPwOpen} />
    </SiteShell>
  );
}
