"use client";
import * as React from "react";
import Link from "next/link";
import { LanguageDropdown } from "@/components/language-switcher";
import { AccountMenu } from "@/components/account-menu";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSite } from "@/components/providers";
import { cn } from "@/lib/utils";
import { useFlash } from "@/lib/use-flash";
import { NavIcon } from "@/components/icons";
import { BrandLogo } from "@/components/brand-logo";
import { useT } from "@/components/i18n-provider";

// Only pages that actually work. Money actions sit together at the end.
export const NAV = [
  { href: "/", label: "หน้าแรก", icon: "home" },
  { href: "/promotions/", label: "โปรโมชัน", icon: "news" },
  { href: "/event/", label: "กิจกรรม", icon: "star" },
  { href: "/deposit/", label: "เติมเงิน", icon: "deposit" },
  { href: "/withdraw/", label: "ถอนเงิน", icon: "withdraw" },
  { href: "/contact/", label: "ติดต่อ", icon: "contact" },
] as const;

export function Logo() {
  return <BrandLogo variant="header" />;
}

export function UserButton() {
  const t = useT();
  const { user, me, authReady, refresh, meUnknown, retryNow, live, setLoginOpen, setRegisterOpen, registerEnabled } = useSite();
  const flash = useFlash(me?.balance);
  const [spin, setSpin] = React.useState(false);
  // Until the first /api/me answer we don't know who is looking: show a placeholder, not the guest buttons.
  if (!authReady && !user)
    return <div aria-hidden className="flex items-center gap-2"><span className="skeleton h-[34px] w-[142px] rounded-full md:h-[46px] md:w-[167px]" /><span className="skeleton size-10 rounded-full" /></div>;
  // Backend error while checking the session: we cannot tell guest from member, so don't show guest buttons.
  if (!user && meUnknown)
    return (
      <button onClick={retryNow} className="flex h-9 items-center gap-1.5 rounded-full bg-black/75 px-3 text-[length:calc(13px*var(--fs))] font-medium text-amber-300 shadow-[inset_0_0_0_1px_#fbbf2466] md:h-[40px]">
        {t("⚠️ เชื่อมต่อไม่ได้ · ลองใหม่")}
      </button>
    );
  if (!user)
    return (
      <div className="flex items-center gap-1.5 md:gap-0">
        {/* Mobile guests: the account menu (which holds the language list) is not shown */}
        <LanguageDropdown compact className="md:hidden" />
        {/* Mobile only: the sidebar's register button is hidden below md */}
        {registerEnabled && (
        <Button onClick={() => setRegisterOpen(true)}
          className="reg-cta h-9 rounded-[30px] px-2.5 text-[13px] md:hidden">
          {t("สมัครสมาชิก")}
        </Button>
        )}
        <Button onClick={() => setLoginOpen(true)}
          className="login-pill h-9 rounded-[30px] px-2.5 text-[13px] font-medium text-white hover:brightness-125 md:h-[40px] md:w-[138px] md:px-0 md:text-[length:calc(14px*var(--fs))]">
          {t("เข้าสู่ระบบ")}
        </Button>
      </div>
    );
  return (
    <>
      <div className="flex h-[34px] items-center gap-1.5 rounded-full bg-gradient-to-b from-black/85 to-black/70 py-0.5 pl-0.5 pr-1 md:h-[46px] md:gap-2 md:py-1 md:pl-1 md:pr-1.5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_55%,transparent),0_2px_8px_rgba(0,0,0,0.35)]">
        <span title={live === "live" ? t("อัปเดตยอดเงินแบบเรียลไทม์") : live === "connecting" ? t("กำลังเชื่อมต่อ") : t("ออฟไลน์ (อัปเดตทุก 45 วินาที)")} className="relative brand-gradient grid size-[30px] shrink-0 place-items-center rounded-full md:size-[38px] shadow-[inset_0_-2px_3px_rgba(0,0,0,0.25),inset_0_2px_3px_rgba(255,255,255,0.45)]">
          <svg viewBox="0 0 24 24" className="size-[18px] md:size-[22px]" fill="none" stroke="var(--brand-dark)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8.5" /><path d="M14.8 9.2c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 3 5.6 1.4 5.6 4.2 0 1.2-1.1 2-2.9 2-1.4 0-2.5-.6-3-1.6M12 6.5v1.3M12 16.2v1.3" />
          </svg>
          <span aria-hidden className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-black", live === "live" ? "bg-emerald-400" : live === "connecting" ? "bg-amber-400" : "bg-white/40")} />
        </span>
        <span className="grid gap-[3px] pr-0.5 leading-none">
          <span className="hidden text-[length:calc(10px*var(--fs))] tracking-wide text-white/60 md:block">{t("ยอดเงินของคุณ")}</span>
          <span className={cn("rounded text-[length:calc(14px*var(--fs))] font-semibold tabular-nums transition-colors duration-500 md:text-[length:calc(16px*var(--fs))]", flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : "text-white")}>
            {me ? me.balance.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span aria-label={t("กำลังโหลดยอดเงิน")} className="skeleton block h-4 w-16 rounded" />}
          </span>
        </span>
        <button aria-label={t("รีเฟรชยอดเงิน")} disabled={spin} onClick={async () => { setSpin(true); await refresh(); setSpin(false); }}
          className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 md:size-8 text-[var(--brand-2)] transition hover:bg-white/20 active:scale-90">
          <svg viewBox="0 0 24 24" className={cn("size-[15px] md:size-[17px]", spin && "animate-spin")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v5h-5" /></svg>
        </button>
      </div>
      <AccountMenu />
    </>
  );
}

export function SiteHeader() {
  const t = useT();
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
      <nav aria-label={t("แถบด้านบน")} className="bar-gradient relative flex h-[60px] items-center justify-between gap-2 px-3 md:h-[75px] md:px-4 md:pr-[38px] lg:py-2">
        <Logo />
        <div className="flex items-center gap-2.5 md:gap-[25px]">
          <div role="menubar" aria-label={t("เมนูหลัก")} className="hidden h-[75px] items-stretch gap-[4px] md:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href}
                className={cn(
                  "nav-tab flex w-[70px] flex-col lg:w-[80px] items-center justify-end gap-1 pb-2 text-[length:calc(14px*var(--fs))] font-medium text-white"
                )}
                data-active={path === n.href}>
                <NavIcon kind={n.icon} className="size-[38px] drop-shadow" />
                {t(n.label)}
              </Link>
            ))}
          </div>
          <LanguageDropdown className="hidden md:block" />
          <UserButton />
        </div>
      </nav>
    </header>
  );
}
