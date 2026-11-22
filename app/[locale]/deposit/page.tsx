"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import { HelpStrip } from "@/components/contact-fab";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSite } from "@/components/providers";
import { ContactLink } from "@/components/contact-link";
import { useT } from "@/components/i18n-provider";

type Channel = "bank" | "payment" | "tw" | "slip";
type Account = { code: number; accNo: string; accName: string; bankName: string; bankPic: string; qrPic: string; depositMin: number; remark: string };
type Provider = { id: string; name: string; minDeposit: number; remark: string };
type Qr = { requestId: string; txid: string; amount: number; payAmount: number; image: string; expiredAt: string };
type Load = "loading" | "ready" | "error";

const CHANNEL_INFO: Record<Channel, { title: string; desc: string; icon: string }> = {
  bank: { title: "ธนาคาร", desc: "โอนผ่านบัญชีธนาคาร", icon: "🏦" },
  payment: { title: "Payment", desc: "ชำระผ่าน QR", icon: "📱" },
  tw: { title: "TrueWallet", desc: "โอนผ่านทรูวอลเล็ต", icon: "👛" },
  slip: { title: "สลิป", desc: "อัปโหลดสลิป", icon: "🧾" },
};

const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const QUICK = [100, 300, 500, 1000, 2000, 5000];

