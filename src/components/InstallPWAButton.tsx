import { useEffect, useState } from "react";
import {
  IconDownload as Download,
  IconX as X,
  IconShare as Share,
  IconSquarePlus as SquarePlus,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "vendabot_install_dismissed";

function isStandaloneMode() {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

// Botão único de instalação. No Android/Chrome/Edge instala com um toque
// (via evento beforeinstallprompt). No iPhone/Safari a Apple não permite
// disparar a instalação por código — então mostramos o passo a passo
// visual em vez da pessoa ter que descobrir sozinha.
export function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    if (isStandaloneMode()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }

    if (isIos) {
      setVisible(true);
    } else {
      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleClick() {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setShowIosSteps(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(DISMISS_KEY, "1");
    }
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-40 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-card p-3 shadow-lg sm:inset-x-auto sm:right-4 sm:max-w-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Download className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Instale o VendaBot</p>
            <p className="text-xs text-muted-foreground">Acesso rápido, direto da tela inicial.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button size="sm" onClick={handleClick}>
            Instalar
          </Button>
          <button
            onClick={dismiss}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={showIosSteps} onOpenChange={setShowIosSteps}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <DialogTitle>Instalar no iPhone</DialogTitle>
            <DialogDescription>
              O iPhone não deixa instalar direto pelo site — são só 2 toques:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-left text-sm">
            <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
              <Share className="h-5 w-5 shrink-0 text-primary" />
              <p>
                Toque no ícone de <strong>Compartilhar</strong>, na barra do Safari
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3">
              <SquarePlus className="h-5 w-5 shrink-0 text-primary" />
              <p>
                Toque em <strong>"Adicionar à Tela de Início"</strong>
              </p>
            </div>
          </div>

          <Button
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, "1");
              setShowIosSteps(false);
              setVisible(false);
            }}
            className="mt-2"
          >
            Entendi
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
