"use client";
import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSite } from "@/components/providers";
import { useT } from "@/components/i18n-provider";

export function LoginForm({ onDone, onSwitchToRegister }: { onDone?: () => void; onSwitchToRegister?: () => void }) {
  const t = useT();
  const { login, registerEnabled } = useSite();
  const [u, setU] = React.useState("");
  const [p, setP] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const msg = await login(u, p);
        setBusy(false);
        setErr(msg ?? "");
        if (!msg) onDone?.();
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="login-user">{t("เบอร์โทรศัพท์")}</Label>
        <Input id="login-user" inputMode="numeric" autoComplete="username" placeholder="0xxxxxxxxx"
          value={u} onChange={(e) => setU(e.target.value)} className="h-11 rounded-[30px] bg-white/10 px-4" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="login-pass">{t("รหัสผ่าน")}</Label>
        <Input id="login-pass" type="password" autoComplete="current-password" placeholder="••••••"
          value={p} onChange={(e) => setP(e.target.value)} className="h-11 rounded-[30px] bg-white/10 px-4" />
      </div>
      {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
      <Button type="submit" disabled={busy} className="brand-gradient h-11 rounded-[30px] text-base font-medium">{busy ? t("กำลังเข้าสู่ระบบ...") : t("เข้าสู่ระบบ")}</Button>
      {registerEnabled && <p className="text-center text-sm text-white/70">
        {t("ยังไม่มีบัญชี?")}{" "}
        {onSwitchToRegister ? (
          <button type="button" onClick={onSwitchToRegister} className="text-[var(--brand)] underline">{t("สมัครสมาชิกฟรี")}</button>
        ) : (
          <Link href="/register/" className="text-[var(--brand)] underline">{t("สมัครสมาชิกฟรี")}</Link>
        )}
      </p>}
    </form>
  );
}
