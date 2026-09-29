import { useEffect } from "react";
import { toast } from "sonner";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar, MobileBottomNav, PwaTopBar, PwaBottomNav } from "@/components/AppSidebar";
import { OnboardingTour } from "@/components/OnboardingTour";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { NotificationsBell } from "@/components/NotificationsBell";

const SUBSCRIPTION_CACHE_TTL_MS = 30_000;
// Só guardamos em cache quem já é pagante (mesma ideia de antes): quem não é
// pagante é reconsultado a cada navegação, pra liberar na hora após o pagamento.
let subscriptionCache: { userId: string; expiresAt: number } | null = null;

// Rotas que qualquer usuário logado pode ver, mesmo sem assinatura ativa.
// Ideia: deixar a pessoa experimentar o produto (cadastrar produto,
// simular a mensagem de venda) antes de pedir pra pagar. Só a operação
// de verdade (conectar WhatsApp, grupos, horários, config) fica trancada.
const FREE_ROUTES = ["/planos", "/painel", "/produtos", "/preview-ia"];

// Teste grátis: além das rotas livres, libera SÓ o Telegram (conexão + horários).
// WhatsApp (/conexao, /grupos) segue trancado até assinar um plano.
const TRIAL_ROUTES = ["/conexao-telegram", "/horarios"];

type Access = "paid" | "trial" | "none";

// Teste grátis é criado 1x por sessão do navegador, assim que a pessoa entra
// logada (o cadastro guarda WhatsApp + consentimento no user_metadata).
const trialHandled = new Set<string>();
let trialStartError: string | null = null;

async function getAccess(userId: string): Promise<Access> {
  const now = Date.now();
  if (subscriptionCache && subscriptionCache.userId === userId && subscriptionCache.expiresAt > now) {
    return "paid";
  }

  const { data: sub } = await supabase
    .from("subscriptions" as never)
    .select("status,current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  const row = sub as unknown as { status: string; current_period_end: string | null } | null;
  const ativo =
    !!row &&
    row.status === "active" &&
    (!row.current_period_end || new Date(row.current_period_end) > new Date());

  if (ativo) {
    subscriptionCache = { userId, expiresAt: now + SUBSCRIPTION_CACHE_TTL_MS };
    return "paid";
  }
  subscriptionCache = null;

  const { data: trial } = await supabase
    .from("trial_accounts" as never)
    .select("ends_at")
    .eq("user_id", userId)
    .maybeSingle();
  const t = trial as unknown as { ends_at: string } | null;
  if (t && new Date(t.ends_at) > new Date()) return "trial";

  return "none";
}

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

    // Teste grátis: cria o trial (idempotente no banco) se o cadastro veio de "Teste grátis".
    const meta = (user.user_metadata ?? {}) as { trial_whatsapp?: string; trial_consent?: boolean };
    if (meta.trial_whatsapp && meta.trial_consent && !trialHandled.has(user.id)) {
      const { error: trialErr } = await supabase.rpc(
        "start_trial" as never,
        { p_whatsapp: meta.trial_whatsapp, p_consent: true } as never,
      );
      const falhaDeRede = !!trialErr && /fetch|network/i.test(trialErr.message);
      if (!falhaDeRede) trialHandled.add(user.id);
      if (trialErr && !falhaDeRede) {
        const chave = `vendabot_trial_err_${user.id}`;
        if (!localStorage.getItem(chave)) {
          localStorage.setItem(chave, "1");
          trialStartError = trialErr.message;
        }
      }
      subscriptionCache = null;
    }

    if (!FREE_ROUTES.includes(location.pathname)) {
      const access = await getAccess(user.id);
      const liberado =
        access === "paid" || (access === "trial" && TRIAL_ROUTES.includes(location.pathname));
      if (!liberado) throw redirect({ to: "/planos" });
    }

    return { user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  useEffect(() => {
    if (trialStartError) {
      toast.error(trialStartError);
      trialStartError = null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sino flutuante só pro modo navegador mobile (não instalado, não
          desktop) — é o único dos 3 modos que hoje não tem uma barra
          superior própria pra encaixar o sino. */}
      <div className="pwa:hidden md:hidden fixed top-3 right-3 z-40">
        <NotificationsBell />
      </div>
      <PwaTopBar />
      <AppSidebar />
      <main className="px-4 pwa:px-3! py-6 pwa:py-4! pb-24 pwa:pb-28! md:ml-64 md:px-8 md:py-8 md:pb-8">
        <Outlet />
      </main>
      <MobileBottomNav />
      <PwaBottomNav />
      <OnboardingTour />
      <NotificationPrompt />
    </div>
  );
}
