import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MessageLogRow = {
  id: string;
  user_id: string;
  group_id: string | null;
  group_name: string | null;
  status: "enviado" | "erro" | string;
  error_message: string | null;
  sent_at: string;
};

const LIMIT = 100;

export function useMessageLogs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["message_logs"],
    queryFn: async (): Promise<MessageLogRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("message_logs" as never)
        .select("*")
        .eq("user_id", userId)
        .order("sent_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw error;
      return (data ?? []) as MessageLogRow[];
    },
  });

  // Assim que o bot grava um novo envio (sucesso ou erro), a linha aparece
  // aqui na hora, sem precisar recarregar a página — mesmo padrão Realtime
  // já usado em use-bot-status.ts.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data: userData }) => {
      if (cancelled) return;
      const userId = userData.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`message_logs_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "message_logs",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as MessageLogRow;
            queryClient.setQueryData<MessageLogRow[]>(["message_logs"], (old) =>
              [row, ...(old ?? [])].slice(0, LIMIT),
            );
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
