import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  IconCircleCheck as CheckCircle2, IconBrandTelegram as TelegramIcon,
  IconLoader2 as Loader2, IconInfoCircle as Info, IconAlertTriangle as AlertTriangle,
  IconUsers as Users,
} from "@tabler/icons-react";
import { useTelegramConnection, useTelegramGroups, useConnectTelegram } from "@/hooks/use-telegram-connection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/conexao-telegram")({
  head: () => ({
    meta: [
      { title: "Conexão Telegram — VendaBot" },
      {
        name: "description",
        content: "Conecte um bot do Telegram como canal adicional de disparo de ofertas.",
      },
      { property: "og:title", content: "Conexão Telegram — VendaBot" },
      { property: "og:description", content: "Conecte um bot do Telegram ao VendaBot." },
    ],
  }),
  component: ConexaoTelegramPage,
});

function ConexaoTelegramPage() {
  const { data: connection, isLoading: loadingConnection } = useTelegramConnection();
  const { data: groups = [], isLoading: loadingGroups } = useTelegramGroups();
  const connectMutation = useConnectTelegram();
  const [token, setToken] = useState("");

  const isConnected = connection?.status === "connected";

  function handleConnect() {
    const tokenLimpo = token.trim();
    if (!tokenLimpo || !tokenLimpo.includes(":")) {
      toast.error("Cole o token completo que o BotFather te enviou");
      return;
    }
    connectMutation.mutate(tokenLimpo, {
      onSuccess: (data) => {
        toast.success(`Bot @${data.bot_username} conectado!`);
        setToken("");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao conectar bot");
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 pwa:hidden">
        <h1 className="font-display text-2xl font-bold">Conexão Telegram</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Canal adicional de disparo, além do WhatsApp.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-card p-8 pwa:border-none! pwa:bg-transparent! pwa:p-0! pwa:pt-4!">
        {loadingConnection ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Carregando status...</p>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col items-center gap-4 pwa:w-full!">
            <CheckCircle2 className="h-14 w-14 text-primary" />
            <p className="font-display text-lg font-semibold text-primary">
              Bot conectado: @{connection?.bot_username}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 pwa:w-full!">
            <TelegramIcon className="h-12 w-12 text-ai" />

            <div className="w-full max-w-sm space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-foreground">
                  1
                </span>
                <p>
                  Abra o Telegram e converse com <span className="font-medium text-foreground">@BotFather</span>.
                  Envie <code className="rounded bg-muted px-1">/newbot</code> e siga as instruções.
                </p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-foreground">
                  2
                </span>
                <p>
                  Copie o token que ele enviar (parece com{" "}
                  <code className="rounded bg-muted px-1">123456:ABC-def</code>).
                </p>
              </div>
              <div className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-foreground">
                  3
                </span>
                <p>Cole o token abaixo e conecte.</p>
              </div>
            </div>

            <div className="flex w-full max-w-xs flex-col gap-3">
              <Input
                type="text"
                placeholder="123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="pwa:h-12!"
              />
              <Button
                onClick={handleConnect}
                disabled={connectMutation.isPending}
                className="gap-2 pwa:h-12!"
              >
                {connectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Conectar bot
              </Button>
            </div>
          </div>
        )}
      </div>

      {isConnected && (
        <div className="mt-6 rounded-xl border border-border bg-card p-8 pwa:border-none! pwa:bg-transparent! pwa:p-0! pwa:pt-4!">
          <p className="mb-4 text-sm font-medium">Grupos conectados</p>

          {loadingGroups ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum grupo detectado ainda. Adicione o bot a um grupo do Telegram e o torne admin.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      g.bot_is_admin ? "bg-primary/15" : "bg-amber-500/15"
                    }`}
                  >
                    {g.bot_is_admin ? (
                      <Users className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{g.chat_title ?? "Sem nome"}</p>
                    <p className={`text-xs ${g.bot_is_admin ? "text-primary" : "text-amber-500"}`}>
                      {g.bot_is_admin ? "Ativo" : "Bot não é admin"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2 rounded-lg border border-ai/20 bg-ai/10 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-ai" />
            <p>Adicione o bot como admin nos grupos para ele aparecer aqui automaticamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
