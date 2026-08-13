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

const openers = [
  "🔥 ACHADO DO DIA",
  "⚡ OFERTA RELÂMPAGO",
  "🚨 PREÇO DESPENCOU",
  "💥 PROMOÇÃO IMPERDÍVEL",
];

const closers = [
  "Corre que é por tempo limitado! 🏃‍♂️",
  "Estoque baixo, garanta o seu 👇",
  "Promoção pode acabar a qualquer momento ⏳",
  "Aproveita antes que volte o preço 😱",
];

export function generateSalesMessage(product: Product, variation = 0) {
  const off = discountPercent(Number(product.old_price), Number(product.price));
  const opener = openers[variation % openers.length];
  const closer = closers[variation % closers.length];
  return [
    `${opener} — ${platformLabel(product.platform)}`,
    "",
    `*${product.name}*`,
    "",
    `~De ${brl(Number(product.old_price))}~`,
    `✅ Por *${brl(Number(product.price))}*${off ? `  (${off}% OFF)` : ""}`,
    "",
    `🛒 ${product.link}`,
    "",
    closer,
  ].join("\n");
}