function formatAcc(acc: string, phone = false) {
  const d = acc.replace(/\D/g, "");
  if (phone && d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return d.length === 10 || d.length === 12 ? `${d.slice(0, 3)}-${d.slice(3, 4)}-${d.slice(4, 9)}-${d.slice(9)}` : acc;
}
const cleanAmount = (v: string) => {
  const s = v.replace(/[^\d.]/g, "");
  const [i, ...rest] = s.split(".");
  return rest.length ? `${i}.${rest.join("").slice(0, 2)}` : i;
};
function parseExpiry(raw: string): number | null {
  const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}
const clock = (sec: number) => {
  const s = Math.max(0, sec), p = (n: number) => String(n).padStart(2, "0");
  return s >= 3600 ? `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}` : `${p(Math.floor(s / 60))}:${p(s % 60)}`;
};

async function post<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T & { message?: string } }> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok && data.success !== false, data };
}

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-white ${className}`}>{children}</div>;
}
function Msg({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p role="status" className={`rounded-[10px] px-4 py-2 text-center text-[length:calc(14px*var(--fs))] ${ok ? "bg-emerald-500/25 text-emerald-100" : "bg-red-500/25 text-red-100"}`}>{children}</p>
  );
}
function Retry({ text, onRetry }: { text: string; onRetry: () => void }) {
  const t = useT();
  return (
    <Box className="grid justify-items-center gap-3 py-8 text-center">
      <p className="text-[length:calc(15px*var(--fs))]">{text}</p>
      <Button onClick={onRetry} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
    </Box>
  );
}

/* ---------- bank / TrueWallet / slip: show the account to transfer to ---------- */
function AccountPanel({ method, onBalance }: { method: "bank" | "tw" | "slip"; onBalance: () => void }) {
  const t = useT();
  const [load, setLoad] = React.useState<Load>("loading");
  const [error, setError] = React.useState("");
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [sel, setSel] = React.useState<Account | null>(null);
  const [note, setNote] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const fetchAccounts = React.useCallback(async () => {
    setLoad("loading");
    try {
      const { ok, data } = await post<{ accounts: Account[]; note?: string }>("/api/deposit/accounts/", { method });
      if (!ok || !data.accounts?.length) { setError(data.message ? t(data.message) : t("ไม่สามารถโหลดข้อมูลบัญชีได้")); return setLoad("error"); }
      setAccounts(data.accounts);
      setNote(data.note ?? "");
      setSel(data.accounts[0]);
      setLoad("ready");
    } catch {
      setError(t("ไม่สามารถเชื่อมต่อระบบได้"));
      setLoad("error");
    }
  }, [method]);
  React.useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text.replace(/\D/g, "") || text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }

  // slip upload
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);

  function pick(f: File | undefined) {
    setResult(null);
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) return setResult({ ok: false, text: t("รองรับเฉพาะไฟล์ JPG หรือ PNG") });
    if (f.size > 5 * 1024 * 1024) return setResult({ ok: false, text: t("ขนาดไฟล์ต้องไม่เกิน 5MB") });
    setFile(f);
    const rd = new FileReader();
    rd.onload = () => setPreview(typeof rd.result === "string" ? rd.result : null);
    rd.readAsDataURL(f);
  }
  async function submitSlip() {
    const n = Number(amount);
    if (!file) return setResult({ ok: false, text: t("กรุณาอัปโหลดสลิป") });
    if (!Number.isFinite(n) || n <= 0) return setResult({ ok: false, text: t("กรุณากรอกจำนวนเงิน") });
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("slip", file);
      fd.append("amount", String(n));
      if (sel) fd.append("bank_code", String(sel.code));
      const r = await fetch("/api/deposit/slip/", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      const ok = r.ok && j.success;
      setResult({ ok, text: (j.message ? t(j.message) : "") || (ok ? t("ส่งสลิปสำเร็จ รอระบบตรวจสอบ") : t("ไม่สามารถส่งสลิปได้")) });
      toast.fromApi(Boolean(ok), j.message, t("ส่งสลิปสำเร็จ รอระบบตรวจสอบ"), t("ไม่สามารถส่งสลิปได้"));
      if (ok) { setFile(null); setPreview(null); setAmount(""); onBalance(); }
    } catch {
      setResult({ ok: false, text: t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่") });
    } finally {
      setBusy(false);
    }
  }

  if (load === "loading") return <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลด")}><div className="skeleton h-12 rounded-[30px]" /><div className="skeleton h-[72px] rounded-[15px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 w-2/3 rounded-[30px] justify-self-center" /></div>;
  if (load === "error") return <Retry text={error} onRetry={fetchAccounts} />;

  return (
    <div className="grid gap-4">
      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-2" role="listbox" aria-label={t("เลือกบัญชี")}>
          {accounts.map((a) => (
            <button key={a.code} role="option" aria-selected={sel?.code === a.code} onClick={() => setSel(a)}
              className={`flex items-center gap-2 rounded-[30px] border px-3 py-1.5 text-[length:calc(13px*var(--fs))] ${sel?.code === a.code ? "border-[var(--brand)] bg-[var(--brand)]/25" : "border-white/20 bg-white/10"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {a.bankPic && <img src={a.bankPic} alt="" className="size-6 rounded-full bg-white object-contain p-0.5" />}
              {a.bankName}
            </button>
          ))}
        </div>
      )}
      {sel && (
        <Box className="grid gap-3">
          <p className="text-[length:calc(13px*var(--fs))] text-white/70">{method === "tw" ? t("โอนมาที่หมายเลขนี้") : t("โอนเงินมาที่บัญชีนี้")}</p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {sel.bankPic && <img src={sel.bankPic} alt={sel.bankName} className="size-12 shrink-0 rounded-full bg-white object-contain p-1" />}
            <div className="min-w-0">
              <p className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{sel.bankName}</p>
              <p className="truncate text-[length:calc(14px*var(--fs))] text-white/80">{sel.accName}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-black/30 px-4 py-3">
            <div>
              <p className="text-[length:calc(12px*var(--fs))] text-white/60">{method === "tw" ? t("หมายเลข") : t("เลขบัญชี")}</p>
              <p className="text-[length:calc(20px*var(--fs))] font-semibold tracking-wide">{formatAcc(sel.accNo, method === "tw")}</p>
            </div>
            <Button onClick={() => copy(sel.accNo)} aria-label={t("คัดลอกเลขบัญชี")} className="brand-gradient h-9 shrink-0 rounded-[30px] px-4 text-[length:calc(13px*var(--fs))] font-medium">
              {copied ? t("คัดลอกแล้ว ✓") : t("คัดลอก")}
            </Button>
          </div>
          {sel.depositMin > 0 && <p className="text-[length:calc(13px*var(--fs))] text-white/70">{t("ฝากขั้นต่ำ ฿{v}", { v: fmt(sel.depositMin) })}</p>}
          {sel.remark && <p className="text-[length:calc(13px*var(--fs))] text-amber-200">{sel.remark}</p>}
          {note && <p className="text-[length:calc(13px*var(--fs))] text-amber-200">{note}</p>}
          {sel.qrPic && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sel.qrPic} alt={t("QR Code รับเงิน")} className="mx-auto w-full max-w-[220px] rounded-[12px] bg-white p-2" />
          )}
        </Box>
      )}

      {method === "slip" && (
        <Box className="grid gap-3">
          <h2 className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{t("อัปโหลดสลิปโอนเงิน")}</h2>
          <div className="grid gap-1.5">
            <Label htmlFor="slip-amount">{t("จำนวนเงินที่โอน")}</Label>
            <Input id="slip-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(cleanAmount(e.target.value))} className="h-11 rounded-[30px] bg-white/10 px-4" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="slip-file">{t("รูปสลิป")}</Label>
            {preview ? (
              <div className="relative mx-auto w-full max-w-[240px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={t("สลิปที่อัปโหลด")} className="w-full rounded-[12px] bg-black/30 object-contain" />
                <button type="button" aria-label={t("ลบรูปสลิป")} onClick={() => { setFile(null); setPreview(null); }} className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-black/70 text-white">✕</button>
              </div>
            ) : (
              <label htmlFor="slip-file" className="grid cursor-pointer justify-items-center gap-1 rounded-[12px] border border-dashed border-white/40 bg-white/5 px-4 py-6 text-center">
                <span className="text-[28px]">📷</span>
                <span className="text-[length:calc(14px*var(--fs))]">{t("แตะเพื่ออัปโหลดสลิป")}</span>
                <span className="text-[length:calc(12px*var(--fs))] text-white/60">{t("รองรับ JPG, PNG ขนาดไม่เกิน 5MB")}</span>
              </label>
            )}
            <input id="slip-file" type="file" accept="image/jpeg,image/png" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {result && <Msg ok={result.ok}>{result.text}</Msg>}
          <Button onClick={submitSlip} disabled={busy} className="brand-gradient h-11 rounded-[30px] text-[length:calc(16px*var(--fs))] font-medium">{busy ? t("กำลังส่งสลิป...") : t("ยืนยันการฝากเงิน")}</Button>
        </Box>
      )}
    </div>
  );
}

