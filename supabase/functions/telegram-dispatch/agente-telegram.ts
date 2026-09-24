// supabase/functions/telegram-dispatch/agente-telegram.ts
//
// Port fiel de agente.js (repositório VENDABOT, o do bot.js/WhatsApp) pro
// TypeScript, rodando dentro de uma edge function em vez de um processo Node
// sempre ligado. A diferença estrutural principal: no bot.js o histórico de
// round-robin fica em memória (carregado uma vez na subida do processo,
// persistido em background). Aqui, como cada chamada da edge function é
// independente (sem processo persistente), o histórico é carregado do banco
// no INÍCIO de cada geração de mensagem e salvo no FINAL — sempre via await,
// nunca fire-and-forget, pra garantir que persiste antes da function acabar.
//
// Reaproveita a MESMA tabela `agente_historico` que o WhatsApp já usa,
// indexada por grupo_id. Não há risco de colisão: os grupos do WhatsApp usam
// ids tipo "1203xxxx@g.us" e os do Telegram são números (ex: -1003820010481),
// guardados aqui como string — nunca vão bater no mesmo valor.

// deno-lint-ignore-file no-explicit-any

export type Produto = {
  id: string;
  name: string;
  oldPrice: number | string;
  price: number | string;
  link: string;
  imageUrl: string | null;
  category: string | null;
};

type Historico = {
  produtosRodada: Set<string>;
  copysRodada: { geral: Set<number>; motoboy: Set<number> };
  ultimoProduto: string | null;
  ultimaCopy: { geral: number | null; motoboy: number | null };
};

// ─── COPYS GERAIS (20 modelos, estilos variados — idêntico ao agente.js) ────
const COPYS_GERAIS = [
  `🌞 *{SAUDACAO}! TEM OFERTA BOA HOJE!* 🌞\n🔥 *{NOME}* 🔥\n💰 De: ~~R$ {PRECO_ANTIGO}~~\n✅ Por apenas: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⏳ Aproveite enquanto a promoção estiver disponível.\n👉 Confira aqui:\n{LINK}`,
  `🚨 *ACHADO DO DIA!* 🚨\n👀 Encontrei essa promoção e vim compartilhar!\n📦 *{NOME}*\n❌ De: ~~R$ {PRECO_ANTIGO}~~\n💥 Hoje por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 Veja antes que o estoque acabe!\n{LINK}`,
  `☀️ *{SAUDACAO}, PESSOAL!*\n🔥 Promoção disponível!\n📦 *{NOME}*\n💰 ~~R$ {PRECO_ANTIGO}~~\n✅ Agora por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⚡ Vale a pena conferir.\n👉 {LINK}`,
  `🎁 *OFERTA ESPECIAL DO DIA* 🎁\n🔥 *{NOME}*\n💸 De: ~~R$ {PRECO_ANTIGO}~~\n💚 Por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👀 Aproveite enquanto durar.\n👉 {LINK}`,
  `🚀 *PROMOÇÃO LIBERADA!*\n📦 *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~\n🔥 Por apenas *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⏳ O preço pode mudar a qualquer momento.\n👉 {LINK}`,
  `💥 *SUPER OFERTA!* 💥\n🛍️ *{NOME}*\n❌ ~~R$ {PRECO_ANTIGO}~~\n✅ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👀 Dá uma olhada nessa promoção.\n👉 {LINK}`,
  `📢 *PROMOÇÃO RELÂMPAGO!*\n🔥 *{NOME}*\n💲 De: ~~R$ {PRECO_ANTIGO}~~\n💚 Agora: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⚠️ Aproveite enquanto o desconto estiver ativo.\n👉 {LINK}`,
  `🎯 *OFERTA QUE VALE A PENA!*\n📦 *{NOME}*\n💸 ~~R$ {PRECO_ANTIGO}~~ ➜ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n✨ Excelente oportunidade.\n👉 {LINK}`,
  `🔥 *CORRE QUE BAIXOU!*\n📦 *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~\n✅ Por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👀 Confere aí!\n👉 {LINK}`,
  `🌟 *OFERTA DO MOMENTO* 🌟\n📦 *{NOME}*\n💵 De: ~~R$ {PRECO_ANTIGO}~~\n🔥 Agora por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n🚀 Aproveite a promoção.\n👉 {LINK}`,
  `🤔 *Já tá precisando disso?*\n📦 *{NOME}*\n💰 Preço lá em cima: ~~R$ {PRECO_ANTIGO}~~\n✅ Aqui: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 Dá uma olhada:\n{LINK}`,
  `✅ *RESOLVE NA HORA!*\n📦 *{NOME}*\n💰 Sai por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n❌ Preço normal: ~~R$ {PRECO_ANTIGO}~~\n🙌 Prático, útil e no precinho.\n👉 {LINK}`,
  `📝 *Relato rápido:* achei esse aqui navegando e vim avisar.\n📦 *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~ por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 Vale conferir:\n{LINK}`,
  `⏰ *ÚLTIMAS HORAS DE PREÇO ASSIM!*\n🔥 *{NOME}*\n❌ ~~R$ {PRECO_ANTIGO}~~\n✅ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n🏃 Corre que não demora a voltar ao normal.\n👉 {LINK}`,
  `👀 *Quem aqui tava esperando baixar?*\n📦 *{NOME}*\n💸 ~~R$ {PRECO_ANTIGO}~~ ➜ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 Agora é a hora:\n{LINK}`,
  `🙋 *PRA FACILITAR O DIA A DIA*\n📦 *{NOME}*\n💰 De: ~~R$ {PRECO_ANTIGO}~~\n✅ Por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n✨ Simples e direto ao ponto.\n👉 {LINK}`,
  `🗣️ *Chegou pedido de indicação — segue!*\n📦 *{NOME}*\n💰 ~~R$ {PRECO_ANTIGO}~~ por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 Olha só:\n{LINK}`,
  `*{NOME}*\nDe R$ {PRECO_ANTIGO} por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\nLink pra garantir o preço:\n{LINK}`,
  `👥 *A galera tá comprando esse aqui!*\n📦 *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~\n✅ Por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 {LINK}`,
  `💭 *Cansado de pagar caro nisso?*\n📦 *{NOME}*\n❌ ~~R$ {PRECO_ANTIGO}~~\n✅ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 {LINK}`,
];

