"use client";
import * as React from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";

type Channel = { id: string; type: string; label: string; link: string; sort: number };
type State = "loading" | "ready" | "error";

const META: Record<string, { title: string; subtitle: string; button: string; color: string; icon: React.ReactNode }> = {
  line: {
    title: "LINE Official",
    subtitle: "ช่องทางหลักสำหรับติดต่อ",
    button: "เพิ่มเพื่อนใน LINE",
    color: "#06c755",
    icon: (
      <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M12 2C6.48 2 2 6.02 2 11c0 3.07 1.6 5.78 4.08 7.5L5 21l3.13-1.56C9.32 19.78 10.63 20 12 20c5.52 0 10-4.02 10-9S17.52 2 12 2zm1 13H7v-1.5h6V15zm2-3H7v-1.5h8V12zm0-3H7V7.5h8V9z" />
      </svg>
    ),
  },
  telegram: {
    title: "Telegram",
    subtitle: "ติดต่อผ่าน Telegram",
    button: "เปิด Telegram",
    color: "#229ed9",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.96c-.12.55-.46.68-.93.43l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.61 4.7-4.24c.2-.18-.04-.28-.32-.1L7.54 14.5l-2.52-.79c-.55-.17-.56-.55.12-.81l9.86-3.8c.46-.17.86.11.64.7z" />
      </svg>
    ),
  },
};
const DEFAULT_META = {
  subtitle: "",
  button: "เปิดลิงก์",
  color: "#8b5cff",
  icon: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" aria-hidden>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
};

function ChannelCard({ ch }: { ch: Channel }) {
  const t = useT();
  const m = META[ch.type];
  const meta = m ?? { ...DEFAULT_META, title: ch.type ? ch.type.toUpperCase() : t("ติดต่อ") };
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(ch.label); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard blocked */ }
  }
  const external = /^https?:/i.test(ch.link);
  return (
    <article className="overflow-hidden rounded-[15px] border border-[var(--brand)]/40 bg-[var(--surface-2)] text-white">
      <div className="h-2" style={{ background: meta.color }} />
      <div className="grid gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-14 shrink-0 place-items-center rounded-[16px] shadow" style={{ background: meta.color }}>{meta.icon}</div>
          <div className="min-w-0">
            <h2 className="text-[length:calc(18px*var(--fs))] font-medium">{meta.title}</h2>
            {meta.subtitle && <p className="text-[length:calc(13px*var(--fs))] text-white/70">{t(meta.subtitle)}</p>}
          </div>
        </div>
        {ch.label && (
          <div className="flex items-center justify-between gap-3 rounded-[12px] bg-black/30 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[length:calc(12px*var(--fs))] text-white/60">ID</p>
              <p className="break-all text-[length:calc(15px*var(--fs))] font-semibold">{ch.label}</p>
            </div>
            <button onClick={copy} aria-label={t("คัดลอก {title}", { title: meta.title })} className="shrink-0 rounded-[30px] bg-white/15 px-4 py-1.5 text-[length:calc(13px*var(--fs))] hover:bg-white/25">{copied ? t("คัดลอกแล้ว ✓") : t("คัดลอก")}</button>
          </div>
        )}
        <a href={ch.link} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="grid h-12 place-items-center rounded-[30px] text-[length:calc(15px*var(--fs))] font-medium text-white transition hover:brightness-110 active:scale-[0.98]" style={{ background: meta.color }}>
          {t(meta.button)}
        </a>
      </div>
    </article>
  );
}

export default function ContactPage() {
  const t = useT();
  const [state, setState] = React.useState<State>("loading");
  const [channels, setChannels] = React.useState<Channel[]>([]);

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/contact/", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.success) return setState("error");
      setChannels(j.channels);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-[560px] px-[10px] py-6">
        <h1 className="text-center text-[length:calc(24px*var(--fs))] font-normal md:text-[length:calc(28px*var(--fs))] lg:text-[length:calc(32px*var(--fs))]">{t("ติดต่อเรา")}</h1>
        <p className="mb-5 mt-1 text-center text-[length:calc(14px*var(--fs))] text-white/70">{t("เลือกช่องทางที่สะดวกสำหรับติดต่อ")}</p>

        {state === "loading" && <div className="grid gap-4" aria-busy="true" aria-label={t("กำลังโหลด")}>{[0, 1].map((i) => <div key={i} className="h-[220px] skeleton rounded-[15px]" />)}</div>}

        {state === "error" && (
          <div className="grid justify-items-center gap-3 rounded-[15px] border border-white/20 bg-[var(--surface-2)] px-6 py-10 text-center">
            <p className="text-[length:calc(16px*var(--fs))]">{t("โหลดช่องทางติดต่อไม่สำเร็จ")}</p>
            <Button onClick={load} className="brand-gradient h-10 rounded-[30px] px-6 text-[length:calc(14px*var(--fs))] font-medium">{t("ลองใหม่")}</Button>
          </div>
        )}

        {state === "ready" && channels.length === 0 && (
          <div className="grid justify-items-center gap-2 rounded-[15px] bg-[var(--surface-2)] px-6 py-12 text-center">
            <span className="text-[48px]">💬</span>
            <p className="text-[length:calc(15px*var(--fs))] text-white/70">{t("ไม่พบข้อมูลติดต่อ")}</p>
          </div>
        )}

        {state === "ready" && channels.length > 0 && <div className="grid gap-4">{channels.map((c) => <ChannelCard key={c.id} ch={c} />)}</div>}
      </section>
    </SiteShell>
  );
}
