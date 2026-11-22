"use client";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

/** Top strip: backend unreachable (auto-retrying) or back again (offer a reload so pages refetch). */
export function OutageBanner() {
  const t = useT();
  const { apiDown, recovered, retryNow, dismissRecovered } = useSite();
  if (!apiDown && !recovered) return null;
  const btn = "shrink-0 rounded-full px-3.5 py-1 text-[length:calc(13px*var(--fs))] font-medium";
  return apiDown ? (
    <div role="status" className="flex items-center justify-center gap-3 bg-amber-500 px-3 py-2 text-[length:calc(13px*var(--fs))] font-medium text-black">
      <span>{t("⚠️ ระบบขัดข้องชั่วคราว กำลังพยายามเชื่อมต่อใหม่อัตโนมัติ")}</span>
      <button onClick={retryNow} className={`${btn} bg-black/80 text-white`}>{t("ลองเดี๋ยวนี้")}</button>
    </div>
  ) : (
    <div role="status" className="flex items-center justify-center gap-3 bg-emerald-500 px-3 py-2 text-[length:calc(13px*var(--fs))] font-medium text-black">
      <span>{t("✅ ระบบกลับมาใช้งานได้แล้ว")}</span>
      <button onClick={() => location.reload()} className={`${btn} bg-black/80 text-white`}>{t("โหลดหน้านี้ใหม่")}</button>
      <button onClick={dismissRecovered} aria-label={t("ปิด")} className="shrink-0 text-lg leading-none">✕</button>
    </div>
  );
}
