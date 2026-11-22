"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { HelpStrip } from "@/components/contact-fab";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/components/providers";
import { ContactLink } from "@/components/contact-link";
import { useT } from "@/components/i18n-provider";

type Info = {
  name: string;
  balance: number;
  min: number;
  max: number;
  maxDay: number;
  sumToday: number;
  remainToday: number;
  limitAmount: number;
  canWithdraw: boolean;
  notice: string | null;
  bank: { name: string; logo: string; accNo: string } | null;
  promo: { active: boolean; name: string | null; turnover: number; limit: number };
};
type State = "loading" | "ready" | "login" | "error";

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const COOLDOWN_MIN = 5;

function formatAcc(acc: string) {
  const d = acc.replace(/\D/g, "");
  return d.length === 10 || d.length === 12 ? `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9)}` : acc;
}
const maskAcc = (acc: string) => (acc.length > 4 ? `${"X".repeat(acc.length - 4)}-${acc.slice(-4)}` : acc);
const cleanAmount = (v: string) => {
  const s = v.replace(/[^\d.]/g, "");
  const [i, ...rest] = s.split(".");
  return rest.length ? `${i}.${rest.join("").slice(0, 2)}` : i;
};

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-white ${className}`}>{children}</div>;
}
function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[length:calc(14px*var(--fs))]">
      <span className="shrink-0 text-white/60">{k}</span>
      <span className={`text-right ${strong ? "font-semibold text-[var(--brand)]" : ""}`}>{v}</span>
    </div>
  );
}

export default function WithdrawPage() {
  const t = useT();
  const { user, authReady, setLoginOpen, refresh } = useSite();
  const [state, setState] = React.useState<State>("loading");
  const [info, setInfo] = React.useState<Info | null>(null);
  const [amount, setAmount] = React.useState("");
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState<{ amount: number; message: string } | null>(null);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/withdraw/info/", { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setInfo(j);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  React.useEffect(() => { if (authReady) load(); }, [authReady, user, load]);

  // ---- numbers (same rules as lotto-seed-app) ----
  const i = info;
  const amountNum = parseFloat(amount) || 0;
  const maxAllowed = i ? Math.max(0, Math.min(i.max, i.balance, i.remainToday)) : 0;
  const promoActive = !!i?.promo.active;
  // With an active promotion the whole withdrawable amount is forced (capped by the promo limit).
  const forced = i && promoActive ? Math.max(0, i.promo.limit > 0 ? Math.min(maxAllowed, i.promo.limit) : maxAllowed) : 0;
  const effective = promoActive ? forced : amountNum;
  const turnoverPassed = i ? i.balance >= i.promo.turnover : true;
  const shortfall = i ? Math.max(0, i.promo.turnover - i.balance) : 0;

  const amountError = (() => {
    if (!i || promoActive || !amount) return "";
    if (amountNum < i.min) return t("ถอนขั้นต่ำ {v} บาท", { v: fmt(i.min) });
    if (amountNum > i.max) return t("ถอนสูงสุดต่อครั้ง {v} บาท", { v: fmt(i.max) });
    if (amountNum > i.remainToday) return t("เกินวงเงินถอนที่เหลือวันนี้ ({v} บาท)", { v: fmt(i.remainToday) });
    if (amountNum > i.balance) return t("ยอดคงเหลือไม่เพียงพอ");
    return "";
  })();
  const valid = !!i && effective >= i.min && effective <= maxAllowed && i.canWithdraw && (!promoActive || turnoverPassed) && !!i.bank && !amountError;

  async function submit() {
    if (!i || !valid || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/withdraw/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: effective }) });
      const j = await r.json().catch(() => ({}));
      setConfirm(false);
      if (!r.ok || !j.success) return setError(j.message ? t(j.message) : t("ไม่สามารถถอนเงินได้"));
      setDone({ amount: effective, message: j.message ? t(j.message) : j.message });
      toast.success(j.message || t("ส่งคำขอถอนเงินเรียบร้อย"));
      refresh();
    } catch {
      setConfirm(false);
      setError(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setBusy(false);
    }
  }

  const retry = (
    <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 py-8 text-center">
      <p className="text-[length:calc(15px*var(--fs))]">{t("โหลดข้อมูลไม่สำเร็จ")}</p>
      <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
    </Box>
  );

  return (
    <SiteShell>
      <section className="mx-auto max-w-[560px] px-[10px] py-6">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("ถอนเงิน")}</h1>
        <HelpStrip />

        {state === "loading" && <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลด")}><div className="skeleton h-12 rounded-[30px]" /><div className="skeleton h-[72px] rounded-[15px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 w-2/3 rounded-[30px] justify-self-center" /></div>}
        {state === "error" && retry}
        {state === "login" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 py-10 text-center">
            <span className="text-[48px]">💸</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อถอนเงิน")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </Box>
        )}

        {state === "ready" && i && done && (
          <Box className="grid gap-3 text-center">
            <span className="text-[56px]">✅</span>
            <p className="text-[length:calc(20px*var(--fs))] font-medium text-emerald-200">{t("ส่งคำขอถอนเงินแล้ว!")}</p>
            <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ระบบกำลังดำเนินการ รอไม่เกิน {COOLDOWN_MIN} นาที", { COOLDOWN_MIN })}</p>
            <div className="grid gap-2 rounded-[12px] bg-black/30 p-3 text-left">
              <Row k={t("จำนวนเงิน")} v={`฿${fmt(done.amount)}`} strong />
              {i.bank && <Row k={t("โอนเข้าบัญชี")} v={i.bank.name || t("บัญชีธนาคาร")} />}
              {i.bank && <Row k={t("เลขบัญชี")} v={maskAcc(i.bank.accNo)} />}
              <Row k={t("ชื่อบัญชี")} v={i.name} />
            </div>
            <Link href="/" className="brand-gradient mx-auto grid h-10 place-items-center rounded-[30px] px-8 text-[length:calc(14px*var(--fs))] font-medium">{t("กลับหน้าแรก")}</Link>
          </Box>
        )}

        {state === "ready" && i && !done && (
          <div className="grid gap-4">
            {i.notice && <p role="status" className="rounded-[10px] bg-amber-500/25 px-4 py-2 text-center text-[length:calc(14px*var(--fs))] text-amber-100">{i.notice}</p>}
            {!i.canWithdraw && <p role="alert" className="rounded-[10px] bg-red-500/25 px-4 py-2 text-center text-[length:calc(14px*var(--fs))] text-red-100">{t("ขณะนี้ระบบถอนเงินปิดชั่วคราว กรุณา")}<ContactLink>{t("ติดต่อเจ้าหน้าที่")}</ContactLink></p>}

            <Box className="flex items-center justify-between">
              <span className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ยอดคงเหลือ")}</span>
              <span className="text-[length:calc(22px*var(--fs))] font-semibold text-[var(--brand)]">🪙 {fmt(i.balance)}</span>
            </Box>

            <Box>
              <p className="mb-2 text-[length:calc(13px*var(--fs))] text-white/60">{t("บัญชีรับเงินของฉัน")}</p>
              {i.bank ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {i.bank.logo && <img src={i.bank.logo} alt={i.bank.name} className="size-12 shrink-0 rounded-full bg-white object-contain p-1" />}
                  <div className="min-w-0">
                    <p className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{i.bank.name || t("บัญชีธนาคาร")}</p>
                    <p className="text-[length:calc(15px*var(--fs))] tracking-wide">{formatAcc(i.bank.accNo)}</p>
                    <p className="truncate text-[length:calc(13px*var(--fs))] text-white/70">{i.name}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[length:calc(14px*var(--fs))] text-amber-200">{t("ยังไม่ได้ผูกบัญชีธนาคาร กรุณา")}<ContactLink /></p>
              )}
            </Box>

            {promoActive && (
              <Box className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("โปรปัจจุบัน")}</p>
                    <p className="truncate text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{i.promo.name || "-"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-0.5 text-[length:calc(12px*var(--fs))] font-medium ${turnoverPassed ? "bg-emerald-500/25 text-emerald-100" : "bg-amber-500/25 text-amber-100"}`}>
                    {turnoverPassed ? t("ผ่านแล้ว") : t("ยังไม่ผ่าน")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[length:calc(13px*var(--fs))]">
                  <div className="rounded-[10px] bg-white/10 px-3 py-2"><p className="text-white/60">{t("ยอดเทิร์น")}</p><p className="font-semibold">{`฿${fmt(i.promo.turnover)}`}</p></div>
                  <div className="rounded-[10px] bg-white/10 px-3 py-2"><p className="text-white/60">{t("ยอดอั้น")}</p><p className="font-semibold text-red-200">{`฿${fmt(i.promo.limit)}`}</p></div>
                  <div className="rounded-[10px] bg-white/10 px-3 py-2"><p className="text-white/60">{t("ยอดโอนจริง")}</p><p className="font-semibold text-[var(--brand)]">{`฿${fmt(forced)}`}</p></div>
                  <div className="rounded-[10px] bg-white/10 px-3 py-2"><p className="text-white/60">{t("ยอดที่ขาดอีก")}</p><p className="font-semibold text-amber-200">{`฿${fmt(shortfall)}`}</p></div>
                </div>
                <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("เพียงให้ยอดเครดิตที่มีมากกว่ายอดเทิร์น ก็จะสามารถแจ้งถอนได้ · มีโปรโมชันที่รับอยู่: ระบบบังคับถอนเต็มจำนวน ไม่สามารถระบุยอดถอนเองได้")}</p>
              </Box>
            )}

            <Box className="grid gap-3">
              <label htmlFor="wd-amount" className="text-[length:calc(15px*var(--fs))] font-medium">{t("ระบุจำนวนเงินที่ต้องการถอน")}</label>
              <div className="flex flex-wrap gap-2">
                {[i.min, i.min * 3, i.min * 5].map((q) => (
                  <button key={q} type="button" disabled={promoActive} onClick={() => setAmount(String(q))}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[length:calc(13px*var(--fs))] hover:bg-white/20 disabled:opacity-40">{q.toLocaleString("th-TH")}</button>
                ))}
                <button type="button" disabled={promoActive} onClick={() => setAmount(String(Math.floor(Math.min(i.balance, i.max, i.remainToday) * 100) / 100))}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[length:calc(13px*var(--fs))] hover:bg-white/20 disabled:opacity-40">{t("ทั้งหมด")}</button>
              </div>
              <Input id="wd-amount" inputMode="decimal" autoComplete="off" placeholder={t("กรอกจำนวนเงิน (ขั้นต่ำ {v} บาท)", { v: i.min.toLocaleString("th-TH") })}
                value={promoActive ? (forced > 0 ? String(forced) : "") : amount} disabled={promoActive}
                onChange={(e) => { setAmount(cleanAmount(e.target.value)); setError(""); }}
                aria-invalid={!!amountError} className={`h-12 rounded-[30px] bg-white/10 px-4 text-[length:calc(18px*var(--fs))] ${amountError ? "border-red-400" : ""}`} />
              {amountError && <p role="alert" className="px-2 text-[length:calc(13px*var(--fs))] text-red-300">{amountError}</p>}
              {error && <p role="alert" className="rounded-[10px] bg-red-500/25 px-4 py-2 text-center text-[length:calc(14px*var(--fs))] text-red-100">{error}</p>}
              <Button onClick={() => setConfirm(true)} disabled={!valid || busy} className="brand-gradient h-12 rounded-[30px] text-[length:calc(16px*var(--fs))] font-medium disabled:opacity-50">
                {!i.bank ? t("กรุณาผูกบัญชีธนาคารก่อน") : !i.canWithdraw ? t("ระบบถอนปิดชั่วคราว") : busy ? t("กำลังดำเนินการ...") : t("ยืนยันถอน ฿{v}", { v: fmt(effective) })}
              </Button>
            </Box>

            <Box className="grid gap-1.5 text-[length:calc(13px*var(--fs))]">
              <p className="font-medium text-[var(--brand)]">{t("⚠️ หมายเหตุสำคัญ")}</p>
              <p>{t("• ถอนขั้นต่ำ ครั้งละ {v} บาท", { v: fmt(i.min) })}</p>
              <p>{t("• ถอนสูงสุดต่อครั้ง {v} บาท", { v: fmt(i.max) })}</p>
              <p>{t("• ถอนได้สูงสุด / วัน : {v} · วันนี้ถอนไปแล้ว : {v1}", { v: fmt(i.maxDay), v1: fmt(i.sumToday) })}</p>
              {i.limitAmount > 0 && <p>{t("• ยอดถอนที่ต้องทำยอด {v} บาท", { v: fmt(i.limitAmount) })}</p>}
              <p>{t("• หากทำรายการถอนไปแล้ว โปรดรออีก {COOLDOWN_MIN} นาทีถึงทำรายการถอนได้อีกครั้ง", { COOLDOWN_MIN })}</p>
            </Box>
          </div>
        )}
      </section>

      <Dialog open={confirm} onOpenChange={(o) => { if (!busy) setConfirm(o); }}>
        <DialogContent className="rounded-[15px] border-[var(--brand)] bg-[var(--surface-2)] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{t("ยืนยันการถอนเงิน")}</DialogTitle>
            <DialogDescription className="text-[length:calc(14px*var(--fs))] text-white/70">{t("กรุณาตรวจสอบข้อมูลก่อนยืนยัน การถอนแล้วไม่สามารถยกเลิกได้")}</DialogDescription>
          </DialogHeader>
          {i && (
            <div className="grid gap-2 rounded-[12px] bg-black/30 p-3">
              <Row k={t("จำนวนเงิน")} v={`฿${fmt(effective)}`} strong />
              {i.bank && <Row k={t("โอนเข้าบัญชี")} v={i.bank.name || t("บัญชีธนาคาร")} />}
              {i.bank && <Row k={t("เลขบัญชี")} v={maskAcc(i.bank.accNo)} />}
              <Row k={t("ชื่อบัญชี")} v={i.name} />
            </div>
          )}
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(false)} className="h-10 rounded-[30px] border-white/30 bg-transparent px-5 text-white">{t("ยกเลิก")}</Button>
            <Button onClick={submit} disabled={busy} className="brand-gradient h-10 rounded-[30px] px-6 font-medium">{busy ? t("กำลังดำเนินการ...") : t("ยืนยัน")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
