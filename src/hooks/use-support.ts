import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SupportCategory = "duvida" | "sugestao" | "avaliacao" | "problema";

export type SupportMessage = {
  id: number;
  category: SupportCategory;
  rating: number | null;
  message: string;
  status: "aberto" | "respondido" | "fechado";
  admin_reply: string | null;
  created_at: string;
};

export function useSupportMessages() {
  return useQuery({
    queryKey: ["support-messages"],
    queryFn: async (): Promise<SupportMessage[]> => {
      const { data, error } = await supabase
        .from("support_messages" as never)
        .select("id,category,rating,message,status,admin_reply,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SupportMessage[];
    },
  });
}

export function useSubmitSupportMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      category: SupportCategory;
      message: string;
      rating: number | null;
    }) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("não autenticado");

      const { error } = await supabase.from("support_messages" as never).insert({
        user_id: userData.user.id,
        category: input.category,
        message: input.message,
        rating: input.rating,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
  });
}
