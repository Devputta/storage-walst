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

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase();
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

export const getRecoveryQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ collectionId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col } = await supabaseAdmin
      .from("collections")
      .select("user_id,recovery_question,recovery_answer_hash")
      .eq("id", data.collectionId)
      .maybeSingle();
    if (!col || col.user_id !== userId || !col.recovery_question || !col.recovery_answer_hash) {
      return { question: null as string | null };
    }
    return { question: col.recovery_question as string };
  });

export const recoverCollectionPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        collectionId: z.string().uuid(),
        answer: z.string().min(1).max(200),
        newPin: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col } = await supabaseAdmin
      .from("collections")
      .select("user_id,recovery_answer_hash")
      .eq("id", data.collectionId)
      .maybeSingle();
    if (!col || col.user_id !== userId || !col.recovery_answer_hash) {
      return { ok: false as const };
    }
    const hash = await sha256Hex(normalizeAnswer(data.answer));
    if (hash !== col.recovery_answer_hash) return { ok: false as const };

    const newHash = await sha256Hex(data.newPin);
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ pin_hash: newHash })
      .eq("id", data.collectionId);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

export const changeCollectionPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        collectionId: z.string().uuid(),
        currentPin: z.string().min(1).max(64),
        newPin: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: col } = await supabaseAdmin
      .from("collections")
      .select("user_id,pin_hash")
      .eq("id", data.collectionId)
      .maybeSingle();
    if (!col || col.user_id !== userId || !col.pin_hash) {
      return { ok: false as const };
    }
    const cur = await sha256Hex(data.currentPin);
    if (cur !== col.pin_hash) return { ok: false as const };
    const newHash = await sha256Hex(data.newPin);
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ pin_hash: newHash })
      .eq("id", data.collectionId);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

export const setRecoveryQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        collectionId: z.string().uuid(),
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(200),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = await sha256Hex(normalizeAnswer(data.answer));
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ recovery_question: data.question, recovery_answer_hash: hash })
      .eq("id", data.collectionId)
      .eq("user_id", userId);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });

export const setCollectionPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        collectionId: z.string().uuid(),
        newPin: z.string().min(1).max(64),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const newHash = await sha256Hex(data.newPin);
    const { error } = await supabaseAdmin
      .from("collections")
      .update({ pin_hash: newHash, is_private: true })
      .eq("id", data.collectionId)
      .eq("user_id", userId);
    if (error) return { ok: false as const };
    return { ok: true as const };
  });
