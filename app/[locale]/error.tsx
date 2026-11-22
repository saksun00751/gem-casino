"use client";
import * as React from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { useT } from "@/components/i18n-provider";

/** Shown when a page throws while rendering. `reset` re-renders the segment without a full reload. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  React.useEffect(() => { console.error(error); }, [error]);
  return (
    <SiteShell>
      <section role="alert" className="mx-auto grid max-w-[460px] justify-items-center gap-4 px-[10px] py-20 text-center">
        <p aria-hidden className="text-[56px] leading-none">⚠️</p>
        <h1 className="text-[length:calc(22px*var(--fs))] font-medium">{t("เกิดข้อผิดพลาดบางอย่าง")}</h1>
        <p className="text-[length:calc(14px*var(--fs))] text-white/70">{t("ขออภัยในความไม่สะดวก กรุณาลองใหม่อีกครั้ง")}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="brand-gradient h-11 rounded-[30px] px-8 text-[length:calc(15px*var(--fs))] font-medium">{t("ลองใหม่")}</button>
          <Link href="/" className="grid h-11 place-items-center rounded-[30px] border border-[var(--brand)] px-8 text-[length:calc(15px*var(--fs))] font-medium hover:bg-white/10">{t("กลับหน้าแรก")}</Link>
        </div>
      </section>
    </SiteShell>
  );
}
