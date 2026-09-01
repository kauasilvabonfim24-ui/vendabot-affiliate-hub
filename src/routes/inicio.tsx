import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type PointerEvent } from "react";
import {
  Clock,
  Users,
  Rocket,
  ShieldCheck,
  Lock,
  BadgeCheck,
  Headset,
  ThumbsUp,
  Star,
  ArrowRight,
  Check,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import titanouLogoAsset from "@/assets/titanou-cod-logo.png.asset.json";

export const Route = createFileRoute("/inicio")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "VendaBot — Automação que vende enquanto você descansa" },
      {
        name: "description",
        content:
          "Pare de perder tempo copiando e colando ofertas no WhatsApp. O VendaBot automatiza seus disparos para afiliados Shopee e Mercado Livre.",
      },
      { property: "og:title", content: "VendaBot — Automação que vende enquanto você descansa" },
      {
        property: "og:description",
        content: "Automatize seus disparos de ofertas no WhatsApp e foque em vender mais.",
      },
    ],
  }),
  component: LandingPage,
});

const BENEFICIOS = [
  {
    icon: Clock,
    title: "Automatize seus disparos",
    desc: "Programe os horários e o VendaBot dispara sozinho, todos os dias, sem você precisar estar na frente do celular.",
  },
  {
    icon: Users,
    title: "Vários grupos, um clique",
    desc: "Envie a mesma oferta pra todos os seus grupos do WhatsApp de uma vez, em segundos.",
  },
  {
    icon: Rocket,
    title: "Mais produtividade",
    desc: "O tempo que você perdia copiando e colando ofertas agora sobra pra criar conteúdo e vender mais.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro e estável",
    desc: "Conecta com seu WhatsApp por QR Code. Sua sessão fica protegida e o sistema roda 24h na nuvem.",
  },
];

const CONFIANCA = [
  { icon: Lock, title: "Seguro", desc: "Não armazenamos suas mensagens." },
  { icon: BadgeCheck, title: "Confiável", desc: "Sistema estável, feito pra rodar todo dia." },
  { icon: Users, title: "Focado em resultado", desc: "Criado por quem também é afiliado." },
  { icon: Headset, title: "Suporte humano", desc: "Time pronto pra te ajudar quando precisar." },
  { icon: ThumbsUp, title: "Aprovado por quem usa", desc: "Afiliados recomendam todos os dias." },
];

const DEPOIMENTOS = [
  {
    avatar: "/avatars/depoimento-1.jpg",
    texto: "Economizei horas do meu dia e minha divulgação aumentou muito. Mudou meu jogo.",
    autor: "Afiliado Shopee",
  },
  {
    avatar: "/avatars/depoimento-2.jpg",
    texto: "Envio pra vários grupos em minutos. Sobra mais tempo pra criar conteúdo e vender.",
    autor: "Afiliado Mercado Livre",
  },
  {
    avatar: "/avatars/depoimento-3.jpg",
    texto: "Simples de usar, seguro e o suporte é top. Recomendo demais.",
    autor: "Afiliado",
  },
];

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  }

  return (
    <div
      style={{ perspective: "1000px" }}
      className={className}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        ref={ref}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 150ms ease-out",
        }}
        className="rounded-2xl border border-border bg-card p-4 shadow-[0_25px_60px_-15px_rgb(0_0_0_/_0.6)]"
      >
        {children}
      </div>
    </div>
  );
}

function DepthCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{ perspective: "800px" }} className={className}>
      <div className="group h-full rounded-xl border border-border bg-card transition-transform duration-300 ease-out [transform-style:preserve-3d] hover:[transform:rotateX(4deg)_rotateY(-4deg)_translateZ(6px)] hover:shadow-[0_20px_40px_-12px_rgb(0_0_0_/_0.5)]">
        {children}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-background text-foreground"
      style={{ perspective: "1500px" }}
    >
      <section className="relative px-4 pb-20 pt-14 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 -left-16 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-64 -right-10 -z-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
        />

        <div className="mx-auto max-w-lg text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_4px_14px_-4px] shadow-primary/40">
            <Send className="h-3 w-3" />
            Feito para afiliados Shopee e Mercado Livre
          </span>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight [text-shadow:0_8px_24px_rgb(0_0_0_/_0.4)] sm:text-5xl">
            Pare de perder tempo
            <br />
            copiando e colando
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
            O <span className="font-semibold text-foreground">VendaBot</span> automatiza seus
            disparos de oferta no WhatsApp, no horário que você escolher — você foca no que
            importa: vender mais.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3">
            <Button
              asChild
              size="lg"
              className="w-full max-w-xs text-base shadow-[0_12px_30px_-8px] shadow-primary/50 transition-transform active:translate-y-0.5 active:shadow-[0_4px_12px_-4px]"
            >
              <Link to="/auth">
                Quero automatizar minhas vendas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Indique um amigo e ganhe <span className="text-primary">15 dias grátis</span>
            </p>
          </div>
        </div>

        <TiltCard className="mx-auto mt-10 max-w-sm">
          <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <p className="text-xs font-medium text-muted-foreground">
              VendaBot disparando agora
            </p>
          </div>
          <div
            style={{ transform: "translateZ(30px)" }}
            className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-primary/15 p-3 text-left text-sm shadow-lg"
          >
            <p className="leading-snug">
              🔥 <span className="font-semibold">Fone Bluetooth</span>
              <br />
              💰 De ~~R$ 89,90~~ por <span className="font-semibold text-primary">R$ 39,90</span>
              <br />
              👉 Confira aqui: link.vendabot.app/xyz
            </p>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">enviado ✓✓</p>
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Enviado automaticamente para 8 grupos
          </p>
        </TiltCard>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-lg space-y-5">
          {BENEFICIOS.map((b) => (
            <DepthCard key={b.title}>
              <div className="flex items-start gap-4 p-4">
                <span
                  style={{ transform: "translateZ(20px)" }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary shadow-md"
                >
                  <b.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-semibold">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            </DepthCard>
          ))}
        </div>
      </section>

      <section className="relative border-y border-border bg-surface px-4 py-10">
        <div className="mx-auto max-w-lg">
          <h2 className="text-center font-display text-lg font-bold">
            Por que você pode confiar no VendaBot?
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {CONFIANCA.map((c) => (
              <DepthCard key={c.title}>
                <div className="p-4 text-center">
                  <c.icon className="mx-auto h-5 w-5 text-primary" />
                  <p className="mt-2 text-xs font-semibold text-primary">{c.title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.desc}</p>
                </div>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto max-w-lg">
          <h2 className="text-center font-display text-lg font-bold">
            O que afiliados estão dizendo
          </h2>
          <div className="mt-6 space-y-4">
            {DEPOIMENTOS.map((d) => (
              <DepthCard key={d.autor}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={d.avatar}
                      alt={`Foto de perfil de ${d.autor}`}
                      width={40}
                      height={40}
                      loading="lazy"
                      className="h-10 w-10 rounded-full border border-primary/30 object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold">{d.autor}</p>
                      <div className="flex gap-0.5 text-primary">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-snug">&ldquo;{d.texto}&rdquo;</p>
                </div>
              </DepthCard>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-6">
        <div
          style={{ transformStyle: "preserve-3d" }}
          className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center shadow-[0_30px_70px_-20px] shadow-primary/30"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/30 blur-2xl"
          />
          <h2 className="font-display text-xl font-bold">
            Pronto para ter mais tempo e mais vendas?
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Crie sua conta grátis e conecte seu WhatsApp em minutos.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-5 w-full max-w-xs text-base shadow-[0_12px_30px_-8px] shadow-primary/50 transition-transform active:translate-y-0.5 active:shadow-[0_4px_12px_-4px]"
          >
            <Link to="/auth">
              Criar minha conta agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <ul className="mx-auto mt-6 flex max-w-xs flex-col gap-1.5 text-left text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              Seus dados protegidos
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              Atualizações constantes
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              Afiliados em todo o Brasil
            </li>
          </ul>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-3 text-xs text-muted-foreground">Plataforma feita por</p>
          <img
            src={titanouLogoAsset.url}
            alt="TITANO-COD"
            width={160}
            height={60}
            loading="lazy"
            className="mx-auto h-12 w-auto object-contain opacity-90"
          />
        </div>
      </footer>
    </main>
  );
}
