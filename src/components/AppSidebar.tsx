import { Link, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBotStatus } from "@/hooks/use-bot-status";

const nav = [
  { to: "/painel", label: "Painel", icon: BarChart3 },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/horarios", label: "Horários", icon: Clock },
  { to: "/grupos", label: "Grupos", icon: Users },
  { to: "/conexao", label: "Conexão", icon: QrCode },
  { to: "/preview-ia", label: "Preview IA", icon: Sparkles },
  { to: "/indicacoes", label: "Indique e Ganhe", icon: Gift },
] as const;

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

// ─── SIDEBAR — visível só em telas médias/grandes (computador, tablet) ──────
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

// ─── BARRA INFERIOR — visível só em telas pequenas (celular) ────────────────
export function MobileBottomNav() {
  const { dotClass } = useBotStatusVisual();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-sidebar-foreground/70"
          activeProps={{ className: "text-primary" }}
        >
          {to === "/conexao" && (
            <span
              className={`absolute top-1.5 right-[calc(50%-14px)] h-1.5 w-1.5 rounded-full ${dotClass}`}
            />
          )}
          <Icon className="h-5 w-5" />
          <span className="leading-none">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
