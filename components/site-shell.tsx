"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/site-header";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteFooter } from "@/components/site-footer";
import { MobileBar } from "@/components/mobile-bar";
import { toast } from "@/lib/toast";
import { OutageBanner } from "@/components/outage-banner";
import { ContactFab } from "@/components/contact-fab";
import { useSiteName } from "@/components/brand-logo";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

// Dialogs pull in the Base UI dialog + floating-ui code (~60 KB gzip): load it only once a visitor first opens one.
const LoginDialog = dynamic(() => import("@/components/login-dialog").then((m) => m.LoginDialog), { ssr: false });
const RegisterDialog = dynamic(() => import("@/components/register-dialog").then((m) => m.RegisterDialog), { ssr: false });

/** true from the first time `open` is true onwards (so a closing dialog can still animate out). */
function useEverOpened(open: boolean) {
  const [ever, setEver] = React.useState(false);
  React.useEffect(() => { if (open) setEver(true); }, [open]);
  return ever || open;
}

export function SiteShell({
  children,
  active,
  onPick,
  mobileTop,
}: {
  children: React.ReactNode;
  active?: string;
  onPick?: (id: string) => void;
  mobileTop?: React.ReactNode;
}) {
  const t = useT();
  const { loginOpen, registerOpen } = useSite();
  const showLogin = useEverOpened(loginOpen);
  const showRegister = useEverOpened(registerOpen);
  return (
    <>
      <OutageBanner />
      <SiteHeader />
      <h2 className="sr-only text-[length:calc(14px*var(--fs))] md:text-[length:calc(18px*var(--fs))] lg:text-[length:calc(20px*var(--fs))]">{t("แจ้งเตือน")}</h2>
      {mobileTop && <div className="md:hidden">{mobileTop}</div>}
      <div className="flex min-w-0 items-stretch">
        <SiteSidebar active={active} onPick={onPick} />
        <div className="min-w-0 flex-1">
          <main className="page-bg min-w-0">{children}</main>
          <div className="hidden md:block"><SiteFooter /></div>
        </div>
      </div>
      <div className="md:hidden"><SiteFooter /></div>
      <MobileBar />
      <ContactFab />
      {showLogin && <LoginDialog />}
      {showRegister && <RegisterDialog />}
    </>
  );
}

// Back-office notice for the signed-in member; the two ticker copies (mobile/desktop) share one request per user.
const noticeCache = new Map<string, Promise<string | null>>();
function loadNotice(key: string): Promise<string | null> {
  let p = noticeCache.get(key);
  if (!p) {
    p = fetch("/api/notice/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && typeof j.notice === "string" ? j.notice : null))
      .catch(() => null);
    noticeCache.set(key, p);
  }
  return p;
}

/**
 * Ticker under the header. Text priority: the member's back-office notice -> the site description from
 * /meta/site -> a built-in welcome line.
 */
export function Announce() {
  const t = useT();
  const name = useSiteName();
  const { site, user, authReady } = useSite();
  const [notice, setNotice] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!authReady) return;
    let alive = true;
    if (!user) { setNotice(null); return; }
    loadNotice(user).then((n) => {
      if (!alive) return;
      setNotice(n);
      // Show a back-office notice as a toast once per browser session (the ticker keeps repeating it).
      if (n) {
        try {
          const k = `notice-seen:${user}:${n.length}:${n.slice(0, 40)}`;
          if (!sessionStorage.getItem(k)) { sessionStorage.setItem(k, "1"); toast.info(n, { title: t("ประกาศ"), duration: 9000 }); }
        } catch { /* storage blocked: skip the toast */ }
      }
    });
    return () => { alive = false; };
  }, [authReady, user]);

  const text = notice || site?.description || t("ยินดีต้อนรับสู่ {name} รวมผู้ให้บริการเกมครบวงจร", { name });
  // keep the reading speed steady: longer text -> longer loop
  const seconds = Math.max(18, Math.round(text.length * 0.3));
  return (
    <div className="flex h-[32px] items-center gap-3 overflow-hidden rounded-b-[10px] bg-[#1c3e3b] px-4 text-[length:calc(12px*var(--fs))]">
      <span aria-hidden className="text-[length:calc(16px*var(--fs))] text-[var(--brand-2)]">📢</span>
      <div className="relative flex-1 overflow-hidden whitespace-nowrap">
        <span className="sr-only">{text}</span>
        <span aria-hidden className="inline-block animate-[marquee_18s_linear_infinite] pl-[100%] text-[var(--brand-2)]" style={{ animationDuration: `${seconds}s` }}>
          {text}
        </span>
      </div>
    </div>
  );
}
