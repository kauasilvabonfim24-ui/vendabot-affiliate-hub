import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$code")({
  ssr: false,
  beforeLoad: async ({ params }) => {
    const code = params.code?.trim().toUpperCase();

    if (code) {
      try {
        // guarda o código até o cadastro/login acontecer (ver _authenticated/route.tsx)
        localStorage.setItem("vendabot_ref_code", code);
      } catch {
        // navegador sem localStorage disponível — segue o fluxo normalmente
      }

      // registra o clique em segundo plano, sem travar o redirect —
      // a pessoa não deve esperar essa chamada de rede terminar pra ver a página
      import("@/integrations/supabase/client")
        .then(({ supabase }) =>
          supabase.rpc("register_referral_click" as never, { p_code: code } as never)
        )
        .catch(() => {
          // clique não registrado não deve impedir a pessoa de continuar
        });
    }

    // manda pra landing page de vendas (não direto pro login) — quem vem de
    // indicação precisa ver o que é o VendaBot e o aviso dos 15 dias grátis
    // antes de cair numa tela de cadastro vazia
    throw redirect({ to: "/inicio" });
  },
  component: () => null,
});
