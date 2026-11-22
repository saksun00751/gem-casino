"use client";
import * as React from "react";
import Link from "next/link";
import { LogoMark } from "@/components/icons";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

export const DEFAULT_SITE_NAME = "Gem Casino";

/** Site name from the backend, or the built-in brand while it is unavailable. */
export function useSiteName(): string {
  return useSite().site?.name || DEFAULT_SITE_NAME;
}

/**
 * Brand link: the backend's logo image when there is one (and it loads),
 * otherwise the built-in star mark with the site name.
 */
export function BrandLogo({ variant }: { variant: "header" | "footer" }) {
  const t = useT();
  const { site } = useSite();
  const name = site?.name || DEFAULT_SITE_NAME;
  const [broken, setBroken] = React.useState(false);
  React.useEffect(() => setBroken(false), [site?.logo]);

  if (site?.logo && !broken)
    return (
      <Link href="/" aria-label={t("{name} หน้าแรก", { name })} className="inline-flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={site.logo} alt={name} onError={() => setBroken(true)}
          className={variant === "header" ? "-my-2.5 h-[74px] w-auto max-w-[190px] object-contain md:-my-3.5 md:h-[100px] md:max-w-[240px]" : "h-24 w-auto max-w-[280px] object-contain"} />
      </Link>
    );

  return variant === "header" ? (
    <Link href="/" aria-label={t("{name} หน้าแรก", { name })} className="flex items-center gap-2 font-semibold tracking-wide text-[var(--brand-dark)]">
      <LogoMark className="size-9 drop-shadow md:size-11" />
      <span className="max-w-[170px] truncate text-[19px] md:max-w-none md:text-2xl">{site ? name : <>PLAY<span className="text-black">NOVA</span></>}</span>
    </Link>
  ) : (
    <Link href="/" className="inline-flex items-center gap-3" aria-label={t("{name} หน้าแรก", { name })}>
      <LogoMark className="size-11 drop-shadow-[0_0_14px_color-mix(in_srgb,var(--brand)_45%,transparent)]" />
      <span className="bg-gradient-to-b from-[var(--brand-2)] to-[var(--brand)] bg-clip-text text-[length:calc(26px*var(--fs))] font-semibold tracking-[0.12em] text-transparent">{site ? name : "GEM CASINO"}</span>
    </Link>
  );
}
