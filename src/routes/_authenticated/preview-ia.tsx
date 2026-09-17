import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  IconSparkles as Sparkles,
  IconRefresh as RefreshCw,
  IconCopy as Copy,
  IconCheck as Check,
  IconChecks as Checks,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/use-vendabot";
import { generateSalesMessages, type Product, type SalesMessageVariant, styleLabel } from "@/lib/vendabot";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/preview-ia")({
  head: () => ({
    meta: [
      { title: "Preview IA — VendaBot" },
      { name: "description", content: "Simule a mensagem de venda gerada pelo agente de IA." },
      { property: "og:title", content: "Preview IA — VendaBot" },
      { property: "og:description", content: "Veja como o bot escreve suas ofertas." },
    ],
  }),
  component: PreviewPage,
});

const DEMO_PRODUCT: Product = {
  id: "demo",
  user_id: "demo",
  name: "Fone de Ouvido Bluetooth",
  platform: "shopee",
  old_price: 89.9,
  price: 39.9,
  link: "https://shopee.com.br/seu-link-de-afiliado",
  image_url: null,
  category: "eletronico",
  created_at: new Date().toISOString(),
};

function nowLabel() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function WhatsAppBubble({
  message,
  onChange,
  editable,
}: {
  message: string;
  onChange?: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <div className="max-w-md rounded-lg rounded-tl-none bg-primary/15 p-3 shadow-sm">
      {editable ? (
        <Textarea
          value={message}
          onChange={(e) => onChange?.(e.target.value)}
          className="min-h-[160px] resize-none border-none bg-transparent p-0 font-sans text-sm text-foreground shadow-none focus-visible:ring-0"
        />
      ) : (
        <pre className="font-sans text-sm whitespace-pre-wrap text-foreground">{message}</pre>
      )}
      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>{nowLabel()}</span>
        <Checks className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
  );
}

function VariantCard({ variant, index }: { variant: SalesMessageVariant; index: number }) {
  const [text, setText] = useState(variant.message);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Mensagem copiada");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {styleLabel[variant.style]}
        </Badge>
        <Button variant="ghost" size="sm" className="gap-2" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          Copiar
        </Button>
      </div>
      <div className="rounded-xl bg-[#eef2e9] p-4 dark:bg-background">
        <WhatsAppBubble message={text} onChange={setText} editable />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Variação {index + 1} — edite o texto acima se quiser ajustar antes de enviar.</p>
    </div>
  );
}

function PreviewPage() {
  const { data: products } = useProducts();
  const [productId, setProductId] = useState("");
  const [seed, setSeed] = useState(0);
  const [generated, setGenerated] = useState(false);

  const product = products?.find((p) => p.id === productId);
  const hasProducts = (products?.length ?? 0) > 0;
  const activeProduct = product ?? (hasProducts ? undefined : DEMO_PRODUCT);

  const variants = useMemo(() => {
    if (!activeProduct) return [];
    return generateSalesMessages(activeProduct, 3, seed);
  }, [activeProduct, seed]);

  function generate() {
    if (!product && hasProducts) {
      toast.error("Selecione um produto");
      return;
    }
    setSeed((s) => s + 7);
    setGenerated(true);
  }

  const showingDemo = !product && !hasProducts;

  return (
    <div className="space-y-8 pwa:space-y-5!">
      <header>
        <h1 className="text-3xl pwa:text-xl! font-bold">Preview IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulação das mensagens que o agente vai enviar nos grupos — veja como fica antes de ativar.
        </p>
      </header>

      <div className="rounded-xl border border-ai/30 bg-card p-6 pwa:p-4!">
        <div className="grid gap-4 pwa:gap-3! md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <select
              id="product"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setGenerated(false);
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecione um produto...</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={generate} className="gap-2">
            {generated ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {generated ? "Gerar outras variações" : "Gerar mensagens"}
          </Button>
        </div>

        {!hasProducts && (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda — abaixo está um exemplo pra você ver como funciona. {" "}
            <Link to="/produtos" className="text-primary hover:underline">
              Cadastrar seu primeiro produto
            </Link>
          </p>
        )}
      </div>

      {(generated || showingDemo) && activeProduct && variants.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg pwa:text-base! font-semibold">
              {showingDemo ? "Exemplo com produto fictício" : "Mensagens geradas"}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {variants.map((v, i) => (
              <VariantCard key={`${seed}-${i}`} variant={v} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
