"use client";
import * as React from "react";

import { THEMES, type ThemeId } from "@/lib/theme";
import { toast } from "@/lib/toast";
import { startRealtime, type Activity, type LiveState, type Wallet } from "@/lib/realtime";
import { useT } from "@/components/i18n-provider";
export { THEMES };
export type { ThemeId };

export type Site = { name: string; title: string; description: string; logo: string; depositMin: number };

export type Me = { phone: string; name: string; balance: number; credit: number; diamond: number; point: number; hasBank: boolean };

type Ctx = {
  theme: ThemeId;
  registerEnabled: boolean; // sign-up open (SITE_REGISTER)
  themeLocked: boolean; // theme forced by SITE_THEME_LOCK: no picker
  site: Site | null; // backend site info (name, logo ...), null if unavailable
  setTheme: (t: ThemeId) => void;
  user: string | null; // phone number of the signed-in member
  me: Me | null;
  authReady: boolean; // true once the first /api/me check has finished
  login: (u: string, p: string) => Promise<string | null>; // null = ok, else error message
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  apiDown: boolean; // backend unreachable (checked on load, then retried automatically)
  meUnknown: boolean; // could not tell whether the member is signed in (backend error)
  live: LiveState; // realtime connection (balance / points / diamonds / wallet notices)
  recovered: boolean; // backend came back after an outage: offer a page reload
  retryNow: () => void;
  dismissRecovered: () => void;
  loginOpen: boolean;
  setLoginOpen: (o: boolean) => void;
  registerOpen: boolean;
  setRegisterOpen: (o: boolean) => void;
};

const SiteContext = React.createContext<Ctx | null>(null);

export function useSite() {
  const c = React.useContext(SiteContext);
  if (!c) throw new Error("useSite outside provider");
  return c;
}

