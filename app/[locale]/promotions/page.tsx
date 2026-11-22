"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

type Promo = {
  code: string;
  id: string;
  name: string;
  image: string;
  bonusPercent: number;
  bonusMax: number;
  turn: number;
  minDeposit: number;
  content: string;
};
type Active = { name: string; min: number } | null;
type State = "loading" | "ready" | "login" | "error";

// Promotions that are applied automatically, so they have no "claim" button (same as lotto-seed-app).
const NO_BUTTON = new Set(["pro_cashback", "pro_ic", "pro_faststart", "pro_spin", "pro_coupon"]);

const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-[10px] bg-white/10 px-1.5 py-2 text-center">
      <p className="whitespace-nowrap text-[length:calc(15px*var(--fs))] font-semibold leading-tight text-[var(--brand)]">{value}</p>
      <p className="text-[length:calc(12px*var(--fs))] text-white/70">{label}</p>
    </div>
  );
}

function PromoCard({ p, pending, locked, onClaim }: { p: Promo; pending: boolean; locked: boolean; onClaim: (code: string) => void }) {
  const t = useT();
  const stats = [
    p.bonusPercent > 0 && { v: `${p.bonusPercent}%`, l: t("โบนัส") },
    p.bonusMax > 0 && { v: baht(p.bonusMax), l: t("สูงสุด") },
    p.turn > 0 && { v: `${p.turn}x`, l: t("เทิร์น") },
  ].filter(Boolean) as { v: string; l: string }[];

  return (
    <article className="overflow-hidden rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] text-white">
      {p.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.name} loading="lazy" className="aspect-[16/7] w-full bg-black/20 object-contain" />
      ) : (
        <div className="grid aspect-[16/7] w-full place-items-center bg-gradient-to-br from-[var(--brand)]/40 to-black/30 text-[48px]">🎁</div>
      )}
      <div className="grid gap-3 p-4">
        <h2 className="text-[length:calc(16px*var(--fs))] font-medium leading-snug text-[var(--brand)]">{p.name}</h2>
        {stats.length > 0 && (
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(84px, 1fr))" }}>
            {stats.map((s) => <Stat key={s.l} value={s.v} label={s.l} />)}
          </div>
        )}
        {p.minDeposit > 0 && (
          <p className="text-[length:calc(13px*var(--fs))] text-white/70">{t("ฝากขั้นต่ำ {v}", { v: baht(p.minDeposit) })}</p>
        )}
        {p.content && (
          <div
            className="rich-text text-[length:calc(13px*var(--fs))] leading-relaxed text-white/80 [&_a]:text-[var(--brand)] [&_a]:underline [&_img]:h-auto [&_img]:max-w-full [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-1.5"
            dangerouslySetInnerHTML={{ __html: p.content }}
          />
        )}
        {!NO_BUTTON.has(p.id) && (
          <div className="flex justify-end pt-1">
            <Button
              onClick={() => onClaim(p.code)}
              disabled={!p.code || pending || locked}
              className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium disabled:opacity-50"
            >
              {pending ? t("กำลังรับ...") : t("รับโปร")}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function PromotionsPage() {
  const t = useT();
  const { user, authReady, setLoginOpen, refresh } = useSite();
  const [state, setState] = React.useState<State>("loading");
  const [promos, setPromos] = React.useState<Promo[]>([]);
  const [active, setActive] = React.useState<Active>(null);
  const [pendingCode, setPendingCode] = React.useState<string | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/promotion/list/", { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setPromos(j.promotions);
      setActive(j.active);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // /api/me already runs on page load and at login: wait for it, then load once,
  // and reload only when the member signs in or out.
  React.useEffect(() => { if (authReady) load(); }, [load, authReady, user]);

  async function act(url: string, body: unknown, setBusy: (b: boolean) => void) {
    setBusy(true);
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      toast.fromApi(Boolean(r.ok && j.success), j.message, t("สำเร็จ"), t("ทำรายการไม่สำเร็จ"));
      if (r.ok && j.success) {
        await load();
        await refresh();
      }
    } catch {
      toast.error(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setBusy(false);
    }
  }

  const claim = (code: string) => act("/api/promotion/select/", { promotion: code }, (b) => setPendingCode(b ? code : null));
  const cancel = () => act("/api/promotion/deselect/", {}, setCancelling);

  return (
    <SiteShell>
      <section className="mx-auto max-w-[1140px] px-[10px] py-6 md:px-[70px]">
        <h1 className="mb-1 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("โปรโมชัน")}</h1>
        {state === "ready" && <p className="mb-5 text-center text-[length:calc(14px*var(--fs))] text-white/70">{t("{length} โปรโมชัน", { length: promos.length })}</p>}

        {active && (
          <div className="mx-auto mb-5 flex max-w-[640px] flex-col gap-3 rounded-[15px] border border-[var(--brand)] bg-[var(--surface-2)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("โปรโมชันที่รับอยู่")}</p>
              <p className="text-[length:calc(16px*var(--fs))] font-medium leading-snug text-[var(--brand)] sm:truncate">{active.name}</p>
              <p className="text-[length:calc(13px*var(--fs))] text-white/70">{t("ยอดขั้นต่ำ {v}", { v: baht(active.min) })}</p>
            </div>
            <Button
              onClick={cancel}
              disabled={cancelling || !!pendingCode}
              className="h-10 shrink-0 self-end rounded-[30px] border border-red-300 bg-red-500/20 px-4 text-[length:calc(14px*var(--fs))] text-red-100 hover:bg-red-500/35 disabled:opacity-50"
            >
              {cancelling ? t("กำลังยกเลิก...") : t("ยกเลิกโปร")}
            </Button>
          </div>
        )}

        {state === "loading" && (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label={t("กำลังโหลดโปรโมชัน")}>
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-[260px] skeleton rounded-[15px]" />)}
          </div>
        )}

        {state === "login" && (
          <div className="mx-auto grid max-w-[420px] justify-items-center gap-3 rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-6 py-10 text-center">
            <span className="text-[48px]">🎁</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อดูและรับโปรโมชัน")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </div>
        )}

        {state === "error" && (
          <div className="mx-auto grid max-w-[420px] justify-items-center gap-3 rounded-[15px] border border-white/20 bg-[var(--surface-2)] px-6 py-10 text-center">
            <p className="text-[length:calc(16px*var(--fs))]">{t("โหลดโปรโมชันไม่สำเร็จ")}</p>
            <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
          </div>
        )}

        {state === "ready" && promos.length === 0 && (
          <div className="mx-auto grid max-w-[420px] justify-items-center gap-2 rounded-[15px] bg-[var(--surface-2)] px-6 py-10 text-center">
            <span className="text-[48px]">🎁</span>
            <p className="text-[length:calc(16px*var(--fs))] text-white/70">{t("ยังไม่มีโปรโมชัน")}</p>
          </div>
        )}

        {state === "ready" && promos.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {promos.map((p) => (
              <PromoCard key={p.code} p={p} pending={pendingCode === p.code} locked={cancelling} onClaim={claim} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
