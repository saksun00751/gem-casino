"use client";
import * as React from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";
import { useI18n } from "@/components/i18n-provider";

type Row = { id: number; title: string; detail: string; credit: boolean; amount: number; balanceAfter: number; date: string; status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" };
type Summary = { count: number; credit: number; debit: number; net: number };
type Pagination = { page: number; limit: number; total: number; hasMore: boolean };
type State = "loading" | "ready" | "login" | "error";

const TABS = [
  { id: "all", label: "ทั้งหมด", icon: "📋" },
  { id: "deposit", label: "ฝาก", icon: "💰" },
  { id: "withdraw", label: "ถอน", icon: "💸" },
  { id: "bonus", label: "โบนัส", icon: "🎁" },
  { id: "game", label: "เกม", icon: "🎮" },
  { id: "cashback", label: "คืนยอดเสีย", icon: "♻️" },
  { id: "referral", label: "ค่าแนะนำ", icon: "👥" },
  { id: "ic", label: "ค่าเสียเพื่อน", icon: "🤝" },
  { id: "rollback", label: "คืนเงิน", icon: "🔄" },
  { id: "admin_adjust", label: "ปรับยอด", icon: "⚙️" },
  { id: "other", label: "อื่นๆ", icon: "🧾" },
] as const;

const STATUS = {
  SUCCESS: { label: "สำเร็จ", cls: "bg-emerald-500/25 text-emerald-100" },
  PENDING: { label: "รอดำเนินการ", cls: "bg-amber-500/25 text-amber-100" },
  FAILED: { label: "ไม่สำเร็จ", cls: "bg-red-500/25 text-red-100" },
  CANCELLED: { label: "ยกเลิก", cls: "bg-red-500/25 text-red-100" },
} as const;

const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const showDate = (v: string, tag: string) => {
  const d = new Date(v.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString(`${tag}-u-nu-latn`, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function Cell({ label, value, cls = "" }: { label: string; value: string; cls?: string }) {
  return (
    <div className="text-center">
      <p className="text-[length:calc(12px*var(--fs))] text-white/60">{label}</p>
      <p className={`text-[length:calc(16px*var(--fs))] font-semibold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}

export default function HistoryPage() {
  const { tag } = useI18n();
  const t = useT();
  const { user, authReady, setLoginOpen } = useSite();
  const [tab, setTab] = React.useState<string>("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [applied, setApplied] = React.useState({ from: "", to: "" }); // dates only apply when "ค้นหา" is pressed
  const [page, setPage] = React.useState(1);

  const [state, setState] = React.useState<State>("loading");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [summary, setSummary] = React.useState<Summary>({ count: 0, credit: 0, debit: 0, net: 0 });
  const [pg, setPg] = React.useState<Pagination>({ page: 1, limit: 20, total: 0, hasMore: false });
  const dateError = from && to && from > to ? t("วันที่เริ่มต้นต้องไม่หลังวันที่สิ้นสุด") : "";

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const qs = new URLSearchParams({ type: tab, page: String(page) });
      if (applied.from) qs.set("date_start", applied.from);
      if (applied.to) qs.set("date_stop", applied.to);
      const r = await fetch(`/api/history/?${qs}`, { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setRows(j.rows);
      setSummary(j.summary);
      setPg(j.pagination);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [tab, page, applied]);
  // /api/me already ran (page load / login): wait for it, then load; reload on sign-in/out or filter change.
  React.useEffect(() => { if (authReady) load(); }, [authReady, user, load]);

  const lastPage = Math.max(1, Math.ceil(pg.total / (pg.limit || 20)), pg.hasMore ? pg.page + 1 : 1);
  const pick = (id: string) => { setTab(id); setPage(1); };
  const search = () => { if (dateError) return; setApplied({ from, to }); setPage(1); };
  const clearDates = () => { setFrom(""); setTo(""); setApplied({ from: "", to: "" }); setPage(1); };
  const tabLabel = TABS.find((t) => t.id === tab)?.label ?? "";

  const dateInput = "h-10 rounded-[30px] border border-white/25 bg-white/10 px-3 text-[length:calc(14px*var(--fs))] text-white [color-scheme:dark] outline-none focus-visible:border-[var(--brand)]";

  return (
    <SiteShell>
      <section className="mx-auto max-w-[720px] px-[10px] py-6">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("ประวัติการเงิน")}</h1>

        {state === "login" ? (
          <div className="mx-auto grid max-w-[420px] justify-items-center gap-3 rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-6 py-10 text-center">
            <span className="text-[48px]">🧾</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อดูประวัติการเงิน")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="no-scrollbar -mx-[10px] flex gap-2 overflow-x-auto px-[10px] pb-1" role="tablist" aria-label={t("ประเภทรายการ")}>
              {TABS.map((tb) => (
                <button key={tb.id} role="tab" aria-selected={tab === tb.id} onClick={() => pick(tb.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-[30px] px-4 py-2 text-[length:calc(14px*var(--fs))] font-medium transition ${tab === tb.id ? "brand-gradient" : "bg-white/10 text-white hover:bg-white/15"}`}>
                  <span aria-hidden>{tb.icon}</span>{t(tb.label)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] p-3">
              <input type="date" aria-label={t("วันที่เริ่มต้น")} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
              <span className="text-white/60">–</span>
              <input type="date" aria-label={t("วันที่สิ้นสุด")} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateInput} />
              <Button onClick={search} disabled={!!dateError} className="brand-gradient h-10 rounded-[30px] px-5 text-[length:calc(14px*var(--fs))] font-medium disabled:opacity-50">{t("ค้นหา")}</Button>
              {(applied.from || applied.to || from || to) && (
                <button onClick={clearDates} className="text-[length:calc(13px*var(--fs))] text-[var(--brand)] underline">{t("ล้างวันที่")}</button>
              )}
              {dateError && <p role="alert" className="w-full text-[length:calc(13px*var(--fs))] text-red-300">{dateError}</p>}
            </div>

            {state === "ready" && (
              <div className="grid grid-cols-2 gap-3 rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] px-4 py-3 sm:grid-cols-4">
                <Cell label={t("รายการทั้งหมด")} value={String(summary.count)} />
                <Cell label={t("รับเข้า")} value={`+${money(summary.credit)}`} cls="text-emerald-300" />
                <Cell label={t("จ่ายออก")} value={`-${money(summary.debit)}`} cls="text-red-300" />
                <Cell label={t("สุทธิ")} value={`${summary.net >= 0 ? "+" : ""}${money(summary.net)}`} cls={summary.net >= 0 ? "text-emerald-300" : "text-red-300"} />
              </div>
            )}

            {state === "loading" && <div className="grid gap-2" aria-busy="true" aria-label={t("กำลังโหลด")}>{[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[76px] skeleton rounded-[12px]" />)}</div>}

            {state === "error" && (
              <div className="grid justify-items-center gap-3 rounded-[15px] border border-white/20 bg-[var(--surface-2)] px-6 py-10 text-center">
                <p className="text-[length:calc(16px*var(--fs))]">{t("ไม่สามารถโหลดข้อมูลรายการได้")}</p>
                <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
              </div>
            )}

            {state === "ready" && rows.length === 0 && (
              <div className="grid justify-items-center gap-1 rounded-[15px] bg-[var(--surface-2)] px-6 py-12 text-center">
                <span className="text-[40px]">📭</span>
                <p className="text-[length:calc(16px*var(--fs))] font-medium">{t("ไม่มีรายการ{v}", { v: tab === "all" ? "" : tabLabel })}</p>
                <p className="text-[length:calc(13px*var(--fs))] text-white/60">{t("รายการจะแสดงเมื่อมีการทำรายการ")}</p>
              </div>
            )}

            {state === "ready" && rows.length > 0 && (
              <>
                <ul className="overflow-hidden rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)]">
                  {rows.map((r) => (
                    <li key={r.id} className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 last:border-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[length:calc(15px*var(--fs))] font-medium text-white">{r.title}</p>
                          <span className={`rounded px-1.5 py-0.5 text-[length:calc(11px*var(--fs))] ${r.credit ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>{r.credit ? t("รับเข้า") : t("จ่ายออก")}</span>
                        </div>
                        {r.detail && <p className="mt-0.5 text-[length:calc(13px*var(--fs))] leading-snug text-white/70">{r.detail}</p>}
                        <p className="mt-0.5 text-[length:calc(12px*var(--fs))] text-white/50">{showDate(r.date, tag)}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[length:calc(11px*var(--fs))] ${STATUS[r.status].cls}`}>{t(STATUS[r.status].label)}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-[length:calc(18px*var(--fs))] font-semibold tabular-nums ${r.credit ? "text-emerald-300" : "text-red-300"}`}>{r.credit ? "+" : ""}{money(r.amount)}</p>
                        {r.balanceAfter > 0 && <p className="text-[length:calc(12px*var(--fs))] tabular-nums text-white/50">{t("คงเหลือ {v}", { v: money(r.balanceAfter) })}</p>}
                      </div>
                    </li>
                  ))}
                </ul>

                {lastPage > 1 && (
                  <div className="flex items-center justify-center gap-4 text-[length:calc(14px*var(--fs))]">
                    <Button variant="outline" disabled={pg.page <= 1} onClick={() => setPage(pg.page - 1)} className="h-9 rounded-[30px] border-[var(--brand)] bg-transparent px-4 text-white">{t("ก่อนหน้า")}</Button>
                    <span className="text-white/70">{t("หน้า {page}/{lastPage}", { page: pg.page, lastPage })}</span>
                    <Button variant="outline" disabled={!pg.hasMore && pg.page >= lastPage} onClick={() => setPage(pg.page + 1)} className="h-9 rounded-[30px] border-[var(--brand)] bg-transparent px-4 text-white">{t("ถัดไป")}</Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
