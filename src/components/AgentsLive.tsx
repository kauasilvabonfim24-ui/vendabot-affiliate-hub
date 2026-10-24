import { useEffect, useMemo, useState } from "react";
import {
  IconSearch as Search,
  IconPencil as Pencil,
  IconSend as Send,
} from "@tabler/icons-react";
import { useAgentEvents, type AgentEventRow, type AgentName } from "@/hooks/use-agent-events";
import { platformLabel } from "@/lib/vendabot";

const ACTIVE_WINDOW_MS = 9000;
const RECENT_WINDOW_MS = 60_000;

const AGENTS: { key: AgentName; name: string; role: string; icon: typeof Search }[] = [
  { key: "cacador", name: "Caçador de Ofertas", role: "Escolhe o produto certo pra cada grupo", icon: Search },
  { key: "redator", name: "Redator", role: "Escreve a copy de venda", icon: Pencil },
  { key: "mensageiro", name: "Mensageiro", role: "Envia nos grupos", icon: Send },
];

const PLATFORM_STYLE: Record<string, string> = {
  shopee: "bg-orange-500/15 text-orange-400",
  mercadolivre: "bg-yellow-500/15 text-yellow-400",
  tiktokshop: "bg-pink-500/15 text-pink-400",
};

type StateKind = "vazio" | "trabalhando" | "recente" | "espera";

function getState(ev: AgentEventRow | undefined, now: number): { kind: StateKind; age: number } {
  if (!ev) return { kind: "vazio", age: 0 };
  const age = now - new Date(ev.created_at).getTime();
  const emAndamento =
    ev.action === "escolhendo" || ev.action === "escrevendo" || ev.action === "enviando";
  if (emAndamento && age <= ACTIVE_WINDOW_MS) return { kind: "trabalhando", age };
  if (emAndamento) return { kind: "espera", age };
  if (age <= RECENT_WINDOW_MS) return { kind: "recente", age };
  return { kind: "espera", age };
}

function statusText(agent: AgentName, ev: AgentEventRow | undefined, kind: StateKind): string {
  if (!ev) return "Aguardando o primeiro disparo";
  const produto = ev.product_name ?? "oferta";
  const grupo = ev.group_name ?? "grupo";
  if (kind === "trabalhando") {
    if (agent === "cacador") return `Procurando a melhor oferta pra ${grupo}…`;
    if (agent === "redator") return `Escrevendo a copy: ${produto}…`;
    return `Enviando em ${grupo}…`;
  }
  if (ev.action === "erro") return `Falhou em ${grupo}`;
  if (ev.action === "concluido") {
    if (agent === "cacador") return `Escolheu: ${produto}`;
    if (agent === "redator") return `Copy pronta: ${produto}`;
    return `Enviado em ${grupo}`;
  }
  return "Em espera";
}

function ago(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `há ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function PlatformChip({ platform }: { platform: string | null }) {
  if (!platform) return null;
  const style = PLATFORM_STYLE[platform] ?? "bg-secondary text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {platformLabel(platform)}
    </span>
  );
}

export function AgentsLive({ nextTime }: { nextTime?: string | null }) {
  const events = useAgentEvents();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastByAgent = useMemo(() => {
    const map: Partial<Record<AgentName, AgentEventRow>> = {};
    for (const ev of events.data ?? []) {
      if (!map[ev.agent]) map[ev.agent] = ev;
    }
    return map;
  }, [events.data]);

  const recentes = useMemo(
    () =>
      (events.data ?? [])
        .filter((ev) => ev.agent === "mensageiro" && (ev.action === "concluido" || ev.action === "erro"))
        .slice(0, 5),
    [events.data],
  );

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Seus agentes</h2>
        <p className="text-xs text-muted-foreground">
          {nextTime ? `Próximo disparo às ${nextTime}` : "Crie um horário pros agentes começarem a trabalhar"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {AGENTS.map(({ key, name, role, icon: Icon }) => {
          const ev = lastByAgent[key];
          const { kind, age } = getState(ev, now);
          const trabalhando = kind === "trabalhando";
          const erro = kind === "recente" && ev?.action === "erro";
          const dot = trabalhando
            ? "bg-primary animate-pulse"
            : erro
              ? "bg-destructive"
              : kind === "recente"
                ? "bg-primary"
                : "bg-muted-foreground/40";

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 transition-colors ${
                trabalhando ? "border-primary/60 ring-1 ring-primary/30" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${
                    trabalhando ? "animate-pulse" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{role}</p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <p className="text-sm">{statusText(key, ev, kind)}</p>
              </div>

              {ev && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <PlatformChip platform={ev.product_platform} />
                  <span className="rounded-full bg-secondary px-2 py-0.5">
                    {ev.channel === "telegram" ? "Telegram" : "WhatsApp"}
                  </span>
                  <span>{ago(age)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recentes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Últimas ofertas
          </p>
          <ul className="space-y-1.5">
            {recentes.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span>{ev.action === "erro" ? "❌" : "✅"}</span>
                <span className="font-medium">{ev.product_name ?? "Oferta"}</span>
                <PlatformChip platform={ev.product_platform} />
                <span className="text-muted-foreground">
                  → {ev.group_name ?? "grupo"} · {ago(now - new Date(ev.created_at).getTime())}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
