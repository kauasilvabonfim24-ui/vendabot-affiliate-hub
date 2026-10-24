import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AgentName = "cacador" | "redator" | "mensageiro";
export type AgentAction = "escolhendo" | "escrevendo" | "enviando" | "concluido" | "erro";

export type AgentEventRow = {
  id: string;
  user_id: string;
  agent: AgentName;
  action: AgentAction;
  channel: string;
  group_name: string | null;
  product_id: string | null;
  product_name: string | null;
  product_platform: string | null;
  created_at: string;
};

const LIMIT = 40;

export function useAgentEvents() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["agent_events"],
    queryFn: async (): Promise<AgentEventRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("agent_events" as never)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(LIMIT);
      if (error) throw error;
      return (data ?? []) as AgentEventRow[];
    },
  });

  // Mesmo padrão do use-message-logs: cada evento novo aparece na hora.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data: userData }) => {
      if (cancelled) return;
      const userId = userData.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`agent_events_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "agent_events",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as AgentEventRow;
            queryClient.setQueryData<AgentEventRow[]>(["agent_events"], (old) => {
              const list = old ?? [];
              if (list.some((e) => e.id === row.id)) return list;
              return [row, ...list].slice(0, LIMIT);
            });
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
