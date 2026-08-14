import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useBotStatus } from "@/hooks/use-bot-status";

export const Route = createFileRoute("/_authenticated/conexao")({
  head: () => ({
    meta: [
      { title: "Conexão — VendaBot" },
      {
        name: "description",
        content: "Acompanhe em tempo real a conexão do bot VendaBot com o WhatsApp.",
      },
      { property: "og:title", content: "Conexão — VendaBot" },
      { property: "og:description", content: "Status da conexão do bot com o WhatsApp." },
    ],
  }),
  component: ConexaoPage,
});

function ConexaoPage() {
  const { data, isLoading } = useBotStatus();
  const status = data?.status ?? "disconnected";

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold">Conexão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status da sessão do bot com o WhatsApp, atualizado em tempo real.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-8">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Carregando status...</p>
          </div>
        ) : status === "qr" && data?.qr_code ? (
          <div className="flex flex-col items-center gap-5">
            <img
              src={data.qr_code}
              alt="QR Code para conectar o WhatsApp"
              className="h-64 w-64 rounded-2xl border-4 border-accent bg-white p-2"
            />
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Escaneie com o WhatsApp: Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        ) : status === "connected" ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <p className="font-display text-lg font-semibold text-primary">WhatsApp conectado!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium">Bot desconectado. Aguardando conexão...</p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60" />
          </div>
        )}

        {data?.updated_at && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Última atualização: {new Date(data.updated_at).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
}
