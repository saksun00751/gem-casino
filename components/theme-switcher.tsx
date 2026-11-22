"use client";
import { Palette } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { THEMES, useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

export function ThemeSwitcher() {
  const t = useT();
  const { theme, setTheme, themeLocked } = useSite();
  if (themeLocked) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("เลือกธีมสี")}
        className="grid size-9 place-items-center rounded-full bg-black/70 text-[var(--brand)] outline-none ring-1 ring-[var(--brand)]"
      >
        <Palette className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {THEMES.map((th) => (
          <DropdownMenuItem key={th.id} onClick={() => setTheme(th.id)} className="gap-3">
            <span className="size-4 rounded-full" style={{ background: th.swatch, boxShadow: `0 0 0 2px ${th.ring}` }} />
            <span className="flex-1">{t(th.label)}</span>
            {theme === th.id && <span className="text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
