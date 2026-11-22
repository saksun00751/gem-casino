"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LanguageChips } from "@/components/language-switcher";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

const MENU = [
  { href: "/profile/", icon: "👤", label: "โปรไฟล์ / เปลี่ยนรหัสผ่าน" },
  { href: "/history/", icon: "🧾", label: "ประวัติการเงิน" },
  { href: "/referral/", icon: "👥", label: "แนะนำเพื่อน" },
  { href: "/promotions/", icon: "🎁", label: "โปรโมชัน" },
  { href: "/event/", icon: "⭐", label: "กิจกรรม แลกรางวัล" },
  { href: "/contact/", icon: "💬", label: "ติดต่อเรา" },
] as const;

const money = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatPhone = (p: string) => {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p;
};

/** Avatar button in the navbar that opens a dropdown: who is signed in, money, quick actions, member pages, logout. */
export function AccountMenu() {
  const t = useT();
  const router = useRouter();
  const { user, me, logout } = useSite();
  const [open, setOpen] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const items = () => Array.from(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);

  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    addEventListener("pointerdown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);

  // Keyboard: when the menu opens, focus its first item.
  React.useEffect(() => { if (open) items()[0]?.focus(); }, [open]);

  if (!user) return null;
  const name = me?.name || user;
  const initial = Array.from(name.replace(/^[เแโใไ]+/, ""))[0]?.toUpperCase() ?? "?";
  const go = (path: string) => { setOpen(false); router.push(path); };
  async function signOut() {
    setLeaving(true);
    await logout();
    setLeaving(false);
    setOpen(false);
    router.push("/");
  }

  return (
    <div ref={box} className="relative">
      <button ref={trigger} aria-label={t("เมนูสมาชิก")} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="brand-gradient relative grid size-10 shrink-0 place-items-center rounded-full text-[length:calc(18px*var(--fs))] font-semibold text-[var(--brand-dark)] shadow-[0_0_0_2px_#0b0b0e,0_0_0_3px_color-mix(in_srgb,var(--brand)_70%,transparent)] outline-none transition hover:scale-105 active:scale-95">
        {initial}
        {/* chevron badge: tells the user this opens a dropdown */}
        <span aria-hidden className="absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full border border-[var(--brand)] bg-[#0b0b0e] text-white">
          <svg viewBox="0 0 24 24" className={`size-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>

      {open && (
        <div role="menu" aria-label={t("บัญชีของฉัน")}
          onKeyDown={(e) => {
            const list = items(); const i = list.indexOf(document.activeElement as HTMLElement);
            if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
            else if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
            else if (e.key === "Home") { e.preventDefault(); list[0]?.focus(); }
            else if (e.key === "End") { e.preventDefault(); list.at(-1)?.focus(); }
            else if (e.key === "Tab") setOpen(false);
          }}
          className="absolute right-0 top-[calc(100%+12px)] z-50 max-h-[calc(100dvh-152px)] w-[320px] max-w-[calc(100vw-24px)] overflow-y-auto overscroll-contain rounded-[18px] md:max-h-[calc(100dvh-100px)] border-2 border-[var(--brand)] bg-[var(--surface-2)] text-white shadow-[0_16px_40px_rgba(0,0,0,0.55)]">
          {/* who */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-[var(--brand)]/30 to-transparent px-4 py-3.5">
            <div aria-hidden className="brand-gradient grid size-12 shrink-0 place-items-center rounded-full text-[length:calc(20px*var(--fs))] font-semibold text-[var(--brand-dark)]">{initial}</div>
            <div className="min-w-0">
              <p className="truncate text-[length:calc(16px*var(--fs))] font-medium">{name}</p>
              <p className="text-[length:calc(13px*var(--fs))] tabular-nums text-white/70">{formatPhone(me?.phone ?? user)}</p>
            </div>
          </div>

          {/* money / points / diamonds (live) */}
          <div className={`grid divide-x divide-white/10 border-y border-white/10 ${me && me.credit > 0 ? "grid-cols-4" : "grid-cols-3"}`}>
            {([
              ["🪙", t("ยอดคงเหลือ"), me ? money(me.balance) : null, true],
              ["⭐", t("แต้ม"), me ? me.point.toLocaleString("th-TH", { maximumFractionDigits: 2 }) : null, true],
              ["💎", t("เพชร"), me ? me.diamond.toLocaleString("th-TH") : null, true],
              ["🎫", t("เครดิต"), me ? money(me.credit) : null, !!me && me.credit > 0],
            ] as const).filter((c) => c[3]).map(([i, l, v]) => (
              <div key={l} className="px-1.5 py-2.5 text-center">
                <p className="whitespace-nowrap text-[length:calc(11px*var(--fs))] text-white/55">{i} {l}</p>
                {v === null ? <span className="skeleton mx-auto mt-1 block h-4 w-12 rounded" /> : <p className="text-[length:calc(14px*var(--fs))] font-semibold tabular-nums text-[var(--brand)]">{v}</p>}
              </div>
            ))}
          </div>

          {/* quick actions */}
          <div className="grid grid-cols-2 gap-2.5 p-3">
            <button role="menuitem" onClick={() => go("/deposit/")} className="brand-gradient h-10 rounded-[30px] text-[length:calc(14px*var(--fs))] font-medium text-[var(--brand-dark)]">{t("💰 เติมเงิน")}</button>
            <button role="menuitem" onClick={() => go("/withdraw/")} className="h-10 rounded-[30px] border border-[var(--brand)] text-[length:calc(14px*var(--fs))] font-medium hover:bg-white/10">{t("💸 ถอนเงิน")}</button>
          </div>

          {/* member pages */}
          <ul className="mx-3 overflow-hidden rounded-[12px] border border-white/10 bg-black/20">
            {MENU.map((m, i) => (
              <li key={m.href} className={i ? "border-t border-white/10" : ""}>
                <button role="menuitem" onClick={() => go(m.href)} className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5">
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-white/10 text-[16px]">{m.icon}</span>
                  <span className="min-w-0 flex-1 text-[length:calc(14px*var(--fs))]">{t(m.label)}</span>
                  <span aria-hidden className="text-white/40 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]">›</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-white/10 px-3 pt-3 md:hidden"><LanguageChips /></div>

          <div className="p-3">
            <button role="menuitem" onClick={signOut} disabled={leaving}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-[30px] border border-red-400/50 bg-red-500/10 text-[length:calc(14px*var(--fs))] font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50">
              🚪 {leaving ? t("กำลังออกจากระบบ...") : t("ออกจากระบบ")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
