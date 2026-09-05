import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileBottomNav, PwaTopBar, PwaBottomNav } from "@/components/AppSidebar";
import { OnboardingTour } from "@/components/OnboardingTour";

const SUBSCRIPTION_CACHE_TTL_MS = 30_000;
let subscriptionCache: { userId: string; expiresAt: number } | null = null;

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (error || !user) throw redirect({ to: "/auth" });

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

    if (location.pathname !== "/planos") {
      const now = Date.now();
      const jaSabemosQueEstaAtivo =
        subscriptionCache && subscriptionCache.userId === user.id && subscriptionCache.expiresAt > now;

      if (!jaSabemosQueEstaAtivo) {
        const { data: sub } = await supabase
          .from("subscriptions" as never)
          .select("status,current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        const row = sub as unknown as { status: string; current_period_end: string | null } | null;
        const ativo =
          !!row &&
          row.status === "active" &&
          (!row.current_period_end || new Date(row.current_period_end) > new Date());

        if (!ativo) {
          subscriptionCache = null;
          throw redirect({ to: "/planos" });
        }

        subscriptionCache = { userId: user.id, expiresAt: now + SUBSCRIPTION_CACHE_TTL_MS };
      }
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-background">
      <PwaTopBar />
      <AppSidebar />
      <main className="px-4 pwa:px-3! py-6 pwa:py-4! pb-24 pwa:pb-28! md:ml-64 md:px-8 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
      <PwaBottomNav />
      <OnboardingTour />
    </div>
  );
}
