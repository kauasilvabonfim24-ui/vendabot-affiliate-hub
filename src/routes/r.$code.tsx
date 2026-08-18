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

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        await supabase.rpc("register_referral_click" as never, { p_code: code } as never);
      } catch {
        // clique não registrado não deve impedir a pessoa de continuar
      }
    }

    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
