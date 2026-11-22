"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const { user, authReady } = useSite();
  // Signed-in members have no business here: send them home.
  React.useEffect(() => { if (authReady && user) router.replace("/"); }, [authReady, user, router]);
  const checking = !authReady || !!user;
  return (
    <SiteShell>
      <section className="mx-auto max-w-[420px] px-[10px] py-10">
        <Card className="rounded-[15px] border border-[var(--brand)] bg-[var(--surface-2)] text-white">
          <CardHeader>
            <CardTitle className="text-center text-[length:calc(20px*var(--fs))] text-[var(--brand)]">
              {t("เข้าสู่ระบบ")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {checking ? <div aria-busy="true" className="grid gap-3"><div className="skeleton h-11 rounded-[30px]" /><div className="skeleton h-11 rounded-[30px]" /><div className="skeleton h-11 rounded-[30px]" /></div> : <LoginForm onDone={() => router.push("/")} />}
          </CardContent>
        </Card>
      </section>
    </SiteShell>
  );
}
