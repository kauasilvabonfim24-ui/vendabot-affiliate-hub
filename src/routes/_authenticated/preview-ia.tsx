import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/hooks/use-vendabot";
import { generateSalesMessage } from "@/lib/vendabot";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

function PreviewPage() {
  const { data: products } = useProducts();
  const [productId, setProductId] = useState("");
  const [variation, setVariation] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const product = products?.find((p) => p.id === productId);

  function generate(next = false) {
    if (!product) {
      toast.error("Selecione um produto");
      return;
    }
    const v = next ? variation + 1 : variation;
    setVariation(v);
    setMessage(generateSalesMessage(product, v));
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Preview IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulação da mensagem que o agente vai enviar nos grupos.
        </p>
      </header>

      <div className="rounded-xl border border-ai/30 bg-card p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <select
              id="product"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setMessage(null);
                setVariation(0);
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
          <Button onClick={() => generate(false)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar mensagem
          </Button>
        </div>

        {(products?.length ?? 0) === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum produto cadastrado.{" "}
            <Link to="/produtos" className="text-primary hover:underline">
              Cadastrar produto
            </Link>
          </p>
        )}
      </div>

      {message && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mensagem gerada</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => generate(true)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Outra variação
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(message);
                  toast.success("Mensagem copiada");
                }}
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-background p-4">
            <div className="max-w-md rounded-2xl rounded-tl-sm border border-primary/25 bg-primary/10 p-4">
              {product?.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="mb-3 h-40 w-full rounded-lg object-cover"
                />
              )}
              <pre className="font-sans text-sm whitespace-pre-wrap text-foreground">{message}</pre>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
