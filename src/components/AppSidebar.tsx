import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Package, Clock, Users, Sparkles, LogOut, Bot, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBotStatus } from "@/hooks/use-bot-status";

const nav = [
  { to: "/painel", label: "Painel", icon: BarChart3 },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/horarios", label: "Horários", icon: Clock },
  { to: "/grupos", label: "Grupos", icon: Users },
  { to: "/conexao", label: "Conexão", icon: QrCode },
  { to: "/preview-ia", label: "Preview IA", icon: Sparkles },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 pt-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div>
          <p className="font-display text-lg leading-none font-bold">VendaBot</p>
          <p className="text-xs text-muted-foreground">Afiliados no WhatsApp</p>
        </div>
      </div>

      <div className="mx-5 mt-5 flex items-center gap-2 rounded-lg border border-sidebar-border bg-background/60 px-3 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
        </span>
        <span className="text-xs font-medium text-muted-foreground">Bot desconectado</span>
      </div>

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
        onClick={handleSignOut}
        className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </aside>
  );
}
