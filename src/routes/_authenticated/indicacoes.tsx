import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Share2, Gift, MousePointerClick, UserPlus, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { useReferralStats } from "@/hooks/use-referral";

export const Route = createFileRoute("/_authenticated/indicacoes")({
  head: () => ({
    meta: [
      { title: "Indique e Ganhe — VendaBot" },
      { name: "description", content: "Indique o VendaBot e ganhe dias grátis de assinatura." },
      { property: "og:title", content: "Indique e Ganhe — VendaBot" },
      { property: "og:description", content: "Indique o VendaBot e ganhe dias grátis." },
    ],
  }),
  component: IndicacoesPage,
});

function buildShareText(link: string) {
  return [
    "🚀 Você trabalha como afiliado?",
    "",
    "Conheça o VendaBot, uma plataforma criada para ajudar afiliados a criarem copies, ofertas e conteúdos de marketing com IA.",
    "",
    "Conheça o VendaBot:",
    link,
  ].join("\n");
}

function IndicacoesPage() {
  const { data: stats, isLoading } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://vendabot.com.br";
  const code = stats?.code ?? "";
  const link = code ? `${origin}/r/${code}` : "";
  const rewardDays = stats?.reward_days_config ?? 15;

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  async function handleShare() {
    if (!link) return;
    const text = buildShareText(link);
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // usuário cancelou o share nativo, cai pro fallback abaixo
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const cards = [
    { label: "Cliques", value: stats?.clicks ?? 0, icon: MousePointerClick },
    { label: "Cadastros", value: stats?.signups ?? 0, icon: UserPlus },
    { label: "Indicações válidas", value: stats?.valid_referrals ?? 0, icon: PartyPopper },
    { label: "Dias conquistados", value: stats?.days_earned ?? 0, icon: Gift },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Gift className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          Indique e Ganhe
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indique o VendaBot para outros afiliados. Quando uma nova pessoa assinar um dos planos
          através do seu link, você ganha{" "}
          <strong className="text-foreground">{rewardDays} dias grátis</strong> na sua assinatura.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Seu link de indicação</h2>
        {isLoading ? (
          <div className="mt-3 h-11 w-full animate-pulse rounded-lg bg-secondary" />
        ) : (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 truncate rounded-lg border border-border bg-secondary/50 px-4 py-2.5 font-mono text-sm">
              {link || "Gerando seu link..."}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!link}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <button
                onClick={handleShare}
                disabled={!link}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold sm:mb-4">Seus resultados</h2>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-display text-3xl font-bold sm:mt-3 sm:text-4xl">
                {isLoading ? "–" : value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm text-muted-foreground">
        <p>
          A indicação só vale quando a pessoa entra pelo seu link, cria a conta, assina um plano e o
          pagamento é aprovado. Cadastro ou clique sozinhos não geram recompensa — e você só ganha
          os dias depois que o pagamento da pessoa indicada for confirmado de verdade.
        </p>
      </section>
    </div>
  );
}
