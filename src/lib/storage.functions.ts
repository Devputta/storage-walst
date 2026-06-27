import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Idempotently ensure the media bucket allows files up to 1 GB. */
export const ensureMediaBucketLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ONE_GB = 1024 * 1024 * 1024;
    const { data } = await supabaseAdmin.storage.getBucket("media");
    if (data && data.file_size_limit === ONE_GB) return { ok: true as const, already: true };
    const { error } = await supabaseAdmin.storage.updateBucket("media", {
      fileSizeLimit: ONE_GB,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
