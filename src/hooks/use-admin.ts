import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async (): Promise<boolean> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { data, error } = await supabase
        .from("admin_users" as never)
        .select("user_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export type AdminSupportMessage = {
  id: number;
  user_id: string;
  category: string;
  rating: number | null;
  message: string;
  status: "aberto" | "respondido" | "fechado";
  admin_reply: string | null;
  created_at: string;
  user_email: string | null;
};

export function useAllSupportMessages() {
  return useQuery({
    queryKey: ["admin-support-messages"],
    queryFn: async (): Promise<AdminSupportMessage[]> => {
      const { data, error } = await supabase
        .from("support_messages" as never)
        .select("id,user_id,category,rating,message,status,admin_reply,created_at")
        .order("status", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as unknown as Omit<AdminSupportMessage, "user_email">[];
      const ids = [...new Set(rows.map((r) => r.user_id))];
      if (ids.length === 0) return [];

      const { data: emailRows } = await supabase.rpc(
        "get_emails_by_ids" as never,
        {
          ids,
        } as never,
      );
      const emailMap = new Map(
        ((emailRows ?? []) as unknown as { id: string; email: string }[]).map((e) => [
          e.id,
          e.email,
        ]),
      );

      return rows.map((r) => ({ ...r, user_email: emailMap.get(r.user_id) ?? null }));
    },
  });
}

export function useReplySupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: number; reply: string; status: "respondido" | "fechado" }) => {
      const { error } = await supabase
        .from("support_messages" as never)
        .update({
          admin_reply: input.reply,
          status: input.status,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-messages"] });
    },
  });
}
