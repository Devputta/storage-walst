import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a media storage path to a short-lived signed URL.
 * Falls back to the value as-is if it already looks like an http(s) URL
 * (legacy rows that stored full signed URLs).
 */
export function useSignedUrl(path: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["sign", path],
    queryFn: async () => {
      if (!path) return null;
      if (/^https?:\/\//i.test(path)) return path;
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
