"use client";
import * as React from "react";
import { SiteShell, Announce } from "@/components/site-shell";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProviderGrid } from "@/components/game-grid";
import { useCategories } from "@/lib/providers";
import { DEFAULT_CATEGORY } from "@/lib/games";
import { useT } from "@/components/i18n-provider";

export default function Home() {
  const t = useT();
  const categories = useCategories();
  const [cat, setCat] = React.useState<string | undefined>();
  React.useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("cat");
    if (c) setCat(c);
  }, []);
  // Fall back to the first open category when ?cat= is missing/unknown (old links like ?cat=hot).
  const current = categories.find((c) => c.id === cat)?.id ?? categories[0]?.id ?? DEFAULT_CATEGORY;
  const title = categories.find((c) => c.id === current)?.th;

  return (
    <SiteShell active={current} onPick={(id) => setCat(id)}
      mobileTop={<><HeroCarousel /><div className="mt-3"><Announce /></div></>}>
      <div className="hidden md:block"><Announce /></div>
      <div className="hidden md:block"><HeroCarousel /></div>
      <section className="p-0">
        <div className="mx-auto max-w-[1140px] px-[10px] pb-10 pt-4 md:px-6 md:pt-[30px]">
        <h1 className="mb-[26px] text-center text-[length:calc(14px*var(--fs))] font-normal md:text-[length:calc(16px*var(--fs))]">
          {title && current !== DEFAULT_CATEGORY ? t("หมวด{title}", { title }) : t("ผู้ให้บริการเกมครบวงจร ตื่นตาตื่นใจไปกับทุกหมวด")}
        </h1>
        <ProviderGrid cat={current} />
        </div>
      </section>
    </SiteShell>
  );
}
