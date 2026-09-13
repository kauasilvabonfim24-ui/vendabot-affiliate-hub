import { useEffect, useState } from "react";
import { IconBellRinging as BellRinging } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePushPermission } from "@/hooks/use-push-permission";

const DISMISS_KEY = "vendabot_notif_prompt_dismissed_until";
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

// Convite explicando o motivo antes de disparar o popup nativo do
// navegador. "Agora não" dá uma soneca de 7 dias (não é "nunca mais").
export function NotificationPrompt() {
  const { permission, loading, requestPermission } = usePushPermission();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (permission !== "default") return;
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedUntil > Date.now()) return;

    const timer = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(timer);
  }, [permission]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + SETE_DIAS_MS));
    setOpen(false);
  }

  async function ativar() {
    await requestPermission();
    dismiss();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader className="items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <BellRinging className="h-7 w-7" />
          </div>
          <DialogTitle>Ativar notificações?</DialogTitle>
          <DialogDescription>
            Avisamos quando o bot desconectar, sobre novidades do app e promoções exclusivas. Sem spam.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Agora não
          </Button>
          <Button size="sm" onClick={ativar} disabled={loading}>
            {loading ? "Ativando..." : "Ativar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
