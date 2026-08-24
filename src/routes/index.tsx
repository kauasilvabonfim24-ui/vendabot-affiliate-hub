import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    // Usuário já logado vai direto pro painel; visitante novo vê a página de vendas primeiro.
    if (data.user) throw redirect({ to: "/painel" });
    throw redirect({ to: "/inicio" });
  },
  component: () => null,
});
