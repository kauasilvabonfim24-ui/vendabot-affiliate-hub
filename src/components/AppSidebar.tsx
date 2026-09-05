import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Package,
  Clock,
  Users,
  Sparkles,
  LogOut,
  Bot,
  QrCode,
  Gift,
  Settings,
  Receipt,
  LifeBuoy,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBotStatus } from "@/hooks/use-bot-status";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

// Navegação completa (sidebar do desktop e barra de navegador no mobile) —
// permanece igual a antes, sem nenhuma mudança.
const nav = [
  { to: "/painel", label: "Painel", icon: BarChart3 },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/horarios", label: "Horários", icon: Clock },
  { to: "/grupos", label: "Grupos", icon: Users },
  { to: "/conexao", label: "Conexão", icon: QrCode },
  { to: "/preview-ia", label: "Preview IA", icon: Sparkles },
  { to: "/indicacoes", label: "Indique e Ganhe", icon: Gift },
  { to: "/configuracoes", label: "Config.", icon: Settings },
] as const;

// Só usada no modo instalado (PWA): 4 destinos fixos + o botão "Mais".
const mainNav = [
  { to: "/painel", label: "Painel", icon: BarChart3 },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/horarios", label: "Horários", icon: Clock },
  { to: "/grupos", label: "Grupos", icon: Users },
] as const;

// Só usada no modo instalado (PWA): itens que ficam dentro do menu "Mais".
const moreNav = [
  { to: "/conexao", label: "Conexão", icon: QrCode },
  { to: "/preview-ia", label: "Preview IA", icon: Sparkles },
  { to: "/indicacoes", label: "Indique e ganhe", icon: Gift },
  { to: "/planos", label: "Planos", icon: Receipt },
  { to: "/suporte", label: "Suporte", icon: LifeBuoy },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

// Título mostrado na barra superior do modo instalado, por rota.
const screenTitles: Record<string, string> = Object.fromEntries(
  [...mainNav, ...moreNav].map(({ to, label }) => [to, label]),
);

function useBotStatusVisual() {
  const { data: botStatus } = useBotStatus();
  const status = botStatus?.status ?? "disconnected";
  const connected = status === "connected";
  const waitingQr = status === "qr";
  const dotClass = connected ? "bg-primary" : waitingQr ? "bg-ai" : "bg-destructive";
  const statusLabel = connected
    ? "Bot conectado"
    : waitingQr
      ? "Aguardando leitura do QR"
      : "Bot desconectado";
  return { dotClass, statusLabel };
}

async function signOutAndRedirect(
  queryClient: ReturnType<typeof useQueryClient>,
  navigate: ReturnType<typeof useNavigate>,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  navigate({ to: "/auth", replace: true });
}

export function AppSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dotClass, statusLabel } = useBotStatusVisual();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-5 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg leading-none font-bold">VendaBot</p>
          <p className="text-xs text-muted-foreground">Afiliados no WhatsApp</p>
        </div>
      </div>

      <Link
        to="/conexao"
        className="mx-5 mt-5 flex items-center gap-2 rounded-lg border border-sidebar-border bg-background/60 px-3 py-2 transition-colors hover:border-primary/40"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`}
          />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
        </span>
        <span className="text-xs font-medium text-muted-foreground">{statusLabel}</span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "bg-primary/12 text-primary hover:bg-primary/12" }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOutAndRedirect(queryClient, navigate)}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </aside>
  );
}

// Barra superior compacta — só aparece no modo instalado (classe "pwa:").
// No navegador comum ela não é renderizada (fica com display:none via CSS).
export function PwaTopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { dotClass, statusLabel } = useBotStatusVisual();
  const title = screenTitles[pathname] ?? "VendaBot";

  return (
    <header className="hidden pwa:flex sticky top-0 z-20 items-center justify-between gap-3 border-b border-sidebar-border bg-sidebar px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 items-center gap-2 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Bot className="h-4 w-4" />
        </span>
        <span className="truncate text-base font-semibold">{title}</span>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
        </span>
        <span className="hidden sm:inline">{statusLabel}</span>
      </span>
    </header>
  );
}

// Barra de navegação do modo NAVEGADOR (mobile) — 8 itens em rolagem
// horizontal, exatamente como já era. Só fica oculta quando o app está
// instalado (a nova PwaBottomNav assume nesse caso).
export function MobileBottomNav() {
  const { dotClass } = useBotStatusVisual();

  return (
    <nav className="pwa:hidden fixed inset-x-0 bottom-0 z-30 flex snap-x snap-mandatory items-stretch gap-1 overflow-x-auto border-t border-sidebar-border bg-sidebar px-1 pb-[env(safe-area-inset-bottom)]">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="relative flex min-w-[72px] shrink-0 snap-start flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-sidebar-foreground/70"
          activeProps={{ className: "text-primary" }}
        >
          {to === "/conexao" && (
            <span
              className={`absolute top-1.5 right-[calc(50%-14px)] h-1.5 w-1.5 rounded-full ${dotClass}`}
            />
          )}
          <Icon className="h-5 w-5" />
          <span className="leading-none whitespace-nowrap">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

// Barra de navegação do modo INSTALADO (PWA): 4 destinos fixos + "Mais".
// Só aparece via a classe "pwa:flex" — some sozinha no navegador comum.
export function PwaBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const moreIsActive = moreNav.some((item) => item.to === pathname);

  return (
    <nav className="hidden pwa:flex fixed inset-x-0 bottom-0 z-30 items-stretch border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)]">
      {mainNav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-sidebar-foreground/70"
          activeProps={{ className: "text-primary" }}
        >
          <Icon className="h-6 w-6" />
          <span className="leading-none">{label}</span>
        </Link>
      ))}

      <Sheet>
        <SheetTrigger asChild>
          <button
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              moreIsActive ? "text-primary" : "text-sidebar-foreground/70"
            }`}
          >
            <MoreHorizontal className="h-6 w-6" />
            <span className="leading-none">Mais</span>
          </button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-sidebar-border bg-sidebar pb-[calc(env(safe-area-inset-bottom)+12px)]"
        >
          <SheetHeader className="mb-2">
            <SheetTitle className="text-left text-base">Mais opções</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col">
            {moreNav.map(({ to, label, icon: Icon }) => (
              <SheetClose asChild key={to}>
                <Link
                  to={to}
                  className="flex min-h-[48px] items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground/90 transition-colors hover:bg-accent"
                  activeProps={{ className: "text-primary" }}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              </SheetClose>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
