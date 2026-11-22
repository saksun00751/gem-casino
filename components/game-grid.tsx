"use client";
import * as React from "react";
import Link from "next/link";
import { useProviders, type Provider } from "@/lib/providers";
import { useT } from "@/components/i18n-provider";

/** Portrait provider artwork card (display only). */
export function ProviderCard({ p, className = "" }: { p: Provider; className?: string }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <div className={`relative aspect-[400/580] overflow-hidden rounded-[10px] bg-gradient-to-b from-[#2b2b3a] to-[#14141c] shadow-[0_6px_14px_#0000006b] ${className}`}>
      {p.logo && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.logo} alt={p.name} loading="lazy" decoding="async" onError={() => setBroken(true)}
          className="size-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center p-3 text-center text-[length:calc(16px*var(--fs))] font-semibold">{p.name}</span>
      )}
    </div>
  );
}

export function ProviderGrid({ cat }: { cat: string }) {
  const t = useT();
  const [retry, setRetry] = React.useState(0);
  const { status, list } = useProviders(cat, retry);

  if (status === "loading")
    return (
      <ul className="grid grid-cols-2 gap-x-[10px] gap-y-4 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 xl:grid-cols-6" aria-busy="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <li key={i}>
            <div className="aspect-[400/580] skeleton rounded-[10px]" />
            <div className="mt-3 h-4 w-2/3 skeleton rounded" />
          </li>
        ))}
      </ul>
    );

  if (status === "error")
    return (
      <div className="grid justify-items-center gap-3 py-16 text-center">
        <p>{t("โหลดรายการไม่สำเร็จ")}</p>
        <button onClick={() => setRetry((n) => n + 1)} className="brand-gradient h-10 rounded-[30px] px-8">{t("ลองใหม่")}</button>
      </div>
    );

  if (list.length === 0)
    return <p className="py-16 text-center text-white/70">{t("ยังไม่มีผู้ให้บริการในหมวดนี้")}</p>;

  return (
    <ul className="grid grid-cols-2 gap-x-[10px] gap-y-4 sm:grid-cols-4 sm:gap-x-4 md:grid-cols-5 md:gap-y-5 xl:grid-cols-6">
      {list.map((p) => (
        <li key={`${p.type}-${p.id}`}>
          {/* The game list is public; signing in is only needed to actually play. */}
          <Link href={`/games/${p.type}/${p.id.toLowerCase()}/`} className="block w-full text-left transition-transform hover:-translate-y-0.5">
            <ProviderCard p={p} />
            <span className="mt-3 block text-[length:calc(13px*var(--fs))] font-medium leading-6 text-white md:text-[length:calc(16px*var(--fs))]">{p.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
