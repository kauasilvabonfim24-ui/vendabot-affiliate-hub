import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MySubscription = {
  plan_id: string;
  plan_name: string;
  status: string;
  current_period_end: string | null;
};

export function useMySubscription() {
  return useQuery({
    queryKey: ["my-subscription"],
    queryFn: async (): Promise<MySubscription | null> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("subscriptions" as never)
        .select("plan_id,status,current_period_end,plans(name)")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (error || !data) return null;

      const row = data as unknown as {
        plan_id: string;
        status: string;
        current_period_end: string | null;
        plans: { name: string } | null;
      };

      return {
        plan_id: row.plan_id,
        plan_name: row.plans?.name ?? row.plan_id,
        status: row.status,
        current_period_end: row.current_period_end,
      };
    },
  });
}
