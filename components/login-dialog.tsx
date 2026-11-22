"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/components/providers";
import { LoginForm } from "@/components/login-form";
import { useT } from "@/components/i18n-provider";

export function LoginDialog() {
  const t = useT();
  const { loginOpen, setLoginOpen, setRegisterOpen } = useSite();
  // Closes only via the X button: Esc and outside clicks are ignored.
  return (
    <Dialog
      open={loginOpen}
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open && details.reason !== "close-press") return details.cancel();
        setLoginOpen(open);
      }}
    >
      <DialogContent className="rounded-[15px] border-[var(--brand)] bg-[var(--surface-2)] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{t("เข้าสู่ระบบ")}</DialogTitle>
          <DialogDescription className="text-white/70">{t("ยินดีต้อนรับกลับมา")}</DialogDescription>
        </DialogHeader>
        <LoginForm onDone={() => setLoginOpen(false)} onSwitchToRegister={() => { setLoginOpen(false); setRegisterOpen(true); }} />
      </DialogContent>
    </Dialog>
  );
}
