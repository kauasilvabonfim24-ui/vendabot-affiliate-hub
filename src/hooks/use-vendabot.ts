import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Group, Product, Schedule } from "@/lib/vendabot";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Group[];
    },
  });
}

export function useSchedules() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async (): Promise<Schedule[]> => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Schedule[];
    },
  });
}
