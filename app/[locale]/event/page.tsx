"use client";
import * as React from "react";
import { toast } from "@/lib/toast";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";
import { useI18n } from "@/components/i18n-provider";

type Reward = {
  id: number;
  name: string;
  description: string;
  image: string;
  featured: boolean;
  pointCost: number;
  rewardType: string;
  creditAmount: number | null;
  gemAmount: number | null;
  status: string;
  stockUnlimited: boolean;
  stockRemaining: number;
  startAt: string | null;
  endAt: string | null;
};
type HistoryItem = {
  id: number;
  name: string;
  pointCost: number;
  rewardType: string;
  creditAmount: number | null;
  gemAmount: number | null;
  status: string;
  redeemedAt: string;
};
type Meta = { page: number; lastPage: number; total: number };
type State = "loading" | "ready" | "login" | "error";
type RewardStatus = "ready" | "inactive" | "upcoming" | "ended" | "out_stock" | "point_not_enough";

const PAGE_SIZE = 20;
const fmt = (n: number) => n.toLocaleString("th-TH");

// API times are "YYYY-MM-DD HH:mm:ss" in local (Thai) time.
const parseTime = (v: string | null) => {
  if (!v) return null;
  const d = new Date(v.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
};
const showTime = (v: string | null, tag: string) => {
  const d = parseTime(v);
  return d ? d.toLocaleString(`${tag}-u-nu-latn`, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";
};

function rewardStatus(r: Reward, point: number): RewardStatus {
  const now = new Date();
  const start = parseTime(r.startAt);
  const end = parseTime(r.endAt);
  if (r.status !== "active") return "inactive";
  if (start && now < start) return "upcoming";
  if (end && now > end) return "ended";
  if (!r.stockUnlimited && r.stockRemaining <= 0) return "out_stock";
  if (point < r.pointCost) return "point_not_enough";
  return "ready";
}
const STATUS_LABEL: Record<RewardStatus, string> = {
  ready: "แลกได้",
  inactive: "ปิดให้แลก",
  upcoming: "ยังไม่เริ่ม",
  ended: "หมดเวลา",
  out_stock: "หมดแล้ว",
  point_not_enough: "แต้มไม่พอ",
};

// What the member receives: wallet credit, diamonds, or just the item itself.
function receive(x: { creditAmount: number | null; gemAmount: number | null; rewardType: string }) {
  if (x.rewardType === "wallet_gem" && x.gemAmount != null) return `💎 ${fmt(x.gemAmount)}`;
  if (x.creditAmount != null && x.creditAmount > 0) return `฿${fmt(x.creditAmount)}`;
  if (x.gemAmount != null && x.gemAmount > 0) return `💎 ${fmt(x.gemAmount)}`;
  return "";
}

const HISTORY_STATUS: Record<string, { label: string; cls: string }> = {
  fulfilled: { label: "สำเร็จ", cls: "bg-emerald-500/25 text-emerald-100" },
  pending: { label: "รอดำเนินการ", cls: "bg-amber-500/25 text-amber-100" },
  failed: { label: "ไม่สำเร็จ", cls: "bg-red-500/25 text-red-100" },
  rejected: { label: "ไม่อนุมัติ", cls: "bg-red-500/25 text-red-100" },
  cancelled: { label: "ยกเลิก", cls: "bg-white/15 text-white/70" },
};

function Pager({ meta, onPage }: { meta: Meta; onPage: (p: number) => void }) {
  const t = useT();
  if (meta.lastPage <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-center gap-4 text-[length:calc(14px*var(--fs))]">
      <Button variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="h-9 rounded-[30px] border-[var(--brand)] bg-transparent px-4 text-white">{t("ก่อนหน้า")}</Button>
      <span className="text-white/70">{meta.page} / {meta.lastPage}</span>
      <Button variant="outline" disabled={meta.page >= meta.lastPage} onClick={() => onPage(meta.page + 1)} className="h-9 rounded-[30px] border-[var(--brand)] bg-transparent px-4 text-white">{t("ถัดไป")}</Button>
    </div>
  );
}

function RewardCard({ r, point, pending, onRedeem }: { r: Reward; point: number; pending: boolean; onRedeem: (r: Reward) => void }) {
  const { tag } = useI18n();
  const t = useT();
  const status = rewardStatus(r, point);
  const gives = receive(r);
  return (
    <article className="flex flex-col overflow-hidden rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] text-white">
      {r.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.image} alt={r.name} loading="lazy" className="aspect-[4/3] w-full bg-black/20 object-contain" />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center bg-gradient-to-br from-[var(--brand)]/40 to-black/30 text-[48px]">🎁</div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-[length:calc(16px*var(--fs))] font-medium leading-snug text-[var(--brand)]">{r.name}</h2>
          {r.featured && <span className="shrink-0 rounded-full bg-[var(--brand)] px-2 py-0.5 text-[length:calc(11px*var(--fs))] font-medium text-[var(--brand-dark)]">{t("แนะนำ")}</span>}
        </div>
        {r.description && <p className="text-[length:calc(13px*var(--fs))] leading-snug text-white/75">{r.description}</p>}
        {gives && <p className="text-[length:calc(14px*var(--fs))] text-white/90">{t("ได้รับ")} <b className="text-[var(--brand)]">{gives}</b></p>}
        {!r.stockUnlimited && <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("เหลือ {v} ชิ้น", { v: fmt(Math.max(0, r.stockRemaining)) })}</p>}
        {r.endAt && <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("ถึง {v}", { v: showTime(r.endAt, tag) })}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[length:calc(16px*var(--fs))] font-semibold">⭐ {fmt(r.pointCost)}</span>
          <Button
            onClick={() => onRedeem(r)}
            disabled={status !== "ready" || pending}
            className="brand-gradient h-9 rounded-[30px] px-4 text-[length:calc(14px*var(--fs))] font-medium disabled:opacity-50"
          >
            {pending ? t("กำลังแลก...") : status === "ready" ? t("แลกรางวัล") : t(STATUS_LABEL[status])}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function EventPage() {
  const { tag } = useI18n();
  const t = useT();
  const { user, me, authReady, setLoginOpen, refresh } = useSite();
  const [tab, setTab] = React.useState<"rewards" | "history">("rewards");

  const [state, setState] = React.useState<State>("loading");
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [point, setPoint] = React.useState(0);
  const [diamond, setDiamond] = React.useState(0);
  // Points / diamonds pushed live by the backend (realtime) replace the loaded values.
  React.useEffect(() => { if (me) { setPoint(me.point); setDiamond(me.diamond); } }, [me?.point, me?.diamond]); // eslint-disable-line react-hooks/exhaustive-deps
  const [enabled, setEnabled] = React.useState(true);
  const [meta, setMeta] = React.useState<Meta>({ page: 1, lastPage: 1, total: 0 });
  const [page, setPage] = React.useState(1);

  const [hState, setHState] = React.useState<State>("loading");
  const [items, setItems] = React.useState<HistoryItem[]>([]);
  const [hMeta, setHMeta] = React.useState<Meta>({ page: 1, lastPage: 1, total: 0 });
  const [hPage, setHPage] = React.useState(1);

  const [confirm, setConfirm] = React.useState<Reward | null>(null);
  const [redeeming, setRedeeming] = React.useState<number | null>(null);

  const loadRewards = React.useCallback(async (p: number) => {
    setState("loading");
    try {
      const r = await fetch(`/api/reward/list/?page=${p}&per_page=${PAGE_SIZE}`, { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setRewards(j.rewards);
      setPoint(j.point);
      setDiamond(j.diamond);
      setEnabled(j.enabled);
      setMeta(j.meta);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  const loadHistory = React.useCallback(async (p: number) => {
    setHState("loading");
    try {
      const r = await fetch(`/api/reward/history/?page=${p}&per_page=${PAGE_SIZE}`, { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setHState("login");
      if (!r.ok || !j.success) return setHState("error");
      setItems(j.items);
      setHMeta(j.meta);
      setHState("ready");
    } catch {
      setHState("error");
    }
  }, []);

  // /api/me runs first (page load / login); then load once, and again on sign-in/out or page change.
  React.useEffect(() => { if (authReady) loadRewards(page); }, [authReady, user, page, loadRewards]);
  React.useEffect(() => { if (authReady && tab === "history") loadHistory(hPage); }, [authReady, user, tab, hPage, loadHistory]);

  async function redeem(r: Reward) {
    setConfirm(null);
    setRedeeming(r.id);
    try {
      const res = await fetch("/api/reward/redeem/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reward_id: r.id }) });
      const j = await res.json().catch(() => ({}));
      const ok = Boolean(res.ok && j.success);
      toast.fromApi(ok, (ok && j.msg) || j.message, t("แลกรางวัลสำเร็จ"), t("แลกรางวัลไม่สำเร็จ"), { title: ok ? j.title || undefined : undefined });
      if (ok) {
        if (typeof j.point === "number") setPoint(j.point);
        await Promise.all([loadRewards(page), refresh()]);
        if (tab === "history") loadHistory(hPage);
      }
    } catch {
      toast.error(t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่"));
    } finally {
      setRedeeming(null);
    }
  }

  const tabCls = (t: string) =>
    `h-10 flex-1 rounded-[30px] text-[length:calc(15px*var(--fs))] font-medium transition ${tab === t ? "brand-gradient" : "bg-white/10 text-white hover:bg-white/15"}`;

  const loginCta = (
    <div className="mx-auto grid max-w-[420px] justify-items-center gap-3 rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-6 py-10 text-center">
      <span className="text-[48px]">🎁</span>
      <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อแลกรางวัล")}</p>
      <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
    </div>
  );
  const errorBox = (retry: () => void) => (
    <div className="mx-auto grid max-w-[420px] justify-items-center gap-3 rounded-[15px] border border-white/20 bg-[var(--surface-2)] px-6 py-10 text-center">
      <p className="text-[length:calc(16px*var(--fs))]">{t("โหลดข้อมูลไม่สำเร็จ")}</p>
      <Button onClick={retry} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
    </div>
  );
  const skeleton = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label={t("กำลังโหลด")}>
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-[240px] skeleton rounded-[15px]" />)}
    </div>
  );

  return (
    <SiteShell>
      <section className="mx-auto max-w-[1140px] px-[10px] py-6 md:px-[70px]">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("กิจกรรม · แลกรางวัล")}</h1>

        {user && state === "ready" && (
          <div className="mx-auto mb-4 grid max-w-[480px] grid-cols-2 gap-3">
            <div className="rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-3 py-2 text-center">
              <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("แต้มสะสม")}</p>
              <p className="text-[length:calc(20px*var(--fs))] font-semibold text-[var(--brand)]">⭐ {fmt(point)}</p>
            </div>
            <div className="rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-3 py-2 text-center">
              <p className="text-[length:calc(12px*var(--fs))] text-white/60">{t("เพชร")}</p>
              <p className="text-[length:calc(20px*var(--fs))] font-semibold text-[var(--brand)]">💎 {fmt(diamond)}</p>
            </div>
          </div>
        )}

        <div className="mx-auto mb-5 flex max-w-[480px] gap-2" role="tablist">
          <button role="tab" aria-selected={tab === "rewards"} onClick={() => setTab("rewards")} className={tabCls("rewards")}>{t("แลกรางวัล")}</button>
          <button role="tab" aria-selected={tab === "history"} onClick={() => setTab("history")} className={tabCls("history")}>{t("ประวัติการแลก")}</button>
        </div>

        {tab === "rewards" && (
          <>
            {state === "loading" && skeleton}
            {state === "login" && loginCta}
            {state === "error" && errorBox(() => loadRewards(page))}
            {state === "ready" && !enabled && (
              <p className="mx-auto max-w-[420px] rounded-[15px] bg-[var(--surface-2)] px-6 py-10 text-center text-[length:calc(16px*var(--fs))] text-white/70">{t("ระบบแลกรางวัลปิดให้บริการชั่วคราว")}</p>
            )}
            {state === "ready" && enabled && rewards.length === 0 && (
              <div className="mx-auto grid max-w-[420px] justify-items-center gap-2 rounded-[15px] bg-[var(--surface-2)] px-6 py-10 text-center">
                <span className="text-[48px]">🎁</span>
                <p className="text-[length:calc(16px*var(--fs))] text-white/70">{t("ยังไม่มีรางวัลให้แลก")}</p>
              </div>
            )}
            {state === "ready" && enabled && rewards.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {rewards.map((r) => <RewardCard key={r.id} r={r} point={point} pending={redeeming === r.id} onRedeem={setConfirm} />)}
                </div>
                <Pager meta={meta} onPage={setPage} />
              </>
            )}
          </>
        )}

        {tab === "history" && (
          <>
            {hState === "loading" && <div className="grid gap-2" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="h-[64px] skeleton rounded-[12px]" />)}</div>}
            {hState === "login" && loginCta}
            {hState === "error" && errorBox(() => loadHistory(hPage))}
            {hState === "ready" && items.length === 0 && (
              <p className="mx-auto max-w-[420px] rounded-[15px] bg-[var(--surface-2)] px-6 py-10 text-center text-[length:calc(16px*var(--fs))] text-white/70">{t("ยังไม่มีประวัติการแลกรางวัล")}</p>
            )}
            {hState === "ready" && items.length > 0 && (
              <>
                <ul className="mx-auto grid max-w-[720px] gap-2">
                  {items.map((h) => {
                    const st = HISTORY_STATUS[h.status] ?? { label: h.status || "-", cls: "bg-white/15 text-white/70" };
                    const got = receive(h);
                    return (
                      <li key={h.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-[var(--surface-2)] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[length:calc(15px*var(--fs))] font-medium text-white">{h.name}</p>
                          <p className="text-[length:calc(12px*var(--fs))] text-white/60">{showTime(h.redeemedAt, tag)} · ⭐ {fmt(h.pointCost)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          {got && <p className="text-[length:calc(14px*var(--fs))] font-medium text-[var(--brand)]">{got}</p>}
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[length:calc(11px*var(--fs))] ${st.cls}`}>{t(st.label)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Pager meta={hMeta} onPage={setHPage} />
              </>
            )}
          </>
        )}
      </section>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="rounded-[15px] border-[var(--brand)] bg-[var(--surface-2)] text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{t("ยืนยันการแลกรางวัล")}</DialogTitle>
            <DialogDescription className="text-[length:calc(14px*var(--fs))] text-white/80">
              {t("แลก “{name}” ด้วย ⭐ {v} แต้ม (คงเหลือ ⭐ {v1} แต้ม) การแลกแล้วไม่สามารถยกเลิกได้", { name: confirm?.name ?? "", v: confirm ? fmt(confirm.pointCost) : 0, v1: confirm ? fmt(Math.max(0, point - confirm.pointCost)) : 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirm(null)} className="h-10 rounded-[30px] border-white/30 bg-transparent px-5 text-white">{t("ยกเลิก")}</Button>
            <Button onClick={() => confirm && redeem(confirm)} className="brand-gradient h-10 rounded-[30px] px-6 font-medium">{t("ยืนยันแลก")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
