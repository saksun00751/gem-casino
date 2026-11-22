"use client";
import * as React from "react";
import { LOCALES, LOCALE_INFO, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/components/i18n-provider";

/** Compact dropdown (navbar): current language + list of all five. */
export function LanguageDropdown({ className = "", align = "right", compact = false }: { className?: string; align?: "left" | "right"; compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("pointerdown", away); addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);
  const cur = LOCALE_INFO[locale];
  return (
    <div ref={box} className={`relative ${className}`}>
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={t("เลือกภาษา")}
        className={`flex h-9 items-center gap-1 rounded-full bg-black/75 ${compact ? "px-2" : "px-3"} text-[length:calc(13px*var(--fs))] font-medium text-white shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_55%,transparent)] transition hover:brightness-125 md:h-[40px]`}>
        <span aria-hidden className="text-[length:calc(16px*var(--fs))]">{cur.flag}</span>
        {!compact && <span className="hidden lg:inline">{cur.label}</span>}
        <span aria-hidden className="text-[10px] text-white/60">▾</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={t("เลือกภาษา")}
          className={`absolute top-[calc(100%+10px)] z-50 w-[170px] overflow-hidden rounded-[14px] border border-[var(--brand)]/60 bg-[var(--surface-2)] py-1 text-white shadow-[0_14px_36px_rgba(0,0,0,0.5)] ${align === "right" ? "right-0" : "left-0"}`}>
          {LOCALES.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button onClick={() => { setOpen(false); if (l !== locale) setLocale(l); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[length:calc(14px*var(--fs))] transition hover:bg-white/10">
                <span aria-hidden className="text-[length:calc(18px*var(--fs))]">{LOCALE_INFO[l].flag}</span>
                <span className="flex-1">{LOCALE_INFO[l].label}</span>
                {l === locale && <span aria-hidden className="text-[var(--brand)]">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Row of chips (footer / menus). */
export function LanguageChips({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t("เลือกภาษา")} className={`flex flex-wrap items-center gap-2 ${className}`}>
      {LOCALES.map((l: Locale) => (
        <button key={l} onClick={() => l !== locale && setLocale(l)} aria-pressed={l === locale}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[length:calc(13px*var(--fs))] font-medium transition ${l === locale ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-dark)]" : "border-white/15 bg-white/[0.04] text-white/80 hover:border-[var(--brand)]/60 hover:text-white"}`}>
          <span aria-hidden>{LOCALE_INFO[l].flag}</span>{LOCALE_INFO[l].label}
        </button>
      ))}
    </div>
  );
}
