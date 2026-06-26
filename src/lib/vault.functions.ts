import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const hasVaultPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("pin_hash")
      .eq("id", context.userId)
      .maybeSingle();
    return { hasPin: !!data?.pin_hash };
  });

export const setVaultPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ newPin: z.string().min(4).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await sha256Hex(data.newPin);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ pin_hash: hash })
      .eq("id", context.userId);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

export const verifyVaultPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ pin: z.string().min(1).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("pin_hash")
      .eq("id", context.userId)
      .maybeSingle();
    if (!row?.pin_hash) return { ok: false as const };
    const hash = await sha256Hex(data.pin);
    return { ok: hash === row.pin_hash };
  });
