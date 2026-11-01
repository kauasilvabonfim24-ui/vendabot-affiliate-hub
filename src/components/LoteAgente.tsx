import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconSparkles as Sparkles, IconPhoto as Photo, IconLoader2 as Loader2,
  IconPencil as Pencil, IconArrowBackUp as Undo, IconAlertTriangle as Alerta,
  IconCircleCheck as Ok, IconX as X,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl, platformLabel, type Product } from "@/lib/vendabot";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Resposta da edge function agente-produtos
type Resposta = {
  ok: boolean;
  status: string;
  motivo?: string;
  observacao?: string | null;
  produto?: Record<string, unknown>;
  produto_existente?: { id: string; name: string };
};

type ItemLote = {
  key: string;
  texto: string;
  file: File | null;
  preview: string | null;
  estado: "enviando" | "salvo" | "duvida" | "duplicado" | "erro";
  motivo?: string;
  observacao?: string | null;
  produto?: Product & { cta?: string | null };
};

// ─── Foto: reduz e corta sozinho as faixas pretas de print (relógio, "X", "1/1") ───
function recorteSemBarrasPretas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const { data } = ctx.getImageData(0, 0, w, h);
  const escuro = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return (data[i]! * 0.299 + data[i + 1]! * 0.587 + data[i + 2]! * 0.114) < 40;
  };
  const fracaoLinha = (y: number) => {
    let n = 0;
    let total = 0;
    for (let x = 0; x < w; x += 2) {
      total++;
      if (escuro(x, y)) n++;
    }
    return n / total;
  };
  const fracaoColuna = (x: number, y0: number, y1: number) => {
    let n = 0;
    let total = 0;
    for (let y = y0; y <= y1; y += 2) {
      total++;
      if (escuro(x, y)) n++;
    }
    return total ? n / total : 1;
  };

  let top = 0;
  while (top < h && fracaoLinha(top) > 0.9) top++;
  if (top >= h) return { x: 0, y: 0, w, h }; // imagem toda escura: não corta
  let bottom = h - 1;
  while (bottom > top && fracaoLinha(bottom) > 0.9) bottom--;
  let left = 0;
  while (left < w && fracaoColuna(left, top, bottom) > 0.9) left++;
  let right = w - 1;
  while (right > left && fracaoColuna(right, top, bottom) > 0.9) right--;

  const nw = right - left + 1;
  const nh = bottom - top + 1;
  const cortouPouco = nw * nh > w * h * 0.98;
  const sobrouPouco = nw < w * 0.25 || nh < h * 0.25;
  if (cortouPouco || sobrouPouco) return { x: 0, y: 0, w, h };
  return { x: left, y: top, w: nw, h: nh };
}

async function prepararImagem(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Não consegui abrir a imagem."));
      i.src = url;
    });
    const escala = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * escala));
    const h = Math.max(1, Math.round(img.naturalHeight * escala));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const area = recorteSemBarrasPretas(ctx, w, h);
    const saida = document.createElement("canvas");
    saida.width = area.w;
    saida.height = area.h;
    const sctx = saida.getContext("2d");
    if (!sctx) return file;
    sctx.drawImage(canvas, area.x, area.y, area.w, area.h, 0, 0, area.w, area.h);
    const blob = await new Promise<Blob | null>((res) => saida.toBlob(res, "image/jpeg", 0.88));
    return blob ?? file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function caminhoNoStorage(url: string | null): string | null {
  if (!url) return null;
  const marcador = "/product-images/";
  const idx = url.indexOf(marcador);
  return idx === -1 ? null : url.slice(idx + marcador.length);
}

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onEditar: (p: Product) => void;
};