// ─── COPYS MOTOBOY (8 modelos — idêntico ao agente.js) ─────────────────────
const COPYS_MOTOBOY = [
  `🏍️ *ACHADO PARA MOTOCA!* 🏍️\n🔥 *{NOME}*\n💰 De: ~~R$ {PRECO_ANTIGO}~~\n✅ Por apenas: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⚡ Produto aprovado pelos irmãos do asfalto!\n👉 Confira:\n{LINK}`,
  `🛵 *PROMOÇÃO PRA QUEM TÁ NA RODA!* 🛵\n📦 *{NOME}*\n❌ ~~R$ {PRECO_ANTIGO}~~\n💥 Agora por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n🏍️ Essencial pra quem vive de moto!\n👉 {LINK}`,
  `🚨 *ATENÇÃO MOTOBOYS!* 🚨\n📢 Oferta imperdível chegou!\n🏍️ *{NOME}*\n💸 De: ~~R$ {PRECO_ANTIGO}~~\n💚 Por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⏳ Corre que é por tempo limitado!\n👉 {LINK}`,
  `⚡ *OFERTA RELÂMPAGO PARA MOTOCA!* ⚡\n🛵 *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~\n🔥 Por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n🏍️ Perfeito pra quem roda todo dia!\n👉 {LINK}`,
  `🔥 *OLHA ESSE ACHADO, MOTOCA!*\n📦 *{NOME}*\n💵 ~~R$ {PRECO_ANTIGO}~~ ➜ *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n🛵 Quem é da vida não pode perder!\n⏳ Aproveite enquanto tem!\n👉 {LINK}`,
  `🪖 *EQUIPAMENTO BOM E BARATO!* 🪖\n🏍️ *{NOME}*\n❌ De: ~~R$ {PRECO_ANTIGO}~~\n✅ Hoje por: *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n⚡ Segurança e economia andam juntas!\n👉 {LINK}`,
  `❓ *Motoboy, já tá com esse aí?*\n🏍️ *{NOME}*\n💰 De ~~R$ {PRECO_ANTIGO}~~\n✅ Por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 {LINK}`,
  `🗣️ *Motoboy aqui do grupo pediu indicação — segue!*\n🏍️ *{NOME}*\n💸 ~~R$ {PRECO_ANTIGO}~~ por *R$ {PRECO_ATUAL}*{DESCONTO_TAG}\n👉 {LINK}`,
];

