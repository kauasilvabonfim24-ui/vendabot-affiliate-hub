import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Star, Send, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllSupportMessages,
  useReplySupportMessage,
  type AdminSupportMessage,
} from "@/hooks/use-admin";

export const Route = createFileRoute("/_authenticated/admin/suporte")({
  ssr: false,
  beforeLoad: async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw redirect({ to: "/auth" });

    const { data } = await supabase
      .from("admin_users" as never)
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (!data) throw redirect({ to: "/painel" });
  },
  head: () => ({
    meta: [{ title: "Admin — Suporte — VendaBot" }],
  }),
  component: AdminSuportePage,
});

const CATEGORY_LABEL: Record<string, string> = {
  duvida: "Dúvida",
  sugestao: "Sugestão",
  avaliacao: "Avaliação",
  problema: "Problema",
};

function TicketCard({ ticket }: { ticket: AdminSupportMessage }) {
  const reply = useReplySupportMessage();
  const [text, setText] = useState(ticket.admin_reply ?? "");

  async function handleReply(status: "respondido" | "fechado") {
    if (!text.trim()) {
      toast.error("Escreva uma resposta antes de enviar");
      return;
    }
    try {
      await reply.mutateAsync({ id: ticket.id, reply: text.trim(), status });
      toast.success("Resposta enviada!");
    } catch {
      toast.error("Não foi possível enviar a resposta");
    }
  }

  return (
    <li className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-sm font-medium">{ticket.user_email ?? "e-mail desconhecido"}</span>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{CATEGORY_LABEL[ticket.category] ?? ticket.category}</span>
            {ticket.rating && (
              <span className="flex items-center gap-0.5">
                {ticket.rating} <Star className="h-3 w-3 fill-primary text-primary" />
              </span>
            )}
            <span>
              {new Date(ticket.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            ticket.status === "aberto"
              ? "bg-ai/15 text-ai"
              : ticket.status === "respondido"
                ? "bg-primary/15 text-primary"
                : "bg-secondary text-muted-foreground"
          }`}
        >
          {ticket.status === "aberto"
            ? "Aguardando"
            : ticket.status === "respondido"
              ? "Respondido"
              : "Fechado"}
        </span>
      </div>

      <p className="mt-3 text-sm text-foreground/90">{ticket.message}</p>

      <div className="mt-3 space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Escreva sua resposta..."
          className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-primary/50"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleReply("respondido")}
            disabled={reply.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {reply.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Responder
          </button>
          <button
            onClick={() => handleReply("fechado")}
            disabled={reply.isPending}
            className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Responder e fechar
          </button>
        </div>
      </div>
    </li>
  );
}

function AdminSuportePage() {
  const { data: tickets, isLoading } = useAllSupportMessages();

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <ShieldCheck className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
          Admin — Suporte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensagens de todos os clientes, mais recentes e "aguardando" primeiro.
        </p>
      </header>

      {isLoading ? (
        <div className="h-20 animate-pulse rounded-xl bg-secondary" />
      ) : !tickets || tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma mensagem recebida ainda.</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </ul>
      )}
    </div>
  );
}
