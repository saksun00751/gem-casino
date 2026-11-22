"use client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSite } from "@/components/providers";
import { RegisterForm } from "@/components/register-form";
import { useT } from "@/components/i18n-provider";

export function RegisterDialog() {
  const t = useT();
  const { registerOpen, setRegisterOpen, setLoginOpen, registerEnabled } = useSite();
  if (!registerEnabled) return null;
  // Closes only via the X button: Esc and outside clicks are ignored.
  return (
    <Dialog
      open={registerOpen}
      disablePointerDismissal
      onOpenChange={(open, details) => {
        if (!open && details.reason !== "close-press") return details.cancel();
        setRegisterOpen(open);
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-[15px] border-[var(--brand)] bg-[var(--surface-2)] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[length:calc(20px*var(--fs))] text-[var(--brand)]">{t("สมัครสมาชิกฟรี")}</DialogTitle>
          <DialogDescription className="text-white/70">{t("กรอกข้อมูลให้ครบเพื่อเริ่มเล่นได้ทันที")}</DialogDescription>
        </DialogHeader>
        {registerOpen && (
          <RegisterForm
            onDone={() => setRegisterOpen(false)}
            onSwitchToLogin={() => { setRegisterOpen(false); setLoginOpen(true); }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