// ─── CATEGORIAS POR HORÁRIO (idêntico ao agente.js) ─────────────────────────
const HORARIOS: Record<string, { min: number; max: number; cats: string[] }> = {
  manha: { min: 7, max: 10, cats: ["uso diario", "cafeteira", "termica", "mochila", "tenis", "roupa", "smartwatch", "fone", "maquiagem", "escova", "kit"] },
  almoco: { min: 11, max: 14, cats: ["impulso", "capinha", "power bank", "carregador", "bijuteria", "bolsa", "bone", "sandalia", "chinelo", "relogio"] },
  tarde: { min: 15, max: 18, cats: ["casa", "air fryer", "aspirador", "panela", "luminaria", "organizador", "decoracao", "espelho", "cabide"] },
  noite: { min: 19, max: 22, cats: ["eletronico", "smartphone", "notebook", "tv", "games", "headset", "tenis", "vestido", "perfume", "cosmetico", "joia", "bolsa feminina"] },
};

const DIAS_SEMANA: Record<number, string[]> = {
  0: ["esporte", "academia", "informatica", "marmita", "mochila", "smartwatch"], // Domingo
  5: ["churrasco", "som bluetooth", "games", "lazer", "cooler"], // Sexta
  6: ["moda", "casa", "tenis", "decoracao", "brinquedo", "pet", "roupa"], // Sábado
};

const SEMPRE_CONVERTE = ["air fryer", "robo aspirador", "smartwatch", "fone bluetooth", "carregador", "power bank", "tenis", "perfume", "bolsa", "mochila", "kit ferramentas", "caixa de som", "impressora", "projetor"];

