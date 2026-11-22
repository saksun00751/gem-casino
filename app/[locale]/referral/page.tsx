"use client";
import * as React from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useSite } from "@/components/providers";
import { ContactLink } from "@/components/contact-link";
import { useSiteName } from "@/components/brand-logo";
import { useT } from "@/components/i18n-provider";
import { useI18n } from "@/components/i18n-provider";

type Friend = { id: string; name: string; phone: string; earned: number; joinedAt: string };
type Data = {
  code: string;
  count: number;
  income: number;
  bonusIncome: number;
  bonusCount: number;
  rule: { display: string; percent: number; price: number; lengthType: string; more: string };
  referrals: Friend[];
};
type State = "loading" | "ready" | "login" | "error";

const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const showDate = (v: string, tag: string) => {
  const d = new Date(v.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(`${tag}-u-nu-latn`, { day: "2-digit", month: "short", year: "numeric" });
};

function Box({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] p-4 text-white ${className}`}>{children}</div>;
}
function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Box className="px-3 py-3 text-center">
      <p className="text-[22px] leading-none" aria-hidden>{icon}</p>
      <p className="mt-1 text-[length:calc(12px*var(--fs))] text-white/60">{label}</p>
      <p className="text-[length:calc(18px*var(--fs))] font-semibold tabular-nums text-[var(--brand)]">{value}</p>
    </Box>
  );
}
function CopyRow({ label, value, buttonLabel, mono }: { label: string; value: string; buttonLabel: string; mono?: boolean }) {
  const t = useT();
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }
  return (
    <div className="grid gap-1.5">
      <p className="text-[length:calc(13px*var(--fs))] text-white/60">{label}</p>
      <div className="flex items-center gap-2 rounded-[12px] bg-black/30 px-3 py-2">
        <p className={`min-w-0 flex-1 ${mono ? "" : "break-all"} ${mono ? "whitespace-nowrap text-[length:calc(18px*var(--fs))] font-semibold tracking-wider text-[var(--brand)] sm:text-[length:calc(22px*var(--fs))] sm:tracking-widest" : "text-[length:calc(13px*var(--fs))] text-white/90"}`}>{value}</p>
        <Button onClick={copy} aria-label={buttonLabel} className="brand-gradient h-9 shrink-0 rounded-[30px] px-4 text-[length:calc(13px*var(--fs))] font-medium">{copied ? t("คัดลอกแล้ว ✓") : t("คัดลอก")}</Button>
      </div>
    </div>
  );
}

export default function ReferralPage() {
  const { tag } = useI18n();
  const t = useT();
  const { user, authReady, setLoginOpen } = useSite();
  const [state, setState] = React.useState<State>("loading");
  const [data, setData] = React.useState<Data | null>(null);
  const siteName = useSiteName();
  const [canShare, setCanShare] = React.useState(false);
  React.useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/referral/", { cache: "no-store" });
      const j = await r.json();
      if (j.reason === "login") return setState("login");
      if (!r.ok || !j.success) return setState("error");
      setData(j);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  // /api/me already ran (page load / login): wait for it, then load; reload on sign-in/out.
  React.useEffect(() => { if (authReady) load(); }, [authReady, user, load]);

  const link = data?.code && typeof window !== "undefined" ? `${window.location.origin}/register/?ref=${encodeURIComponent(data.code)}` : "";
  const shareText = data ? t("ชวนคุณมาเล่นกับ {siteName}! ใช้รหัส {code} รับโบนัสทันที", { siteName, code: data.code }) : "";
  const totalFriendIncome = data ? data.referrals.reduce((s, f) => s + f.earned, 0) : 0;

  return (
    <SiteShell>
      <section className="mx-auto max-w-[720px] px-[10px] py-6">
        <h1 className="mb-4 text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("แนะนำเพื่อน")}</h1>

        {state === "loading" && <div className="grid gap-3" aria-busy="true" aria-label={t("กำลังโหลด")}>{[0, 1, 2].map((i) => <div key={i} className="h-[120px] skeleton rounded-[15px]" />)}</div>}

        {state === "login" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 py-10 text-center">
            <span className="text-[48px]">👥</span>
            <p className="text-[length:calc(16px*var(--fs))]">{t("เข้าสู่ระบบเพื่อรับรหัสและลิงก์แนะนำเพื่อน")}</p>
            <Button onClick={() => setLoginOpen(true)} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(16px*var(--fs))] font-medium">{t("เข้าสู่ระบบ")}</Button>
          </Box>
        )}

        {state === "error" && (
          <Box className="mx-auto grid max-w-[420px] justify-items-center gap-3 py-8 text-center">
            <p className="text-[length:calc(15px*var(--fs))]">{t("โหลดข้อมูลไม่สำเร็จ")}</p>
            <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
          </Box>
        )}

        {state === "ready" && data && (
          <div className="grid gap-4">
            <Box className="bg-gradient-to-br from-[var(--brand)]/30 to-[var(--surface-2)] text-center">
              <p className="text-[length:calc(18px*var(--fs))] font-medium text-[var(--brand)]">{t("แนะนำเพื่อน รับยอดค่าแนะนำ จากเพื่อนที่เติมเงินมาครั้งแรก")}</p>
              {data.rule.display && <p className="mt-1 text-[length:calc(14px*var(--fs))] text-white/80">{t("ยิ่งเพื่อนมากยิ่งได้รับมาก รับส่วนแบ่ง {display}", { display: data.rule.display })}</p>}
            </Box>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon="👥" label={t("เพื่อนที่แนะนำ")} value={String(data.count)} />
              <Stat icon="💰" label={t("รายได้จากแนะนำเพื่อน")} value={money(data.income)} />
              <Stat icon="🎁" label={t("รายได้โบนัสโปร")} value={money(data.bonusIncome)} />
              <Stat icon="🔢" label={t("จำนวนครั้งโบนัสโปร")} value={String(data.bonusCount)} />
            </div>

            <Box className="grid gap-3">
              <h2 className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{t("รหัสและลิงก์แนะนำ")}</h2>
              {data.code ? (
                <>
                  <CopyRow label={t("รหัสแนะนำของคุณ")} value={data.code} buttonLabel={t("คัดลอกรหัสแนะนำ")} mono />
                  <CopyRow label={t("ลิงก์แนะนำ")} value={link} buttonLabel={t("คัดลอกลิงก์แนะนำ")} />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a href={`https://line.me/R/share?text=${encodeURIComponent(`${shareText}\n${link}`)}`} target="_blank" rel="noopener noreferrer"
                      className="grid h-10 flex-1 place-items-center rounded-[30px] bg-[#06c755] px-4 text-[length:calc(14px*var(--fs))] font-medium text-white">{t("แชร์ Line")}</a>
                    {canShare && (
                      <Button variant="outline" onClick={() => navigator.share({ title: siteName, text: shareText, url: link }).catch(() => {})}
                        className="h-10 flex-1 rounded-[30px] border-[var(--brand)] bg-transparent text-white">{t("แชร์อื่นๆ")}</Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-[length:calc(14px*var(--fs))] text-amber-200">{t("ยังไม่มีรหัสแนะนำสำหรับบัญชีนี้ กรุณาลองใหม่อีกครั้ง หรือ")}<ContactLink /></p>
              )}
            </Box>

            {data.rule.more && (
              <Box className="grid gap-2">
                <h2 className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{t("กติกาโปรโมชัน")}</h2>
                {/* Plain text from the back office: rendered as text on purpose (no HTML). */}
                <p className="whitespace-pre-line text-[length:calc(13px*var(--fs))] leading-relaxed text-white/80">{data.rule.more}</p>
              </Box>
            )}

            <Box className="grid gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[length:calc(16px*var(--fs))] font-medium text-[var(--brand)]">{t("รายการเพื่อนที่แนะนำ")}</h2>
                <span className="text-[length:calc(13px*var(--fs))] text-white/60">{t("ทั้งหมด {v} คน", { v: data.referrals.length || data.count })}</span>
              </div>
              {data.referrals.length === 0 ? (
                <div className="grid justify-items-center gap-1 py-6 text-center">
                  <span className="text-[40px]">🫂</span>
                  <p className="text-[length:calc(15px*var(--fs))] font-medium">{t("ยังไม่มีเพื่อนที่แนะนำ")}</p>
                  <p className="text-[length:calc(13px*var(--fs))] text-white/60">{t("แชร์รหัสหรือลิงก์แนะนำด้านบนให้เพื่อน เมื่อเพื่อนสมัครสำเร็จจะปรากฏที่นี่")}</p>
                </div>
              ) : (
                <>
                  <ul className="overflow-hidden rounded-[12px] bg-black/20">
                    {data.referrals.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 last:border-0">
                        <div className="min-w-0">
                          <p className="truncate text-[length:calc(14px*var(--fs))] font-medium">{f.name || f.phone || t("สมาชิก")}</p>
                          <p className="text-[length:calc(12px*var(--fs))] text-white/50">{[f.name ? f.phone : "", f.joinedAt ? t("เข้าร่วม {v}", { v: showDate(f.joinedAt, tag) }) : ""].filter(Boolean).join(" · ")}</p>
                        </div>
                        <p className="shrink-0 text-[length:calc(15px*var(--fs))] font-semibold tabular-nums text-emerald-300">+{money(f.earned)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between text-[length:calc(14px*var(--fs))]">
                    <span className="text-white/70">{t("โบนัสรวมทั้งหมด")}</span>
                    <span className="font-semibold text-[var(--brand)]">{money(totalFriendIncome)}</span>
                  </div>
                </>
              )}
            </Box>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