/* ---------- payment gateway: create a QR deposit, then watch its status ---------- */
function PaymentPanel({ onPaid }: { onPaid: () => void }) {
  const t = useT();
  const [load, setLoad] = React.useState<Load>("loading");
  const [error, setError] = React.useState("");
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [prov, setProv] = React.useState<Provider | null>(null);
  const [amount, setAmount] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createErr, setCreateErr] = React.useState("");
  const [qr, setQr] = React.useState<Qr | null>(null);
  const [outcome, setOutcome] = React.useState<"paid" | "expired" | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [redirected, setRedirected] = React.useState(false);

  const fetchProviders = React.useCallback(async () => {
    setLoad("loading");
    try {
      const { ok, data } = await post<{ providers: Provider[] }>("/api/deposit/providers/", {});
      if (!ok || !data.providers?.length) { setError(data.message ? t(data.message) : t("ไม่สามารถโหลดข้อมูลช่องทาง Payment ได้")); return setLoad("error"); }
      setProviders(data.providers);
      setProv(data.providers[0]);
      setLoad("ready");
    } catch {
      setError(t("ไม่สามารถเชื่อมต่อระบบได้"));
      setLoad("error");
    }
  }, []);
  React.useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const reset = () => { setQr(null); setOutcome(null); setAmount(""); setCreateErr(""); setRedirected(false); };

  async function create() {
    if (!prov) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setCreateErr(t("กรุณากรอกจำนวนเงิน"));
    if (prov.minDeposit > 0 && n < prov.minDeposit) return setCreateErr(t("ยอดฝากขั้นต่ำ ฿{v}", { v: fmt(prov.minDeposit) }));
    setCreating(true);
    setCreateErr("");
    try {
      const { ok, data } = await post<{ kind?: string; qr?: Qr; url?: string; target?: string }>("/api/deposit/payment/create/", { provider: prov.id, amount: n });
      if (!ok) return setCreateErr(data.message ? t(data.message) : t("ไม่สามารถสร้างรายการฝากเงินได้"));
      if (data.kind === "redirect" && data.url) {
        window.open(data.url, data.target === "_blank" ? "_blank" : "_self", "noopener");
        return setRedirected(true);
      }
      if (data.qr) { setQr(data.qr); setOutcome(null); setNow(Date.now()); } else setCreateErr(t("ไม่พบข้อมูล QR จากระบบ"));
    } catch {
      setCreateErr(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setCreating(false);
    }
  }

  const expiry = qr ? parseExpiry(qr.expiredAt) : null;
  const left = expiry ? Math.max(0, Math.floor((expiry - now) / 1000)) : null;

  // countdown tick
  React.useEffect(() => {
    if (!qr || outcome) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [qr, outcome]);

  // QR ran out: tell the backend once, then show the expired state
  const expiredSent = React.useRef<string>("");
  React.useEffect(() => {
    if (!qr || outcome || left === null || left > 0 || !prov) return;
    if (qr.txid && expiredSent.current !== qr.txid) {
      expiredSent.current = qr.txid;
      post("/api/deposit/payment/expire/", { provider: prov.id, txid: qr.txid }).catch(() => {});
    }
    setOutcome("expired");
  }, [qr, outcome, left, prov]);

  // poll the status while the QR is open
  React.useEffect(() => {
    if (!qr?.txid || outcome || !prov) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stop) return;
      try {
        const r = await fetch(`/api/deposit/payment/status/?provider=${encodeURIComponent(prov.id)}&txid=${encodeURIComponent(qr.txid)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (stop) return;
        if (j.state === "paid") { setOutcome("paid"); onPaid(); return; }
        if (j.state === "expired") { setOutcome("expired"); return; }
      } catch { /* try again */ }
      timer = setTimeout(tick, 10000 + Math.floor(Math.random() * 5000));
    };
    timer = setTimeout(tick, 8000);
    return () => { stop = true; clearTimeout(timer); };
  }, [qr?.txid, outcome, prov, onPaid]);

  if (load === "loading") return <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลด")}><div className="skeleton h-12 rounded-[30px]" /><div className="skeleton h-[72px] rounded-[15px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 rounded-[12px]" /><div className="skeleton h-12 w-2/3 rounded-[30px] justify-self-center" /></div>;
  if (load === "error") return <Retry text={error} onRetry={fetchProviders} />;

  if (outcome === "paid")
    return (
      <Box className="grid justify-items-center gap-3 py-8 text-center">
        <span className="text-[56px]">✅</span>
        <p className="text-[length:calc(20px*var(--fs))] font-medium text-emerald-200">{t("ฝากเงินสำเร็จ")}</p>
        <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ยอดเงินจะอัปเดตในกระเป๋าของคุณ")}</p>
        <Button onClick={reset} className="brand-gradient h-10 rounded-[30px] px-6 font-medium">{t("ฝากเงินอีกครั้ง")}</Button>
      </Box>
    );
  if (outcome === "expired")
    return (
      <Box className="grid justify-items-center gap-3 py-8 text-center">
        <span className="text-[56px]">⌛</span>
        <p className="text-[length:calc(20px*var(--fs))] font-medium text-red-200">{t("รายการหมดอายุ")}</p>
        <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("หากโอนเงินไปแล้ว ระบบจะตรวจสอบและเติมให้ภายหลัง หรือ")}<ContactLink /></p>
        <Button onClick={reset} className="brand-gradient h-10 rounded-[30px] px-6 font-medium">{t("สร้างรายการใหม่")}</Button>
      </Box>
    );

  if (qr)
    return (
      <Box className="grid justify-items-center gap-3 text-center">
        <h2 className="text-[length:calc(18px*var(--fs))] font-medium text-[var(--brand)]">{t("สแกน QR เพื่อชำระเงิน")}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr.image} alt={t("QR Code สำหรับชำระเงิน")} className="w-full max-w-[260px] rounded-[12px] bg-white p-2" />
        <p className="text-[length:calc(14px*var(--fs))] text-white/80">{t("ชำระภายในเวลาที่กำหนด และรอระบบตรวจสอบอัตโนมัติ")}</p>
        <div className="grid w-full max-w-[320px] gap-1 rounded-[12px] bg-black/30 px-4 py-3 text-[length:calc(14px*var(--fs))]">
          <p className="flex justify-between"><span className="text-white/60">{t("จำนวน")}</span><b>{`฿${fmt(qr.amount)}`}</b></p>
          {qr.payAmount > 0 && qr.payAmount !== qr.amount && (
            <p className="flex justify-between text-amber-200"><span>{t("ยอดที่ต้องโอนจริง")}</span><b>{`฿${fmt(qr.payAmount)}`}</b></p>
          )}
          <p className="flex justify-between"><span className="text-white/60">{t("หมดเวลาใน")}</span><b className={left !== null && left < 60 ? "text-red-300" : ""}>{left === null ? "-" : clock(left)}</b></p>
        </div>
        <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("กรุณาโอนตามยอดที่แสดงให้ตรงทุกหลัก")}</p>
        <Button variant="outline" onClick={reset} className="h-10 rounded-[30px] border-white/30 bg-transparent px-5 text-white">{t("เลือกช่องทางใหม่")}</Button>
      </Box>
    );

  const quick = QUICK.filter((q) => !prov || q >= prov.minDeposit);
  return (
    <Box className="grid gap-4">
      <div className="grid gap-2">
        <Label>{t("เลือกช่องทาง Payment")}</Label>
        <div className="flex flex-wrap gap-2" role="listbox" aria-label={t("เลือกช่องทาง Payment")}>
          {providers.map((p) => (
            <button key={p.id} role="option" aria-selected={prov?.id === p.id} onClick={() => { setProv(p); setCreateErr(""); }}
              className={`rounded-[30px] border px-4 py-1.5 text-[length:calc(14px*var(--fs))] ${prov?.id === p.id ? "border-[var(--brand)] bg-[var(--brand)]/25" : "border-white/20 bg-white/10"}`}>
              {p.name}
            </button>
          ))}
        </div>
        {prov?.remark && <p className="text-[length:calc(13px*var(--fs))] text-amber-200">{prov.remark}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pay-amount">{t("จำนวนเงิน")}</Label>
        <Input id="pay-amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => { setAmount(cleanAmount(e.target.value)); setCreateErr(""); }} className="h-11 rounded-[30px] bg-white/10 px-4" />
        {prov && prov.minDeposit > 0 && <p className="px-2 text-[length:calc(12px*var(--fs))] text-white/60">{t("ยอดฝากขั้นต่ำ ฿{v}", { v: fmt(prov.minDeposit) })}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => { setAmount(String(q)); setCreateErr(""); }} className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[length:calc(13px*var(--fs))] hover:bg-white/20">{q.toLocaleString("th-TH")}</button>
          ))}
        </div>
      </div>
      {createErr && <Msg ok={false}>{createErr}</Msg>}
      {redirected && <Msg ok>{t("เปิดหน้าชำระเงินแล้ว หลังชำระ ยอดจะอัปเดตอัตโนมัติ")}</Msg>}
      <Button onClick={create} disabled={creating || !prov} className="brand-gradient h-11 rounded-[30px] text-[length:calc(16px*var(--fs))] font-medium">
        {creating ? t("กำลังสร้างเส้นทางการชำระเงิน...") : t("สร้างเส้นทางการชำระเงิน")}
      </Button>
    </Box>
  );
}

export default function DepositPage() {
  const t = useT();
  const { user, me, site, authReady, setLoginOpen, refresh } = useSite();
  const [state, setState] = React.useState<"loading" | "ready" | "login" | "error">("loading");
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const [active, setActive] = React.useState<Channel | null>(null);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/deposit/channels/", { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setChannels(j.channels);
      setActive((cur) => (cur && j.channels.includes(cur) ? cur : j.channels[0] ?? null));
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  React.useEffect(() => { if (authReady) load(); }, [authReady, user, load]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-[720px] px-[10px] py-6">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("เติมเงิน")}</h1>
        <HelpStrip />

        {state === "loading" && <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลดช่องทางฝากเงิน")}><div className="grid grid-cols-2 gap-2">{[0,1].map((i)=><div key={i} className="skeleton h-12 rounded-[30px]" />)}</div><div className="skeleton h-[200px] rounded-[15px]" /></div>}
        {state === "error" && <Retry text={t("ไม่สามารถโหลดช่องทางฝากเงินได้")} onRetry={load} />}
        {state === "login" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 py-10 text-center">
            <span className="text-[48px]">🪙</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อเติมเงิน")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </Box>
        )}

        {state === "ready" && (
          <div className="grid gap-4">
            <Box className="flex items-center justify-between">
              <span className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ยอดคงเหลือ")}</span>
              <span className="text-[length:calc(22px*var(--fs))] font-semibold text-[var(--brand)]">🪙 {fmt(me?.balance ?? 0)}</span>
            </Box>

            {channels.length === 0 ? (
              <Box className="py-8 text-center text-[length:calc(15px*var(--fs))] text-white/70">{t("ไม่มีช่องทางฝากเงินที่เปิดใช้งาน")}</Box>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label={t("เลือกวิธีฝากเงิน")}>
                  {channels.map((c) => (
                    <button key={c} role="tab" aria-selected={active === c} onClick={() => setActive(c)}
                      className={`grid justify-items-center gap-0.5 rounded-[12px] border px-2 py-3 text-center transition ${active === c ? "border-[var(--brand)] bg-[var(--brand)]/25" : "border-white/20 bg-white/10 hover:bg-white/15"}`}>
                      <span className="text-[24px] leading-none">{CHANNEL_INFO[c].icon}</span>
                      <span className="text-[length:calc(14px*var(--fs))] font-medium">{t(CHANNEL_INFO[c].title)}</span>
                      <span className="text-[length:calc(11px*var(--fs))] text-white/60">{t(CHANNEL_INFO[c].desc)}</span>
                    </button>
                  ))}
                </div>

                {active === "payment" ? <PaymentPanel key="payment" onPaid={refresh} /> : active ? <AccountPanel key={active} method={active} onBalance={refresh} /> : null}
              </>
            )}

            <Box className="grid gap-1 text-[length:calc(13px*var(--fs))] text-white/80">
              <p className="font-medium text-[var(--brand)]">{t("หมายเหตุสำคัญ")}</p>
              {site && site.depositMin > 0 && <p>{t("• ฝากขั้นต่ำ {v} บาท", { v: site.depositMin.toLocaleString("th-TH") })}</p>}
              <p>{t("• ใช้บัญชีที่ลงทะเบียนไว้ในการฝากเงินเท่านั้น")}</p>
              <p>{t("• หลังจากฝากเงินสำเร็จ รอไม่เกิน 1–3 นาที")}</p>
              <p>{t("• หากพบปัญหา")}<ContactLink /></p>
            </Box>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
