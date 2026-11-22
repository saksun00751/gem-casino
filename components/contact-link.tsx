"use client";
import Link from "next/link";
import { useT } from "@/components/i18n-provider";

/** Inline link to the contact page, used wherever the UI says "contact support". */
export function ContactLink({ children }: { children?: React.ReactNode }) {
  const t = useT();
  return <Link href="/contact/" className="font-medium text-[var(--brand)] underline">{children ?? t("ติดต่อฝ่ายบริการลูกค้า")}</Link>;
}
