import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// Avisa o usuário (in-app + push, via send-push) quando um grupo não entra
// porque bateu no limite do plano. Sem isso, o grupo só falha em silêncio
// no upsert e some sem explicação (veio de webhook, não tem toast na tela).
async function notificarLimiteAtingido(supabaseUrl: string, userId: string) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: Deno.env.get("INTERNAL_TRIGGER_SECRET")!,
        user_id: userId,
        title: "🚀 Limite de grupos atingido",
        message:
          "Esse grupo do Telegram não foi adicionado porque seu plano bateu o limite (WhatsApp + Telegram). Faça upgrade pro plano com grupos ilimitados.",
      }),
    });
  } catch (e) {
    console.error("Erro ao notificar limite de grupos:", String(e));
  }
}

Deno.serve(async (req) => {
  try {
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
    const receivedSecret = req.headers.get("x-telegram-bot-api-secret-token");

    if (receivedSecret !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Quando um grupo comum vira supergrupo (ex: ao promover o bot a admin,
    // ou automaticamente pelo Telegram), o Telegram TROCA o chat_id e avisa
    // via "migrate_to_chat_id" numa mensagem de servico no chat antigo.
    // Sem tratar isso, criamos um registro duplicado em vez de atualizar o
    // que ja existe. Aqui a gente so migra o chat_id da linha existente.
    const migrateToChatId = update.message?.migrate_to_chat_id;
    if (migrateToChatId) {
      const oldChatId = update.message.chat.id;
      await supabaseAdmin
        .from("telegram_groups")
        .update({ chat_id: migrateToChatId, updated_at: new Date().toISOString() })
        .eq("chat_id", oldChatId);
      return new Response("OK", { status: 200 });
    }

    // O payload do Telegram nao diz "de qual usuario e esse bot" diretamente.
    // Como cada bot tem um bot_id unico (salvo em telegram_connections no momento
    // da conexao), usamos o proprio bot_id que aparece no evento pra achar o dono.
    if (update.my_chat_member) {
      const chatMember = update.my_chat_member;
      const chat = chatMember.chat; // grupo/canal
      const newStatus = chatMember.new_chat_member?.status; // 'member' | 'administrator' | 'left' | 'kicked'
      const targetBotId = chatMember.new_chat_member?.user?.id;

      if (chat?.type === "group" || chat?.type === "supergroup") {
        const { data: connection } = await supabaseAdmin
          .from("telegram_connections")
          .select("user_id")
          .eq("bot_id", targetBotId)
          .maybeSingle();

        if (connection) {
          const isActive = newStatus === "member" || newStatus === "administrator";
          const isAdmin = newStatus === "administrator";

          if (isActive) {
            const { error: upsertError } = await supabaseAdmin.from("telegram_groups").upsert(
              {
                user_id: connection.user_id,
                chat_id: chat.id,
                chat_title: chat.title,
                bot_is_admin: isAdmin,
                status: "active",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id,chat_id" }
            );

            if (upsertError && upsertError.message?.includes("Limite de")) {
              await notificarLimiteAtingido(Deno.env.get("SUPABASE_URL")!, connection.user_id);
            }
          } else {
            await supabaseAdmin
              .from("telegram_groups")
              .update({ status: "removed", updated_at: new Date().toISOString() })
              .eq("user_id", connection.user_id)
              .eq("chat_id", chat.id);
          }
        }
      }
    }

    // Telegram exige 200 OK rapido, senao reenvia o update
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Erro em telegram-webhook:", err);
    return new Response("OK", { status: 200 });
  }
});
