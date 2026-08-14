import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AvailableGroup = {
  user_id: string;
  gid: string;
  name: string;
  updated_at: string;
};

export function useAvailableGroups() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp_groups_available"],
    queryFn: async (): Promise<AvailableGroup[]> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("whatsapp_groups_available" as never)
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AvailableGroup[];
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
        .channel(`wa_groups_available_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "whatsapp_groups_available",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            queryClient.invalidateQueries({
              queryKey: ["whatsapp_groups_available"],
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
