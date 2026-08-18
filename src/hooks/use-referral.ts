import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ReferralStats = {
  code: string | null;
  clicks: number;
  signups: number;
  valid_referrals: number;
  days_earned: number;
  reward_days_config: number;
};

const EMPTY_STATS: ReferralStats = {
  code: null,
  clicks: 0,
  signups: 0,
  valid_referrals: 0,
  days_earned: 0,
  reward_days_config: 15,
};

export function useReferralStats() {
  return useQuery({
    queryKey: ["referral-stats"],
    queryFn: async (): Promise<ReferralStats> => {
      // garante que o usuário já tem um código de indicação antes de buscar as estatísticas
      await supabase.rpc("ensure_referral_code" as never);

      const { data, error } = await supabase.rpc("get_referral_stats" as never);
      if (error) throw error;

      const row = (Array.isArray(data) ? data[0] : data) as ReferralStats | undefined;
      return row ?? EMPTY_STATS;
    },
  });
}
