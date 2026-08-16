import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BotStatusRow = {
  user_id: string;
  status: "requested" | "qr" | "connected" | "disconnected" | string;
  qr_code: string | null;
  updated_at: string;
};

export function useBotStatus() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bot_status"],
    queryFn: async (): Promise<BotStatusRow | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from("bot_status" as never)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BotStatusRow | null;
    },
  });

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data: userData }) => {
      if (cancelled) return;
      const userId = userData.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`bot_status_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bot_status",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = (payload.new ?? null) as BotStatusRow | null;
            queryClient.setQueryData(["bot_status"], row);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// Dispara o pedido de conexão: cria/atualiza a linha do usuário com status "requested".
// O bot (rodando no Render) está escutando essa tabela e inicia a conexão do WhatsApp
// assim que detectar essa mudança.
export function useConnectWhatsApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("bot_status" as never).upsert({
        user_id: userId,
        status: "requested",
        qr_code: null,
        updated_at: new Date().toISOString(),
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bot_status"] });
    },
  });
}
