"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/register-form";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const { user, authReady, registerEnabled } = useSite();
  // Signed-in members have no business here: send them home.
  React.useEffect(() => { if (authReady && user) router.replace("/"); }, [authReady, user, router]);
  const checking = !authReady || !!user;
  return (
    <SiteShell>
      <section className="mx-auto max-w-[460px] px-[10px] py-10">
        <Card className="rounded-[15px] border border-[var(--brand)] bg-[var(--surface-2)] text-white">
          <CardHeader>
            <CardTitle className="text-center text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{registerEnabled ? t("สมัครสมาชิกฟรี") : t("ปิดรับสมัคร")}</CardTitle>
          </CardHeader>
          <CardContent>
            {!registerEnabled ? <p className="text-center">{t("ขณะนี้ปิดรับสมัครสมาชิกชั่วคราว")}</p> : checking ? <div aria-busy="true" className="grid gap-3"><div className="skeleton h-11 rounded-[30px]" /><div className="skeleton h-11 rounded-[30px]" /><div className="skeleton h-11 rounded-[30px]" /></div> : <RegisterForm onDone={() => router.push("/")} />}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
