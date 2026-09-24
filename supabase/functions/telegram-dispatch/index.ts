// supabase/functions/telegram-dispatch/index.ts
//
// Disparado a cada minuto pelo pg_cron (via pg_net), sem depender do Render —
// exatamente a decisão de arquitetura combinada desde o início do projeto.
// Aceita duas formas de autorização (qualquer uma libera):
// 1) header x-cron-secret == CRON_SECRET (mesmo secret que abandoned-cart-emails já usa)
// 2) body.secret == INTERNAL_TRIGGER_SECRET (mesmo secret que send-push já usa)
// Isso evita depender de um único secret e reaproveita o que o projeto já tem configurado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { gerarParaGrupoTelegram, type Produto } from "./agente-telegram.ts";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_TRIGGER_SECRET");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ─── Envio via API do Telegram, com retry (mesma ideia do enviarMensagem do bot.js) ─
async function enviarTelegram(botToken: string, chatId: number, texto: string, imageUrl: string | null) {
  const tentarUmaVez = async () => {
    if (imageUrl) {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: texto, parse_mode: "HTML" }),
      });
      return res.json();
    }
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto, parse_mode: "HTML" }),
    });
    return res.json();
  };

  let ultimoErro: string | null = null;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const resultado = await tentarUmaVez();
    if (resultado.ok) return { ok: true };

    ultimoErro = resultado.description || "Erro desconhecido do Telegram";
    const ehErroDePermissao =
      resultado.error_code === 403 || /kicked|blocked|not enough rights|no rights/i.test(ultimoErro);
    if (ehErroDePermissao) break; // não adianta tentar de novo
    if (tentativa < 3) await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false, error: ultimoErro };
}

Deno.serve(async (req) => {
  const headerSecret = req.headers.get("x-cron-secret");
  const body = await req.json().catch(() => null);

  const autorizadoPorHeader = Boolean(headerSecret && CRON_SECRET && headerSecret === CRON_SECRET);
  const autorizadoPorBody = Boolean(body && INTERNAL_SECRET && body.secret === INTERNAL_SECRET);

  if (!autorizadoPorHeader && !autorizadoPorBody) {
    return new Response(JSON.stringify({ ok: false, error: "não autorizado" }), { status: 401 });
  }

  // Hora certa de Brasília, não a do servidor (que roda em UTC)
  const agora = new Date();
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(agora);

  const hora = Number(partes.find((p) => p.type === "hour")?.value ?? "0");
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "00";
  const horaAtualStr = `${String(hora).padStart(2, "0")}:${minuto}`;
  const diasMap: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6, sab: 6 };
  const diaSemanaStr = (partes.find((p) => p.type === "weekday")?.value ?? "").toLowerCase().replace(".", "");
  const diaSemana = diasMap[diaSemanaStr] ?? agora.getUTCDay();
  const ehDiaUtil = diaSemana >= 1 && diaSemana <= 5;

  // Só horários que têm pelo menos 1 grupo do Telegram marcado
  const { data: schedules, error: schedulesError } = await supabase
    .from("schedules")
    .select("id, user_id, time, repeat, category, telegram_group_ids")
    .eq("time", horaAtualStr)
    .not("telegram_group_ids", "eq", "{}");

  if (schedulesError) {
    console.error("Erro ao buscar schedules:", schedulesError.message);
    return new Response(JSON.stringify({ ok: false, error: schedulesError.message }), { status: 500 });
  }

  const schedulesValidos = (schedules ?? []).filter((s) => s.repeat === "daily" || (s.repeat === "weekdays" && ehDiaUtil));

  let disparos = 0;
  let falhas = 0;

  for (const schedule of schedulesValidos) {
    // Bot conectado desse usuário
    const { data: connection } = await supabase
      .from("telegram_connections")
      .select("bot_token, status")
      .eq("user_id", schedule.user_id)
      .maybeSingle();

    if (!connection || connection.status !== "connected") {
      console.log(`⚠️  Schedule ${schedule.id}: usuário sem bot Telegram conectado, pulando.`);
      continue;
    }

    // Grupos marcados nesse horário, só os que ainda estão ativos e com bot admin
    const { data: grupos } = await supabase
      .from("telegram_groups")
      .select("id, chat_id, chat_title, bot_is_admin, status")
      .in("id", schedule.telegram_group_ids)
      .eq("status", "active")
      .eq("bot_is_admin", true);

    if (!grupos || grupos.length === 0) continue;

    // Produtos do usuário, no mesmo formato que o agente espera
    const { data: produtosRaw } = await supabase
      .from("products")
      .select("id, name, old_price, price, link, image_url, category")
      .eq("user_id", schedule.user_id);

    const produtos: Produto[] = (produtosRaw ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      oldPrice: p.old_price,
      price: p.price,
      link: p.link,
      imageUrl: p.image_url,
      category: p.category,
    }));

    if (produtos.length === 0) continue;

    // Compartilhado entre todos os grupos DESTE horário — mesma regra do WhatsApp
    const usadosNesteCiclo = new Set<string>();

    for (const grupo of grupos) {
      const msg = await gerarParaGrupoTelegram(
        supabase,
        produtos,
        hora,
        diaSemana,
        grupo.chat_title ?? "",
        String(grupo.chat_id),
        schedule.category,
        usadosNesteCiclo,
      );

      if (!msg) continue;

      const envio = await enviarTelegram(connection.bot_token, grupo.chat_id, msg.mensagem, msg.imageUrl);

      await supabase.from("message_logs").insert({
        user_id: schedule.user_id,
        group_id: String(grupo.chat_id),
        group_name: grupo.chat_title,
        status: envio.ok ? "enviado" : "erro",
        error_message: envio.ok ? null : envio.error,
        platform: "telegram",
      });

      if (envio.ok) disparos++;
      else falhas++;
    }
  }

  return new Response(JSON.stringify({ ok: true, schedules_processados: schedulesValidos.length, disparos, falhas }), {
    headers: { "Content-Type": "application/json" },
  });
});
