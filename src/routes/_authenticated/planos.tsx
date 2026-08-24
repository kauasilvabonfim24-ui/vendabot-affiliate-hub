import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/planos")({
  head: () => ({
    meta: [{ title: "Planos — VendaBot" }],
  }),
  component: PlanosPage,
});

// TODO: trocar pelos links reais de pagamento da Cakto
// (Produtos → abre o produto → Links → "Link de pagamento")
const CHECKOUT_LINKS: Record<string, string> = {
  basico: "https://pay.cakto.com.br/fq9b2h5_1040779",
  pro: "https://pay.cakto.com.br/56j7c9i_1040783",
};

type Plan = {
  id: string;
  name: string;
  price: number;
  max_groups: number | null;
  max_schedules: number | null;
};

function PlanosPage() {
  const [termosAceitos, setTermosAceitos] = useState(false);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from("plans" as never)
        .select("*")
        .order("price", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold">Escolha seu plano</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assine para liberar o VendaBot. O acesso é ativado automaticamente
          assim que o pagamento é confirmado.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 pwa:gap-4! sm:grid-cols-2">
          {plans?.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6 pwa:p-4!"
            >
              <h2 className="font-display text-lg pwa:text-base! font-semibold">{plan.name}</h2>
              <p className="mt-2 text-3xl pwa:text-2xl! font-bold text-primary">
                R$ {plan.price.toFixed(2).replace(".", ",")}
                <span className="text-sm font-normal text-muted-foreground">
                  /mês
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {plan.max_groups
                    ? `Até ${plan.max_groups} grupos do WhatsApp`
                    : "Grupos ilimitados"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {plan.max_schedules
                    ? `Até ${plan.max_schedules} horários por dia`
                    : "Horários ilimitados"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  Agente de IA gerando as ofertas automaticamente
                </li>
              </ul>
              <a
                href={termosAceitos ? CHECKOUT_LINKS[plan.id] : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!termosAceitos}
                onClick={(e) => {
                  if (!termosAceitos) e.preventDefault();
                }}
                className={`mt-6 block rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                  termosAceitos
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "cursor-not-allowed bg-muted text-muted-foreground"
                }`}
              >
                Assinar {plan.name}
              </a>
            </div>
          ))}
        </div>
      )}

      <label className="mx-auto mt-8 flex max-w-md items-start gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={termosAceitos}
          onChange={(e) => setTermosAceitos(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Li e aceito os{" "}
          <a href="/termos" target="_blank" className="underline">
            Termos de Uso
          </a>{" "}
          do VendaBot, incluindo a cobrança recorrente automática do plano
          escolhido.
        </span>
      </label>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Já pagou? A liberação é automática em poucos segundos. Se esta tela
        continuar aparecendo, atualize a página.
      </p>
    </div>
  );
}
