import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Heart, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useSignedUrl } from "@/lib/storage";
import { useVaultUnlock } from "@/components/VaultUnlock";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "Vault — Lumen" }] }),
  component: VaultPage,
});

type Fav = { id: string; storage_path: string; media_type: "image" | "video"; title: string | null };

function VaultPage() {
  const { unlocked, request, lock } = useVaultUnlock();

  // Auto-prompt for PIN on first visit
  useEffect(() => {
    if (!unlocked) request();
  }, [unlocked, request]);

  const { data } = useQuery({
    queryKey: ["favorites"],
    enabled: unlocked,
    queryFn: async (): Promise<Fav[]> => {
      const { data, error } = await supabase
        .from("media")
        .select("id,storage_path,media_type,title")
        .eq("is_favorite", true)
        .order("created_at", { ascending: false })
        .range(0, 1049);
      if (error) throw error;
      return data as Fav[];
    },
  });

  if (!unlocked) {
    return (
      <AppShell>
        <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="glass-strong flex h-16 w-16 items-center justify-center rounded-full">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-4xl">The Vault is locked</h1>
          <p className="mt-2 max-w-sm text-muted-foreground">
            Your favorites live behind a private PIN.
          </p>
          <Button onClick={() => request()} className="mt-6 rounded-full">
            Unlock Vault
          </Button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="pt-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-muted-foreground">
              <Heart className="h-3.5 w-3.5 text-primary" /> The Vault
            </p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl">
              Your <span className="text-gradient">favorites</span>.
            </h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Hidden moments — only you know this door exists.
            </p>
          </div>
          <Button variant="secondary" onClick={lock} className="rounded-full">
            <Lock className="mr-1.5 h-4 w-4" /> Lock now
          </Button>
        </motion.div>
      </section>

      {data && data.length > 0 ? (
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
          {data.map((m) => <VaultTile key={m.id} m={m} />)}
        </div>
      ) : (
        <div className="glass mt-12 rounded-3xl py-24 text-center text-muted-foreground">
          <p>No favorites yet. Heart something to find it here.</p>
        </div>
      )}
    </AppShell>
  );
}

function VaultTile({ m }: { m: Fav }) {
  const { data: url } = useSignedUrl(m.storage_path);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-white/5"
    >
      {url ? (
        m.media_type === "image" ? (
          <img src={url} className="w-full" alt={m.title ?? ""} loading="lazy" />
        ) : (
          <video src={url} className="w-full" muted playsInline preload="metadata" />
        )
      ) : (
        <div className="aspect-[3/4] animate-pulse bg-white/5" />
      )}
    </motion.div>
  );
}
