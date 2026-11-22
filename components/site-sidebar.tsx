"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategories } from "@/lib/providers";
import { useSite } from "@/components/providers";
import { CategoryIcon } from "@/components/icons";
import dynamic from "next/dynamic";
import { useT } from "@/components/i18n-provider";

// The picker (dropdown + floating-ui code) is only fetched when themes are not locked by SITE_THEME_LOCK.
const ThemeSwitcher = dynamic(() => import("@/components/theme-switcher").then((m) => m.ThemeSwitcher), { ssr: false });

export function SiteSidebar({ active, onPick }: { active?: string; onPick?: (id: string) => void }) {
  const t = useT();
  const { user, authReady, setRegisterOpen, registerEnabled, themeLocked } = useSite();
  const categories = useCategories();
  // On phones the category menu only makes sense beside the game list (home page); desktop shows it everywhere.
  const onHome = usePathname() === "/";
  return (
    <aside aria-label={t("หมวดเกม")} className={`w-[90px] shrink-0 bg-[var(--side)] sm:w-[152px] md:block md:w-[200px] ${onHome ? "" : "hidden"}`}>
      {/* Locks below the header once the page scrolls to it; the game list beside it keeps scrolling.
          Mobile: header 60px above, bottom bar 72px below. Desktop: header 75px. */}
      <div className="no-scrollbar sticky top-[60px] max-h-[calc(100dvh-132px)] overflow-y-auto px-[5px] py-[14px] md:top-[75px] md:max-h-[calc(100dvh-75px)] md:px-4">
      {authReady && !user && registerEnabled && (
        <button onClick={() => setRegisterOpen(true)}
          className="reg-btn mb-[14px] hidden h-[48px] w-full rounded-[10px] text-[length:calc(16px*var(--fs))] text-white md:block">
          {t("สมัครสมาชิก")}
        </button>
      )}
      <ul className="grid gap-[14px]">
        {categories.map((c) => {
          const isActive = active === c.id;
          const inner = (
            <>
              <CategoryIcon id={c.icon} className="size-[34px] shrink-0 drop-shadow md:size-[46px]" />
              <span className="flex flex-col leading-tight">
                <span className="hidden text-[length:calc(14px*var(--fs))] font-medium md:block">{c.en}</span>
                <span className="text-[length:calc(11px*var(--fs))] font-medium md:hidden">{t(c.short)}</span>
                <span className={`hidden font-medium leading-tight md:block ${c.th.length > 12 ? "text-[length:calc(12px*var(--fs))]" : "text-[length:calc(14px*var(--fs))]"}`}>
                  {/* keep each word whole; a long label may only wrap at the "/" separators */}
                  {c.th.split(" / ").map((w, i) => (
                    <React.Fragment key={w}>{i > 0 && " / "}<span className="whitespace-nowrap">{t(w)}</span></React.Fragment>
                  ))}
                </span>
              </span>
            </>
          );
          const cls = "side-tile flex h-[78px] w-full flex-col items-center justify-center gap-1 rounded-[10px] px-1 text-white md:flex-row md:justify-start md:gap-3 md:px-3 md:text-left";
          return (
            <li key={c.id}>
              {onPick ? (
                <button data-active={isActive} className={cls} onClick={() => onPick(c.id)}>{inner}</button>
              ) : (
                <Link data-active={isActive} className={cls} href={`/?cat=${c.id}`}>{inner}</Link>
              )}
            </li>
          );
        })}
      </ul>
      {!themeLocked && <div className="mt-4 flex justify-center pb-2"><ThemeSwitcher /></div>}
      </div>
    </aside>
  );
}
