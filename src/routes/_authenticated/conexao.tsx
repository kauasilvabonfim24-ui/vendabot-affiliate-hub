import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  IconCircleCheck as CheckCircle2, IconAlertTriangle as AlertTriangle,
  IconLoader2 as Loader2, IconDeviceMobile as Smartphone, IconQrcode as QrCodeIcon,
} from "@tabler/icons-react";
import { useBotStatus, useConnectWhatsApp, useDisconnectWhatsApp } from "@/hooks/use-bot-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const disconnectMutation = useDisconnectWhatsApp();
  const [metodoEscolhido, setMetodoEscolhido] = useState<"qr" | "pairing" | null>(null);
  const [telefone, setTelefone] = useState("");
  const status = data?.status ?? "disconnected";

  function handleConnectQr() {
    connectMutation.mutate(
      { method: "qr" },
      {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao solicitar conexão");
        },
      },
    );
  }

  function handleConnectPairing() {
    const numeroLimpo = telefone.replace(/\D/g, "");
    if (numeroLimpo.length < 12) {
      toast.error("Digite o número com DDI + DDD, ex: 5511999999999");
      return;
    }
    connectMutation.mutate(
      { method: "pairing", phone: numeroLimpo },
      {
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao solicitar conexão");
        },
      },
    );
  }

  function handleDisconnect() {
    disconnectMutation.mutate(undefined, {
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao desconectar");
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 pwa:hidden">
        <h1 className="font-display text-2xl font-bold">Conexão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Status da sessão do bot com o WhatsApp, atualizado em tempo real.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-8 pwa:border-none! pwa:bg-transparent! pwa:p-0! pwa:pt-4!">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Carregando status...</p>
          </div>
        ) : status === "requested" ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-ai" />
            <p className="text-sm font-medium">Preparando conexão...</p>
          </div>
        ) : status === "qr" && data?.qr_code ? (
          <div className="flex flex-col items-center gap-5">
            <img
              src={data.qr_code}
              alt="QR Code para conectar o WhatsApp"
              className="h-64 w-64 pwa:h-auto! pwa:w-[min(70vw,260px)]! rounded-2xl border-4 border-ai bg-card p-2 shadow-[0_0_40px_-12px_var(--ai)]"
            />
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Escaneie com o WhatsApp: Aparelhos conectados → Conectar um aparelho
            </p>
          </div>
        ) : status === "pairing" && data?.pairing_code ? (
          <div className="flex flex-col items-center gap-5">
            <div className="rounded-2xl border-4 border-ai bg-card px-8 py-6 shadow-[0_0_40px_-12px_var(--ai)]">
              <p className="text-center font-display text-3xl font-bold tracking-[0.2em] text-ai">
                {data.pairing_code}
              </p>
            </div>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              No próprio celular do número informado, abra o WhatsApp:
              Aparelhos conectados → Conectar um aparelho → Conectar com número de telefone,
              e digite esse código.
            </p>
          </div>
        ) : status === "connected" ? (
          <div className="flex flex-col items-center gap-4 pwa:w-full!">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <p className="font-display text-lg font-semibold text-primary">WhatsApp conectado!</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnectMutation.isPending}
              className="gap-2 pwa:h-12! pwa:w-full!"
            >
              {disconnectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 pwa:w-full!">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-sm font-medium">Bot desconectado.</p>

            {metodoEscolhido === "pairing" ? (
              <div className="flex w-full max-w-xs flex-col gap-3">
                <Input
                  type="tel"
                  placeholder="Ex: 5511999999999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="pwa:h-12!"
                />
                <p className="text-center text-xs text-muted-foreground">
                  DDI (55) + DDD + número, só números
                </p>
                <Button
                  onClick={handleConnectPairing}
                  disabled={connectMutation.isPending}
                  className="gap-2 pwa:h-12!"
                >
                  {connectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Gerar código
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setMetodoEscolhido(null)}>
                  Voltar
                </Button>
              </div>
            ) : (
              <div className="flex w-full max-w-xs flex-col gap-3">
                <Button
                  onClick={handleConnectQr}
                  disabled={connectMutation.isPending}
                  className="gap-2 pwa:h-12!"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCodeIcon className="h-4 w-4" />
                  )}
                  Escanear QR Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setMetodoEscolhido("pairing")}
                  className="gap-2 pwa:h-12!"
                >
                  <Smartphone className="h-4 w-4" />
                  Conectar com número de telefone
                </Button>
              </div>
            )}
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
