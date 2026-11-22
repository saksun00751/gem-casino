"use client";
import * as React from "react";
import Link from "next/link";
import { LanguageChips } from "@/components/language-switcher";
import { FooterIcon } from "@/components/icons";
import { BrandLogo, useSiteName } from "@/components/brand-logo";
import { useCategories } from "@/lib/providers";
import { useT } from "@/components/i18n-provider";

export type Channel = { id: string; type: string; label: string; link: string };

// Contact channels from the backend; both footer copies (desktop/mobile) share one request.
let contactPromise: Promise<Channel[]> | null = null;
export function loadContact(): Promise<Channel[]> {
  if (!contactPromise) {
    contactPromise = fetch("/api/contact/")
      .then((r) => (r.ok ? r.json() : { channels: [] }))
      .then((j) => (Array.isArray(j.channels) ? (j.channels as Channel[]) : []))
      .catch(() => []);
  }
  return contactPromise;
}

export const ICON: Record<string, React.ReactNode> = {
  line: <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z" />,
  telegram: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.96c-.12.55-.46.68-.93.43l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.61 4.7-4.24c.2-.18-.04-.28-.32-.1L7.54 14.5l-2.52-.79c-.55-.17-.56-.55.12-.81l9.86-3.8c.46-.17.86.11.64.7z" />,
};
export const CHANNEL_NAME: Record<string, string> = { line: "LINE", telegram: "Telegram" };

const MENU = [
  { href: "/", label: "หน้าแรก" },
  { href: "/promotions/", label: "โปรโมชัน" },
  { href: "/event/", label: "กิจกรรมแลกรางวัล" },
];
const SERVICES = [
  { href: "/deposit/", label: "เติมเงิน" },
  { href: "/withdraw/", label: "ถอนเงิน" },
  { href: "/history/", label: "ประวัติการเงิน" },
  { href: "/referral/", label: "แนะนำเพื่อน" },
];
const SPONSORS = ["bng", "dg", "ds", "evp", "fch", "glx", "hak", "jili", "joker", "nge", "nlc", "pg", "pp", "rlx", "sa", "sexy", "tpg", "trb", "wm", "ygg"];

type Bank = { code: number; name: string; shortcode: string; image: string };
const BANKS_KEY = "footer-banks-v1";
const BANKS_TTL = 24 * 60 * 60 * 1000; // bank logos almost never change: keep them a day

function readBanks(): { list: Bank[]; fresh: boolean } | null {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    if (!raw) return null;
    const { at, list } = JSON.parse(raw) as { at: number; list: Bank[] };
    if (!Array.isArray(list) || !list.length) return null;
    return { list, fresh: Date.now() - at < BANKS_TTL };
  } catch { return null; }
}

let banksPromise: Promise<Bank[]> | null = null;
function loadBanks(): Promise<Bank[]> {
  if (!banksPromise) {
    banksPromise = fetch("/api/auth/banks/")
      .then((r) => (r.ok ? r.json() : { banks: [] }))
      .then((j) => (Array.isArray(j.banks) ? (j.banks as Bank[]) : []))
      .then((list) => {
        if (list.length) { try { localStorage.setItem(BANKS_KEY, JSON.stringify({ at: Date.now(), list })); } catch {} }
        return list;
      })
      .catch(() => []);
  }
  return banksPromise;
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-[length:calc(13px*var(--fs))] font-semibold tracking-[0.14em] text-[var(--brand)]">
      <span aria-hidden className="h-px w-5 bg-[var(--brand)]" />
      {children}
    </h2>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-[length:calc(14px*var(--fs))] text-white/65 transition-colors hover:text-white">
      <span aria-hidden className="text-[var(--brand)] opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">›</span>
      <span className="-ml-4 transition-all duration-200 group-hover:ml-0">{children}</span>
    </Link>
  );
}

