import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BotStatusRow = {
  session_id: string;
  status: "qr" | "connected" | "disconnected" | string;
  qr_code: string | null;
  updated_at: string;
};

export function useBotStatus() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bot_status", "default"],
    queryFn: async (): Promise<BotStatusRow | null> => {
      const { data, error } = await supabase
        .from("bot_status" as never)
        .select("*")
        .eq("session_id", "default")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as BotStatusRow | null;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("bot_status_default")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bot_status" },
        (payload) => {
          const row = (payload.new ?? null) as BotStatusRow | null;
          if (row && row.session_id !== "default") return;
          queryClient.setQueryData(["bot_status", "default"], row);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
