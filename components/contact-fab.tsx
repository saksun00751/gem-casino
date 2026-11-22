"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CHANNEL_NAME, ICON, loadContact, type Channel } from "@/components/site-footer";
import { useT } from "@/components/i18n-provider";

const isWeb = (l: string) => /^https?:/i.test(l);
const chIcon = (c: Channel) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>{ICON[c.type] ?? <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />}</svg>
);

/** Floating contact button (bottom-right, every page): opens the backend contact channels. */
export function ContactFab() {
  const t = useT();
  const path = usePathname();
  const [open, setOpen] = React.useState(false);
  const [channels, setChannels] = React.useState<Channel[]>([]);
  const box = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => { let alive = true; loadContact().then((c) => alive && setChannels(c)); return () => { alive = false; }; }, []);
  React.useEffect(() => { setOpen(false); }, [path]);
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("pointerdown", away); addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);

  if (path.startsWith("/contact")) return null;
  return (
    <div ref={box} className="fixed right-3 bottom-[calc(88px+env(safe-area-inset-bottom))] z-30 flex flex-col items-end gap-2 md:right-6 md:bottom-6">
      {open && (
        <div role="menu" aria-label={t("ช่องทางติดต่อ")} className="w-[230px] overflow-hidden rounded-[16px] border border-[var(--brand)]/50 bg-[var(--surface-2)] text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <p className="border-b border-white/10 px-4 py-2.5 text-[length:calc(13px*var(--fs))] text-white/70">{t("ติดต่อเจ้าหน้าที่ ตลอด 24 ชม.")}</p>
          {channels.map((c) => (
            <a key={c.id} role="menuitem" href={c.link} target={isWeb(c.link) ? "_blank" : undefined} rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 text-[length:calc(15px*var(--fs))] transition hover:bg-white/10">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-[var(--brand)]">{chIcon(c)}</span>
              {CHANNEL_NAME[c.type] ?? (c.label || c.type)}
            </a>
          ))}
          <Link href="/contact/" className="block border-t border-white/10 px-4 py-2.5 text-center text-[length:calc(13px*var(--fs))] text-[var(--brand)] hover:bg-white/10">{t("ดูช่องทางทั้งหมด")}</Link>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? t("ปิดช่องทางติดต่อ") : t("ติดต่อเจ้าหน้าที่")}
        className="brand-gradient grid size-14 place-items-center rounded-full text-[var(--brand-dark)] shadow-[0_6px_18px_rgba(0,0,0,0.45)] ring-2 ring-white/20 transition hover:scale-105 active:scale-95">
        {open
          ? <span aria-hidden className="text-2xl leading-none">✕</span>
          : <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 13v-1a8 8 0 0116 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" /></svg>}
      </button>
    </div>
  );
}

/** Small help line for money pages: "stuck? talk to support". */
export function HelpStrip() {
  const t = useT();
  const [channels, setChannels] = React.useState<Channel[]>([]);
  React.useEffect(() => { let alive = true; loadContact().then((c) => alive && setChannels(c)); return () => { alive = false; }; }, []);
  const first = channels[0];
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-[14px] border border-white/10 bg-white/[0.05] px-4 py-2.5">
      <p className="text-[length:calc(13px*var(--fs))] text-white/75">{t("ติดปัญหา? เจ้าหน้าที่พร้อมช่วยตลอด 24 ชม.")}</p>
      {first
        ? <a href={first.link} target={isWeb(first.link) ? "_blank" : undefined} rel="noopener noreferrer" className="shrink-0 rounded-full bg-[#06c755] px-3.5 py-1.5 text-[length:calc(13px*var(--fs))] font-medium text-white">{CHANNEL_NAME[first.type] ?? t("ติดต่อ")}</a>
        : <Link href="/contact/" className="shrink-0 rounded-full border border-[var(--brand)] px-3.5 py-1.5 text-[length:calc(13px*var(--fs))] text-[var(--brand)]">{t("ติดต่อเรา")}</Link>}
    </div>
  );
}
