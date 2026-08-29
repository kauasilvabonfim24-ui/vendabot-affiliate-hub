import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMySubscription } from "@/hooks/use-subscription";

// Cada passo representa uma tela ou ação importante do app.
// title/description ficam curtos de propósito — é um tutorial pra quem tá
// vendo o app pela primeira vez, não um manual técnico.
const STEPS: { title: string; description: string; to?: string }[] = [
  {
    title: "Bem-vindo ao VendaBot!",
    description:
      "Seu pagamento foi confirmado. Agora vamos te mostrar rapidinho onde fica cada coisa, pra você já sair configurando certo. São só alguns passos.",
  },
  {
    title: "1. Conectar o WhatsApp",
    description:
      "Primeiro passo: vá em Conexão e escaneie o QR Code com o WhatsApp que vai enviar as ofertas. Sem isso conectado, o bot não consegue postar nada.",
    to: "/conexao",
  },
  {
    title: "2. Cadastrar produtos",
    description:
      "Em Produtos, adicione as ofertas que quer divulgar: nome, plataforma (Shopee, Mercado Livre...), preço antigo, preço atual e o link de afiliado. O desconto é calculado sozinho.",
    to: "/produtos",
  },
  {
    title: "3. Adicionar os grupos",
    description:
      "Em Grupos, escolha em quais grupos do WhatsApp o bot vai postar as ofertas. Dá pra cadastrar vários e escolher o papel do bot em cada um.",
    to: "/grupos",
  },
  {
    title: "4. Definir os horários",
    description:
      "Em Horários, você define quando o bot deve enviar as ofertas ao longo do dia. Pode cadastrar quantos horários quiser.",
    to: "/horarios",
  },
  {
    title: "5. Ver como vai ficar a mensagem",
    description:
      "Em Preview IA, dá pra simular como a mensagem vai sair no grupo antes mesmo do bot postar de verdade. Bom pra conferir se tá do jeito que você quer.",
    to: "/preview-ia",
  },
  {
    title: "6. Acompanhar os resultados",
    description:
      "O Painel mostra um resumo de tudo: quantos produtos, horários e grupos você já tem cadastrado. É a tela inicial, sempre que você abrir o app.",
    to: "/painel",
  },
  {
    title: "7. Indique e ganhe",
    description:
      "Em Indique e Ganhe você pega seu link de indicação. Cada pessoa que assinar através dele te dá recompensa. Vale muito compartilhar com quem você conhece.",
    to: "/indicacoes",
  },
  {
    title: "Pronto!",
    description:
      "É isso — configure na ordem (Conexão → Produtos → Grupos → Horários) e o bot já começa a rodar sozinho. Se travar em algo, tem um botão de Suporte lá nas Configurações pra falar comigo direto.",
  },
];

const STORAGE_PREFIX = "vendabot_onboarding_seen_";

export function OnboardingTour() {
  const navigate = useNavigate();
  const { data: subscription } = useMySubscription();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getUser().then(({ data }) => {
        setUserId(data.user?.id ?? null);
      });
    });
  }, []);

  // Abre sozinho quando a assinatura está ativa e essa pessoa ainda não viu.
  useEffect(() => {
    if (!userId || subscription?.status !== "active") return;
    const seen = localStorage.getItem(STORAGE_PREFIX + userId);
    if (!seen) {
      setStep(0);
      setOpen(true);
    }
  }, [userId, subscription?.status]);

  // Permite reabrir o tutorial a qualquer momento (ex: botão em Configurações)
  // via window.dispatchEvent(new Event("vendabot:reopen-tour"))
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener("vendabot:reopen-tour", handler);
    return () => window.removeEventListener("vendabot:reopen-tour", handler);
  }, []);

  function finish() {
    if (userId) localStorage.setItem(STORAGE_PREFIX + userId, "1");
    setOpen(false);
  }

  function next() {
    const current = STEPS[step]!;
    if (current.to) navigate({ to: current.to });
    if (step === STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }

  const current = STEPS[step]!;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={finish}>
            Pular tutorial
          </Button>
          <Button size="sm" onClick={next}>
            {step === STEPS.length - 1 ? "Concluir" : "Próximo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
