import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertTriangle, Loader2, Smartphone } from "lucide-react";
import { useBotStatus, useConnectWhatsApp } from "@/hooks/use-bot-status";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const connectMutation = useConnectWhatsApp();
  const status = data?.status ?? "disconnected";

  function handleConnect() {
    connectMutation.mutate(undefined, {
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao solicitar conexão");
      },
    });
  }

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
        ) : status === "requested" ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-ai" />
            <p className="text-sm font-medium">Preparando QR Code...</p>
          </div>
        ) : status === "qr" && data?.qr_code ? (
          <div className="flex flex-col items-center gap-5">
            <img
              src={data.qr_code}
              alt="QR Code para conectar o WhatsApp"
              className="h-64 w-64 rounded-2xl border-4 border-ai bg-card p-2 shadow-[0_0_40px_-12px_var(--ai)]"
            />
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Escaneie com o WhatsApp: Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        ) : status === "connected" ? (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <p className="font-display text-lg font-semibold text-primary">WhatsApp conectado!</p>
            <Button variant="outline" size="sm" disabled>
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium">Bot desconectado.</p>
            <Button onClick={handleConnect} disabled={connectMutation.isPending} className="gap-2">
              {connectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              Conectar WhatsApp
            </Button>
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
