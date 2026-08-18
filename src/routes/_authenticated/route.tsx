import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileBottomNav } from "@/components/AppSidebar";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Se a pessoa chegou por um link /r/CODIGO antes de logar, o código ficou
    // guardado no navegador — captura aqui, 1x, no primeiro carregamento logado.
    // Fire-and-forget: a função é idempotente e nunca deve travar a navegação.
    if (typeof window !== "undefined") {
      const pendingCode = localStorage.getItem("vendabot_ref_code");
      if (pendingCode) {
        localStorage.removeItem("vendabot_ref_code");
        void supabase.rpc("capture_referral" as never, { p_code: pendingCode } as never);
      }
    }

    // A tela de planos precisa ficar acessível mesmo sem assinatura ativa,
    // senão o usuário nunca conseguiria chegar até ela pra assinar.
    if (location.pathname !== "/planos") {
      const { data: sub } = await supabase
        .from("subscriptions" as never)
        .select("status,current_period_end")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const row = sub as unknown as { status: string; current_period_end: string | null } | null;
      const ativo =
        !!row &&
        row.status === "active" &&
        (!row.current_period_end || new Date(row.current_period_end) > new Date());

      if (!ativo) throw redirect({ to: "/planos" });
    }

    return { user: data.user };
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