export function SiteProvider({ children, site = null, defaultTheme = "emerald", themeLocked = false, registerEnabled = true }: { children: React.ReactNode; site?: Site | null; defaultTheme?: ThemeId; themeLocked?: boolean; registerEnabled?: boolean }) {
  const t = useT();
  const [theme, setThemeState] = React.useState<ThemeId>(defaultTheme);
  const [me, setMe] = React.useState<Me | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  React.useEffect(() => {
    const t = themeLocked ? null : (localStorage.getItem("site-theme") as ThemeId | null);
    if (t && THEMES.some((x) => x.id === t)) setThemeState(t);
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("site-theme", t);
  };
  const meRef = React.useRef<Me | null>(null);
  meRef.current = me;
  const [apiDown, setApiDown] = React.useState(false);
  const [meUnknown, setMeUnknown] = React.useState(false);
  const [recovered, setRecovered] = React.useState(false);

  /** Loads the member. true = got a definite answer (signed in or signed out), false = backend/network problem. */
  const loadMe = React.useCallback(async (): Promise<boolean> => {
    try {
      const r = await fetch("/api/me/", { cache: "no-store" });
      if (!r.ok) { setMeUnknown(!meRef.current); return false; } // server error: do NOT pretend the member signed out
      const j = await r.json();
      setMe(j.success ? j : null);
      setMeUnknown(false);
      return true;
    } catch {
      setMeUnknown(!meRef.current); // network error: keep what we know
      return false;
    } finally {
      setAuthReady(true);
    }
  }, []);
  const refresh = React.useCallback(async () => { await loadMe(); }, [loadMe]);

  const checkHealth = React.useCallback(async (): Promise<boolean> => {
    try { return (await fetch("/api/health/", { cache: "no-store" })).ok; } catch { return false; }
  }, []);

  // One check on load; while the backend is down keep retrying every 15 s (and when the browser regains network).
  const downRef = React.useRef(false);
  downRef.current = apiDown;
  const recheck = React.useCallback(async () => {
    const [healthy, meOk] = await Promise.all([checkHealth(), loadMe()]);
    if (healthy && meOk) {
      if (downRef.current) { setApiDown(false); setRecovered(true); }
    } else setApiDown(true);
  }, [checkHealth, loadMe]);
  React.useEffect(() => { recheck(); }, [recheck]);
  React.useEffect(() => {
    if (!apiDown) return;
    const t = setInterval(recheck, 15000);
    const on = () => recheck();
    addEventListener("online", on);
    return () => { clearInterval(t); removeEventListener("online", on); };
  }, [apiDown, recheck]);

  // ── Realtime: balance / points / diamonds update the moment the backend says so ──
  const [live, setLive] = React.useState<LiveState>("connecting");
  const user_ = me?.phone ?? null;
  React.useEffect(() => {
    if (!user_) { setLive("connecting"); return; }
    let alive = true;
    let stop: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reconcile = () => { // coalesce bursts of events into one profile refresh
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer = null; void loadMe(); }, 500);
    };
    const patch = (w: Wallet) => {
      if (w.balance === undefined && w.credit === undefined && w.diamond === undefined && w.point === undefined) return;
      setMe((prev) => (prev ? { ...prev, ...Object.fromEntries(Object.entries(w).filter(([, v]) => v !== undefined)) } : prev));
    };
    const notify = (a: Activity) => {
      const money = a.amount ? a.amount.toLocaleString("th-TH") : "";
      switch (a.event) {
        case "wallet.deposit_approved": toast.success(a.message || (money ? t("เติมเงินสำเร็จ +{money} บาท", { money }) : t("เติมเงินสำเร็จ"))); break;
        case "wallet.withdraw_approved": toast.success(a.message || (money ? t("ถอนเงินสำเร็จ -{money} บาท", { money }) : t("ถอนเงินสำเร็จ"))); break;
        case "wallet.withdraw_rejected": toast.error(a.message || t("การถอนเงินถูกปฏิเสธ")); break;
        case "wallet.rollback_applied": toast.info(a.message || t("มีการปรับปรุงยอดเงิน")); break;
        case "wallet.admin_adjusted": toast.info(a.message || t("ยอดเงินถูกปรับโดยแอดมิน")); break;
        default: if (a.event.startsWith("wallet.") && a.message) toast.info(a.message);
      }
      window.dispatchEvent(new CustomEvent("member:activity", { detail: a })); // pages (history ...) may refresh themselves
    };
    startRealtime({ onWallet: patch, onActivity: notify, onState: (st) => alive && setLive(st), onReconcile: reconcile })
      .then((s) => { if (alive) stop = s; else s(); })
      .catch(() => alive && setLive("offline"));
    // Heartbeat ("member online") every minute while the tab is visible
    const beat = () => { if (document.visibilityState === "visible") fetch("/api/realtime/heartbeat/", { method: "POST" }).catch(() => {}); };
    beat();
    const hb = setInterval(beat, 60000);
    const vis = () => { if (document.visibilityState === "visible") reconcile(); }; // catch up after the tab was hidden
    document.addEventListener("visibilitychange", vis);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      clearInterval(hb);
      document.removeEventListener("visibilitychange", vis);
      stop?.();
    };
  }, [user_, loadMe]);

  // No websocket (blocked / backend without realtime): fall back to refreshing the profile every 45 s while the tab is visible.
  React.useEffect(() => {
    if (!user_ || live === "live") return;
    const t = setInterval(() => { if (document.visibilityState === "visible") void loadMe(); }, 45000);
    return () => clearInterval(t);
  }, [user_, live, loadMe]);

  const login = async (username: string, password: string) => {
    try {
      const r = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) return j.message ? t(j.message) : t("เข้าสู่ระบบไม่สำเร็จ");
      if (j.me?.phone) { setMe(j.me); setAuthReady(true); } else await refresh();
      toast.success(j.me?.name ? t("ยินดีต้อนรับ {name}", { name: j.me.name }) : t("เข้าสู่ระบบสำเร็จ"));
      return null;
    } catch {
      return t("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่");
    }
  };
  const logout = async () => {
    setMe(null);
    await fetch("/api/auth/logout/", { method: "POST" }).catch(() => {});
    toast.info(t("ออกจากระบบเรียบร้อยแล้ว"));
  };
  const user = me?.phone ?? null;

  return (
    <SiteContext.Provider value={{ theme, themeLocked, registerEnabled, apiDown, meUnknown, live, recovered, retryNow: () => { void recheck(); }, dismissRecovered: () => setRecovered(false), site, setTheme, user, me, authReady, login, logout, refresh, loginOpen, setLoginOpen, registerOpen, setRegisterOpen }}>
      {children}
    </SiteContext.Provider>
  );
}
