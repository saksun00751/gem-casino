"use client";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { useT } from "@/components/i18n-provider";

export default function NotFound() {
  const t = useT();
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-[460px] justify-items-center gap-4 px-[10px] py-20 text-center">
        <p aria-hidden className="text-[72px] font-semibold leading-none text-[var(--brand)]">404</p>
        <h1 className="text-[length:calc(22px*var(--fs))] font-medium">{t("ไม่พบหน้าที่ต้องการ")}</h1>
        <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ลิงก์อาจไม่ถูกต้องหรือหน้านี้ถูกย้ายไปแล้ว")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link href="/" className="brand-gradient grid h-11 place-items-center rounded-[30px] px-8 text-[length:calc(15px*var(--fs))] font-medium">{t("กลับหน้าแรก")}</Link>
          <Link href="/contact/" className="grid h-11 place-items-center rounded-[30px] border border-[var(--brand)] px-8 text-[length:calc(15px*var(--fs))] font-medium hover:bg-white/10">{t("ติดต่อเรา")}</Link>
        </div>
      </section>
    </SiteShell>
  );
}
