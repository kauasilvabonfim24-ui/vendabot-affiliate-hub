import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TelegramConnectionRow = {
  bot_username: string | null;
  status: "connected" | "error" | "disconnected" | string;
  last_error: string | null;
};

export type TelegramGroupRow = {
  id: string;
  chat_id: number;
  chat_title: string | null;
  bot_is_admin: boolean;
  status: "active" | "removed" | string;
};

export function useTelegramConnection() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["telegram_connection"],
    queryFn: async (): Promise<TelegramConnectionRow | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from("telegram_connections" as never)
        .select("bot_username, status, last_error")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as TelegramConnectionRow | null;
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
        .channel(`telegram_connection_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "telegram_connections",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = (payload.new ?? null) as TelegramConnectionRow | null;
            queryClient.setQueryData(["telegram_connection"], row);
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

export function useTelegramGroups() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["telegram_groups"],
    queryFn: async (): Promise<TelegramGroupRow[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("telegram_groups" as never)
        .select("id, chat_id, chat_title, bot_is_admin, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("chat_title");
      if (error) throw error;
      return (data ?? []) as TelegramGroupRow[];
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
        .channel(`telegram_groups_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "telegram_groups",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["telegram_groups"] });
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

export function useConnectTelegram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botToken: string) => {
      const { data, error } = await supabase.functions.invoke("telegram-connect", {
        body: { bot_token: botToken },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { ok: true; bot_username: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telegram_connection"] });
      queryClient.invalidateQueries({ queryKey: ["telegram_groups"] });
    },
  });
}
