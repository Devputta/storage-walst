import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a media storage path to a short-lived signed URL.
 * Stored media paths are always resolved again through the private bucket.
 * Never reuse an old URL from a database row: that would bypass current
 * collection unlock and storage authorization checks.
 */
export function useSignedUrl(path: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sign", path],
    queryFn: async () => {
      if (!path) return null;
      if (/^https?:\/\//i.test(path)) return null;
      const { data, error } = await supabase.storage
        .from("media")
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!path && enabled,
    staleTime: 1000 * 60 * 50,
  });
}
