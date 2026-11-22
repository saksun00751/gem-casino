"use client";
import * as React from "react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { useSlides } from "@/lib/providers";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

/** Home-page banner slider. Shows only the slides the backend returns; with none, the section is hidden. */
export function HeroCarousel() {
  const t = useT();
  const [api, setApi] = React.useState<CarouselApi>();
  const [index, setIndex] = React.useState(0);
  const { status, slides, retry } = useSlides();

  React.useEffect(() => {
    if (!api || slides.length < 2) return;
    const onSelect = () => setIndex(api.selectedScrollSnap());
    api.on("select", onSelect);
    const t = setInterval(() => api.scrollNext(), 5000);
    return () => { clearInterval(t); api.off("select", onSelect); };
  }, [api, slides.length]);

  if (status === "loading")
    return (
      <div className="px-[15px] pt-[14px] sm:px-0 md:pt-[18px]" aria-busy="true" aria-label={t("กำลังโหลดแบนเนอร์")}>
        <div className="aspect-square skeleton rounded-[14px] md:mx-auto md:aspect-[2/1] md:w-[53.5%] md:rounded-[12px]" />
      </div>
    );
  if (status === "error")
    return (
      <div className="px-[15px] pt-[14px] sm:px-0 md:pt-[18px]">
        <div role="alert" className="mx-auto flex items-center justify-between gap-3 rounded-[14px] border border-white/15 bg-white/[0.06] px-4 py-3 md:w-[53.5%]">
          <p className="text-[length:calc(13px*var(--fs))] text-white/80">{t("โหลดแบนเนอร์ไม่สำเร็จ")}</p>
          <button onClick={retry} className="brand-gradient h-9 shrink-0 rounded-[30px] px-5 text-[length:calc(13px*var(--fs))] font-medium">{t("ลองใหม่")}</button>
        </div>
      </div>
    );
  if (slides.length === 0) return null;

  return (
    <div className="px-[15px] pt-[14px] sm:px-0 md:px-0 md:pt-[18px]">
      <Carousel setApi={setApi} opts={{ loop: slides.length > 1, align: "center", startIndex: 0, containScroll: false }} className="w-full overflow-hidden">
        <CarouselContent viewportClassName="sm:!overflow-visible" className="ml-0">
          {slides.map((s, i) => (
            <CarouselItem key={s.id} className="basis-full px-0 pl-0 sm:basis-[85%] sm:px-1.5 md:basis-[53.5%] md:px-2">
              <div className="relative aspect-square overflow-hidden rounded-[14px] border border-[var(--brand)]/40 bg-black/20 md:aspect-[2/1] md:rounded-[12px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.src} alt={s.alt || t("สไลด์ {v}", { v: i + 1 })} decoding="async" {...(i === 0 ? { fetchPriority: "high" as const } : { loading: "lazy" as const })} className="absolute inset-0 size-full object-cover" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-[10px]">
          {slides.map((s, i) => (
            <button key={s.id} aria-label={t("สไลด์ {v}", { v: i + 1 })} onClick={() => api?.scrollTo(i)}
              className={cn("h-[3px] w-[30px] rounded-full bg-white/30", i === index && "bg-white")} />
          ))}
        </div>
      )}
    </div>
  );
}
