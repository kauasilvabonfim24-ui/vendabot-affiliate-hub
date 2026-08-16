import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/hooks/use-vendabot";
import { brl, discountPercent, platformLabel, type Product } from "@/lib/vendabot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — VendaBot" },
      { name: "description", content: "Cadastre e gerencie os produtos afiliados do seu bot." },
      { property: "og:title", content: "Produtos — VendaBot" },
      { property: "og:description", content: "Gerencie os produtos afiliados do seu bot." },
    ],
  }),
  component: ProdutosPage,
});

const emptyForm = {
  name: "",
  platform: "shopee",
  old_price: "",
  price: "",
  link: "",
  image_url: "",
  category: "",
};

function ProdutosPage() {
  const { data: products, isLoading } = useProducts();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const off = discountPercent(Number(form.old_price), Number(form.price));

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      platform: p.platform,
      old_price: String(p.old_price),
      price: String(p.price),
      link: p.link,
      image_url: p.image_url ?? "",
      category: p.category ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        platform: form.platform,
        old_price: Number(form.old_price) || 0,
        price: Number(form.price) || 0,
        link: form.link,
        image_url: form.image_url || null,
        category: form.category || null,
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("products")
          .insert({ ...payload, user_id: userData.user!.id });
        if (error) throw error;
        toast.success("Produto adicionado");
      }
      cancelEdit();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (editingId === id) cancelEdit();
    toast.success("Produto excluído");
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }




  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Produtos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre as ofertas que o bot vai divulgar.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editingId ? "Editar produto" : "Novo produto"}
          </h2>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome do produto</Label>
            <Input
              id="name"
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Fone Bluetooth XYZ"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <select
              id="platform"
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="shopee">Shopee</option>
              <option value="mercadolivre">Mercado Livre</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="eletronicos"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="old_price">Preço antigo</Label>
            <Input
              id="old_price"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.old_price}
              onChange={(e) => set("old_price", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Preço atual</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              required
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="link">Link de afiliado</Label>
            <Input
              id="link"
              type="url"
              required
              value={form.link}
              onChange={(e) => set("link", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="image_url">URL da imagem (opcional)</Label>
            <Input
              id="image_url"
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Desconto calculado:{" "}
            <span className="font-display text-lg font-bold text-primary">{off}% OFF</span>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar produto"}
          </Button>
        </div>
      </form>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Produtos cadastrados</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (products?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {products!.map((p) => (
              <li key={p.id} className="flex items-center gap-4 py-4">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-lg border border-border bg-secondary" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2 py-0.5">
                      {platformLabel(p.platform)}
                    </span>
                    {p.category && (
                      <span className="rounded-full bg-ai/15 px-2 py-0.5 text-ai">{p.category}</span>
                    )}
                    <span className="line-through">{brl(Number(p.old_price))}</span>
                    <span className="font-semibold text-primary">{brl(Number(p.price))}</span>
                    <span className="text-primary">
                      {discountPercent(Number(p.old_price), Number(p.price))}% OFF
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