export function SiteFooter() {
  const t = useT();
  const categories = useCategories();
  const siteName = useSiteName();
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  React.useEffect(() => {
    let alive = true;
    loadContact().then((c) => alive && setChannels(c));
    // Show the stored list at once; only hit the network when it is missing or older than a day.
    const cached = readBanks();
    if (cached) setBanks(cached.list);
    if (!cached || !cached.fresh) loadBanks().then((b) => alive && b.length && setBanks(b));
    return () => { alive = false; };
  }, []);

  return (
    <footer className="relative overflow-hidden bg-[#0b0b0e] text-white">
      {/* gold hairline + soft glow along the top edge */}
      <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-[var(--brand)] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent)" }} />

      <div className="relative mx-auto max-w-[1140px] px-6 pb-[110px] pt-12 md:px-8 md:pb-8 md:pt-14">
        {/* payments */}
        <div className="flex flex-col gap-3">
          <p className="text-[length:calc(13px*var(--fs))] font-semibold tracking-[0.14em] text-[var(--brand)]">{t("วิธีชำระเงิน")}</p>
          <ul className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {banks.map((b) => (
              <li key={b.code} title={b.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.image} alt={b.name} loading="lazy" className="aspect-square w-full rounded-full bg-white object-contain p-1 sm:size-12" />
              </li>
            ))}
          </ul>
        </div>

        {/* sponsors */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
            <p className="text-[length:calc(13px*var(--fs))] font-semibold tracking-[0.14em] text-[var(--brand)]">{t("สนับสนุนโดย")}</p>
            <ul className="grid grid-cols-5 gap-2 sm:max-w-[560px] sm:grid-cols-10">
              {SPONSORS.map((id) => (
                <li key={id} className="aspect-square overflow-hidden rounded-[12px] border border-[var(--brand)]/60 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/sponsors/${id}.webp`} alt={id.toUpperCase()} loading="lazy" className="block size-full rounded-[8px] object-contain" />
                </li>
              ))}
            </ul>
        </div>

        <div className="mt-6 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[1.5fr_1fr_1fr_1.1fr] md:gap-8">
          {/* brand */}
          <div className="max-w-[340px]">
            <BrandLogo variant="footer" />
            <p className="mt-4 text-[length:calc(14px*var(--fs))] leading-relaxed text-white/65">
              {t("รวมผู้ให้บริการเกมครบวงจร เลือกเล่นได้ทุกหมวด ทุกอุปกรณ์ ฝาก-ถอนสะดวกผ่านหลายช่องทาง")}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2" aria-label={t("จุดเด่น")}>
              {([["security", "ปลอดภัย"], ["fast", "รวดเร็ว"], ["support", "ดูแล 24/7"]] as const).map(([k, label]) => {
                const cls = "grid place-items-center gap-1.5 rounded-[14px] border border-white/10 bg-white/[0.04] px-2 py-3 text-center text-[length:calc(12px*var(--fs))] font-medium text-white/85 backdrop-blur transition hover:border-[var(--brand)]/60";
                const inner = <><FooterIcon kind={k} className="size-6" />{t(label)}</>;
                return k === "support"
                  ? <Link key={k} href="/contact/" aria-label={t("ติดต่อเรา")} className={cls}>{inner}</Link>
                  : <div key={k} className={cls}>{inner}</div>;
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {channels.map((c) => (
                <a key={c.id} href={c.link} target={/^https?:/i.test(c.link) ? "_blank" : undefined} rel="noopener noreferrer"
                  aria-label={t("ติดต่อทาง {v}", { v: CHANNEL_NAME[c.type] ?? c.type })}
                  className="grid size-12 place-items-center rounded-full border border-[var(--brand)] bg-[var(--brand)]/15 text-[var(--brand)] shadow-[0_0_18px_color-mix(in_srgb,var(--brand)_35%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--brand)] hover:text-[var(--brand-dark)]">
                  <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>{ICON[c.type] ?? <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}</svg>
                </a>
              ))}
              <Link href="/contact/" className="inline-flex h-12 items-center rounded-full bg-[var(--brand)] px-6 text-[length:calc(14px*var(--fs))] font-semibold text-[var(--brand-dark)] shadow-[0_0_18px_color-mix(in_srgb,var(--brand)_35%,transparent)] transition hover:-translate-y-0.5 hover:brightness-110">
                {t("ติดต่อเรา")}
              </Link>
            </div>
          </div>

          {/* menu + services side by side on mobile */}
          <nav aria-label={t("เมนูหลัก")} className="grid grid-cols-2 gap-8 md:contents">
            <div>
              <Heading>{t("เมนู")}</Heading>
              <ul className="grid gap-2.5">{MENU.map((m) => <li key={m.href}><FooterLink href={m.href}>{t(m.label)}</FooterLink></li>)}</ul>
            </div>
            <div>
              <Heading>{t("บริการสมาชิก")}</Heading>
              <ul className="grid gap-2.5">{SERVICES.map((m) => <li key={m.href}><FooterLink href={m.href}>{t(m.label)}</FooterLink></li>)}</ul>
            </div>
          </nav>

          <nav aria-label={t("หมวดเกม")}>
            <Heading>{t("หมวดเกม")}</Heading>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 md:grid-cols-1">
              {categories.map((c) => <li key={c.id}><FooterLink href={`/?cat=${c.id}`}>{t(c.short)}</FooterLink></li>)}
            </ul>
          </nav>
        </div>

        {/* language */}
        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
          <p className="text-[length:calc(13px*var(--fs))] font-semibold tracking-[0.14em] text-[var(--brand)]">{t("เลือกภาษา")}</p>
          <LanguageChips />
        </div>

        {/* bottom bar */}
        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-end">
          <div className="flex items-center justify-between gap-4 md:justify-end">
            <p className="text-[length:calc(12px*var(--fs))] text-white/55">© 2026 {siteName}. All Rights Reserved.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={t("กลับขึ้นด้านบน")}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-[length:calc(16px*var(--fs))] text-white/80 transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)]">↑</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
