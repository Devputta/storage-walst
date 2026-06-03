import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const UNLOCK_TTL_MS = 60 * 60 * 1000; // 1 hour

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const unlockCollection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        collectionId: z.string().uuid(),
        pin: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: col, error } = await supabaseAdmin
      .from("collections")
      .select("id,user_id,pin_hash")
      .eq("id", data.collectionId)
      .maybeSingle();

    if (error || !col || col.user_id !== userId || !col.pin_hash) {
      return { ok: false as const };
    }

    const hash = await sha256Hex(data.pin);
    if (hash !== col.pin_hash) return { ok: false as const };

    const expiresAt = new Date(Date.now() + UNLOCK_TTL_MS).toISOString();
    const { error: upErr } = await supabaseAdmin
      .from("collection_unlocks")
      .upsert({
        user_id: userId,
        collection_id: data.collectionId,
        expires_at: expiresAt,
      });
    if (upErr) return { ok: false as const };

    return { ok: true as const, expiresAt };
  });
