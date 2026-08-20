import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileBottomNav } from "@/components/AppSidebar";

// Guarda por alguns segundos se a assinatura está ativa, pra não bater no
// servidor de novo a cada clique no menu — só refaz a checagem quando expira.
const SUBSCRIPTION_CACHE_TTL_MS = 30_000;
let subscriptionCache: { userId: string; ativo: boolean; expiresAt: number } | null = null;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession() lê a sessão salva no celular, sem precisar de rede —
    // bem mais rápido que getUser(), que sempre confirma com o servidor.
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (error || !user) throw redirect({ to: "/auth" });

    // Se a pessoa chegou por um link /r/CODIGO antes de logar, o código ficou
    // guardado no navegador — captura aqui, 1x, no primeiro carregamento logado.
    // Espera a confirmação do servidor antes de seguir (evita perder a captura
    // numa corrida com o redirect pra /planos que acontece logo abaixo).
    if (typeof window !== "undefined") {
      const pendingCode = localStorage.getItem("vendabot_ref_code");
      if (pendingCode) {
        try {
          await supabase.rpc("capture_referral" as never, { p_code: pendingCode } as never);
          localStorage.removeItem("vendabot_ref_code");
        } catch {
          // falha de rede: mantém o código guardado pra tentar de novo na próxima navegação
        }
      }
    }

    // A tela de planos precisa ficar acessível mesmo sem assinatura ativa,
    // senão o usuário nunca conseguiria chegar até ela pra assinar.
    if (location.pathname !== "/planos") {
      const now = Date.now();
      const cached =
        subscriptionCache &&
        subscriptionCache.userId === user.id &&
        subscriptionCache.expiresAt > now
          ? subscriptionCache
          : null;

      let ativo: boolean;
      if (cached) {
        ativo = cached.ativo;
      } else {
        const { data: sub } = await supabase
          .from("subscriptions" as never)
          .select("status,current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        const row = sub as unknown as { status: string; current_period_end: string | null } | null;
        ativo =
          !!row &&
          row.status === "active" &&
          (!row.current_period_end || new Date(row.current_period_end) > new Date());

        subscriptionCache = { userId: user.id, ativo, expiresAt: now + SUBSCRIPTION_CACHE_TTL_MS };
      }

      if (!ativo) throw redirect({ to: "/planos" });
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="px-4 py-6 pb-24 md:ml-64 md:px-8 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}
