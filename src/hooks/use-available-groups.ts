import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AvailableGroup = {
  session_id: string;
  gid: string;
  name: string;
  updated_at: string;
};

export function useAvailableGroups() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp_groups_available", "default"],
    queryFn: async (): Promise<AvailableGroup[]> => {
      const { data, error } = await supabase
        .from("whatsapp_groups_available" as never)
        .select("*")
        .eq("session_id", "default")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AvailableGroup[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`wa_groups_available_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_groups_available" },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["whatsapp_groups_available", "default"],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
