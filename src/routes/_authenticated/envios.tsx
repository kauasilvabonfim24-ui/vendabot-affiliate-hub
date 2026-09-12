import { createFileRoute } from "@tanstack/react-router";
import { IconCircleCheck as CheckCircle2, IconAlertTriangle as AlertTriangle } from "@tabler/icons-react";
import { useMessageLogs } from "@/hooks/use-message-logs";

export const Route = createFileRoute("/_authenticated/envios")({
  head: () => ({
    meta: [
      { title: "Envios — VendaBot" },
      { name: "description", content: "Acompanhe os disparos de mensagem enviados a cada grupo." },
      { property: "og:title", content: "Envios — VendaBot" },
      { property: "og:description", content: "Histórico de mensagens enviadas e com erro por grupo." },
    ],
  }),
  component: EnviosPage,
});

function ehHoje(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

function formatarQuando(iso: string) {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (ehHoje(iso)) return `Hoje, ${hora}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${hora}`;
}

function EnviosPage() {
  const { data: logs, isLoading } = useMessageLogs();

  const logsHoje = (logs ?? []).filter((l) => ehHoje(l.sent_at));
  const enviadosHoje = logsHoje.filter((l) => l.status === "enviado").length;
  const errosHoje = logsHoje.filter((l) => l.status === "erro").length;

  return (
    <div className="space-y-8 pwa:space-y-4!">
      <header>
        <h1 className="text-3xl pwa:text-xl! font-bold">Envios</h1>
        <p className="mt-1 text-sm text-muted-foreground pwa:hidden">
          Acompanhe se as mensagens estão saindo certinho em cada grupo.
        </p>
      </header>

      {!isLoading && logsHoje.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-2 rounded-full bg-primary/12 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            {enviadosHoje} enviada{enviadosHoje === 1 ? "" : "s"} hoje
          </span>
          {errosHoje > 0 && (
            <span className="flex items-center gap-2 rounded-full bg-destructive/12 px-4 py-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {errosHoje} com erro hoje
            </span>
          )}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6 pwa:border-none! pwa:bg-transparent! pwa:p-0!">
        <h2 className="mb-4 text-lg font-semibold pwa:hidden">Histórico recente</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (logs?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum envio registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border pwa:space-y-2! pwa:divide-y-0!">
            {logs!.map((log) => {
              const ok = log.status === "enviado";
              return (
                <li
                  key={log.id}
                  className="flex items-center gap-4 py-4 pwa:rounded-xl! pwa:border! pwa:border-border! pwa:bg-card! pwa:p-3! pwa:py-3!"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      ok ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{log.group_name || "Grupo removido"}</p>
                    {!ok && (
                      <p className="mt-0.5 truncate text-xs text-destructive/80">
                        {log.error_message || "Não foi possível enviar"}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                    {formatarQuando(log.sent_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
