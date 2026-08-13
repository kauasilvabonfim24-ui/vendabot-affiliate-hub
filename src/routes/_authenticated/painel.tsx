import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Clock, Users } from "lucide-react";
import { useGroups, useProducts, useSchedules } from "@/hooks/use-vendabot";
import { repeatLabel } from "@/lib/vendabot";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel — VendaBot" },
      { name: "description", content: "Visão geral dos produtos, grupos e horários do seu bot." },
      { property: "og:title", content: "Painel — VendaBot" },
      { property: "og:description", content: "Visão geral do seu bot de ofertas." },
    ],
  }),
  component: PainelPage,
});

function PainelPage() {
  const products = useProducts();
  const groups = useGroups();
  const schedules = useSchedules();

  const cards = [
    {
      label: "Produtos cadastrados",
      value: products.data?.length ?? 0,
      icon: Package,
      to: "/produtos" as const,
    },
    {
      label: "Horários ativos",
      value: schedules.data?.length ?? 0,
      icon: Clock,
      to: "/horarios" as const,
    },
    {
      label: "Grupos cadastrados",
      value: groups.data?.length ?? 0,
      icon: Users,
      to: "/grupos" as const,
    },
  ];

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = [...(schedules.data ?? [])].sort((a, b) => {
    const toM = (t: string) => {
      const [h = 0, m = 0] = t.split(":").map(Number);
      const v = h * 60 + m;
      return v < nowMinutes ? v + 1440 : v;
    };

    return toM(a.time) - toM(b.time);
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe a operação do seu bot de ofertas.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-4xl font-bold">{value}</p>
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Próximos disparos</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum horário cadastrado ainda.{" "}
            <Link to="/horarios" className="text-primary hover:underline">
              Criar horário
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {upcoming.slice(0, 6).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-semibold text-primary">{s.time}</span>
                  <span className="text-sm text-muted-foreground">{repeatLabel(s.repeat)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {s.category && (
                    <span className="rounded-full bg-ai/15 px-2 py-1 text-ai">{s.category}</span>
                  )}
                  <span className="rounded-full bg-secondary px-2 py-1">
                    {s.group_ids?.length ?? 0} grupo(s)
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
