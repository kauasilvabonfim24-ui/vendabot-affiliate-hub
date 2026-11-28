import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { IconPhoto as Photo, IconLoader2 as Loader2, IconSparkles as Sparkles, IconTag as Tag } from "@tabler/icons-react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/vendabot";
import { suggestPrices, buildListingText, whatsappLink, CONDITIONS, type Condition } from "@/lib/venda-direta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/vender")({
  head: () => ({ meta: [{ title: "Vender produto — VendaBot" }] }),
  component: VenderPage,
});

const CATEGORIAS = ["Celulares", "Eletrônicos", "Informática", "Casa e móveis", "Moda", "Veículos e peças", "Esportes", "Infantil", "Outros"];

function VenderPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Celulares");
  const [condition, setCondition] = useState<Condition>("usado");
  const [reference, setReference] = useState("");
  const [max, setMax] = useState("");
  const [mid, setMid] = useState("");
  const [min, setMin] = useState("");
  const [details, setDetails] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function applySuggestion() {
    const s = suggestPrices(Number(reference.replace(",", ".")), condition);
    if (!s) { toast.error("Informe quanto custa um igual novo ou na loja."); return; }
    setMax(String(s.max)); setMid(String(s.mid)); setMin(String(s.min));
    toast.success("Preços sugeridos! Ajuste se quiser.");
  }

  const prices = useMemo(() => ({ max: Number(max) || 0, mid: Number(mid) || 0, min: Number(min) || 0 }), [max, mid, min]);

  function generateText() {
    if (!name.trim()) { toast.error("Coloque o nome do produto primeiro."); return; }
    setDescription(buildListingText({ name, condition, category, details, city, prices }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Sessão expirada, faça login de novo.");
      const path = `${data.user.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      setImage(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally { setUploading(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (!name.trim()) { toast.error("Coloque o nome do produto."); return; }
    if (!prices.mid || !prices.max || !prices.min) { toast.error("Preencha os três preços."); return; }
    if (!(prices.min <= prices.mid && prices.mid <= prices.max)) { toast.error("O preço mínimo deve ser menor que o médio, e o médio menor que o máximo."); return; }
    if (digits.length < 10) { toast.error("Informe seu WhatsApp com DDD para os compradores falarem com você."); return; }
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const text = description.trim() || buildListingText({ name, condition, category, details, city, prices });
      const { error } = await supabase.from("products").insert({
        user_id: data.user!.id,
        name: name.trim(),
        platform: "vendadireta",
        old_price: prices.max,
        price: prices.mid,
        link: whatsappLink(digits, name.trim()),
        image_url: image || null,
        category,
        cta: text,
        source: "manual",
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto cadastrado! O VendaBot já pode anunciar nos seus horários.");
      setName(""); setReference(""); setMax(""); setMid(""); setMin(""); setDetails(""); setDescription(""); setImage("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Vender produto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tem algo pra vender (um celular, por exemplo) e não tem tempo de ficar postando? Cadastre aqui e o VendaBot anuncia pra você nos grupos, nos horários que você escolher.
        </p>
      </header>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="v-name">O que você está vendendo?</Label>
            <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: iPhone 12 128GB preto" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="v-cat">Categoria</Label>
              <select id="v-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Estado do produto</Label>
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => (
                  <button type="button" key={c.value} onClick={() => setCondition(c.value)}
                    className={`h-10 rounded-md border text-xs font-medium ${condition === c.value ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4 text-primary" /> Preço inteligente</p>
            <p className="text-xs text-muted-foreground">Diga quanto custa um igual novo na loja e o VendaBot sugere os preços pelo estado do produto.</p>
            <div className="flex gap-2">
              <Input inputMode="decimal" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Preço na loja, ex.: 3500" />
              <Button type="button" variant="secondary" onClick={applySuggestion}><Sparkles className="h-4 w-4" /> Sugerir</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([["Máximo", max, setMax, "Anunciado como 'de'"], ["Médio", mid, setMid, "Preço do anúncio"], ["Mínimo", min, setMin, "Seu limite (não aparece)"]] as const).map(([l, v, s, hint]) => (
                <div key={l} className="space-y-1">
                  <Label className="text-xs">{l}</Label>
                  <Input inputMode="decimal" value={v} onChange={(e) => s(e.target.value)} placeholder="0" />
                  <p className="text-[10px] leading-tight text-muted-foreground">{hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="v-city">Cidade / bairro</Label>
              <Input id="v-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Belo Horizonte - Centro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-phone">Seu WhatsApp para contato</Label>
              <Input id="v-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(31) 99999-9999" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="v-details">Detalhes (um por linha)</Label>
            <Textarea id="v-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={"Bateria 89%\nCom caixa e carregador\nSem marcas de uso"} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="v-desc">Descrição do anúncio</Label>
              <Button type="button" size="sm" variant="outline" onClick={generateText}><Sparkles className="h-4 w-4" /> Gerar descrição</Button>
            </div>
            <Textarea id="v-desc" rows={8} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Toque em 'Gerar descrição' para montar um anúncio no estilo Marketplace, ou escreva o seu." />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <Label>Foto do produto</Label>
            <label className="mt-2 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40">
              {image ? <img src={image} alt="Foto do produto" className="h-full w-full object-cover" />
                : uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                : <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><Photo className="h-6 w-6" />Toque para enviar</span>}
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            {prices.mid > 0 && (
              <div className="mt-3 text-sm">
                {prices.max > prices.mid && <p className="text-xs text-muted-foreground line-through">{brl(prices.max)}</p>}
                <p className="text-lg font-bold text-primary">{brl(prices.mid)}</p>
                {prices.min > 0 && <p className="text-xs text-muted-foreground">Você aceita até {brl(prices.min)} na negociação</p>}
              </div>
            )}
          </div>
          <Button type="submit" className="h-12 w-full" disabled={saving || uploading}>
            {saving ? "Salvando..." : "Cadastrar e anunciar"}
          </Button>
          <p className="text-xs text-muted-foreground">
            O produto entra na sua lista de <Link to="/produtos" className="underline">Produtos</Link> e é anunciado nos seus <Link to="/horarios" className="underline">Horários</Link>. Os compradores falam direto com você no WhatsApp.
          </p>
        </aside>
      </form>
    </div>
  );
}
