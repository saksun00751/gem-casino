"use client";
import * as React from "react";
import { toastStore, dismissToast, type ToastItem, type ToastKind } from "@/lib/toast";
import { useT } from "@/components/i18n-provider";

const STYLE: Record<ToastKind, { glow: string; ring: string; icon: React.ReactNode; iconBg: string }> = {
  success: {
    glow: "from-emerald-500/25", ring: "ring-emerald-400/50", iconBg: "bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.6)]",
    icon: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  },
  error: {
    glow: "from-red-500/25", ring: "ring-red-400/50", iconBg: "bg-red-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.6)]",
    icon: <path d="M6 6l12 12M18 6L6 18" />,
  },
  warning: {
    glow: "from-amber-500/25", ring: "ring-amber-400/50", iconBg: "bg-amber-400 text-black shadow-[0_0_14px_rgba(251,191,36,0.6)]",
    icon: <path d="M12 6v7M12 17.5v.5" />,
  },
  info: {
    glow: "from-sky-500/25", ring: "ring-sky-400/50", iconBg: "bg-sky-500 text-white shadow-[0_0_14px_rgba(14,165,233,0.6)]",
    icon: <path d="M12 11v6M12 7v.5" />,
  },
};

function Toast({ t }: { t: ToastItem }) {
  const tr = useT(); // messages come from code or the API in Thai: translate when they are shown
  const [paused, setPaused] = React.useState(false);
  const remaining = React.useRef(t.duration);
  const startedAt = React.useRef(0);

  // auto-dismiss, pausing while the pointer/focus is on it
  React.useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismissToast(t.id), remaining.current);
    return () => { clearTimeout(timer); remaining.current -= Date.now() - startedAt.current; };
  }, [paused, t.id]);

  const s = STYLE[t.kind];
  return (
    <div role={t.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className={`toast-in pointer-events-auto relative flex items-center gap-3.5 overflow-hidden rounded-[18px] bg-gradient-to-r ${s.glow} to-transparent py-4 pl-4 pr-3 text-white shadow-[0_14px_40px_rgba(0,0,0,0.55)] ring-1 ${s.ring}`}
      style={{ backgroundColor: "rgba(17,21,26,0.97)" }}>
      <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-full ${s.iconBg}`}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
      </span>
      <div className="min-w-0 flex-1">
        {t.title && <p className="text-[length:calc(17px*var(--fs))] font-semibold leading-snug">{tr(t.title)}</p>}
        <p className={`break-words text-[length:calc(16px*var(--fs))] leading-snug ${t.title ? "mt-0.5 text-white/85" : "font-medium text-white"}`}>{tr(t.message)}</p>
      </div>
      <button onClick={() => dismissToast(t.id)} aria-label={tr("ปิดการแจ้งเตือน")}
        className="grid size-8 shrink-0 place-items-center self-start rounded-full text-[length:calc(16px*var(--fs))] text-white/50 transition hover:bg-white/10 hover:text-white">✕</button>
      {/* time left bar */}
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
        <span className="toast-bar block h-full bg-white/50" style={{ animationDuration: `${t.duration}ms`, animationPlayState: paused ? "paused" : "running" }} />
      </span>
    </div>
  );
}

/** Toast stack: top-right on desktop, full-width under the header on phones. Mounted once in the root layout. */
export function Toaster() {
  const items = React.useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getServerSnapshot);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-[68px] z-[60] mx-auto flex max-w-[420px] flex-col gap-3 md:inset-x-auto md:right-6 md:top-[88px] md:mx-0 md:w-[420px]">
      {items.map((t) => <Toast key={t.id} t={t} />)}
    </div>
  );
}
