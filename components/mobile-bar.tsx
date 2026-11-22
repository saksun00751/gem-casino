"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

// Bottom bar (mobile): deposit, promotions, GAMES (raised centre button), withdraw, contact.
const side = (active: boolean) =>
  cn(
    "flex flex-1 flex-col items-center justify-end gap-0.5 pb-1.5 whitespace-nowrap text-[14px] leading-tight",
    active ? "text-[var(--brand)]" : "text-white",
  );

export function MobileBar() {
  const t = useT();
  const path = usePathname();
  const is = (href: string) => (href === "/" ? path === "/" || path.startsWith("/games/") : path === href);
  const item = (href: string, icon: string, label: string) => (
    <Link href={href} aria-current={is(href) ? "page" : undefined} className={side(is(href))}>
      <span className="text-[22px] leading-none">{icon}</span>
      {label}
    </Link>
  );
  return (
    <nav aria-label={t("เมนูมือถือ")}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] items-stretch rounded-t-[30px] border-t border-[var(--brand)]/60 bg-gradient-to-b from-[#2a2a2a] to-black px-2 shadow-[0_-4px_12px_#0008] md:hidden">
      {item("/deposit/", "💰", t("เติมเงิน"))}
      {item("/promotions/", "🎁", t("โปรโมชั่น"))}
      <Link href="/" aria-current={is("/") ? "page" : undefined}
        className="relative flex flex-1 flex-col items-center justify-end pb-1.5 text-[14px] leading-tight">
        <span className="brand-gradient absolute -top-8 grid size-[64px] place-items-center rounded-full border-[5px] border-[#1d1d1d] text-3xl shadow-[0_0_10px_#f2ab3988]">🎮</span>
        <span className={is("/") ? "text-[var(--brand)]" : "text-white"}>{t("เกม")}</span>
      </Link>
      {item("/withdraw/", "💸", t("ถอนเงิน"))}
      {item("/contact/", "💬", t("ติดต่อ"))}
    </nav>
  );
}