export function LoteAgente({ aberto, onFechar, onEditar }: Props) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<string | null>(null);
  const [itens, setItens] = useState<ItemLote[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Fila: um produto por vez (respeita o limite de uso da IA e mantém a ordem)
  const fila = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!arquivo) {
      setPreviewArquivo(null);
      return;
    }
    const url = URL.createObjectURL(arquivo);
    setPreviewArquivo(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  const atualizar = (key: string, mudancas: Partial<ItemLote>) =>
    setItens((lista) => lista.map((i) => (i.key === key ? { ...i, ...mudancas } : i)));

  async function processar(item: ItemLote) {
    let caminho: string | null = null;
    try {
      let imageUrl: string | null = null;
      if (item.file) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) throw new Error("Sessão expirada, faça login de novo.");
        const blob = await prepararImagem(item.file);
        caminho = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { error: upError } = await supabase.storage
          .from("product-images")
          .upload(caminho, blob, { contentType: "image/jpeg", upsert: false });
        if (upError) throw upError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(caminho).data.publicUrl;
      }

      const { data, error } = await supabase.functions.invoke("agente-produtos", {
        body: { text: item.texto, image_url: imageUrl },
      });
      if (error) throw new Error("Não consegui falar com o agente. Tente de novo.");

      const r = data as Resposta;
      if (r.ok && r.produto) {
        atualizar(item.key, {
          estado: "salvo",
          produto: r.produto as unknown as NonNullable<ItemLote["produto"]>,
          observacao: r.observacao ?? null,
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        return;
      }

      // Não salvou: apaga a foto que acabou de subir pra não deixar lixo no storage
      if (caminho) await supabase.storage.from("product-images").remove([caminho]);
      const estado = r.status === "duvida" ? "duvida" : r.status === "duplicado" ? "duplicado" : "erro";
      const motivo =
        r.status === "duplicado" && r.produto_existente
          ? `Esse link já está cadastrado: ${r.produto_existente.name}`
          : r.motivo || "Não consegui cadastrar esse produto.";
      atualizar(item.key, { estado, motivo });
    } catch (e) {
      if (caminho) await supabase.storage.from("product-images").remove([caminho]);
      atualizar(item.key, {
        estado: "erro",
        motivo: e instanceof Error ? e.message : "Erro ao cadastrar o produto.",
      });
    }
  }

  function enviar() {
    const t = texto.trim();
    if (!t) {
      toast.error("Cole o link (e o preço) do produto.");
      return;
    }
    const item: ItemLote = {
      key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      texto: t,
      file: arquivo,
      preview: arquivo ? URL.createObjectURL(arquivo) : null,
      estado: "enviando",
    };
    setItens((lista) => [item, ...lista]);
    setTexto("");
    setArquivo(null);
    if (inputRef.current) inputRef.current.value = "";
    fila.current = fila.current.then(() => processar(item)).catch(() => undefined);
  }

  function tentarDeNovo(item: ItemLote) {
    setTexto(item.texto);
    setArquivo(item.file);
    setItens((lista) => lista.filter((i) => i.key !== item.key));
  }

  async function desfazer(item: ItemLote) {
    const p = item.produto;
    if (!p) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const caminho = caminhoNoStorage(p.image_url ?? null);
    if (caminho) await supabase.storage.from("product-images").remove([caminho]);
    setItens((lista) => lista.filter((i) => i.key !== item.key));
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Produto desfeito");
  }

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Sparkles className="h-5 w-5 text-primary" />
            Lote com agente
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Um produto por vez: cole o texto de compartilhar (ou o link + preço) e escolha a foto. O agente
            organiza o nome, a chamada e a categoria e salva sozinho. Se tiver dúvida, ele avisa e não salva.
          </p>

          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            placeholder={'Ex.: Dê uma olhada em Kit Conjunto... por R$59,90. Compre na Shopee agora! https://s.shopee.com.br/...\nOu: https://vt.tiktok.com/... 49,90'}
          />

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3">
            {previewArquivo ? (
              <img src={previewArquivo} alt="Foto escolhida" className="h-14 w-14 rounded-lg border border-border object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40">
                <Photo className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="gap-2">
              <Photo className="h-4 w-4" />
              {arquivo ? "Trocar foto" : "Escolher foto / print"}
            </Button>
            {arquivo && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setArquivo(null)} aria-label="Tirar foto">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Print com faixa preta, relógio ou "1/1" tudo bem: o app corta sozinho.
          </p>

          <Button type="button" onClick={enviar} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Mandar pro agente
          </Button>
        </div>

        {itens.length > 0 && (
          <ul className="mt-6 space-y-3">
            {itens.map((item) => (
              <li key={item.key} className="rounded-xl border border-border bg-card p-3">
                {item.estado === "enviando" && (
                  <div className="flex items-center gap-3">
                    {item.preview && <img src={item.preview} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Agente trabalhando...</p>
                  </div>
                )}

                {item.estado === "salvo" && item.produto && (
                  <div className="flex gap-3">
                    {item.produto.image_url ? (
                      <img src={item.produto.image_url} alt={item.produto.name} className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover" />
                    ) : (
                      <div className="h-14 w-14 shrink-0 rounded-lg border border-border bg-secondary" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Ok className="h-3.5 w-3.5" /> Salvo · {platformLabel(item.produto.platform)}
                      </p>
                      <p className="mt-0.5 text-sm font-medium">{item.produto.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Number(item.produto.old_price) > Number(item.produto.price) && (
                          <span className="mr-1 line-through">{brl(Number(item.produto.old_price))}</span>
                        )}
                        <span className="font-semibold text-primary">{brl(Number(item.produto.price))}</span>
                        {item.produto.category && <span className="ml-2 rounded-full bg-ai/15 px-2 py-0.5 text-ai">{item.produto.category}</span>}
                      </p>
                      {item.produto.cta && <p className="mt-1 text-xs italic text-muted-foreground">{item.produto.cta}</p>}
                      {item.observacao && <p className="mt-1 text-[11px] text-muted-foreground">Obs.: {item.observacao}</p>}
                      <div className="mt-2 flex gap-2">
                        <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={() => { onFechar(); onEditar(item.produto!); }}>
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="h-8 gap-1 text-destructive" onClick={() => desfazer(item)}>
                          <Undo className="h-3.5 w-3.5" /> Desfazer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {(item.estado === "duvida" || item.estado === "duplicado" || item.estado === "erro") && (
                  <div className="flex gap-3">
                    {item.preview && <img src={item.preview} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 text-xs font-medium text-amber-500">
                        <Alerta className="h-3.5 w-3.5" />
                        {item.estado === "duplicado" ? "Já cadastrado" : item.estado === "duvida" ? "Não salvei: tive dúvida" : "Não deu certo"}
                      </p>
                      <p className="mt-0.5 text-sm">{item.motivo}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{item.texto}</p>
                      <div className="mt-2 flex gap-2">
                        {item.estado !== "duplicado" && (
                          <Button type="button" size="sm" variant="outline" className="h-8" onClick={() => tentarDeNovo(item)}>
                            Corrigir e mandar de novo
                          </Button>
                        )}
                        <Button type="button" size="sm" variant="ghost" className="h-8" onClick={() => setItens((l) => l.filter((i) => i.key !== item.key))}>
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