// ─── HELPERS (idênticos ao agente.js) ───────────────────────────────────────
function normalizar(str: unknown): string {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getSaudacao(hora: number): string {
  if (hora >= 5 && hora < 12) return "BOM DIA";
  if (hora >= 12 && hora < 18) return "BOA TARDE";
  return "BOA NOITE";
}

export function calcularDesconto(precoAntigo: unknown, precoAtual: unknown): number {
  const a = parseFloat(String(precoAntigo).replace(",", "."));
  const b = parseFloat(String(precoAtual).replace(",", "."));
  if (!a || !b || a <= b) return 0;
  return Math.round(((a - b) / a) * 100);
}

function isMotoboy(produto: Produto): boolean {
  const palavras = ["motoboy", "moto", "delivery", "capacete", "luva", "jaqueta", "bag delivery", "suporte celular", "capa chuva", "bota moto", "cadeado moto", "farol", "buzina", "retrovisor"];
  const texto = normalizar((produto.category || "") + " " + (produto.name || ""));
  return palavras.some((c) => texto.includes(normalizar(c)));
}

function isGrupoMotoboy(nomeGrupo: string): boolean {
  const palavras = ["motoboy", "moto", "delivery", "motoca", "piloto", "rider", "capacete"];
  const texto = normalizar(nomeGrupo);
  return palavras.some((p) => texto.includes(normalizar(p)));
}

function getCategoriasPorContexto(hora: number, diaSemana: number): string[] {
  if (DIAS_SEMANA[diaSemana]) return DIAS_SEMANA[diaSemana];
  for (const v of Object.values(HORARIOS)) {
    if (hora >= v.min && hora < v.max) return v.cats;
  }
  return SEMPRE_CONVERTE;
}

function produtoMatchCategoria(produto: Produto, categorias: string[], categoriaForcada: string | null): boolean {
  const texto = normalizar((produto.category || "") + " " + (produto.name || ""));
  if (categoriaForcada) return texto.includes(normalizar(categoriaForcada));
  return categorias.some((c) => texto.includes(normalizar(c)));
}

// ─── ROUND-ROBIN (idêntico ao agente.js, só troca onde busca/salva o histórico) ─
function semRepetir(lista: Produto[], hist: Historico, usadosNesteCiclo: Set<string>): Produto[] {
  if (!lista.length) return lista;
  const foraDoDisparo = lista.filter((p) => !usadosNesteCiclo.has(p.id));
  const candidatos = foraDoDisparo.length ? foraDoDisparo : lista;

  const semRodada = candidatos.filter((p) => !hist.produtosRodada.has(p.id));
  if (semRodada.length) return semRodada;

  candidatos.forEach((p) => hist.produtosRodada.delete(p.id));
  const semORecente = candidatos.filter((p) => p.id !== hist.ultimoProduto);
  return semORecente.length ? semORecente : candidatos;
}

function escolherProduto(
  produtos: Produto[],
  hora: number,
  diaSemana: number,
  nomeGrupo: string,
  hist: Historico,
  categoriaForcada: string | null,
  usadosNesteCiclo: Set<string>,
): { produto: Produto; tipo: "geral" | "motoboy" } | null {
  const validos = produtos.filter((p) => p.oldPrice && p.price && p.link);
  if (!validos.length) return null;

  const ehMotoboy = isGrupoMotoboy(nomeGrupo);
  const categorias = getCategoriasPorContexto(hora, diaSemana);

  if (ehMotoboy) {
    const motoboys = semRepetir(validos.filter((p) => isMotoboy(p)), hist, usadosNesteCiclo);
    if (motoboys.length) return { produto: motoboys[Math.floor(Math.random() * motoboys.length)], tipo: "motoboy" };
    const qualquer = semRepetir(validos, hist, usadosNesteCiclo);
    if (qualquer.length) return { produto: qualquer[Math.floor(Math.random() * qualquer.length)], tipo: "motoboy" };
  }

  if (categoriaForcada) {
    const porCategoria = semRepetir(validos.filter((p) => produtoMatchCategoria(p, [], categoriaForcada)), hist, usadosNesteCiclo);
    if (porCategoria.length) return { produto: porCategoria[Math.floor(Math.random() * porCategoria.length)], tipo: "geral" };
  }

  const porHorario = semRepetir(validos.filter((p) => produtoMatchCategoria(p, categorias, null)), hist, usadosNesteCiclo);
  if (porHorario.length) return { produto: porHorario[Math.floor(Math.random() * porHorario.length)], tipo: "geral" };

  const disponiveis = semRepetir(validos, hist, usadosNesteCiclo);
  if (!disponiveis.length) return null;
  return { produto: disponiveis[Math.floor(Math.random() * disponiveis.length)], tipo: "geral" };
}

function escolherCopy(copys: string[], hist: Historico, tipo: "geral" | "motoboy"): number {
  const rodada = hist.copysRodada[tipo];
  let disponiveis = copys.map((_, i) => i).filter((i) => !rodada.has(i));
  if (!disponiveis.length) {
    rodada.clear();
    const ultima = hist.ultimaCopy[tipo];
    const semARecente = copys.map((_, i) => i).filter((i) => i !== ultima);
    disponiveis = semARecente.length ? semARecente : copys.map((_, i) => i);
  }
  const idx = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  rodada.add(idx);
  hist.ultimaCopy[tipo] = idx;
  return idx;
}

// ─── ESCAPE + CONVERSÃO DE FORMATAÇÃO PRO TELEGRAM ─────────────────────────
// O agente.js usa formatação do WhatsApp (*negrito*, ~~riscado~~). O Telegram
// (modo HTML) usa <b>negrito</b> e <s>riscado</s>. Convertemos DEPOIS de
// preencher o template — os valores dinâmicos (nome do produto, link) são
// escapados ANTES de entrar no template, pra nunca quebrar o HTML nem deixar
// o usuário injetar tag sem querer via nome de produto.
function escapeHtml(str: string): string {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function converterParaTelegramHtml(msg: string): string {
  return msg
    .replace(/~~([\s\S]+?)~~/g, "<s>$1</s>")
    .replace(/\*([^*\n]+)\*/g, "<b>$1</b>");
}

// ─── GERAR MENSAGEM (idêntico ao agente.js, com escape + conversão HTML) ────
function gerarMensagem(produto: Produto, tipo: "geral" | "motoboy", hist: Historico, hora: number) {
  const desconto = calcularDesconto(produto.oldPrice, produto.price);
  const precoAtual = parseFloat(String(produto.price).replace(",", ".")).toFixed(2).replace(".", ",");
  const precoAntigo = parseFloat(String(produto.oldPrice).replace(",", ".")).toFixed(2).replace(".", ",");
  const descontoTag = desconto > 0 ? ` (${desconto}% OFF)` : "";

  const copys = tipo === "motoboy" ? COPYS_MOTOBOY : COPYS_GERAIS;
  const idx = escolherCopy(copys, hist, tipo);

  hist.produtosRodada.add(produto.id);
  hist.ultimoProduto = produto.id;

  const template = copys[idx]
    .replace(/{SAUDACAO}/g, getSaudacao(hora))
    .replace(/{NOME}/g, escapeHtml(produto.name))
    .replace(/{PRECO_ANTIGO}/g, precoAntigo)
    .replace(/{PRECO_ATUAL}/g, precoAtual)
    .replace(/{DESCONTO_TAG}/g, descontoTag)
    .replace(/{LINK}/g, escapeHtml(produto.link));

  const mensagem = converterParaTelegramHtml(template);

  return { mensagem, imageUrl: produto.imageUrl || null, produto: produto.name, produtoId: produto.id, desconto };
}

// ─── HISTÓRICO: carregar/salvar na tabela agente_historico (compartilhada com o WhatsApp) ─
async function carregarHistorico(supabase: any, grupoId: string): Promise<Historico> {
  const hist: Historico = {
    produtosRodada: new Set(),
    copysRodada: { geral: new Set(), motoboy: new Set() },
    ultimoProduto: null,
    ultimaCopy: { geral: null, motoboy: null },
  };
  const { data, error } = await supabase
    .from("agente_historico")
    .select("*")
    .eq("grupo_id", grupoId)
    .maybeSingle();
  if (error || !data) return hist;

  hist.produtosRodada = new Set(data.produtos_rodada || []);
  hist.copysRodada.geral = new Set(data.copys_rodada_geral || []);
  hist.copysRodada.motoboy = new Set(data.copys_rodada_motoboy || []);
  hist.ultimoProduto = data.ultimo_produto ?? null;
  hist.ultimaCopy.geral = data.ultima_copy_geral ?? null;
  hist.ultimaCopy.motoboy = data.ultima_copy_motoboy ?? null;
  return hist;
}

async function salvarHistorico(supabase: any, grupoId: string, hist: Historico): Promise<void> {
  const { error } = await supabase.from("agente_historico").upsert(
    {
      grupo_id: grupoId,
      produtos_rodada: Array.from(hist.produtosRodada),
      copys_rodada_geral: Array.from(hist.copysRodada.geral),
      copys_rodada_motoboy: Array.from(hist.copysRodada.motoboy),
      ultimo_produto: hist.ultimoProduto,
      ultima_copy_geral: hist.ultimaCopy.geral,
      ultima_copy_motoboy: hist.ultimaCopy.motoboy,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "grupo_id" },
  );
  if (error) console.error(`⚠️  Agente Telegram: falha ao salvar histórico do grupo ${grupoId}:`, error.message);
}

// ─── FUNÇÃO PRINCIPAL (equivalente a gerarParaGrupo do agente.js) ──────────
export async function gerarParaGrupoTelegram(
  supabase: any,
  produtos: Produto[],
  hora: number,
  diaSemana: number,
  nomeGrupo: string,
  grupoId: string,
  categoriaForcada: string | null,
  usadosNesteCiclo: Set<string>,
) {
  const hist = await carregarHistorico(supabase, grupoId);

  const resultado = escolherProduto(produtos, hora, diaSemana, nomeGrupo, hist, categoriaForcada, usadosNesteCiclo);
  if (!resultado) {
    console.log("⚠️  Agente Telegram: sem produtos válidos pra esse grupo/contexto.");
    return null;
  }

  const msg = gerarMensagem(resultado.produto, resultado.tipo, hist, hora);
  usadosNesteCiclo.add(msg.produtoId);

  await salvarHistorico(supabase, grupoId, hist);

  console.log(`🧠 Agente Telegram → Grupo: "${nomeGrupo}" | Produto: ${msg.produto} | Desconto: ${msg.desconto}% | Tipo: ${resultado.tipo}`);

  return msg;
}
