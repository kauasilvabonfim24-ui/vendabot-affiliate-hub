import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, FileText, ShieldCheck, LogOut, ChevronRight, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin";
import { useMySubscription } from "@/hooks/use-subscription";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [{ title: "Configurações — VendaBot" }],
  }),
  component: ConfiguracoesPage,
});

const STATUS_LABEL: Record<string, string> = {
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  pending: "Pendente",
};

function ConfiguracoesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const { data: subscription, isLoading } = useMySubscription();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const items = [
    { to: "/suporte" as const, label: "Suporte", icon: LifeBuoy },
    { to: "/termos" as const, label: "Termos de uso", icon: FileText },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua conta, assinatura e outras opções do VendaBot.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {isLoading ? "Carregando..." : (subscription?.plan_name ?? "Nenhum plano ativo")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {subscription
                ? `${STATUS_LABEL[subscription.status] ?? subscription.status}${
                    subscription.current_period_end
                      ? ` · renova em ${new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}`
                      : ""
                  }`
                : "Assine um plano pra usar o VendaBot"}
            </p>
          </div>
          <Link
            to="/planos"
            className="shrink-0 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Gerenciar
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {items.map(({ to, label, icon: Icon }, i) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <Icon className="h-4 w-4 text-primary" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin/suporte"
            className="flex items-center gap-3 border-t border-border px-4 py-3.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="flex-1">Admin — Suporte</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </section>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        Sair da conta
      </button>
    </div>
  );
}
