import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStorageStats() {
  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id,title,nickname,cover_url,is_private,is_invisible,has_pin")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["collection-counts", (collections ?? []).map((c) => c.id).join(",")],
    enabled: !!collections && collections.length > 0,
    queryFn: async (): Promise<Record<string, number>> => {
      const ids = (collections ?? []).map((c) => c.id);
      const entries = await Promise.all(
        ids.map(async (id) => {
          const { count } = await supabase
            .from("media")
            .select("id", { count: "exact", head: true })
            .eq("collection_id", id);
          return [id, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries);
    },
  });

  const totalItems = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
  const totalCollections = (collections ?? []).length;
  const capacity = Math.max(totalCollections, 1) * 1050;
  const usedPct = Math.min(100, Math.round((totalItems / capacity) * 100));

  return { totalItems, totalCollections, capacity, usedPct };
}
