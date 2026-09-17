export type Product = {
  id: string;
  user_id: string;
  name: string;
  platform: string;
  old_price: number;
  price: number;
  link: string;
  image_url: string | null;
  category: string | null;
  created_at: string;
};

export type Group = {
  id: string;
  user_id: string;
  name: string;
  whatsapp_gid: string;
  role: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  user_id: string;
  time: string;
  repeat: string;
  group_ids: string[];
  category: string | null;
  created_at: string;
};

export const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number.isFinite(value) ? value : 0,
  );

export function discountPercent(oldPrice: number, price: number) {
  if (!oldPrice || oldPrice <= 0 || price < 0 || price >= oldPrice) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export const platformLabel = (platform: string) =>
  platform === "mercadolivre" ? "Mercado Livre" : "Shopee";

export const repeatLabel = (repeat: string) =>
  repeat === "weekdays" ? "Dias úteis" : "Todos os dias";

export type MessageStyle = "urgencia" | "pergunta" | "beneficio" | "storytelling" | "social";

export const styleLabel: Record<MessageStyle, string> = {
  urgencia: "Urgência",
  pergunta: "Pergunta",
  beneficio: "Benefício direto",
  storytelling: "Relato rápido",
  social: "Prova social",
};

const openers: { text: string; style: MessageStyle }[] = [
  { text: "🔥 ACHADO DO DIA", style: "urgencia" },
  { text: "⚡ OFERTA RELÂMPAGO", style: "urgencia" },
  { text: "🚨 PREÇO DESPENCOU", style: "urgencia" },
  { text: "💥 PROMOÇÃO IMPERDÍVEL", style: "urgencia" },
  { text: "⏰ ÚLTIMAS HORAS NESSE PREÇO", style: "urgencia" },
  { text: "🤔 JÁ TAVA PRECISANDO DISSO?", style: "pergunta" },
  { text: "👀 QUEM TAVA ESPERANDO BAIXAR?", style: "pergunta" },
  { text: "💭 CANSADO DE PAGAR CARO NISSO?", style: "pergunta" },
  { text: "✅ RESOLVE NA HORA", style: "beneficio" },
  { text: "🙋 PRA FACILITAR O DIA A DIA", style: "beneficio" },
  { text: "🎯 OFERTA QUE VALE A PENA", style: "beneficio" },
  { text: "📝 ACHEI ESSE AQUI NAVEGANDO E VIM AVISAR", style: "storytelling" },
  { text: "🗣️ CHEGOU PEDIDO DE INDICAÇÃO — SEGUE", style: "storytelling" },
  { text: "👥 A GALERA TÁ COMPRANDO ESSE AQUI", style: "social" },
  { text: "🌟 OFERTA DO MOMENTO", style: "social" },
];

const closers: { text: string; style: MessageStyle }[] = [
  { text: "Corre que é por tempo limitado! 🏃‍♂️", style: "urgencia" },
  { text: "Estoque baixo, garanta o seu 👇", style: "urgencia" },
  { text: "Promoção pode acabar a qualquer momento ⏳", style: "urgencia" },
  { text: "Aproveita antes que volte o preço 😱", style: "urgencia" },
  { text: "Vale a pena conferir 👉", style: "beneficio" },
  { text: "Simples, útil e no precinho ✨", style: "beneficio" },
  { text: "Dá uma olhada nessa promoção 👀", style: "pergunta" },
  { text: "Confere aí e me conta o que achou 🙌", style: "pergunta" },
  { text: "Achei que ia gostar, olha só 👉", style: "storytelling" },
  { text: "Vale conferir antes que suba de novo 📈", style: "storytelling" },
  { text: "Tá bombando por aqui 🔥", style: "social" },
  { text: "Bastante gente já garantiu o seu 🙌", style: "social" },
];

function pickIndices(poolSize: number, count: number, seedOffset = 0): number[] {
  // Embaralha de forma determinística a partir de um offset, sem repetir índice
  // dentro do mesmo lote — puramente local, sem custo de API.
  const indices = Array.from({ length: poolSize }, (_, i) => (i + seedOffset) % poolSize);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
  return indices.slice(0, Math.min(count, poolSize));
}

const FALLBACK_OPENER = openers[0]!;
const FALLBACK_CLOSER = closers[0]!;

export function generateSalesMessage(product: Product, variation = 0, style?: MessageStyle) {
  const off = discountPercent(Number(product.old_price), Number(product.price));
  const openerPool = style ? openers.filter((o) => o.style === style) : openers;
  const closerPool = style ? closers.filter((c) => c.style === style) : closers;
  const opener = (openerPool.length ? openerPool[variation % openerPool.length] : undefined) ?? FALLBACK_OPENER;
  const closer = (closerPool.length ? closerPool[variation % closerPool.length] : undefined) ?? FALLBACK_CLOSER;
  return [
    `${opener.text} — ${platformLabel(product.platform)}`,
    "",
    `*${product.name}*`,
    "",
    `~De ${brl(Number(product.old_price))}~`,
    `✅ Por *${brl(Number(product.price))}*${off ? `  (${off}% OFF)` : ""}`,
    "",
    `🛒 ${product.link}`,
    "",
    closer.text,
  ].join("\n");
}

export type SalesMessageVariant = { message: string; style: MessageStyle };

/** Gera várias variações de uma vez, sem repetir combinação de estilo dentro do lote. Zero custo — tudo local. */
export function generateSalesMessages(product: Product, count = 3, seedOffset = 0): SalesMessageVariant[] {
  const idxs = pickIndices(openers.length, count, seedOffset);
  return idxs.map((i) => ({
    message: generateSalesMessage(product, i),
    style: (openers[i] ?? FALLBACK_OPENER).style,
  }));
}
