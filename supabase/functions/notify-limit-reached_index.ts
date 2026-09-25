import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Endpoint fino, chamado pelo front-end quando um insert é rejeitado pelo
// trigger de limite de plano (mensagem "Limite de ... grupo(s)..."). O
// user_id vem sempre do token de quem chamou (nunca do corpo da requisição),
// pra ninguém conseguir mandar notificação em nome de outro usuário.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // "canal" só ajusta o texto da mensagem — não afeta quem recebe.
    const body = await req.json().catch(() => ({}));
    const canal = body?.canal === "telegram" ? "Telegram" : "WhatsApp";

    const resp = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: Deno.env.get("INTERNAL_TRIGGER_SECRET")!,
        user_id: userData.user.id,
        title: "🚀 Limite de grupos atingido",
        message: `Você bateu o limite de grupos (WhatsApp + Telegram) do seu plano ao tentar adicionar um grupo pelo ${canal}. Faça upgrade pro plano com grupos ilimitados.`,
      }),
    });
    const result = await resp.json().catch(() => null);

    return new Response(JSON.stringify({ ok: resp.ok, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro em notify-limit-reached:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
