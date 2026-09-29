import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MyTrial = {
  started_at: string;
  ends_at: string;
  active: boolean;
  daysLeft: number;
};

// Teste grátis do usuário logado (ou null se nunca teve).
// "active" = ainda dentro dos 7 dias. Fonte da verdade: tabela trial_accounts.
export function useMyTrial() {
  return useQuery({
    queryKey: ["my-trial"],
    queryFn: async (): Promise<MyTrial | null> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("trial_accounts" as never)
        .select("started_at,ends_at")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (error || !data) return null;

      const row = data as unknown as { started_at: string; ends_at: string };
      const msLeft = new Date(row.ends_at).getTime() - Date.now();
      return {
        ...row,
        active: msLeft > 0,
        daysLeft: Math.max(0, Math.ceil(msLeft / 86_400_000)),
      };
    },
  });
}
