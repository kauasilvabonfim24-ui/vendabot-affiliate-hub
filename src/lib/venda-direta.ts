import { brl } from "@/lib/vendabot";

export type Condition = "novo" | "seminovo" | "usado";
export const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "novo", label: "Novo" },
  { value: "seminovo", label: "Seminovo" },
  { value: "usado", label: "Usado" },
];

// Fator sobre o preço de loja: [máximo, médio, mínimo]
const FACTORS: Record<Condition, [number, number, number]> = {
  novo: [0.95, 0.85, 0.75],
  seminovo: [0.8, 0.7, 0.6],
  usado: [0.65, 0.55, 0.45],
};

const round = (v: number) => (v >= 100 ? Math.round(v / 10) * 10 : Math.round(v));

export function suggestPrices(storePrice: number, condition: Condition) {
  if (!Number.isFinite(storePrice) || storePrice <= 0) return null;
  const [a, b, c] = FACTORS[condition];
  return { max: round(storePrice * a), mid: round(storePrice * b), min: round(storePrice * c) };
}

export function whatsappLink(digits: string, productName: string) {
  const full = digits.length <= 11 ? `55${digits}` : digits;
  const msg = encodeURIComponent(`Olá! Vi seu anúncio do ${productName}. Ainda está disponível?`);
  return `https://wa.me/${full}?text=${msg}`;
}

export function buildListingText(p: {
  name: string; condition: Condition; category: string; details: string; city: string;
  prices: { max: number; mid: number };
}) {
  const cond = CONDITIONS.find((c) => c.value === p.condition)?.label ?? "";
  const lines = p.details.split("\n").map((l) => l.trim()).filter(Boolean);
  return [
    `📦 ${p.name} — ${cond}`,
    "",
    ...(lines.length ? ["✅ Detalhes:", ...lines.map((l) => `• ${l}`), ""] : []),
    p.prices.mid ? `💰 ${p.prices.max > p.prices.mid ? `De ${brl(p.prices.max)} por ` : ""}${brl(p.prices.mid)}` : "",
    p.city ? `📍 ${p.city}` : "",
    `🏷️ Categoria: ${p.category}`,
    "",
    "Aceito propostas! Chama no WhatsApp 👇",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}
