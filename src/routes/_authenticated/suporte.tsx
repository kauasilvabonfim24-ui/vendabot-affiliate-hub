import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  LifeBuoy,
  Star,
  Send,
  Loader2,
  MessageCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSupportMessages,
  useSubmitSupportMessage,
  type SupportCategory,
} from "@/hooks/use-support";

export const Route = createFileRoute("/_authenticated/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte — VendaBot" },
      {
        name: "description",
        content: "Fale com o suporte, envie sugestões e avaliações do VendaBot.",
      },
    ],
  }),
  component: SuportePage,
});

const CATEGORIES: { value: SupportCategory; label: string; icon: typeof MessageCircle }[] = [
  { value: "duvida", label: "Dúvida", icon: MessageCircle },
  { value: "sugestao", label: "Sugestão", icon: Lightbulb },
  { value: "avaliacao", label: "Avaliação", icon: Star },
  { value: "problema", label: "Problema", icon: AlertTriangle },
];

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aguardando resposta",
  respondido: "Respondido",
  fechado: "Encerrado",
};

const STATUS_CLASS: Record<string, string> = {
  aberto: "bg-secondary text-muted-foreground",
  respondido: "bg-primary/15 text-primary",
  fechado: "bg-secondary text-muted-foreground",
};

function SuportePage() {
  const { data: messages, isLoading } = useSupportMessages();
  const submit = useSubmitSupportMessage();

  const [category, setCategory] = useState<SupportCategory>("duvida");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Escreva sua mensagem antes de enviar");
      return;
    }

    try {
      await submit.mutateAsync({
        category,
        message: message.trim(),
        rating: category === "avaliacao" ? rating : null,
      });
      toast.success("Mensagem enviada! A gente responde por aqui mesmo.");
      setMessage("");
      setRating(null);
    } catch {
      toast.error("Não foi possível enviar. Tenta de novo em alguns instantes.");
    }
  }

  return (
    <div className="space-y-6 pwa:space-y-4! sm:space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl pwa:text-xl! font-bold sm:text-3xl">
          <LifeBuoy className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          Suporte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manda sua dúvida, sugestão, avaliação ou problema. A gente lê e responde por aqui.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <div>
          <span className="text-sm font-medium text-muted-foreground">Sobre o que é?</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  category === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {category === "avaliacao" && (
          <div>
            <span className="text-sm font-medium text-muted-foreground">Sua nota</span>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  aria-label={`${n} estrela(s)`}
                  className="p-0.5"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      rating !== null && n <= rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="support-message" className="text-sm font-medium text-muted-foreground">
            Mensagem
          </label>
          <textarea
            id="support-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Conta com detalhes o que você precisa..."
            className="mt-2 w-full resize-none rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <button
          type="submit"
          disabled={submit.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {submit.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-lg font-semibold sm:mb-4">Suas mensagens</h2>

        {isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-secondary" />
        ) : !messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não enviou nenhuma mensagem.</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => {
              const cat = CATEGORIES.find((c) => c.value === m.category);
              return (
                <li key={m.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {cat && <cat.icon className="h-4 w-4 text-primary" />}
                      <span className="text-sm font-medium">{cat?.label ?? m.category}</span>
                      {m.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          {m.rating} <Star className="h-3 w-3 fill-primary text-primary" />
                        </span>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[m.status]}`}
                    >
                      {STATUS_LABEL[m.status]}
                    </span>
                  </div>

                  <p className="mt-2.5 text-sm text-foreground/90">{m.message}</p>

                  {m.admin_reply && (
                    <div className="mt-3 rounded-lg bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary">Resposta do suporte</p>
                      <p className="mt-1 text-sm text-muted-foreground">{m.admin_reply}</p>
                    </div>
                  )}

                  <p className="mt-2.5 text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
